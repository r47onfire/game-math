import { Vec2, Vec2_clone } from "../../linearAlgebra";
import { ShapeType, TaggedWithShape } from "./Shape";

export class Point implements TaggedWithShape {
    readonly type = ShapeType.POINT;
    pt: Vec2;
    constructor(pt: Vec2) {
        this.pt = Vec2_clone(pt);
    }
}
