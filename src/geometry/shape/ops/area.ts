import { abs } from "lib0/math";
import { PI } from "../../../common";
import { Shape, ShapeClassForType, ShapeType } from "../Shape";

type AreaDispatchTable = {
    [T in ShapeType]: (shape: ShapeClassForType<T>) => number;
};

export const Circle_area: AreaDispatchTable[ShapeType.CIRCLE] = circle => (circle.radius ** 2) * PI;

export const Ellipse_area: AreaDispatchTable[ShapeType.ELLIPSE] = ellipse => ellipse.radiusX * ellipse.radiusY * PI;

export const Line_area = () => 0 as const;

export const Point_area = Line_area;

export const Polygon_area: AreaDispatchTable[ShapeType.POLYGON] = polygon => {
    var total = 0;
    const l = polygon.pts.length;
    for (var i = 0; i < l; i++) {
        const p1 = polygon.pts[i]!;
        const p2 = polygon.pts[(i + 1) % l]!;
        total += p1.x * p2.y;
        total -= p2.x * p1.y;
    }
    return abs(total / 2);
};

export const Rect_area: AreaDispatchTable[ShapeType.RECTANGLE] = rect => rect.width * rect.height;

const areaDispatchTable: AreaDispatchTable = {
    [ShapeType.CIRCLE]: Circle_area,
    [ShapeType.ELLIPSE]: Ellipse_area,
    [ShapeType.LINE]: Line_area,
    [ShapeType.POINT]: Point_area,
    [ShapeType.POLYGON]: Polygon_area,
    [ShapeType.RECTANGLE]: Rect_area,
};

export const Shape_area = (shape: Shape) => {
    return areaDispatchTable[shape.type](shape as any);
};
