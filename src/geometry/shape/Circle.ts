import { V2_ZERO, Vec2, Vec2_clone } from "../../linearAlgebra";
import { ShapeType, TaggedWithShape } from "./Shape";

export class Circle implements TaggedWithShape {
    readonly type = ShapeType.CIRCLE;
    center: Vec2;
    radius: number;
    constructor(center: Vec2, radius: number) {
        this.center = Vec2_clone(center);
        this.radius = radius;
    }
}

export const Circle_UNIT_DISC = /* @__PURE__ */ new Circle(V2_ZERO, 1);
