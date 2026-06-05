import { max, sqrt } from "lib0/math";
import { atan2 } from "../../../common";
import { Mat2, Mat2_eigenvalues, Mat2_eigenvectors, Mat2_inverse, Mat2_mul_Mat2, Mat2_transpose, Vec2, Vec2_add_m, Vec2_addC, Vec2_clone, Vec2_dot, Vec2_rotate_a_m, Vec2_scale_sv_m, Vec2_scaleC_m, Vec2_unit, Vec2_unit_i, Vec2_unit_m } from "../../../linearAlgebra";
import { deg2rad, rad2deg } from "../../../misc";
import { Shape, ShapeClassForType, ShapeType } from "../Shape";
import { Point } from "../Point";
import { Rect, Rect_points } from "../Rect";

type SupportDispatchTable = {
    [T in ShapeType]: (shape: ShapeClassForType<T>, direction: Vec2) => Vec2;
};
type GJKCenterDispatchTable = {
    [T in ShapeType]: (shape: ShapeClassForType<T>) => Vec2;
};

export const Circle_support: SupportDispatchTable[ShapeType.CIRCLE] = (circle, direction) => {
    const s = Vec2_unit_i(Vec2_clone(direction));
    Vec2_scale_sv_m(s, circle.radius, s);
    Vec2_add_m(s, circle.center, s);
    return s;
};
export const Circle_gjkCenter: GJKCenterDispatchTable[ShapeType.CIRCLE] = circle => circle.center;

export const Ellipse_support: SupportDispatchTable[ShapeType.ELLIPSE] = (ellipse, direction) => {
    const { angle, center, radiusX, radiusY } = ellipse;
    // Axis aligned
    if (angle === 0.0) {
        const axis = Vec2_unit(direction);
        Vec2_scaleC_m(axis, radiusX, radiusY, axis);
        Vec2_add_m(axis, center, axis);
        return axis;
    }
    // Rotated
    else {
        const axis = Vec2_unit(direction);
        Vec2_rotate_a_m(axis, -deg2rad(angle), axis);
        Vec2_scaleC_m(axis, radiusX, radiusY, axis);
        Vec2_rotate_a_m(axis, deg2rad(angle), axis);
        Vec2_add_m(axis, center, axis);
        return axis;
    }
}
export const Ellipse_gjkCenter: GJKCenterDispatchTable[ShapeType.ELLIPSE] = ellipse => ellipse.center;

export const Line_support: SupportDispatchTable[ShapeType.LINE] = (line, direction) => {
    const { p1, p2 } = line;
    return Vec2_dot(p1, direction) > Vec2_dot(p2, direction) ? p1 : p2;
}
export const Line_gjkCenter: GJKCenterDispatchTable[ShapeType.LINE] = line => {
    return new Vec2(
        (line.p1.x + line.p2.x) / 2,
        (line.p1.y + line.p2.y) / 2,
    );
};

export const Point_support = (p: Point) => p.pt;
export const Point_gjkCenter = Point_support;

const Polygon_support_helper = (pts: Vec2[], direction: Vec2) => {
    var maxPoint!: Vec2;
    var maxDistance = -Infinity;
    for (var i = 0; i < pts.length; i++) {
        const vertex = pts[i]!;
        const distance = Vec2_dot(vertex, direction);
        if (distance > maxDistance) {
            maxDistance = distance;
            maxPoint = vertex;
        }
    }
    return maxPoint;
}
export const Polygon_support: SupportDispatchTable[ShapeType.POLYGON] = (polygon, direction) => {
    return Polygon_support_helper(polygon.pts, direction);
}
export const Polygon_gjkCenter: GJKCenterDispatchTable[ShapeType.POLYGON] = poly => poly.pts[0];

export const Rect_support: SupportDispatchTable[ShapeType.RECTANGLE] = (rect, direction) => {
    return Polygon_support_helper(Rect_points(rect), direction);
}
export const Rect_gjkCenter: GJKCenterDispatchTable[ShapeType.RECTANGLE] = rect => rect.pos;

const supportDispatchTable: SupportDispatchTable = {
    [ShapeType.CIRCLE]: Circle_support,
    [ShapeType.ELLIPSE]: Ellipse_support,
    [ShapeType.LINE]: Line_support,
    [ShapeType.POINT]: Point_support,
    [ShapeType.POLYGON]: Polygon_support,
    [ShapeType.RECTANGLE]: Rect_support,
};

const gjkCenterDispatchTable: GJKCenterDispatchTable = {
    [ShapeType.CIRCLE]: Circle_gjkCenter,
    [ShapeType.ELLIPSE]: Ellipse_gjkCenter,
    [ShapeType.LINE]: Line_gjkCenter,
    [ShapeType.POINT]: Point_gjkCenter,
    [ShapeType.POLYGON]: Polygon_gjkCenter,
    [ShapeType.RECTANGLE]: Rect_gjkCenter,
};

export const Shape_support = (shape: Shape, direction: Vec2) => {
    return supportDispatchTable[shape.type](shape as any, direction);
};

export const Shape_gjkCenter = (shape: Shape) => {
    return gjkCenterDispatchTable[shape.type](shape as any);
};
