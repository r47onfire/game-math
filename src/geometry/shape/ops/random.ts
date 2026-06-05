import { sqrt } from "lib0/math";
import { Vec2, Vec2_addScaled_m, Vec2_clone, Vec2_fromAngle, Vec2_lerp } from "../../../linearAlgebra";
import { Random_floatBelow, RandomSource } from "../../../random";
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

export const Polygon_random: RandomDispatchTable[ShapeType.POLYGON] = (polygon, rng) => {
    /**
     * TODO:
     * - cut into triangles
     * - choose a random triangle weighted on the triangles' areas
     * - choose a random point in the triangle
     */
    return Vec2_clone(polygon.pts[0]);
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
