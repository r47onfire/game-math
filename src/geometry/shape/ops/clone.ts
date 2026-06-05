import { Circle } from "../Circle";
import { Ellipse } from "../Ellipse";
import { Line } from "../Line";
import { Point } from "../Point";
import { Polygon } from "../Polygon";
import { Rect } from "../Rect";
import { ShapeType, ShapeClassForType, Shape } from "../Shape";

type CloneDispatchTable = {
    [T in ShapeType]: (shape: ShapeClassForType<T>) => ShapeClassForType<T>;
};

export const Circle_clone: CloneDispatchTable[ShapeType.CIRCLE] = c => new Circle(c.center, c.radius);
export const Ellipse_clone: CloneDispatchTable[ShapeType.ELLIPSE] = e => new Ellipse(e.center, e.radiusX, e.radiusY, e.angle);
export const Line_clone: CloneDispatchTable[ShapeType.LINE] = l => new Line(l.p1, l.p2);
export const Point_clone: CloneDispatchTable[ShapeType.POINT] = p => new Point(p.pt);
export const Polygon_clone: CloneDispatchTable[ShapeType.POLYGON] = p => new Polygon(p.pts);
export const Rect_clone: CloneDispatchTable[ShapeType.RECTANGLE] = r => new Rect(r.pos, r.width, r.height);

const cloneDispatchTable: CloneDispatchTable = {
    [ShapeType.CIRCLE]: Circle_clone,
    [ShapeType.ELLIPSE]: Ellipse_clone,
    [ShapeType.LINE]: Line_clone,
    [ShapeType.POINT]: Point_clone,
    [ShapeType.POLYGON]: Polygon_clone,
    [ShapeType.RECTANGLE]: Rect_clone,
};

export const Shape_clone = <T extends Shape>(shape: T): T => {
    return cloneDispatchTable[shape.type](shape as any) as any;
};
