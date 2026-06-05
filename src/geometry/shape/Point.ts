import { Vec2, Vec2_clone } from "../../linearAlgebra";
import { ShapeType, TaggedWithShape } from "./Shape";

export class Point implements TaggedWithShape {
    type = ShapeType.POINT;
    pt: Vec2;
    constructor(pt: Vec2) {
        this.pt = Vec2_clone(pt);
    }
    // collides(shape: Shape) {
    //     return testPointShape(this, shape);
    // }
    // closestPt(p: Vec2) {
    //     return this.pt;
    // }
}
