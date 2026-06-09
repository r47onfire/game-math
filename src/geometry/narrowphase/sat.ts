import { abs, max, min, sign } from "lib0/math";
import { Vec2, Vec2_dot, Vec2_normal, Vec2_scale_sv, Vec2_sub, Vec2_unit_i } from "../../linearAlgebra";
import { Polygon, Rect_points, Shape, Shape_bbox, ShapeType } from "../shape";

export type SatResult = {
    normal: Vec2;
    distance: number;
};

const ensurePolygon = (shape: Shape): Polygon => {
    return shape.type === ShapeType.POLYGON ? shape as Polygon : new Polygon(Rect_points(Shape_bbox(shape)));
}

export const satShapeIntersection = (shape1: Shape, shape2: Shape) => {
    return sat(ensurePolygon(shape1), ensurePolygon(shape2));
}

export const sat = (p1: Polygon, p2: Polygon): SatResult | null => {
    var overlap = Infinity;
    var result: SatResult | null = null;
    for (const poly of [p1, p2]) {
        const pts = poly.pts, len = pts.length;
        for (var i = 0, j = len - 1; i < len; j = i++) {
            const a = poly.pts[j]!;
            const b = poly.pts[i]!;
            const axisProj = Vec2_unit_i(Vec2_normal(Vec2_sub(b, a)));
            var min1 = Infinity;
            var max1 = -Infinity;
            for (var k = 0; k < p1.pts.length; k++) {
                const q = Vec2_dot(p1.pts[k]!, axisProj);
                min1 = min(min1, q);
                max1 = max(max1, q);
            }
            var min2 = Infinity;
            var max2 = -Infinity;
            for (var k = 0; k < p2.pts.length; k++) {
                const q = Vec2_dot(p2.pts[k]!, axisProj);
                min2 = min(min2, q);
                max2 = max(max2, q);
            }
            const o = min(max1, max2) - max(min1, min2);
            if (o <= 0) {
                return null;
            }
            if (o < abs(overlap)) {
                const o1 = max2 - min1;
                const o2 = min2 - max1;
                overlap = abs(o1) < abs(o2) ? o1 : o2;
                if (!result) {
                    result = {
                        normal: overlap !== 0
                            ? Vec2_scale_sv(axisProj, sign(overlap))
                            : Vec2_scale_sv(axisProj, sign(min1 - max2)),
                        distance: abs(overlap),
                    };
                }
                else {
                    const s = overlap !== 0
                        ? sign(overlap)
                        : sign(min1 - max2);
                    result.normal.x = s * axisProj.x;
                    result.normal.y = s * axisProj.y;
                    result.distance = abs(overlap);
                }
            }
        }
    }
    return result;
}
