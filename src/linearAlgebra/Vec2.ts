import { abs, sqrt } from "lib0/math";
import { freeze } from "lib0/object";
import { deg2rad, rad2deg } from "../misc";
import { lerpNumber } from "../misc";
import { Mat4, Mat4_mul_Vec2 } from "./Mat4";
import { atan2, cos, sin } from "../common";

export class Vec2 {
    constructor(public x = 0, public y = x) {
    }
}

/** Set the X and Y of this vector */
export const Vec2_set = (v: Vec2, x: number, y: number): Vec2 => {
    v.x = x;
    v.y = y;
    return v;
}

/** angle is in degrees */
export const Vec2_fromAngle = (degrees: number) => {
    const angle = deg2rad(degrees);
    return new Vec2(cos(angle), sin(angle));
}

export const Vec2_fromArray = (arr: [number, number]) => {
    return new Vec2(arr[0], arr[1]);
}

/** Closest orthogonal direction: LEFT, RIGHT, UP, or DOWN */
export const Vec2_toAxis = (v: Vec2): Vec2 => {
    return abs(v.x) > abs(v.y)
        ? v.x < 0 ? V2_LEFT : V2_RIGHT
        : v.y < 0
            ? V2_UP
            : V2_DOWN;
}

/** Clone the vector */
export const Vec2_clone = (v: Vec2): Vec2 => {
    return new Vec2(v.x, v.y);
}

export const Vec2_copy = (v: Vec2, out: Vec2): Vec2 => {
    out.x = v.x;
    out.y = v.y;
    return out;
}

/** Returns the sum with another vector. */
export const Vec2_add = (a: Vec2, b: Vec2): Vec2 => {
    return new Vec2(a.x + b.x, a.y + b.y);
}

export const Vec2_addC = (a: Vec2, x: number, y: number): Vec2 => {
    return new Vec2(a.x + x, a.y + y);
}

export const Vec2_addScaled_m = (v: Vec2, other: Vec2, s: number, out: Vec2): Vec2 => {
    out.x = v.x + other.x * s;
    out.y = v.y + other.y * s;
    return out;
}

/**
 * Calculates the sum of the vectors
 * @param v - The first term
 * @param x - The x of the second term
 * @param y - The y of the second term
 * @param out - The vector sum
 *
 * @returns The sum of the vectors
 */
export const Vec2_addComponents_m = (v: Vec2, x: number, y: number, out: Vec2): Vec2 => {
    out.x = v.x + x;
    out.y = v.y + y;
    return out;
}

/**
 * Calculates the sum of the vectors
 * @param v - The first term
 * @param other - The second term
 * @param out - The vector sum
 *
 * @returns The sum of the vectors
 */
export const Vec2_add_m = (v: Vec2, other: Vec2, out: Vec2): Vec2 => {
    out.x = v.x + other.x;
    out.y = v.y + other.y;
    return out;
}

/** Returns the difference with another vector. */
export const Vec2_sub = (a: Vec2, b: Vec2): Vec2 => {
    return new Vec2(a.x - b.x, a.y - b.y);
}

/**
 * Calculates the difference of the vectors
 * @param v - The first term
 * @param x - The x of the second term
 * @param y - The y of the second term
 * @param out - The vector difference
 *
 * @returns The difference of the vectors
 */
export const Vec2_subC_m = (v: Vec2, x: number, y: number, out: Vec2): Vec2 => {
    out.x = v.x - x;
    out.y = v.y - y;
    return out;
}

/**
 * Calculates the difference of the vectors
 * @param v - The first term
 * @param other - The second term
 * @param out - The vector difference
 *
 * @returns The difference of the vectors
 */
export const Vec2_sub_m = (v: Vec2, other: Vec2, out: Vec2): Vec2 => {
    out.x = v.x - other.x;
    out.y = v.y - other.y;
    return out;
}

/** Scale by another vector. */
export const Vec2_scale = (a: Vec2, b: Vec2): Vec2 => {
    return new Vec2(a.x * b.x, a.y * b.y);
}

/** Scale both components by the same number. */
export const Vec2_scale_sv = (a: Vec2, b: number): Vec2 => {
    return new Vec2(a.x * b, a.y * b);
}

/**
 * Calculates the scale of the vector
 * @param v - The vector
 * @param s - The scale
 * @param out - The scaled vector
 *
 * @returns The scale of the vector
 */
export const Vec2_scale_sv_m = (v: Vec2, s: number, out: Vec2): Vec2 => {
    out.x = v.x * s;
    out.y = v.y * s;
    return out;
}

/**
 * Calculates the scale of the vector
 * @param v - The vector
 * @param x - The x scale
 * @param y - The y scale
 * @param out - The scaled vector
 *
 * @returns The scale of the vector
 */
export const Vec2_scaleC_m = (v: Vec2, x: number, y: number, out: Vec2): Vec2 => {
    out.x = v.x * x;
    out.y = v.y * y;
    return out;
}

/**
 * Calculates the scale of the vector
 * @param v - The vector
 * @param other - The scale
 * @param out - The scaled vector
 *
 * @returns The scale of the vector
 */
export const Vec2_scale_m = (v: Vec2, other: Vec2, out: Vec2): Vec2 => {
    out.x = v.x * other.x;
    out.y = v.y * other.y;
    return out;
}

/** Scale by the inverse of another vector. */
export const Vec2_invScale = (a: Vec2, b: Vec2): Vec2 => {
    return new Vec2(a.x / b.x, a.y / b.y);
}

/** Scale by the inverse of a number. */
export const Vec2_invScale_sv = (a: number, b: Vec2): Vec2 => {
    return new Vec2(a / b.x, a / b.y);
}

/** Get distance between another vector */
export const Vec2_distance = (a: Vec2, b: Vec2): number => {
    return sqrt(Vec2_distance_squared(a, b));
}


/**
 * Calculates the squared distance between the vectors
 * @param a - The vector
 * @param b - The other vector
 *
 * @returns The distance between the vectors
 */
export const Vec2_distance_squared = (a: Vec2, b: Vec2): number => {
    const x = a.x - b.x;
    const y = a.y - b.y;
    return x * x + y * y;
}

/**
 * Calculates the length of the vector
 * @param v - The vector
 *
 * @returns The length of the vector
 */
export const Vec2_length = (v: Vec2) => {
    return sqrt(Vec2_length_squared(v));
}

/**
 * Calculates the squared length of the vector
 * @param v - The vector
 *
 * @returns The squared length of the vector
 */
export const Vec2_length_squared = (v: Vec2) => {
    return v.x * v.x + v.y * v.y;
}

/**
 * Get the unit vector (length of 1).
 */
export const Vec2_unit = (v: Vec2): Vec2 => {
    const len = Vec2_length(v);
    return len === 0 ? new Vec2(0) : new Vec2(v.x / len, v.y / len);
}

export const Vec2_unit_m = (v: Vec2, out: Vec2): Vec2 => {
    const len = Vec2_length(v);
    if (len === 0) {
        out.x = 0;
        out.y = 0;
    } else {
        out.x = v.x / len;
        out.y = v.y / len;
    }
    return out;
}

/**
 * Get the perpendicular vector.
 */
export const Vec2_normal = (v: Vec2): Vec2 => {
    return new Vec2(v.y, -v.x);
}

export const Vec2_normal_m = (v: Vec2, out: Vec2): Vec2 => {
    out.x = v.y;
    out.y = -v.x;
    return out;
}

/**
 * Get the reflection of a vector with a normal.
 */
export const Vec2_reflect = (v: Vec2, normal: Vec2) => {
    return Vec2_sub(v, Vec2_scale_sv(normal, 2 * Vec2_dot(v, normal)));
}

/**
 * Get the projection of a vector onto another vector.
 */
export const Vec2_project = (v: Vec2, on: Vec2) => {
    return Vec2_scale_sv(on, Vec2_dot(on, v) / Vec2_length(on));
}

/**
 * Get the rejection of a vector onto another vector.
 */
export const Vec2_reject = (v: Vec2, on: Vec2) => {
    return Vec2_sub(v, Vec2_project(v, on));
}

export const Vec2_rotate_v = (v: Vec2, other: Vec2) => {
    return new Vec2(
        v.x * other.x - v.y * other.y,
        v.x * other.y + v.y * other.x,
    );
}

/** angle is in degrees */
export const Vec2_rotate_a = (v: Vec2, degrees: number) => {
    const angle = deg2rad(degrees);
    const c = cos(angle);
    const s = sin(angle);
    return new Vec2(
        v.x * c - v.y * s,
        v.x * s + v.y * c,
    );
}

/**
 * Calculates the rotated vector
 * @param v - The vector
 * @param dir - The rotation vector
 * @param out - The rotated vector
 *
 * @returns The rotated vector
 */
export const Vec2_rotate_v_m = (v: Vec2, dir: Vec2, out: Vec2): Vec2 => {
    const tmp = v.x;
    out.x = v.x * dir.x - v.y * dir.y;
    out.y = tmp * dir.y + v.y * dir.x;
    return out;
}

/**
 * Calculates the rotated vector
 * @param v - The vector
 * @param angle - The angle in radians
 * @param out - The rotated vector
 *
 * @returns The rotated vector
 */
export const Vec2_rotate_a_m = (v: Vec2, angle: number, out: Vec2): Vec2 => {
    const c = cos(angle);
    const s = sin(angle);
    const tmp = v.x;
    out.x = v.x * c - v.y * s;
    out.y = tmp * s + v.y * c;
    return out;
}

export const Vec2_invRotate_v = (v: Vec2, other: Vec2) => {
    return Vec2_rotate_v(v, new Vec2(other.x, -other.y));
}

export const Vec2_invRotate_a = (v: Vec2, degrees: number) => {
    return Vec2_rotate_a(v, -degrees);
}

/**
 * Calculates the inverse rotated vector
 * @param v - The vector
 * @param dir - The rotation vector
 * @param out - The rotated vector
 *
 * @returns The rotated vector
 */
export const Vec2_invRotate_v_m = (v: Vec2, dir: Vec2, out: Vec2): Vec2 => {
    const tmp = v.x;
    out.x = v.x * dir.x + v.y * dir.y;
    out.y = -tmp * dir.y + v.y * dir.x;
    return out;
}

/**
 * Get the dot product with another vector.
 */
export const Vec2_dot = (v: Vec2, other: Vec2): number => {
    return v.x * other.x + v.y * other.y;
}

/**
 * Get the cross product between 2 vectors.
 */
export const Vec2_cross = (v: Vec2, other: Vec2): number => {
    return v.x * other.y - v.y * other.x;
}

/**
 * Get the angle of the vector in **degrees**.
 */
export const Vec2_angle = (v: Vec2): number => {
    return rad2deg(Vec2_angle_r(v));
}

/**
 * Calculates the angle represented by the vector in radians
 * @param v - The vector
 *
 * @returns Angle represented by the vector in **radians**
 */
export const Vec2_angle_r = (v: Vec2) => {
    return atan2(v.y, v.x);
}

/**
 * Calculates the angle between the vectors in radians
 * @param v - First vector
 * @param other - Second vector
 *
 * @returns Angle between the vectors in radians
 */
export const Vec2_angleBetween = (v: Vec2, other: Vec2): number => {
    return rad2deg(atan2(Vec2_cross(v, other), Vec2_dot(v, other)));
}

/**
 * Linear interpolate to a destination vector (for positions).
 */
export const Vec2_lerp = (v: Vec2, dest: Vec2, t: number): Vec2 => {
    return new Vec2(
        lerpNumber(v.x, dest.x, t),
        lerpNumber(v.y, dest.y, t),
    );
}

/**
 * Linear interpolate src and dst by t
 * @param src - First vector
 * @param dst - Second vector
 * @param t - Percentage
 * @param out - The linear interpolation between src and dst by t
 *
 * @returns The linear interpolation between src and dst by t
 */
export const Vec2_lerp_m = (src: Vec2, dst: Vec2, t: number, out: Vec2): Vec2 => {
    out.x = src.x + (dst.x - src.x) * t;
    out.y = src.y + (dst.y - src.y) * t;
    return out;
}

/**
 * Spherical linear interpolate to a destination vector (for rotations).
 */
export const Vec2_spherical_lerp = (v: Vec2, dest: Vec2, t: number): Vec2 => {
    const cos = Vec2_dot(v, dest);
    const sin_ = Vec2_cross(v, dest);
    if (abs(sin_) < 1e-6) {
        return Vec2_lerp(v, dest, t);
    }
    const angle = atan2(sin_, cos);
    const t1 = sin((1 - t) * angle);
    const t2 = sin(t * angle);
    return new Vec2(
        (v.x * t1 + dest.x * t2) / sin_,
        (v.y * t1 + dest.y * t2) / sin_);
}

/**
 * Spherical interpolate src and dst by t
 * @param src - First vector
 * @param dst - Second vector
 * @param t - Percentage
 * @param out - The spherical interpolation between src and dst by t
 *
 * @returns The spherical interpolation between src and dst by t
 */
export const Vec2_spherical_lerp_m = (src: Vec2, dst: Vec2, t: number, out: Vec2): Vec2 => {
    const cos = Vec2_dot(src, dst);
    const sin_ = Vec2_cross(src, dst);
    if (abs(sin_) < 1e-6) {
        return Vec2_lerp_m(src, dst, t, out);
    }
    const angle = atan2(sin_, cos);
    const t1 = sin((1 - t) * angle);
    const t2 = sin(t * angle);
    out.x = (src.x * t1 + dst.x * t2) / sin_;
    out.y = (src.y * t1 + dst.y * t2) / sin_;
    return out;
}

/**
 * If the vector (x, y) is zero.
 */
export const Vec2_isZero = (v: Vec2): boolean => {
    return v.x === 0 && v.y === 0;
}

/**
 * To n precision floating point.
 */
export const Vec2_toFixed = (v: Vec2, n: number): Vec2 => {
    return new Vec2(Number(v.x.toFixed(n)), Number(v.y.toFixed(n)));
}

/**
 * Multiply by a Mat4.
 */
export const Vec2_transform_Mat4 = (v: Vec2, m: Mat4): Vec2 => {
    return Mat4_mul_Vec2(m, v);
}

/**
 * See if one vector is equal to another.
 */
export const Vec2_equals = (v: Vec2, other: Vec2): boolean => {
    return v.x === other.x && v.y === other.y;
}

/** An empty 2D vector. (0, 0) */
export const V2_ZERO = /* @__PURE__ */ freeze(new Vec2(0, 0));
/** A 2D vector with both components of 1. (1, 1) */
export const V2_ONE = /* @__PURE__ */ freeze(new Vec2(1, 1));
/** A 2D vector signaling to the left. (-1, 0) */
export const V2_LEFT = /* @__PURE__ */ freeze(new Vec2(-1, 0));
/** A 2D vector signaling to the right. (1, 0) */
export const V2_RIGHT = /* @__PURE__ */ freeze(new Vec2(1, 0));
/** A 2D vector signaling up. (0, -1) */
export const V2_UP = /* @__PURE__ */ freeze(new Vec2(0, -1));
/** A 2D vector signaling down. (0, 1) */
export const V2_DOWN = /* @__PURE__ */ freeze(new Vec2(0, 1));

export const V2_TOP_LEFT = /* @__PURE__ */ freeze(new Vec2(-1, -1));
export const V2_TOP = /* @__PURE__ */ freeze(new Vec2(0, -1));
export const V2_TOP_RIGHT = /* @__PURE__ */ freeze(new Vec2(1, -1));
export const V2_CENTER = /* @__PURE__ */ V2_ZERO;
export const V2_BOTTOM_LEFT = /* @__PURE__ */ freeze(new Vec2(-1, 1));
export const V2_BOTTOM = /* @__PURE__ */ V2_DOWN;
export const V2_BOTTOM_RIGHT = /* @__PURE__ */ V2_ONE;
