import { last } from "lib0/array";
import { abs, max, min } from "lib0/math";
import { Mat23, Mat23_transformPointV_m, Vec2, Vec2_addScaled_m, Vec2_clone, Vec2_cross, Vec2_distance_squared, Vec2_distance, Vec2_dot, Vec2_length_squared, Vec2_lerp, Vec2_sub, Vec2_sub_m } from "../../linearAlgebra";
import { RandomSource } from "../../random";
import { Line } from "./Line";
import { Rect } from "./Rect";
import { Shape } from "./Shape";

export class Polygon implements Shape {
    pts: [Vec2, Vec2, Vec2, ...Vec2[]];
    constructor(pts: Vec2[]) {
        if (pts.length < 3) {
            throw new Error("Polygons should have at least 3 vertices");
        }
        this.pts = pts as [Vec2, Vec2, Vec2, ...Vec2[]];
        /*this.center = new Vec2(pts[0].x, pts[0].y);
        for (var i = 1; i < pts.length; i++) {
            this.center.x += pts[i].x;
            this.center.y += pts[i].y;
        }
        this.center.x /= pts.length;
        this.center.y /= pts.length;*/
    }
    transform(m: Mat23, s?: Shape): Polygon {
        if (s && s instanceof Polygon) {
            s.pts.length = this.pts.length;
            for (var i = 0; i < this.pts.length; i++) {
                Mat23_transformPointV_m(m, this.pts[i]!, s.pts[i] ??= new Vec2());
            }
            return s;
        }
        return new Polygon(this.pts.map(pt => Mat23_transformPointV_m(m, pt, new Vec2())));
    }
    bbox(r?: Rect) {
        const p1 = new Vec2(Infinity);
        const p2 = new Vec2(-Infinity);
        for (const pt of this.pts) {
            p1.x = min(p1.x, pt.x);
            p2.x = max(p2.x, pt.x);
            p1.y = min(p1.y, pt.y);
            p2.y = max(p2.y, pt.y);
        }
        if (r) {
            r.pos.x = p1.x;
            r.pos.y = p1.y;
            r.width = p2.x - p1.x;
            r.height = p2.y - p1.y;
            return r;
        }
        else {
            return new Rect(p1, p2.x - p1.x, p2.y - p1.y);
        }
    }
    area() {
        var total = 0;
        const l = this.pts.length;
        for (var i = 0; i < l; i++) {
            const p1 = this.pts[i]!;
            const p2 = this.pts[(i + 1) % l]!;
            total += p1.x * p2.y;
            total -= p2.x * p1.y;
        }
        return abs(total / 2);
    }
    clone() {
        return new Polygon(this.pts.map(Vec2_clone));
    }
    collides(shape: Shape | Vec2) {
        return testPolygonShape(this, shape);
    }
    contains(point: Vec2) {
        return this.collides(point);
    }
    raycast(origin: Vec2, direction: Vec2) {
        return raycastPolygon(origin, direction, this);
    }
    random(rng: RandomSource): Vec2 {
        /**
         * TODO:
         * - cut into triangles
         * - choose a random triangle with probability linked to surface area
         * - choose a random point in the triangle
         */
        return this.pts[0];
    }
    support(direction: Vec2) {
        var maxPoint!: Vec2;
        var maxDistance = -Infinity;

        var vertex;
        for (var i = 0; i < this.pts.length; i++) {
            vertex = this.pts[i]!;
            const distance = Vec2_dot(vertex, direction);
            if (distance > maxDistance) {
                maxDistance = distance;
                maxPoint = vertex;
            }
        }

        return maxPoint;
    }
    get gjkCenter() {
        return this.pts[0];
    }
    closestPt(p: Vec2) {
        // Edge points
        var p1 = this.pts.at(-1)!, p2;
        // Vector from point to edge and edge vector
        var v1 = new Vec2(), v2 = new Vec2();
        // Projected point
        var pp = new Vec2();
        // Closest point and closest (squared) distance if any
        var c: Vec2 | undefined, cd = 0;
        // For all edges
        for (var i = 0; i < this.pts.length; i++) {
            p2 = this.pts[i]!;
            // Calculate aforementioned vectors
            Vec2_sub_m(p, v1, v1);
            Vec2_sub_m(p2, p1, v2);
            // Calculate scalar projection
            const t = Vec2_dot(v1, v2) / Vec2_length_squared(v2);
            // If on edge segment
            if (t >= 0 && t <= 1) {
                // Calculate projected point on edge
                Vec2_addScaled_m(p1, v2, t, pp);
                // Calculate squared distance
                const d = Vec2_distance_squared(p, pp);
                if (!c || d < cd) {
                    // Update closest point
                    c = pp;
                    cd = d;
                }
            }
            // If not, check the vertex itself
            else {
                const d = Vec2_distance_squared(p, p2);
                if (!c || d < cd) {
                    c = p2;
                    cd = d;
                }
            }
            p1 = p2;
        }
        return c;
    }
}

export const Polygon_cut = (
    polygon: Polygon,
    a: Vec2,
    b: Vec2,
    srcUv?: Vec2[],
    dstUv?: [Vec2[], Vec2[]],
): [Polygon | null, Polygon | null] => {
    const left: Vec2[] = [];
    const right: Vec2[] = [];
    const ab = Vec2_sub(b, a);
    var prev = last(polygon.pts);
    var ap = Vec2_sub(prev, a);
    var wasLeft = Vec2_cross(ab, ap) > 0;
    polygon.pts.forEach((p, index) => {
        ap = Vec2_sub(p, a);
        const isLeft = Vec2_cross(ab, ap) > 0;
        if (wasLeft != isLeft) {
            // Since the points are on opposite sides of the line, we know they intersect
            const intersection: Vec2 = segmentLineIntersection(prev, p, a, b)!;
            left.push(intersection);
            right.push(intersection);
            if (srcUv && dstUv) {
                const uv1 = index === 0 ? last(srcUv) : srcUv[index - 1]!;
                const uv2 = srcUv[index]!;
                const ab = Vec2_sub(p, prev);
                const ac = Vec2_sub(intersection, prev);
                const alpha = Vec2_dot(ac, ab) / Vec2_length_squared(ab);
                const uv = Vec2_lerp(uv1, uv2, alpha);
                dstUv[0].push(uv);
                dstUv[1].push(uv);
            }
            wasLeft = isLeft;
        }
        (isLeft ? left : right).push(p);
        if (srcUv && dstUv) {
            (isLeft ? dstUv[0] : dstUv[1]).push(srcUv[index]!);
        }
        prev = p;
    });
    return [
        left.length ? new Polygon(left) : null,
        right.length ? new Polygon(right) : null,
    ];
}
