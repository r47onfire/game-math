import { last } from "lib0/array";
import { Vec2_distance_squared, type Vec2 } from "../linearAlgebra";

/**
 * > 0 if counter clockwise
 * < 0 if clockwise
 * == 0 if colinear
 */
const orient = (a: Vec2, b: Vec2, c: Vec2) => {
    const v = a.x * (b.y - c.y)
        + b.x * (c.y - a.y)
        + c.x * (a.y - b.y);
    if (v < 0) return -1;
    if (v > 0) return +1;
    return 0;
}

/**
 * Graham scan to calculate the convex hull of a polygon
 */
export const convexHull = (points: Vec2[]) => {
    // Find the point with lowest y, then lowest x
    var first = 0;
    for (var i = 1; i < points.length; i++) {
        if (points[i]!.y < points[first]!.y) {
            first = i;
        }
        else if (points[i]!.y == points[first]!.y && points[i]!.x < points[first]!.x) {
            first = i;
        }
    }
    // Sort points on angle, then greatest distance
    const sorted = points.toSorted((a, b) => {
        const o = orient(points[first]!, a, b);
        if (o === 0) {
            return Vec2_distance_squared(points[first]!, a) - Vec2_distance_squared(points[first]!, b);
        }
        return (o < 0) ? -1 : 1;
    });
    // Build hull, removing points which change orientation
    const stack = [sorted[0], sorted[1]];
    for (var i = 2; i < sorted.length; i++) {
        while (
            stack.length > 1
            && orient(
                stack[stack.length - 2]!,
                last(stack),
                sorted[i]!,
            ) >= 0
        ) {
            stack.pop();
        }
        stack.push(sorted[i]);
    }
    return stack;
}
