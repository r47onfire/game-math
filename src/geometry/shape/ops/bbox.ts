import { abs, max, min, sqrt } from "lib0/math";
import { cos, sin } from "../../../common";
import { Vec2, Vec2_addComponents_m, Vec2_copy, Vec2_subC_m } from "../../../linearAlgebra";
import { deg2rad } from "../../../misc";
import { Rect, Rect_fromPoints } from "../Rect";
import { Shape, ShapeClassForType, ShapeType } from "../Shape";
import { Rect_clone } from "./clone";

type BboxDispatchTable = {
    [T in ShapeType]: (shape: ShapeClassForType<T>, out?: Rect) => Rect;
};

export const Circle_bbox: BboxDispatchTable[ShapeType.CIRCLE] = (circle, r) => {
    const { center, radius } = circle;
    if (r) {
        Vec2_addComponents_m(center, -radius, -radius, r.pos);
        r.width = r.height = radius * 2;
        return r;
    }
    else {
        return new Rect(Vec2_subC_m(center, -radius, -radius, new Vec2()), radius * 2, radius * 2);
    }
};

export const Ellipse_bbox: BboxDispatchTable[ShapeType.ELLIPSE] = (ellipse, r) => {
    const { center, radiusX, radiusY } = ellipse;
    if (ellipse.angle == 0) {
        // No rotation, so the semi-major and semi-minor axis give the extends
        if (r) {
            Vec2_addComponents_m(center, -radiusX, -radiusY, r.pos);
            r.width = radiusX * 2;
            r.height = radiusY * 2;
            return r;
        }
        else {
            return new Rect(Vec2_subC_m(center, -radiusX, -radiusY, new Vec2()), radiusX * 2, radiusY * 2);
        }
    }
    else {
        // Rotation. We need to find the maximum x and y distance from the
        // center of the rotated ellipse
        const angle = deg2rad(ellipse.angle);
        const c = cos(angle);
        const s = sin(angle);
        const ux = radiusX * c;
        const uy = radiusX * s;
        const vx = radiusY * s;
        const vy = radiusY * c;

        const halfwidth = sqrt(ux * ux + vx * vx);
        const halfheight = sqrt(uy * uy + vy * vy);

        if (r) {
            Vec2_addComponents_m(center, -halfwidth, -halfheight, r.pos);
            r.width = halfwidth * 2;
            r.height = halfheight * 2;
            return r;
        }
        else {
            return new Rect(Vec2_subC_m(center, -halfwidth, -halfheight, new Vec2()), halfwidth * 2, halfheight * 2);
        }
    }
};

export const Line_bbox: BboxDispatchTable[ShapeType.LINE] = (line, r) => {
    if (r) {
        r.pos.x = min(line.p1.x, line.p2.x);
        r.pos.y = min(line.p1.y, line.p2.y);
        r.width = abs(line.p2.x - line.p1.x);
        r.height = abs(line.p2.y - line.p1.y);
        return r;
    }
    else {
        return Rect_fromPoints(line.p1, line.p2);
    }
};

export const Point_bbox: BboxDispatchTable[ShapeType.POINT] = (point, r) => {
    if (r) {
        Vec2_copy(point.pt, r.pos);
        r.width = 0;
        r.height = 0;
        return r;
    }
    return new Rect(point.pt, 0, 0);
};

export const Polygon_bbox: BboxDispatchTable[ShapeType.POLYGON] = (polygon, r) => {
    const p1 = new Vec2(Infinity);
    const p2 = new Vec2(-Infinity);
    for (const pt of polygon.pts) {
        p1.x = min(p1.x, pt.x);
        p2.x = max(p2.x, pt.x);
        p1.y = min(p1.y, pt.y);
        p2.y = max(p2.y, pt.y);
    }
    if (r) {
        r.pos.x = p1.x;
        r.pos.y = p1.y;
        r.width = p2.x - p1.x;
        r.height = p2.y - p1.y;
        return r;
    }
    else {
        return new Rect(p1, p2.x - p1.x, p2.y - p1.y);
    }
};

export const Rect_bbox: BboxDispatchTable[ShapeType.RECTANGLE] = (rect, r) => {
    if (r) {
        Vec2_copy(rect.pos, r.pos);
        r.width = rect.width;
        r.height = rect.height;
        return r;
    }
    else {
        return Rect_clone(rect);
    }
};

const bboxDispatchTable: BboxDispatchTable = {
    [ShapeType.CIRCLE]: Circle_bbox,
    [ShapeType.ELLIPSE]: Ellipse_bbox,
    [ShapeType.LINE]: Line_bbox,
    [ShapeType.POINT]: Point_bbox,
    [ShapeType.POLYGON]: Polygon_bbox,
    [ShapeType.RECTANGLE]: Rect_bbox,
};

export const Shape_bbox = (shape: Shape, out?: Rect): Rect => {
    return bboxDispatchTable[shape.type](shape as any, out);
};

