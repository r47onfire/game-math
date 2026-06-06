import { last } from "lib0/array";
import { Vec2, Vec2_clone, Vec2_copy, Vec2_cross, Vec2_dot, Vec2_length_squared, Vec2_lerp, Vec2_sub, Vec2_sub_m } from "../../linearAlgebra";
import { ShapeType, TaggedWithShape } from "./Shape";
import { Line_raycast } from "./ops";
import { Line } from "./Line";

export class Polygon implements TaggedWithShape {
    readonly type = ShapeType.POLYGON;
    pts: [Vec2, Vec2, Vec2, ...Vec2[]];
    // center: Vec2;
    constructor(pts: Vec2[]) {
        if (pts.length < 3) {
            throw new Error("Polygons should have at least 3 vertices");
        }
        this.pts = pts.map(Vec2_clone) as [Vec2, Vec2, Vec2, ...Vec2[]];
        // const center = this.center = new Vec2();
        // for (var i = 1; i < pts.length; i++) {
        //     Vec2_add_m(center, pts[i]!, center);
        // }
        // Vec2_scale_sv_m(center, 1 / pts.length, center);
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
    const pts = polygon.pts;
    var ap = Vec2_sub(last(pts), a);
    var wasLeft = Vec2_cross(ab, ap) > 0;
    const line = new Line(new Vec2(), new Vec2());
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const p = pts[i]!, q = pts[j]!;
        Vec2_sub_m(p, a, ap);
        const isLeft = Vec2_cross(ab, ap) > 0;
        if (wasLeft != isLeft) {
            // Since the points are on opposite sides of the line, we know they intersect
            line.p1 = q;
            line.p2 = p;
            const intersection: Vec2 = Line_raycast(line, a, ab)!.point;
            left.push(intersection);
            right.push(intersection);
            if (srcUv && dstUv) {
                const uv1 = i === 0 ? last(srcUv) : srcUv[i - 1]!;
                const uv2 = srcUv[i]!;
                const ab = Vec2_sub(p, q);
                const ac = Vec2_sub(intersection, q);
                const alpha = Vec2_dot(ac, ab) / Vec2_length_squared(ab);
                const uv = Vec2_lerp(uv1, uv2, alpha);
                dstUv[0].push(uv);
                dstUv[1].push(uv);
            }
            wasLeft = isLeft;
        }
        (isLeft ? left : right).push(p);
        if (srcUv && dstUv) {
            (isLeft ? dstUv[0] : dstUv[1]).push(srcUv[i]!);
        }
    }
    return [
        left.length ? new Polygon(left) : null,
        right.length ? new Polygon(right) : null,
    ];
}
