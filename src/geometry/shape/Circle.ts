import { sqrt } from "lib0/math";
import { PI } from "../../common";
import { Mat23, Vec2, Vec2_add_m, Vec2_addComponents_m, Vec2_addScaled_m, Vec2_clone, Vec2_fromAngle, Vec2_scale_sv_m, Vec2_sub, Vec2_subC_m, Vec2_unit_m } from "../../linearAlgebra";
import { Random_floatBelow, RandomSource } from "../../random";
import { Rect } from "./Rect";
import { Shape } from "./Shape";

export class Circle implements Shape {
    center: Vec2;
    radius: number;
    constructor(center: Vec2, radius: number) {
        this.center = Vec2_clone(center);
        this.radius = radius;
    }
    transform(tr: Mat23, s?: Shape) {
        return new Ellipse(this.center, this.radius, this.radius).transform(tr, s);
    }
    bbox(r?: Rect): Rect {
        const { center, radius } = this;
        if (r) {
            Vec2_addComponents_m(center, -radius, -radius, r.pos);
            r.width = r.height = radius * 2;
            return r;
        }
        else {
            return new Rect(Vec2_subC_m(center, -radius, -radius, new Vec2()), radius * 2, radius * 2);
        }
    }
    area() {
        return this.radius * this.radius * PI;
    }
    clone() {
        return new Circle(this.center, this.radius);
    }
    collides(shape: Shape | Vec2): boolean {
        return testCircleShape(this, shape);
    }
    contains(point: Vec2): boolean {
        return this.collides(point);
    }
    raycast(origin: Vec2, direction: Vec2) {
        return raycastCircle(origin, direction, this);
    }
    random(rng: RandomSource) {
        return Vec2_addScaled_m(this.center, Vec2_fromAngle(Random_floatBelow(rng, 360)), sqrt(rng()) * this.radius, new Vec2());
    }
    support(direction: Vec2) {
        const s = new Vec2(direction.x, direction.y);
        Vec2_unit_m(s, s);
        Vec2_scale_sv_m(s, this.radius, s);
        Vec2_add_m(s, this.center, s);
        return s;
    }
    get gjkCenter() {
        return this.center;
    }
    closestPt(p: Vec2) {
        return this.support(Vec2_sub(p, this.center));
    }
}
