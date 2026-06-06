import { Vec2, Vec2_addC, Vec2_addScaled_m, Vec2_copy, Vec2_distance_squared, Vec2_dot, Vec2_length_squared, Vec2_sub, Vec2_sub_m } from "../../../linearAlgebra";
import { Point } from "../Point";
import { Shape, ShapeClassForType, ShapeType } from "../Shape";
import { Circle_support, Ellipse_support } from "./support";

type ClosestPointDispatchTable = {
    [T in ShapeType]: (shape: ShapeClassForType<T>, pt: Vec2) => Vec2;
};

export const Circle_closestPoint: ClosestPointDispatchTable[ShapeType.CIRCLE] = (circle, pt) => {
    return Circle_support(circle, Vec2_sub(pt, circle.center));
};

export const Ellipse_closestPoint: ClosestPointDispatchTable[ShapeType.ELLIPSE] = (ellipse, pt) => {
    return Ellipse_support(ellipse, Vec2_sub(pt, ellipse.center));
};

const Line_closestPt_helper = (p1: Vec2, p2: Vec2, p: Vec2, out: Vec2, temp1: Vec2, temp2: Vec2) => {
    Vec2_sub_m(p, p1, temp1);
    Vec2_sub_m(p2, p1, temp2);
    // Calculate scalar projection
    const t = Vec2_dot(temp1, temp2) / Vec2_length_squared(temp2);
    // If on edge segment
    if (t >= 0 && t <= 1) {
        // Calculate projected point on edge
        return Vec2_addScaled_m(p1, temp2, t, out);
    }
    else {
        return Vec2_copy(Vec2_distance_squared(p1, p) < Vec2_distance_squared(p2, p) ? p1 : p2, out);
    }
};

export const Line_closestPoint: ClosestPointDispatchTable[ShapeType.LINE] = (line, pt) => {
    return Line_closestPt_helper(line.p1, line.p2, pt, new Vec2(), new Vec2(), new Vec2());
};

export const Point_closestPoint = (point: Point) => point.pt;

export const Polygon_closestPoint: ClosestPointDispatchTable[ShapeType.POLYGON] = (polygon, pt) => {
    // Closest point and closest (squared) distance if any
    var c: Vec2 | undefined, cd = 0;
    // For all edges
    const pts = polygon.pts, len = pts.length;
    const temp1 = new Vec2(), temp2 = new Vec2(), temp3 = new Vec2();
    for (var i = 0, j = len - 1; i < pts.length; j = i++) {
        const closest = Line_closestPt_helper(pts[i]!, pts[j]!, pt, temp1, temp2, temp3);
        const distance = Vec2_distance_squared(pt, closest);
        if (!c || distance < cd) {
            cd = distance;
            c = closest;
        }
    }
    return c!;
};

export const Rect_closestPoint: ClosestPointDispatchTable[ShapeType.RECTANGLE] = (rect, pt) => {
    const above = pt.y < rect.pos.y;
    const notBelow = pt.y < (rect.pos.y + rect.height);
    // to the left
    if (pt.x < rect.pos.x) {
        if (above) return rect.pos; // above and to the left
        if (notBelow) return new Vec2(rect.pos.x, pt.y); // to the left
        return Vec2_addC(rect.pos, 0, rect.height); // below and to the left
    }
    // center section
    if (pt.x < (rect.pos.x + rect.width)) {
        if (above) return new Vec2(pt.x, rect.pos.y); // above
        if (notBelow) return pt; // inside
        return new Vec2(pt.x, rect.pos.y + rect.height); // below
    }
    // to the right
    if (above) return Vec2_addC(rect.pos, rect.width, 0); // above and to the right
    if (notBelow) return new Vec2(rect.pos.x + rect.width, pt.y); // to the right
    return Vec2_addC(rect.pos, rect.width, rect.height); // below and to the right
};

const closestPointDispatchTable: ClosestPointDispatchTable = {
    [ShapeType.CIRCLE]: Circle_closestPoint,
    [ShapeType.ELLIPSE]: Ellipse_closestPoint,
    [ShapeType.LINE]: Line_closestPoint,
    [ShapeType.POINT]: Point_closestPoint,
    [ShapeType.POLYGON]: Polygon_closestPoint,
    [ShapeType.RECTANGLE]: Rect_closestPoint,
};

export const Shape_closestPoint = (shape: Shape, pt: Vec2) => {
    return closestPointDispatchTable[shape.type](shape as any, pt);
};
