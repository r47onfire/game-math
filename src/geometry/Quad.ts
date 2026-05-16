import { Vec2 } from "../linearAlgebra";

export class Quad {
    constructor(public x = 0, public y = 0, public w = 1, public h = 1) {
    }
}
export const Quad_scale = (q: Quad, other: Quad): Quad => {
    return new Quad(
        q.x + q.w * other.x,
        q.y + q.h * other.y,
        q.w * other.w,
        q.h * other.h,
    );
}
export const Quad_pos = (q: Quad) => {
    return new Vec2(q.x, q.y);
}
export const Quad_clone = (q: Quad): Quad => {
    return new Quad(q.x, q.y, q.w, q.h);
}
export const Quad_equals = (q: Quad, other: Quad): boolean => {
    return q.x === other.x
        && q.y === other.y
        && q.w === other.w
        && q.h === other.h;
}
