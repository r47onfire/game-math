import { Mat23, Mat23_transformPointV_m, Vec2, Vec2_clone, Vec2_copy, Vec2_dot, Vec2_equals } from "../../linearAlgebra";
import { Rect } from "./Rect";
import { Shape } from "./Shape";

export class Point implements Shape {
    pt: Vec2;
    constructor(pt: Vec2) {
        this.pt = Vec2_clone(pt);
    }
    transform(m: Mat23, s?: Shape): Point {
        if (s && s instanceof Point) {
            Mat23_transformPointV_m(m, this.pt, s.pt);
            return s;
        }
        return new Point(Mat23_transformPointV_m(m, this.pt, new Vec2()));
    }
    bbox(r?: Rect) {
        if (r) {
            Vec2_copy(this.pt, r.pos);
            r.width = 0;
            r.height = 0;
            return r;
        }
        return new Rect(this.pt, 0, 0);
    }
    area() {
        return 0;
    }
    clone() {
        return new Point(this.pt);
    }
    collides(shape: Shape) {
        return testPointShape(this, shape);
    }
    contains(point: Vec2) {
        return Vec2_equals(point, this.pt);
    }
    raycast(origin: Vec2, direction: Vec2) {
        // TODO: if it's in the same direction, return the point
        return null;
    }
    random() {
        return Vec2_clone(this.pt);
    }
    support(direction: Vec2): Vec2 {
        return this.pt;
    }
    get gjkCenter(): Vec2 {
        return this.pt;
    }
    closestPt(p: Vec2) {
        return this.pt;
    }
}
