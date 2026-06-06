import { Vec2, Vec2_clone } from "../../linearAlgebra";
import { ShapeType, TaggedWithShape } from "./Shape";

export class Line implements TaggedWithShape {
    readonly type = ShapeType.LINE;
    p1: Vec2;
    p2: Vec2;
    constructor(p1: Vec2, p2: Vec2) {
        this.p1 = Vec2_clone(p1);
        this.p2 = Vec2_clone(p2);
    }
}
