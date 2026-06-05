import { Vec2, Vec2_clone } from "../../linearAlgebra";
import { ShapeType, TaggedWithShape } from "./Shape";

export class Circle implements TaggedWithShape {
    type = ShapeType.CIRCLE;
    center: Vec2;
    radius: number;
    constructor(center: Vec2, radius: number) {
        this.center = Vec2_clone(center);
        this.radius = radius;
    }
    // closestPt(p: Vec2) {
    //     return this.support(Vec2_sub(p, this.center));
    // }
}
