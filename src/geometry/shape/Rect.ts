import { abs, max, min, sqrt } from "lib0/math";
import { Mat23, Mat23_transformPoint_m, Mat23_transformPointV_m, Vec2, Vec2_addC, Vec2_copy, Vec2_dot } from "../../linearAlgebra";
import { Random_floatBelow, RandomSource } from "../../random";
import { Polygon } from "./Polygon";
import { Shape } from "./Shape";

export class Rect implements Shape {
    // x, y are topleft
    pos: Vec2;
    width: number;
    height: number;
    constructor(pos: Vec2, width: number, height: number) {
        this.pos = pos;
        this.width = width;
        this.height = height;
    }
    center(): Vec2 {
        return new Vec2(
            this.pos.x + this.width / 2,
            this.pos.y + this.height / 2,
        );
    }
    transform(m: Mat23, s?: Shape): Polygon | Rect {
        // TODO: resize existing pts array?
        // TODO: if m has no skew or rotation (only scale and translation), return a Rect
        const p = (s && s instanceof Polygon && s.pts.length == 4)
            ? s
            : new Polygon([new Vec2(), new Vec2(), new Vec2(), new Vec2()]);
        Mat23_transformPointV_m(m, this.pos, p.pts[0]);
        Mat23_transformPoint_m(m, this.pos.x + this.width, this.pos.y, p.pts[1]);
        Mat23_transformPoint_m(m, this.pos.x + this.width, this.pos.y + this.height, p.pts[2]);
        Mat23_transformPoint_m(m, this.pos.x, this.pos.y + this.height, p.pts[3]!);
        return p;
    }
    bbox(r?: Rect): Rect {
        if (r) {
            Vec2_copy(this.pos, r.pos);
            r.width = this.width;
            r.height = this.height;
            return r;
        }
        else {
            return this.clone();
        }
    }
    area(): number {
        return this.width * this.height;
    }
    clone(): Rect {
        return new Rect(this.pos, this.width, this.height);
    }
    collides(shape: Shape | Vec2): boolean {
        return testRectShape(this, shape);
    }
    contains(point: Vec2): boolean {
        return this.collides(point);
    }
    raycast(origin: Vec2, direction: Vec2) {
        return raycastRect(origin, direction, this);
    }
    random(rng: RandomSource): Vec2 {
        return new Vec2(
            this.pos.x + Random_floatBelow(rng, this.width),
            this.pos.y + Random_floatBelow(rng, this.height));
    }
    support(direction: Vec2) {
        const pts = Rect_points(this);
        var maxPoint!: Vec2;
        var maxDistance = -Infinity;
        var vertex;
        for (var i = 0; i < pts.length; i++) {
            vertex = pts[i]!;
            const distance = Vec2_dot(vertex, direction);
            if (distance > maxDistance) {
                maxDistance = distance;
                maxPoint = vertex;
            }
        }

        return maxPoint;
    }
    get gjkCenter() {
        return this.pos;
    }
    closestPt(p: Vec2): Vec2 | undefined {
        // TODO
        return undefined;
    }
}

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
