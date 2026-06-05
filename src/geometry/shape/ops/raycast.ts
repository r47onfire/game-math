import { last } from "lib0/array";
import { abs, floor, max, min, sign, sqrt } from "lib0/math";
import { Mat2_fromRotation, Mat2_fromScale, Mat2_inverse, Mat2_transformPoint, V2_ZERO, Vec2, Vec2_add, Vec2_addScaled_m, Vec2_cross, Vec2_distance, Vec2_dot, Vec2_length, Vec2_length_squared, Vec2_normal, Vec2_scale_sv, Vec2_scale_sv_m, Vec2_sub, Vec2_unit_i } from "../../../linearAlgebra";
import { deg2rad } from "../../../misc";
import { Circle } from "../Circle";
import { Ellipse_toMat2 } from "../Ellipse";
import { Line } from "../Line";
import { Shape, ShapeClassForType, ShapeType } from "../Shape";

export type RaycastHit = {
    fraction: number;
    normal: Vec2;
    point: Vec2;
    gridPos?: Vec2;
};

export type RaycastResult = RaycastHit | null;

type RaycastDispatchTable = {
    [T in ShapeType]: (shape: ShapeClassForType<T>, origin: Vec2, direction: Vec2) => RaycastResult;
};

export const Circle_raycast: RaycastDispatchTable[ShapeType.CIRCLE] = (circle, origin, direction) => {
    const a = origin;
    const c = circle.center;
    const ab = direction;
    const A = Vec2_length_squared(ab);
    const centerToOrigin = Vec2_sub(a, c);
    const B = 2 * Vec2_dot(ab, centerToOrigin);
    const C = Vec2_length_squared(centerToOrigin) - circle.radius * circle.radius;
    // Calculate the discriminant of ax^2 + bx + c
    const disc = B * B - 4 * A * C;
    // No root
    if ((A <= Number.EPSILON) || (disc < 0)) {
        return null;
    }
    // One possible root
    else if (disc == 0) {
        const t = -B / (2 * A);
        if (t >= 0 && t <= 1) {
            const point = Vec2_addScaled_m(a, ab, t, new Vec2());
            return {
                point,
                normal: Vec2_unit_i(Vec2_sub(point, c)),
                fraction: t,
            };
        }
    }
    // Two possible roots
    else {
        const t1 = (-B + sqrt(disc)) / (2 * A);
        const t2 = (-B - sqrt(disc)) / (2 * A);
        var t = null;
        if (t1 >= 0 && t1 <= 1) {
            t = t1;
        }
        if (t2 >= 0 && t2 <= 1) {
            t = min(t2, t ?? t2);
        }
        if (t != null) {
            const point = Vec2_addScaled_m(a, ab, t, new Vec2());
            return {
                point: point,
                normal: Vec2_unit_i(Vec2_sub(point, c)),
                fraction: t,
            };
        }
    }
    return null;
};

export const Ellipse_raycast: RaycastDispatchTable[ShapeType.ELLIPSE] = (ellipse, origin, direction) => {
    // Transforms from unit circle to rotated ellipse
    const T = Ellipse_toMat2(ellipse);
    // Transforms from rotated ellipse to unit circle
    const TI = Mat2_inverse(T);
    // Transform both origin and direction into the unit circle coordinate system
    const T_origin = Mat2_transformPoint(TI, Vec2_sub(origin, ellipse.center));
    const T_direction = Mat2_transformPoint(TI, direction);
    // Raycast as if we have a circle
    const result = Circle_raycast(new Circle(V2_ZERO, 1), T_origin, T_direction);
    if (!result) return null;
    const R = Mat2_fromRotation(deg2rad(-ellipse.angle));
    const S = Mat2_fromScale(ellipse.radiusX, ellipse.radiusY);
    // Scale the point so we have a point on the un-rotated ellipse
    const p = Mat2_transformPoint(S, result.point);
    // transform the result point to the coordinate system of the rotated ellipse
    const point = Vec2_add(Mat2_transformPoint(T, result.point), ellipse.center);
    const fraction = Vec2_distance(point, origin) / Vec2_length(direction);
    return {
        point: point,
        // Calculate the normal at the un-rotated ellipse, then rotate the normal to the rotated ellipse
        normal: Vec2_unit_i(Mat2_transformPoint(R,
            new Vec2(ellipse.radiusY ** 2 * p.x, ellipse.radiusX ** 2 * p.y),
        )),
        fraction,
    };
};

export const Line_raycast: RaycastDispatchTable[ShapeType.LINE] = (line, origin, direction) => {
    const a = origin;
    const c = line.p1;
    const d = line.p2;
    const ab = direction;
    const cd = Vec2_sub(d, c);
    const abXcd = Vec2_cross(ab, cd);
    // If parallel, no intersection
    if (abs(abXcd) < Number.EPSILON) {
        return null;
    }
    const ac = Vec2_sub(c, a);
    const s = Vec2_cross(ac, cd) / abXcd;
    // Outside the ray
    if (s <= 0 || s >= 1) {
        return null;
    }
    // Outside the line
    const t = Vec2_cross(ac, ab) / abXcd;
    if (t <= 0 || t >= 1) {
        return null;
    }

    const normal = Vec2_unit_i(Vec2_normal(cd));
    if (Vec2_dot(direction, normal) > 0) {
        Vec2_scale_sv_m(normal, -1, normal);
    }

    return {
        point: Vec2_addScaled_m(a, ab, s, a),
        normal,
        fraction: s,
    };
};

export const Point_raycast: RaycastDispatchTable[ShapeType.POINT] = (point, origin, direction) => {
    // TODO: if it's a direct hit, return the point
    // but normal will be undefined???
    return null;
};

export const Polygon_raycast: RaycastDispatchTable[ShapeType.POLYGON] = (polygon, origin, direction) => {
    const points = polygon.pts;
    var minHit = null;
    var prev = last(points);
    for (var i = 0; i < points.length; i++) {
        const cur = points[i]!;
        const hit = Line_raycast(new Line(prev, cur), origin, direction);
        if (hit && (!minHit || minHit.fraction > hit.fraction)) {
            minHit = hit;
        }
        prev = cur;
    }

    return minHit;
};

export const Rect_raycast: RaycastDispatchTable[ShapeType.RECTANGLE] = (rect, origin, direction) => {
    var tMin = -Infinity, tMax = Infinity;
    var normal!: Vec2;

    if (direction.x != 0.0) {
        const tx1 = (rect.pos.x - origin.x) / direction.x;
        const tx2 = (rect.pos.x + rect.width - origin.x) / direction.x;

        normal = new Vec2(-sign(direction.x), 0);

        tMin = max(tMin, min(tx1, tx2));
        tMax = min(tMax, max(tx1, tx2));
    }

    if (direction.y != 0.0) {
        const ty1 = (rect.pos.y - origin.y) / direction.y;
        const ty2 = (rect.pos.y + rect.height - origin.y) / direction.y;

        if (min(ty1, ty2) > tMin) {
            normal = new Vec2(0, -sign(direction.y));
        }

        tMin = max(tMin, min(ty1, ty2));
        tMax = min(tMax, max(ty1, ty2));
    }

    if (tMax >= tMin && tMin >= 0 && tMin <= 1) {
        return {
            point: Vec2_addScaled_m(origin, direction, tMin, new Vec2()),
            normal,
            fraction: tMin,
        };
    }
    return null;
};

const raycastDispatchTable: RaycastDispatchTable = {
    [ShapeType.CIRCLE]: Circle_raycast,
    [ShapeType.ELLIPSE]: Ellipse_raycast,
    [ShapeType.LINE]: Line_raycast,
    [ShapeType.POINT]: Point_raycast,
    [ShapeType.POLYGON]: Polygon_raycast,
    [ShapeType.RECTANGLE]: Rect_raycast,
}

export const Shape_raycast = (shape: Shape, origin: Vec2, direction: Vec2) => {
    return raycastDispatchTable[shape.type](shape as any, origin, direction);
};


export const raycastGrid = (
    origin: Vec2,
    direction: Vec2,
    gridPosHit: (gridPos: Vec2) => boolean | RaycastResult,
    maxDistance: number = 64,
): RaycastResult | null => {
    const pos = origin;
    const len = Vec2_length(direction);
    const dir = Vec2_scale_sv(direction, 1 / len);
    var t = 0;
    const gridPos = new Vec2(floor(origin.x), floor(origin.y));
    const step = new Vec2(dir.x > 0 ? 1 : -1, dir.y > 0 ? 1 : -1);
    const tDelta = new Vec2(abs(1 / dir.x), abs(1 / dir.y));
    const dist = new Vec2(
        (step.x > 0) ? (gridPos.x + 1 - origin.x) : (origin.x - gridPos.x),
        (step.y > 0) ? (gridPos.y + 1 - origin.y) : (origin.y - gridPos.y),
    );
    const tMax = new Vec2(
        (tDelta.x < Infinity) ? tDelta.x * dist.x : Infinity,
        (tDelta.y < Infinity) ? tDelta.y * dist.y : Infinity,
    );
    var steppedIndex = -1;
    while (t <= maxDistance) {
        const hit = gridPosHit(gridPos);
        if (hit === true) {
            return {
                point: Vec2_addScaled_m(pos, dir, t, new Vec2()),
                normal: new Vec2(
                    steppedIndex === 0 ? -step.x : 0,
                    steppedIndex === 1 ? -step.y : 0,
                ),
                fraction: t / len, // Since dir is normalized, t is len times too large
                gridPos,
            };
        }
        else if (hit) {
            return hit;
        }
        if (tMax.x < tMax.y) {
            gridPos.x += step.x;
            t = tMax.x;
            tMax.x += tDelta.x;
            steppedIndex = 0;
        }
        else {
            gridPos.y += step.y;
            t = tMax.y;
            tMax.y += tDelta.y;
            steppedIndex = 1;
        }
    }

    return null;
}
