import { Vec2, Vec2_clone } from "../../linearAlgebra";
import { ShapeType, TaggedWithShape } from "./Shape";

export class Line implements TaggedWithShape {
    type = ShapeType.LINE;
    p1: Vec2;
    p2: Vec2;
    constructor(p1: Vec2, p2: Vec2) {
        this.p1 = Vec2_clone(p1);
        this.p2 = Vec2_clone(p2);
    }
    // collides(shape: Shape | Vec2) {
    //     return testLineShape(this, shape);
    // }
    // closestPt(p: Vec2): Vec2 | undefined {
    //     const v1 = new Vec2();
    //     const v2 = new Vec2();
    //     Vec2_sub_m(p, this.p1, v1);
    //     Vec2_sub_m(this.p2, this.p1, v2);
    //     // Calculate scalar projection
    //     const t = Vec2_dot(v1, v2) / Vec2_length_squared(v2);
    //     // If on edge segment
    //     if (t >= 0 && t <= 1) {
    //         // Calculate projected point on edge
    //         return Vec2_addScaled_m(this.p1, v2, t, new Vec2());
    //     }
    //     else {
    //         return Vec2_distance_squared(this.p1, p) < Vec2_distance_squared(this.p2, p) ? this.p1 : this.p2;
    //     }
    // }
}
