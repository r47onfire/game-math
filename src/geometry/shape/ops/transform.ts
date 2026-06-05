import { Mat23, Mat23_getRotation, Mat23_getScale, Mat23_transformPoint_m, Mat23_transformPointV_m, Mat3_fromMat2, Mat3_rotate_i, Mat3_scale_i, Mat3_toMat2, Vec2 } from "../../../linearAlgebra";
import { Ellipse, Ellipse_fromMat2, Ellipse_toMat2 } from "../Ellipse";
import { Line } from "../Line";
import { Point } from "../Point";
import { Polygon } from "../Polygon";
import { Shape, ShapeClassForType, ShapeType } from "../Shape";

type TransformDispatchTable = {
    [T in ShapeType]: (shape: ShapeClassForType<T>, tr: Mat23, out?: Shape) => Shape;
};

export const Circle_transform: TransformDispatchTable[ShapeType.CIRCLE] = (circle, tr, out) => Ellipse_transform(new Ellipse(circle.center, circle.radius, circle.radius), tr, out);

export const Ellipse_transform: TransformDispatchTable[ShapeType.ELLIPSE] = (ellipse, tr) => {
    if (ellipse.angle === 0 && Mat23_getRotation(tr) === 0) {
        // No rotation, so we can just take the scale and translation
        return new Ellipse(
            Mat23_transformPointV_m(tr, ellipse.center, new Vec2()),
            tr.a * ellipse.radiusX,
            tr.d * ellipse.radiusY,
        );
    }
    else {
        // Rotation. We can't just add angles, as the scale can squeeze the
        // ellipse and thus change the angle.
        // Get the transformation which maps the unit circle onto the ellipse
        // Transform the transformation matrix with the rotation+scale matrix
        const angle = Mat23_getRotation(tr);
        const scale = Mat23_getScale(tr);
        const M = Mat3_rotate_i(Mat3_scale_i(Mat3_fromMat2(Ellipse_toMat2(ellipse)), scale.x, scale.y), angle);
        // Return the ellipse made from the transformed unit circle
        const ellipse2 = Ellipse_fromMat2(Mat3_toMat2(M));
        Mat23_transformPointV_m(tr, ellipse.center, ellipse2.center);
        return ellipse2;
    }
};

export const Line_transform: TransformDispatchTable[ShapeType.LINE] = (line, tr, s) => {
    if (s && s instanceof Line) {
        Mat23_transformPointV_m(tr, line.p1, s.p1);
        Mat23_transformPointV_m(tr, line.p2, s.p2);
        return s;
    }
    return new Line(
        Mat23_transformPointV_m(tr, line.p1, new Vec2()),
        Mat23_transformPointV_m(tr, line.p2, new Vec2()),
    );
};

export const Point_transform: TransformDispatchTable[ShapeType.POINT] = (point, tr, s) => {
    if (s && s instanceof Point) {
        Mat23_transformPointV_m(tr, point.pt, s.pt);
        return s;
    }
    return new Point(Mat23_transformPointV_m(tr, point.pt, new Vec2()));
};

export const Polygon_transform: TransformDispatchTable[ShapeType.POLYGON] = (polygon, tr, s) => {
    if (s && s instanceof Polygon) {
        s.pts.length = polygon.pts.length;
        for (var i = 0; i < polygon.pts.length; i++) {
            Mat23_transformPointV_m(tr, polygon.pts[i]!, s.pts[i] ??= new Vec2());
        }
        return s;
    }
    return new Polygon(polygon.pts.map(pt => Mat23_transformPointV_m(tr, pt, new Vec2())));
};

export const Rect_transform: TransformDispatchTable[ShapeType.RECTANGLE] = (rect, tr, s) => {
    // TODO: resize existing pts array if it's a Polygon?
    // TODO: if m has no skew or rotation (only scale and translation), return a Rect
    const p = (s && s instanceof Polygon && s.pts.length == 4)
        ? s
        : new Polygon([new Vec2(), new Vec2(), new Vec2(), new Vec2()]);
    const { pos, width, height } = rect;
    Mat23_transformPointV_m(tr, pos, p.pts[0]);
    Mat23_transformPoint_m(tr, pos.x + width, pos.y, p.pts[1]);
    Mat23_transformPoint_m(tr, pos.x + width, pos.y + height, p.pts[2]);
    Mat23_transformPoint_m(tr, pos.x, pos.y + height, p.pts[3]!);
    return p;
};

const transformDispatchTable: TransformDispatchTable = {
    [ShapeType.CIRCLE]: Circle_transform,
    [ShapeType.ELLIPSE]: Ellipse_transform,
    [ShapeType.LINE]: Line_transform,
    [ShapeType.POINT]: Point_transform,
    [ShapeType.POLYGON]: Polygon_transform,
    [ShapeType.RECTANGLE]: Rect_transform,
};

export const Shape_transform = (shape: Shape, tr: Mat23, out?: Shape): Shape => {
    return transformDispatchTable[shape.type](shape as any, tr, out);
}
