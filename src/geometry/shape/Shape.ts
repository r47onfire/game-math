import { Mat23, Vec2 } from "../../linearAlgebra";
import { RandomSource } from "../../random";
import { RaycastResult } from "./raycast";
import { Rect } from "./Rect";

export interface Shape {
    transform(m: Mat23, out?: Shape): Shape;
    bbox(out?: Rect): Rect;
    area(): number;
    clone(): Shape;
    contains(pt: Vec2): boolean;
    collides(other: Shape): boolean;
    raycast(origin: Vec2, direction: Vec2): RaycastResult<never>;
    random(rng: RandomSource): Vec2;
    support(direction: Vec2): Vec2;
    readonly gjkCenter: Vec2;
    closestPt(from: Vec2): Vec2 | undefined;
}
