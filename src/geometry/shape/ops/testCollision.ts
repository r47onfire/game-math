import { cos, sin } from "../../../common";
import { Mat2_inverse, Mat2_transformPoint, Mat3, Mat3_inverse, Mat3_mul_Mat3, Mat3_transpose, V2_ZERO, Vec2, Vec2_distance_squared, Vec2_sub, Vec2_sub_m } from "../../../linearAlgebra";
import { deg2rad } from "../../../misc";
import { Circle, Circle_UNIT_DISC } from "../Circle";
import { Ellipse, Ellipse_toMat2 } from "../Ellipse";
import { Line } from "../Line";
import { Polygon } from "../Polygon";
import { Rect, Rect_points } from "../Rect";
import { Shape, ShapeClassForType, ShapeType } from "../Shape";
import { Rect_closestPoint } from "./closestPt";
import { Circle_contains, Ellipse_contains, lessThan, Line_contains, Point_contains, Polygon_contains, Rect_contains } from "./contains";
import { Circle_raycast, Line_raycast, Rect_raycast } from "./raycast";

type CollisionDispatchTableT<T extends ShapeType> = {
    [U in ShapeType]: (shape1: ShapeClassForType<T>, shape2: ShapeClassForType<U>) => boolean;
};

type CollisionDispatchTable = {
    [T in ShapeType]: (shape1: ShapeClassForType<T>, shape2: Shape) => boolean;
};

// MARK: Circle-X
export const Circle_collides_Circle: CollisionDispatchTableT<ShapeType.CIRCLE>[ShapeType.CIRCLE] = (circle1, circle2) =>
    Vec2_distance_squared(circle1.center, circle2.center) < ((circle1.radius + circle2.radius) ** 2);

export const Circle_collides_Ellipse: CollisionDispatchTableT<ShapeType.CIRCLE>[ShapeType.ELLIPSE] = (circle, ellipse) =>
    Ellipse_collides_Circle(ellipse, circle);

export const Circle_collides_Line: CollisionDispatchTableT<ShapeType.CIRCLE>[ShapeType.LINE] = (circle, line) =>
    Line_collides_Circle(line, circle);

export const Circle_collides_Point: CollisionDispatchTableT<ShapeType.CIRCLE>[ShapeType.POINT] = (circle, point) =>
    Circle_contains(circle, point.pt);

export const Circle_collides_Polygon: CollisionDispatchTableT<ShapeType.CIRCLE>[ShapeType.POLYGON] = (circle, polygon) => {
    // For each edge check for intersection
    const pts = polygon.pts, len = pts.length;
    for (var i = 0, j = len - 1; i < len; j = i++) {
        if (Circle_raycast(circle, pts[i]!, Vec2_sub(pts[j]!, pts[i]!))) return true;
    }

    // Check if the polygon is completely within the circle
    // We only need to check one point, since the polygon didn't cross the circle
    if (Circle_contains(circle, pts[0]!)) {
        return true;
    }

    // Check if the circle is completely within the polygon
    return Polygon_contains(polygon, circle.center);
};

export const Circle_collides_Rect: CollisionDispatchTableT<ShapeType.CIRCLE>[ShapeType.RECTANGLE] = (circle, rect) =>
    Rect_collides_Circle(rect, circle);

const Circle_collidesDispatchTable: CollisionDispatchTableT<ShapeType.CIRCLE> = {
    [ShapeType.CIRCLE]: Circle_collides_Circle,
    [ShapeType.ELLIPSE]: Circle_collides_Ellipse,
    [ShapeType.LINE]: Circle_collides_Line,
    [ShapeType.POINT]: Circle_collides_Point,
    [ShapeType.POLYGON]: Circle_collides_Polygon,
    [ShapeType.RECTANGLE]: Circle_collides_Rect,
};

export const Circle_collides_Shape: CollisionDispatchTable[ShapeType.CIRCLE] = (circle, shape) => {
    return Circle_collidesDispatchTable[shape.type](circle, shape as any);
};

// MARK: Ellipse-X
export const Ellipse_collides_Circle: CollisionDispatchTableT<ShapeType.ELLIPSE>[ShapeType.CIRCLE] = (ellipse, circle) => {
    // This is an approximation, because the parallel curve of an ellipse is an octic algebraic curve, not just a larger ellipse.
    // Transform the circle's center into the ellipse's un-rotated coordinate system at the origin
    const center = Vec2_sub(circle.center, ellipse.center);
    const angle = deg2rad(ellipse.angle);
    const c = cos(angle);
    const s = sin(angle);
    const cx = center.x * c + center.y * s;
    const cy = -center.x * s + center.y * c;
    // Test with an approximate Minkowski sum of the ellipse and the circle
    return Ellipse_contains(
        new Ellipse(
            V2_ZERO,
            ellipse.radiusX + circle.radius,
            ellipse.radiusY + circle.radius,
            0),
        new Vec2(cx, cy)
    );
};

// HOLY COW THIS IS A LONG FUNCTION
export const Ellipse_collides_Ellipse: CollisionDispatchTableT<ShapeType.ELLIPSE>[ShapeType.ELLIPSE] = (ellipse1, ellipse2) => {
    // First check if one of the ellipses isn't secretly a circle
    if (ellipse1.radiusX === ellipse1.radiusY) {
        return Ellipse_collides_Circle(
            ellipse2,
            new Circle(ellipse1.center, ellipse1.radiusX),
        );
    }
    else if (ellipse2.radiusX === ellipse2.radiusY) {
        return Ellipse_collides_Circle(
            ellipse1,
            new Circle(ellipse2.center, ellipse2.radiusX),
        );
    }
    // No luck, we need to solve the equation
    /*
    Etayo, Fernando, Laureano Gonzalez-Vega, and Natalia del Rio. "A new approach to characterizing the relative position of two ellipses depending on one parameter." Computer aided geometric design 23, no. 4 (2006): 324-350.
    */
    const A1 = new Mat3(
        1 / ellipse1.radiusX ** 2, 0, 0,
        0, 1 / ellipse1.radiusY ** 2, 0,
        0, 0, -1,
    );
    const A2 = new Mat3(
        1 / ellipse2.radiusX ** 2, 0, 0,
        0, 1 / ellipse2.radiusY ** 2, 0,
        0, 0, -1,
    );

    const { x: x1, y: y1 } = ellipse1.center;
    const { x: x2, y: y2 } = ellipse2.center;
    const theta1 = deg2rad(ellipse1.angle);
    const theta2 = deg2rad(ellipse2.angle);
    const ct1 = cos(theta1), st1 = sin(theta1);
    const ct2 = cos(theta2), st2 = sin(theta2);

    const M1 = new Mat3(
        ct1, -st1, x1,
        st1, ct1, y1,
        0, 0, 1,
    );
    const M2 = new Mat3(
        ct2, -st2, x2,
        st2, ct2, y2,
        0, 0, 1,
    );
    const M1inv = Mat3_inverse(M1);
    const M2inv = Mat3_inverse(M2);

    const A = Mat3_mul_Mat3(Mat3_mul_Mat3(Mat3_transpose(M1inv), A1), M1inv);
    const B = Mat3_mul_Mat3(Mat3_mul_Mat3(Mat3_transpose(M2inv), A2), M2inv);

    const a11 = A.m11, a12 = A.m12, a13 = A.m13, a21 = A.m21, a22 = A.m22, a23 = A.m23, a31 = A.m31, a32 = A.m32, a33 = A.m33;

    const b11 = B.m11, b12 = B.m12, b13 = B.m13, b21 = B.m21, b22 = B.m22, b23 = B.m23, b31 = B.m31, b32 = B.m32, b33 = B.m33;

    const factor = a11 * a22 * a33 - a11 * a23 * a32 - a12 * a21 * a33
        + a12 * a23 * a31 + a13 * a21 * a32 - a13 * a22 * a31;
    const a =
        (a11 * a22 * b33 - a11 * a23 * b32 - a11 * a32 * b23 + a11 * a33 * b22
            - a12 * a21 * b33 + a12 * a23 * b31 + a12 * a31 * b23
            - a12 * a33 * b21 + a13 * a21 * b32 - a13 * a22 * b31
            - a13 * a31 * b22 + a13 * a32 * b21 + a21 * a32 * b13
            - a21 * a33 * b12 - a22 * a31 * b13 + a22 * a33 * b11
            + a23 * a31 * b12 - a23 * a32 * b11) / factor;
    const b =
        (a11 * b22 * b33 - a11 * b23 * b32 - a12 * b21 * b33 + a12 * b23 * b31
            + a13 * b21 * b32 - a13 * b22 * b31 - a21 * b12 * b33
            + a21 * b13 * b32 + a22 * b11 * b33 - a22 * b13 * b31
            - a23 * b11 * b32 + a23 * b12 * b31 + a31 * b12 * b23
            - a31 * b13 * b22 - a32 * b11 * b23 + a32 * b13 * b21
            + a33 * b11 * b22 - a33 * b12 * b21) / factor;
    const c =
        (b11 * b22 * b33 - b11 * b23 * b32 - b12 * b21 * b33 + b12 * b23 * b31
            + b13 * b21 * b32 - b13 * b22 * b31) / factor;

    if (a >= 0) {
        const condition1 = -3 * b + a ** 2;
        const condition2 = 3 * a * c + b * a ** 2 - 4 * b ** 2;
        const condition3 = -27 * c ** 2 + 18 * c * a * b + a ** 2 * b ** 2
            - 4 * a ** 3 * c - 4 * b ** 3;
        return !(condition1 > 0 && condition2 < 0 && condition3 > 0);
    }
    else {
        const condition1 = -3 * b + a ** 2;
        const condition2 = -27 * c ** 2 + 18 * c * a * b + a ** 2 * b ** 2
            - 4 * a ** 3 * c - 4 * b ** 3;
        return !(condition1 > 0 && condition2 > 0);
    }
}

export const Ellipse_collides_Line: CollisionDispatchTableT<ShapeType.ELLIPSE>[ShapeType.LINE] = (ellipse, line) => {
    // Transform the line to the coordinate system where the ellipse is a unit circle
    const T = Mat2_inverse(Ellipse_toMat2(ellipse));
    line = new Line(
        Mat2_transformPoint(T, Vec2_sub(line.p1, ellipse.center)),
        Mat2_transformPoint(T, Vec2_sub(line.p2, ellipse.center)),
    );
    return Line_collides_Circle(line, Circle_UNIT_DISC);
}

export const Ellipse_collides_Point: CollisionDispatchTableT<ShapeType.ELLIPSE>[ShapeType.POINT] = (ellipse, point) =>
    Ellipse_contains(ellipse, point.pt);

export const Ellipse_collides_Polygon: CollisionDispatchTableT<ShapeType.ELLIPSE>[ShapeType.POLYGON] = (ellipse, polygon) => {
    // Transform the polygon to the coordinate system where the ellipse is a unit circle
    const T = Mat2_inverse(Ellipse_toMat2(ellipse));
    polygon = new Polygon(polygon.pts.map(p => Mat2_transformPoint(T, Vec2_sub(p, ellipse.center))));
    return Circle_collides_Polygon(Circle_UNIT_DISC, polygon);
};

export const Ellipse_collides_Rect: CollisionDispatchTableT<ShapeType.ELLIPSE>[ShapeType.RECTANGLE] = (ellipse, rect) =>
    Ellipse_collides_Polygon(ellipse, new Polygon(Rect_points(rect)));

const Ellipse_collidesDispatchTable: CollisionDispatchTableT<ShapeType.ELLIPSE> = {
    [ShapeType.CIRCLE]: Ellipse_collides_Circle,
    [ShapeType.ELLIPSE]: Ellipse_collides_Ellipse,
    [ShapeType.LINE]: Ellipse_collides_Line,
    [ShapeType.POINT]: Ellipse_collides_Point,
    [ShapeType.POLYGON]: Ellipse_collides_Polygon,
    [ShapeType.RECTANGLE]: Ellipse_collides_Rect,
};

export const Ellipse_collides_Shape: CollisionDispatchTable[ShapeType.ELLIPSE] = (ellipse, shape) => {
    return Ellipse_collidesDispatchTable[shape.type](ellipse, shape as any);
};

// MARK: Line-X
export const Line_collides_Circle: CollisionDispatchTableT<ShapeType.LINE>[ShapeType.CIRCLE] = (line, circle) =>
    Circle_raycast(circle, line.p1, Vec2_sub(line.p2, line.p1)) !== null;

export const Line_collides_Ellipse: CollisionDispatchTableT<ShapeType.LINE>[ShapeType.ELLIPSE] = (line, ellipse) =>
    Ellipse_collides_Line(ellipse, line);

export const Line_collides_Line: CollisionDispatchTableT<ShapeType.LINE>[ShapeType.LINE] = (line1, line2) => {
    return Line_raycast(line1, line2.p1, Vec2_sub(line2.p2, line2.p1)) !== null;
}

export const Line_collides_Point: CollisionDispatchTableT<ShapeType.LINE>[ShapeType.POINT] = (line, point) =>
    Line_contains(line, point.pt);

export const Line_collides_Polygon: CollisionDispatchTableT<ShapeType.LINE>[ShapeType.POLYGON] = (line, polygon) => {
    // test if line is inside
    if (Polygon_contains(polygon, line.p1) || Polygon_contains(polygon, line.p2)) {
        return true;
    }

    // test each line
    const pts = polygon.pts, len = pts.length;
    const temp = new Vec2();
    for (var i = 0, j = len - 1; i < len; j = i++) {
        if (Line_raycast(line, pts[i]!, Vec2_sub_m(pts[j]!, pts[i]!, temp)) !== null) {
            return true;
        }
    }

    return false;
}

export const Line_collides_Rect: CollisionDispatchTableT<ShapeType.LINE>[ShapeType.RECTANGLE] = (line, rect) =>
    Rect_raycast(rect, line.p1, Vec2_sub(line.p2, line.p1)) !== null;

const Line_collidesDispatchTable: CollisionDispatchTableT<ShapeType.LINE> = {
    [ShapeType.CIRCLE]: Line_collides_Circle,
    [ShapeType.ELLIPSE]: Line_collides_Ellipse,
    [ShapeType.LINE]: Line_collides_Line,
    [ShapeType.POINT]: Line_collides_Point,
    [ShapeType.POLYGON]: Line_collides_Polygon,
    [ShapeType.RECTANGLE]: Line_collides_Rect,
};

export const Line_collides_Shape: CollisionDispatchTable[ShapeType.LINE] = (line, shape) => {
    return Line_collidesDispatchTable[shape.type](line, shape as any);
};

// MARK: Point-X
export const Point_collides_Circle: CollisionDispatchTableT<ShapeType.POINT>[ShapeType.CIRCLE] = (point, circle) => Circle_contains(circle, point.pt);
export const Point_collides_Ellipse: CollisionDispatchTableT<ShapeType.POINT>[ShapeType.ELLIPSE] = (point, ellipse) => Ellipse_contains(ellipse, point.pt);
export const Point_collides_Line: CollisionDispatchTableT<ShapeType.POINT>[ShapeType.LINE] = (point, line) => Line_contains(line, point.pt);
export const Point_collides_Point: CollisionDispatchTableT<ShapeType.POINT>[ShapeType.POINT] = (point1, point2) => Point_contains(point1, point2.pt);
export const Point_collides_Polygon: CollisionDispatchTableT<ShapeType.POINT>[ShapeType.POLYGON] = (point, polygon) => Polygon_contains(polygon, point.pt);
export const Point_collides_Rect: CollisionDispatchTableT<ShapeType.POINT>[ShapeType.RECTANGLE] = (point, rect) => Rect_contains(rect, point.pt);

const Point_collidesDispatchTable: CollisionDispatchTableT<ShapeType.POINT> = {
    [ShapeType.CIRCLE]: Point_collides_Circle,
    [ShapeType.ELLIPSE]: Point_collides_Ellipse,
    [ShapeType.LINE]: Point_collides_Line,
    [ShapeType.POINT]: Point_collides_Point,
    [ShapeType.POLYGON]: Point_collides_Polygon,
    [ShapeType.RECTANGLE]: Point_collides_Rect,
};

export const Point_collides_Shape: CollisionDispatchTable[ShapeType.POINT] = (point, shape) => {
    return Point_collidesDispatchTable[shape.type](point, shape as any);
};

// MARK: Polygon-X
export const Polygon_collides_Circle: CollisionDispatchTableT<ShapeType.POLYGON>[ShapeType.CIRCLE] = (polygon, circle) => Circle_collides_Polygon(circle, polygon);
export const Polygon_collides_Ellipse: CollisionDispatchTableT<ShapeType.POLYGON>[ShapeType.ELLIPSE] = (polygon, ellipse) => Ellipse_collides_Polygon(ellipse, polygon);
export const Polygon_collides_Line: CollisionDispatchTableT<ShapeType.POLYGON>[ShapeType.LINE] = (polygon, line) => Line_collides_Polygon(line, polygon);
export const Polygon_collides_Point: CollisionDispatchTableT<ShapeType.POLYGON>[ShapeType.POINT] = (polygon, point) => Point_collides_Polygon(point, polygon);
export const Polygon_collides_Polygon: CollisionDispatchTableT<ShapeType.POLYGON>[ShapeType.POLYGON] = (p1, p2) => {
    const pts = p1.pts, len = pts.length;
    for (var i = 0, j = len - 1; i < p1.pts.length; j = i++) {
        if (Line_collides_Polygon(new Line(pts[i]!, pts[j]!), p2)) return true;
    }
    // Check if any of the points of the polygon lie in the other polygon
    // - if so, then we know one is contained within the other
    return pts.some(p => Polygon_contains(p2, p)) || p2.pts.some(p => Polygon_contains(p1, p));
};
export const Polygon_collides_Rect: CollisionDispatchTableT<ShapeType.POLYGON>[ShapeType.RECTANGLE] = (polygon, rect) => Rect_collides_Polygon(rect, polygon);

const Polygon_collidesDispatchTable: CollisionDispatchTableT<ShapeType.POLYGON> = {
    [ShapeType.CIRCLE]: Polygon_collides_Circle,
    [ShapeType.ELLIPSE]: Polygon_collides_Ellipse,
    [ShapeType.LINE]: Polygon_collides_Line,
    [ShapeType.POINT]: Polygon_collides_Point,
    [ShapeType.POLYGON]: Polygon_collides_Polygon,
    [ShapeType.RECTANGLE]: Polygon_collides_Rect,
};

export const Polygon_collides_Shape: CollisionDispatchTable[ShapeType.POLYGON] = (polygon, shape) => {
    return Polygon_collidesDispatchTable[shape.type](polygon, shape as any);
};

// MARK: Rect-X
export const Rect_collides_Circle: CollisionDispatchTableT<ShapeType.RECTANGLE>[ShapeType.CIRCLE] = (rect, circle) => {
    return Vec2_distance_squared(Rect_closestPoint(rect, circle.center), circle.center) < (circle.radius ** 2);
};
export const Rect_collides_Ellipse: CollisionDispatchTableT<ShapeType.RECTANGLE>[ShapeType.ELLIPSE] = (rect, ellipse) => Ellipse_collides_Rect(ellipse, rect);
export const Rect_collides_Line: CollisionDispatchTableT<ShapeType.RECTANGLE>[ShapeType.LINE] = (rect, line) => Line_collides_Rect(line, rect);
export const Rect_collides_Point: CollisionDispatchTableT<ShapeType.RECTANGLE>[ShapeType.POINT] = (rect, point) => Point_collides_Rect(point, rect);
export const Rect_collides_Polygon: CollisionDispatchTableT<ShapeType.RECTANGLE>[ShapeType.POLYGON] = (rect, polygon) => Polygon_collides_Rect(polygon, rect);
export const Rect_collides_Rect = (r1: Rect, r2: Rect, includeEdge = true) => {
    return lessThan(r2.pos.x, r1.pos.x + r1.width, includeEdge)
        && lessThan(r1.pos.x, r2.pos.x + r2.width, includeEdge)
        && lessThan(r2.pos.y, r1.pos.y + r1.height, includeEdge)
        && lessThan(r1.pos.y, r2.pos.y + r2.height, includeEdge);
};

const Rect_collidesDispatchTable: CollisionDispatchTableT<ShapeType.RECTANGLE> = {
    [ShapeType.CIRCLE]: Rect_collides_Circle,
    [ShapeType.ELLIPSE]: Rect_collides_Ellipse,
    [ShapeType.LINE]: Rect_collides_Line,
    [ShapeType.POINT]: Rect_collides_Point,
    [ShapeType.POLYGON]: Rect_collides_Polygon,
    [ShapeType.RECTANGLE]: Rect_collides_Rect,
};

export const Rect_collides_Shape: CollisionDispatchTable[ShapeType.RECTANGLE] = (rect, shape) => {
    return Rect_collidesDispatchTable[shape.type](rect, shape as any);
};

// MARK: Bottom
const Shape_collidesDispatchTable: CollisionDispatchTable = {
    [ShapeType.CIRCLE]: Circle_collides_Shape,
    [ShapeType.ELLIPSE]: Ellipse_collides_Shape,
    [ShapeType.LINE]: Line_collides_Shape,
    [ShapeType.POINT]: Point_collides_Shape,
    [ShapeType.POLYGON]: Polygon_collides_Shape,
    [ShapeType.RECTANGLE]: Rect_collides_Shape,
};

export const Shape_collides_Shape = (a: Shape, b: Shape) => {
    return Shape_collidesDispatchTable[a.type](a as any, b);
};
