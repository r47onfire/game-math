import { abs, min } from "lib0/math";
import { Mat23, Mat23_transformPointV_m, Vec2, Vec2_addScaled_m, Vec2_clone, Vec2_distance_squared, Vec2_dot, Vec2_length_squared, Vec2_lerp, Vec2_sub_m } from "../../linearAlgebra";
import { RandomSource } from "../../random";
import { Shape } from "./Shape";
import { Rect, Rect_fromPoints } from "./Rect";

export class Line implements Shape {
    p1: Vec2;
    p2: Vec2;
    constructor(p1: Vec2, p2: Vec2) {
        this.p1 = Vec2_clone(p1);
        this.p2 = Vec2_clone(p2);
    }
    transform(m: Mat23, s?: Shape): Line {
        if (s && s instanceof Line) {
            Mat23_transformPointV_m(m, this.p1, s.p1);
            Mat23_transformPointV_m(m, this.p2, s.p2);
            return s;
        }
        return new Line(
            Mat23_transformPointV_m(m, this.p1, new Vec2()),
            Mat23_transformPointV_m(m, this.p2, new Vec2()),
        );
    }
    bbox(r?: Rect): Rect {
        if (r) {
            r.pos.x = min(this.p1.x, this.p2.x);
            r.pos.y = min(this.p1.y, this.p2.y);
            r.width = abs(this.p2.x - this.p1.x);
            r.height = abs(this.p2.y - this.p1.y);
            return r;
        }
        else {
            return Rect_fromPoints(this.p1, this.p2);
        }
    }
    area() {
        return 0;
    }
    clone() {
        return new Line(this.p1, this.p2);
    }
    collides(shape: Shape | Vec2) {
        return testLineShape(this, shape);
    }
    contains(point: Vec2) {
        return this.collides(point);
    }
    raycast(origin: Vec2, direction: Vec2) {
        return raycastLine(origin, direction, this);
    }
    random(rng: RandomSource): Vec2 {
        return Vec2_lerp(this.p1, this.p2, rng());
    }
    support(direction: Vec2): Vec2 {
        return Vec2_dot(this.p1, direction) > Vec2_dot(this.p2, direction)
            ? this.p1
            : this.p2;
    }
    get gjkCenter(): Vec2 {
        return new Vec2(
            (this.p1.x + this.p2.x) / 2,
            (this.p1.y + this.p2.y) / 2,
        );
    }
    closestPt(p: Vec2): Vec2 | undefined {
        const v1 = new Vec2();
        const v2 = new Vec2();
        Vec2_sub_m(p, this.p1, v1);
        Vec2_sub_m(this.p2, this.p1, v2);
        // Calculate scalar projection
        const t = Vec2_dot(v1, v2) / Vec2_length_squared(v2);
        // If on edge segment
        if (t >= 0 && t <= 1) {
            // Calculate projected point on edge
            return Vec2_addScaled_m(this.p1, v2, t, new Vec2());
        }
        else {
            return Vec2_distance_squared(this.p1, p) < Vec2_distance_squared(this.p2, p) ? this.p1 : this.p2;
        }
    }
}
