import { abs, max, min, sqrt } from "lib0/math";
import { Vec2, Vec2_addC } from "../../linearAlgebra";
import { ShapeType, TaggedWithShape } from "./Shape";

export class Rect implements TaggedWithShape {
    readonly type = ShapeType.RECTANGLE;
    // x, y are topleft
    pos: Vec2;
    width: number;
    height: number;
    constructor(pos: Vec2, width: number, height: number) {
        this.pos = pos;
        this.width = width;
        this.height = height;
    }
}

export const Rect_center = (rect: Rect) =>
    new Vec2(
        rect.pos.x + rect.width / 2,
        rect.pos.y + rect.height / 2,
    );

export const Rect_points = (rect: Rect): [Vec2, Vec2, Vec2, Vec2] => {
    const { pos: { x, y }, width, height } = rect;
    return [
        new Vec2(x, y),
        new Vec2(x + width, y),
        new Vec2(x + width, y + height),
        new Vec2(x, y + height),
    ];
}

export const Rect_distToPoint = (rect: Rect, p: Vec2) => {
    return sqrt(Rect_sdistToPoint(rect, p));
}
export const Rect_sdistToPoint = (rect: Rect, p: Vec2): number => {
    const min_ = rect.pos;
    const max_ = Vec2_addC(rect.pos, rect.width, rect.height);
    const dx = max(min_.x - p.x, max(0, p.x - max_.x));
    const dy = max(min_.y - p.y, max(0, p.y - max_.y));
    return dx * dx + dy * dy;
}

export const Rect_fromPoints = (p1: Vec2, p2: Vec2): Rect => {
    return new Rect(new Vec2(min(p1.x, p2.x), min(p1.y, p2.y)), abs(p2.x - p1.x), abs(p2.y - p1.y));
}
