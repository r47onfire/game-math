import { abs, sqrt } from "lib0/math";
import { freeze } from "lib0/object";

/**
 * A 3D vector.
 */
export class Vec3 {
    constructor(public x: number, public y: number, public z: number) {
    }
}

export const Vec3_dot = (v: Vec3, other: Vec3) => {
    return v.x * other.x + v.y * other.y + v.z * other.z;
}

export const Vec3_add = (v: Vec3, other: Vec3) => {
    return new Vec3(v.x + other.x, v.y + other.y, v.z + other.z);
}

export const Vec3_sub = (v: Vec3, other: Vec3) => {
    return new Vec3(v.x - other.x, v.y - other.y, v.z - other.z);
}

export const Vec3_cross = (v: Vec3, other: Vec3) => {
    return new Vec3(
        v.y * other.z - v.z * other.y,
        v.z * other.x - v.x * other.z,
        v.x * other.y - v.y * other.x,
    );
}

export const Vec3_toAxis = (v: Vec3): Vec3 => {
    const ax = abs(v.x);
    const ay = abs(v.y);
    const az = abs(v.z);

    if (ax >= ay && ax >= az) {
        return v.x < 0 ? V3_LEFT : V3_RIGHT;
    }
    else if (ay >= az) {
        return v.y < 0 ? V3_UP : V3_DOWN;
    }
    else {
        return v.z < 0 ? V3_BACK : V3_FORWARD;
    }
}

export const Vec3_mul_sv = (v: Vec3, scalar: number) => {
    return new Vec3(v.x * scalar, v.y * scalar, v.z * scalar);
}

export const Vec3_div_sv = (v: Vec3, scalar: number) => {
    return new Vec3(v.x / scalar, v.y / scalar, v.z / scalar);
}

export const Vec3_length_squared = (v: Vec3) => {
    return v.x * v.x + v.y * v.y + v.z * v.z;
}

export const Vec3_length = (v: Vec3) => {
    return sqrt(Vec3_length_squared(v));
}

export const Vec3_unit = (v: Vec3) => {
    return Vec3_div_sv(v, Vec3_length(v));
}

export const V3_LEFT = freeze(new Vec3(-1, 0, 0));
export const V3_RIGHT = freeze(new Vec3(1, 0, 0));
export const V3_UP = freeze(new Vec3(0, -1, 0));
export const V3_DOWN = freeze(new Vec3(0, 1, 0));
export const V3_FORWARD = freeze(new Vec3(0, 0, 1));
export const V3_BACK = freeze(new Vec3(0, 0, -1));
export const V3_ZERO = freeze(new Vec3(0, 0, 0));
export const V3_ONE = freeze(new Vec3(1, 1, 1));
