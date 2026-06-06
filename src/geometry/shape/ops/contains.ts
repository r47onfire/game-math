import { cos, sin } from "../../../common";
import { Vec2, Vec2_cross, Vec2_distance_squared, Vec2_dot, Vec2_equals, Vec2_length_squared, Vec2_sub } from "../../../linearAlgebra";
import { deg2rad } from "../../../misc";
import { Line } from "../Line";
import { Point } from "../Point";
import { Polygon } from "../Polygon";
import { Shape, ShapeClassForType, ShapeType } from "../Shape";

type ContainsDispatchTable = {
    [T in ShapeType]: (shape: ShapeClassForType<T>, point: Vec2, includeBorder?: boolean) => boolean;
};

export const lessThan = (a: number, b: number, orEqualTo: boolean) => orEqualTo ? a <= b : a < b;

export const Circle_contains: ContainsDispatchTable[ShapeType.CIRCLE] = (circle, point, includeBorder = true) =>
    lessThan(Vec2_distance_squared(circle.center, point), circle.radius, includeBorder);

export const Ellipse_contains: ContainsDispatchTable[ShapeType.ELLIPSE] = (ellipse, point, includeBorder = true) => {
    // Both methods work, but the second one is faster
    /*point = Vec2_sub(point, ellipse.center);
    point = Mat2_transformPoint(Mat2_inverse(Ellipse_toMat2(ellipse)), point);
    return Circle_contains(Circle_UNIT_DISC, point, includeBorder) */
    const { center, radiusX, radiusY } = ellipse;
    point = Vec2_sub(point, center);
    const angle = deg2rad(ellipse.angle);
    const c = cos(angle);
    const s = sin(angle);
    const vx = point.x * c + point.y * s;
    const vy = -point.x * s + point.y * c;
    return lessThan(
        vx * vx / (radiusX * radiusX)
        + vy * vy / (radiusY * radiusY),
        1,
        includeBorder);
};

export const Line_contains = (line: Line, pt: Vec2) => {
    const v1 = Vec2_sub(pt, line.p1);
    const v2 = Vec2_sub(line.p2, line.p1);

    // Check if sine is 0, in that case lines are parallel.
    // If not parallel, the point cannot lie on the line.
    if (Vec2_cross(v1, v2) !== 0) {
        return false;
    }

    // Scalar projection of v1 on v2
    const t = Vec2_dot(v1, v2) / Vec2_length_squared(v2);
    // Since t is fraction distance of pt from line.p1 on the line,
    // it should be between 0% and 100%
    return t >= 0 && t <= 1;
};

export const Point_contains = (point: Point, pt: Vec2) => Vec2_equals(point.pt, pt);

// https://wrfranklin.org/Research/Short_Notes/pnpoly.html
export const Polygon_contains = (poly: Polygon, pt: Vec2) => {
    var c = false;
    const p = poly.pts, l = p.length;
    for (var i = 0, j = l - 1; i < l; j = i++) {
        if (((p[i]!.y > pt.y) != (p[j]!.y > pt.y))
            && (pt.x < (p[j]!.x - p[i]!.x) * (pt.y - p[i]!.y) / (p[j]!.y - p[i]!.y) + p[i]!.x))
            c = !c;
    }
    return c;
};

export const Rect_contains: ContainsDispatchTable[ShapeType.RECTANGLE] = (r, pt, includeEdge = true) => {
    return lessThan(r.pos.x, pt.x, includeEdge)
        && lessThan(pt.x, r.pos.x + r.width, includeEdge)
        && lessThan(r.pos.y, pt.y, includeEdge)
        && lessThan(pt.y, r.pos.y + r.height, includeEdge);
};

const containsDispatchTable: ContainsDispatchTable = {
    [ShapeType.CIRCLE]: Circle_contains,
    [ShapeType.ELLIPSE]: Ellipse_contains,
    [ShapeType.LINE]: Line_contains,
    [ShapeType.POINT]: Point_contains,
    [ShapeType.POLYGON]: Polygon_contains,
    [ShapeType.RECTANGLE]: Rect_contains,
};

export const Shape_contains = (shape: Shape, pt: Vec2) => {
    return containsDispatchTable[shape.type](shape as any, pt);
}

