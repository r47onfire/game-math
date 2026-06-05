import { Circle } from "./Circle";
import { Ellipse } from "./Ellipse";
import { Line } from "./Line";
import { Point } from "./Point";
import { Polygon } from "./Polygon";
import { Rect } from "./Rect";

export interface TaggedWithShape {
    readonly type: ShapeType;
}

export const enum ShapeType {
    CIRCLE,
    ELLIPSE,
    LINE,
    POINT,
    POLYGON,
    RECTANGLE,
}

export type ShapeClassForType<T extends ShapeType> = {
    [ShapeType.CIRCLE]: Circle,
    [ShapeType.ELLIPSE]: Ellipse,
    [ShapeType.LINE]: Line,
    [ShapeType.POINT]: Point,
    [ShapeType.POLYGON]: Polygon,
    [ShapeType.RECTANGLE]: Rect,
}[T];

export type Shape = ShapeClassForType<ShapeType>;
