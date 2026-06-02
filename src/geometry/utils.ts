import { Vec2_cross, Vec2_sub, Vec2_sub_m, type Vec2 } from "../linearAlgebra";

/**
 * * positive if counter clockwise
 * * negative if clockwise
 * * zero if colinear
 */
export const orient = (a: Vec2, b: Vec2, c: Vec2) => {
    return a.x * (b.y - c.y)
        + b.x * (c.y - a.y)
        + c.x * (a.y - b.y);
}

export const isConvex = (pts: Vec2[]) => {
    const len = pts.length;

    if (len < 3) {
        return false;
    }

    // a polygon is convex if all corners turn in the same direction
    // turning direction can be determined using the cross-product of
    // the forward difference vectors
    var i = len - 2;
    var j = len - 1;
    var k = 0;
    var p = Vec2_sub(pts[j]!, pts[i]!);
    var q = Vec2_sub(pts[k]!, pts[j]!);
    const winding = Vec2_cross(p, q);

    while (k + 1 < len) {
        i = j;
        j = k;
        k++;
        Vec2_sub_m(pts[j]!, pts[i]!, p);
        Vec2_sub_m(pts[k]!, pts[j]!, q);

        if (Vec2_cross(p, q) * winding < 0) {
            return false;
        }
    }
    return true;
}
