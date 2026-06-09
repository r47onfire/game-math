import { abs } from "lib0/math";
import { Vec2, Vec2_copy, Vec2_dot, Vec2_length, Vec2_scale_sv, Vec2_scale_sv_m, Vec2_sub, Vec2_sub_m, Vec2_unit_i } from "../../linearAlgebra";
import { Shape, Shape_gjkCenter, Shape_support } from "../shape";

const calculateSupport = (
    shapeA: Shape,
    shapeB: Shape,
    direction: Vec2,
): Vec2 => {
    // Calculate the support vector. This is done by calculating the difference between
    // the furthest points found of the shapes along the given direction.
    const oppositeDirection = Vec2_scale_sv(direction, -1);
    const supportA = Shape_support(shapeA, direction);
    const supportB = Shape_support(shapeB, oppositeDirection);
    return Vec2_sub_m(supportA, supportB, oppositeDirection);
}

const addSupport = (
    vertices: Vec2[],
    shapeA: Shape,
    shapeB: Shape,
    direction: Vec2,
): boolean => {
    const support: Vec2 = calculateSupport(shapeA, shapeB, direction);
    vertices.push(support);
    // Returns true if both vectors are in the same direction
    return Vec2_dot(direction, support) >= 0;
}

const enum EvolveResult {
    NO_INTERSECTION,
    YES_INTERSECTION,
    INCONCLUSIVE,
}

const tripleProduct = (a: Vec2, b: Vec2, c: Vec2): Vec2 => {
    // AxB = (0, 0, axb)
    // AxBxC = (-axb * c.y, axb * c.x, 0)
    const n = a.x * b.y - a.y * b.x;

    // This vector lies in the same plane as a and b and is perpendicular to c
    return new Vec2(-n * c.y, n * c.x);
}

const evolveSimplex = (
    simplex: Vec2[],
    colliderA: Shape,
    colliderB: Shape,
    direction: Vec2,
): EvolveResult => {
    switch (simplex.length) {
        case 0:
            // Zero points, set the direction the center of colliderA
            // towards the center of of colliderB
            Vec2_sub_m(Shape_gjkCenter(colliderB), Shape_gjkCenter(colliderA), direction);
            break;
        case 1:
            // Reverse the direction, to make a line
            Vec2_scale_sv_m(direction, -1, direction);
            break;
        case 2: {
            // We now have a line ab. Take the vector ab and the vector a origin
            const ab = Vec2_sub(simplex[1]!, simplex[0]!);
            const a0 = Vec2_scale_sv(simplex[0]!, -1);

            // Get the vector perpendicular to ab and a0
            // Then get the vector perpendicular to the result and ab
            // This is our new direction to form a triangle
            Vec2_copy(tripleProduct(ab, a0, ab), direction);
            break;
        }
        case 3: {
            // We have a triangle, and need to check if it contains the origin
            const c0 = Vec2_scale_sv(simplex[2]!, -1);
            const bc = Vec2_sub(simplex[1]!, simplex[2]!);
            const ca = Vec2_sub(simplex[0]!, simplex[2]!);

            var bcNorm = tripleProduct(ca, bc, bc);
            var caNorm = tripleProduct(bc, ca, ca);

            if (Vec2_dot(bcNorm, c0) > 0) {
                // The origin does not lie within the triangle
                // Remove the first point and look in the direction of bcNorm
                simplex.splice(0, 1);
                Vec2_copy(bcNorm, direction);
            }
            else if (Vec2_dot(caNorm, c0) > 0) {
                // The origin does not lie within the triangle
                // Remove the second point and look in the direction of caNorm
                simplex.splice(1, 1);
                Vec2_copy(caNorm, direction);
            }
            else {
                // The origin lies within the triangle
                return EvolveResult.YES_INTERSECTION;
            }
            break;
        }
    }

    // Try to add a new support point to the simplex
    // If successful, continue evolving
    return addSupport(simplex, colliderA, colliderB, direction)
        ? EvolveResult.INCONCLUSIVE
        : EvolveResult.NO_INTERSECTION;
}

/**
 * Returns true if the shapes collide
 * @param shapeA - The first shape to test
 * @param shapeB - The second shape to test
 *
 * @returns True if the shapes collide
 */
export const gjkIntersects = (shapeA: Shape, shapeB: Shape): boolean => {
    const vertices: Vec2[] = [];
    const direction = new Vec2();
    var result: EvolveResult;
    do {
        result = evolveSimplex(vertices, shapeA, shapeB, direction);
    } while (result === EvolveResult.INCONCLUSIVE);
    return result === EvolveResult.YES_INTERSECTION;
}

const enum PolygonWinding {
    CLOCKWISE,
    COUNTERCLOCKWISE,
}

type GjkEdge = {
    distance: number;
    normal: Vec2;
    index: number;
};

/**
 * Returns the edge closest to the origin.
 * @param simplex - The simplex whose edges we will check to find the closest edge to the origin
 * @param winding - The winding order of the simplex
 *
 * @returns The edge closest to the origin.
 */
const findClosestEdge = (simplex: Vec2[], winding: PolygonWinding): GjkEdge => {
    var minDistance: number = Infinity;
    var minNormal = new Vec2();
    var minIndex = 0;
    var line = new Vec2();
    var norm = new Vec2();
    for (var i = 0, j = simplex.length - 1; i < simplex.length; j = i++) {

        Vec2_sub_m(simplex[j]!, simplex[i]!, line);

        // The normal of the edge depends on the polygon winding of the simplex
        switch (winding) {
            case PolygonWinding.CLOCKWISE:
                norm.x = line.y;
                norm.y = -line.x;
                break;
            case PolygonWinding.COUNTERCLOCKWISE:
                norm.x = -line.y;
                norm.y = line.x;
                break;
        }
        Vec2_unit_i(norm);

        // Only keep the edge closest to the origin
        var dist: number = Vec2_dot(norm, simplex[i]!);
        if (dist < minDistance) {
            minDistance = dist;
            Vec2_copy(norm, minNormal);
            minIndex = j;
        }
    }

    return { distance: minDistance, normal: minNormal, index: minIndex };
}

const EPSILON = 0.00001;

const getIntersection = (
    colliderA: Shape,
    colliderB: Shape,
    simplex: Vec2[],
): Vec2 | null => {

    const e0: number = (simplex[1]!.x - simplex[0]!.x)
        * (simplex[1]!.y + simplex[0]!.y);
    const e1: number = (simplex[2]!.x - simplex[1]!.x)
        * (simplex[2]!.y + simplex[1]!.y);
    const e2: number = (simplex[0]!.x - simplex[2]!.x)
        * (simplex[0]!.y + simplex[2]!.y);
    var winding: PolygonWinding = (e0 + e1 + e2 >= 0)
        ? PolygonWinding.CLOCKWISE
        : PolygonWinding.COUNTERCLOCKWISE;

    var intersection = new Vec2();
    for (var i = 0; i < 20; i++) {
        const { normal, distance: edgeDistance, index } = findClosestEdge(simplex, winding);
        // Calculate the difference for the two vertices furthest along the
        // direction of the edge normal
        const support = calculateSupport(colliderA, colliderB, normal);
        // Check distance to the origin
        const distance: number = Vec2_dot(support, normal);

        Vec2_scale_sv_m(normal, distance, intersection);

        // If close enough, return if we need to move a distance greater than 0
        if (abs(distance - edgeDistance) <= EPSILON) {
            const len = Vec2_length(intersection);
            if (len != 0) {
                Vec2_scale_sv_m(intersection, -1, intersection);
                return intersection;
            }
            return null;
        }
        else {
            simplex.splice(index, 0, support);
        }
    }

    // Return if we need to move a distance greater than 0
    // Since we did more than the maximum amount of iterations, this may not be optimal
    const len = Vec2_length(intersection);
    if (len != 0) {
        Vec2_scale_sv_m(intersection, -1, intersection);
        return intersection;
    }
    return null;
}

/**
 * @param shapeA - The first shape to test
 * @param shapeB - The second shape to test
 *
 * @returns The displacement vector that one shape needs to be moved to
 * resolve the collision, or null if they aren't colliding
 */
export const gjkIntersection = (
    shapeA: Shape,
    shapeB: Shape,
): Vec2 | null => {
    const vertices: Vec2[] = [];
    const direction = new Vec2();

    var result: EvolveResult;
    do {
        result = evolveSimplex(vertices, shapeA, shapeB, direction);
    } while (result === EvolveResult.INCONCLUSIVE)
    if (result !== EvolveResult.YES_INTERSECTION) {
        return null;
    }
    return getIntersection(shapeA, shapeB, vertices);
}
