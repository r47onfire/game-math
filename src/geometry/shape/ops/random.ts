import { abs, sqrt } from "lib0/math";
import { Vec2, Vec2_addScaled_m, Vec2_clone, Vec2_fromAngle, Vec2_lerp } from "../../../linearAlgebra";
import { Random_floatBelow, Random_indexWeighted, RandomSource } from "../../../random";
import { triangulate } from "../../triangulate";
import { Point } from "../Point";
import { Shape, ShapeClassForType, ShapeType } from "../Shape";

type RandomDispatchTable = {
    [T in ShapeType]: (shape: ShapeClassForType<T>, rng: RandomSource) => Vec2;
};

export const Circle_random: RandomDispatchTable[ShapeType.CIRCLE] = (circle, rng) => {
    return Vec2_addScaled_m(circle.center, Vec2_fromAngle(Random_floatBelow(rng, 360)), sqrt(rng()) * circle.radius, new Vec2());
};

export const Ellipse_random: RandomDispatchTable[ShapeType.ELLIPSE] = (ellipse, rng) => {
    // TODO: generate point in unit disk, then transform to the ellipse
    return Vec2_clone(ellipse.center);
};

export const Line_random: RandomDispatchTable[ShapeType.LINE] = (line, rng) => rng() < .5 ? Vec2_lerp(line.p1, line.p2, rng()) : Vec2_lerp(line.p2, line.p1, rng());

export const Point_random = (p: Point) => Vec2_clone(p.pt);

const triangle_area = (p1: Vec2, p2: Vec2, p3: Vec2) => {
    const ax = p2.x - p1.x, ay = p2.y - p1.y;
    const bx = p3.x - p1.x, by = p3.y - p1.y;
    return abs(ax * by - ay * bx) / 2;
}
const triangle_random = (p1: Vec2, p2: Vec2, p3: Vec2, r1: number, r2: number) => {
    // https://math.stackexchange.com/q/18686
    const w1 = 1 - sqrt(r1);
    const w2 = sqrt(r1) * (1 - r2);
    const w3 = r2 * sqrt(r1);
    return new Vec2(
        p1.x * w1 + p2.x * w2 + p3.x * w3,
        p1.y * w1 + p2.y * w2 + p3.y * w3,
    );
}
export const Polygon_random: RandomDispatchTable[ShapeType.POLYGON] = (polygon, rng) => {
    const pts = polygon.pts;
    const tri = triangulate(pts);
    const weights: number[] = [];
    for (var i = 0; i < tri.length; i += 3) {
        weights.push(triangle_area(pts[tri[i]!]!, pts[tri[i + 1]!]!, pts[tri[i + 2]!]!));
    }
    const t = 3 * Random_indexWeighted(rng, weights);
    return triangle_random(pts[tri[t]!]!, pts[tri[t + 1]!]!, pts[tri[t + 2]!]!, rng(), rng());
}

export const Rect_random: RandomDispatchTable[ShapeType.RECTANGLE] = (rect, rng) =>
    new Vec2(
        rect.pos.x + Random_floatBelow(rng, rect.width),
        rect.pos.y + Random_floatBelow(rng, rect.height));

const randomDispatchTable: RandomDispatchTable = {
    [ShapeType.CIRCLE]: Circle_random,
    [ShapeType.ELLIPSE]: Ellipse_random,
    [ShapeType.LINE]: Line_random,
    [ShapeType.POINT]: Point_random,
    [ShapeType.POLYGON]: Polygon_random,
    [ShapeType.RECTANGLE]: Rect_random,
};

export const Shape_random = (shape: Shape, rng: RandomSource) => {
    return randomDispatchTable[shape.type](shape as any, rng);
}
