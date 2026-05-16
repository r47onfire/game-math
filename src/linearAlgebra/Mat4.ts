import { sqrt } from "lib0/math";
import { freeze } from "lib0/object.js";
import { cos, HALF_PI, sin } from "../common";
import { deg2rad, rad2deg } from "../misc";
import { Vec2 } from "./Vec2";
import { Vec3 } from "./Vec3";

type array16<T> = [
    T, T, T, T,
    T, T, T, T,
    T, T, T, T,
    T, T, T, T
];

/**
 * @group Math
 */
export class Mat4 {

    constructor(public m: array16<number>) {
    }

}

export const Mat4_translateXY = (p: Vec2): Mat4 => {
    return new Mat4([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        p.x, p.y, 0, 1,
    ]);
}

export const Mat4_translateXYZ = (p: Vec3) => {
    return new Mat4([
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        p.x, p.y, p.z, 1,
    ]);
}

export const Mat4_scale = (s: Vec2): Mat4 => {
    return new Mat4([
        s.x, 0, 0, 0,
        0, s.y, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]);
}

export const Mat4_scale3 = (s: Vec3): Mat4 => {
    return new Mat4([
        s.x, 0, 0, 0,
        0, s.y, 0, 0,
        0, 0, s.z, 0,
        0, 0, 0, 1,
    ]);
}

export const Mat4_rotateX = (a: number): Mat4 => {
    a = deg2rad(-a);
    const c = cos(a);
    const s = sin(a);
    return new Mat4([
        1, 0, 0, 0,
        0, c, -s, 0,
        0, s, c, 0,
        0, 0, 0, 1,
    ]);
}

export const Mat4_rotateY = (a: number): Mat4 => {
    a = deg2rad(-a);
    const c = cos(a);
    const s = sin(a);
    return new Mat4([
        c, 0, s, 0,
        0, 1, 0, 0,
        -s, 0, c, 0,
        0, 0, 0, 1,
    ]);
}

export const Mat4_rotateZ = (a: number): Mat4 => {
    a = deg2rad(-a);
    const c = cos(a);
    const s = sin(a);
    return new Mat4([
        c, -s, 0, 0,
        s, c, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1,
    ]);
}

export const Mat4_perspective = (
    left: number,
    right: number,
    top: number,
    bottom: number,
    near: number,
    far: number,
    focus: number,
) => {
    const sx = 2 * focus / (right - left);
    const sy = 2 * focus / (top - bottom);
    const sz = -(far + near) / (far - near);
    const tz = -2 * far * near / (far - near);
    const tx = (left + right) / (right - left);
    const ty = (bottom + top) / (top - bottom);
    return new Mat4([
        sx, 0, 0, 0,
        0, sy, 0, 0,
        tx, ty, tz, -1,
        0, 0, sz, 0,
    ]);
}

export const Mat4_translate_i = (m: Mat4, p: Vec2): Mat4 => {
    m.m[12] += m.m[0] * p.x + m.m[4] * p.y;
    m.m[13] += m.m[1] * p.x + m.m[5] * p.y;
    m.m[14] += m.m[2] * p.x + m.m[6] * p.y;
    m.m[15] += m.m[3] * p.x + m.m[7] * p.y;
    return m;
}

export const Mat4_scale_i = (m: Mat4, p: Vec2): Mat4 => {
    m.m[0] *= p.x;
    m.m[4] *= p.y;
    m.m[1] *= p.x;
    m.m[5] *= p.y;
    m.m[2] *= p.x;
    m.m[6] *= p.y;
    m.m[3] *= p.x;
    m.m[7] *= p.y;
    return m;
}

export const Mat4_rotateX_i = (m: Mat4, a: number): Mat4 => {
    a = deg2rad(-a);
    const c = cos(a);
    const s = sin(a);
    const m0 = m.m[0];
    const m1 = m.m[1];
    const m4 = m.m[4];
    const m5 = m.m[5];
    m.m[0] = m0 * c + m1 * s;
    m.m[1] = -m0 * s + m1 * c;
    m.m[4] = m4 * c + m5 * s;
    m.m[5] = -m4 * s + m5 * c;
    return m;
}

// TODO: in-place variant
export const Mat4_mul_Mat4 = (m: Mat4, other: Mat4): Mat4 => {
    const out = [];
    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            out[i * 4 + j] = m.m[0 * 4 + j]! * other.m[i * 4 + 0]!
                + m.m[1 * 4 + j]! * other.m[i * 4 + 1]!
                + m.m[2 * 4 + j]! * other.m[i * 4 + 2]!
                + m.m[3 * 4 + j]! * other.m[i * 4 + 3]!;
        }
    }
    return new Mat4(out as array16<number>);
}

export const Mat4_mul_Vec2 = (m: Mat4, p: Vec2): Vec2 => {
    return new Vec2(
        p.x * m.m[0] + p.y * m.m[4] + m.m[12],
        p.x * m.m[1] + p.y * m.m[5] + m.m[13],
    );
}

export const Mat4_getTranslation = (m: Mat4) => {
    return new Vec2(m.m[12], m.m[13]);
}

export const Mat4_getScale = (m: Mat4) => {
    if (m.m[0] != 0 || m.m[1] != 0) {
        const det = m.m[0] * m.m[5] - m.m[1] * m.m[4];
        const r = sqrt(m.m[0] * m.m[0] + m.m[1] * m.m[1]);
        return new Vec2(r, det / r);
    }
    else if (m.m[4] != 0 || m.m[5] != 0) {
        const det = m.m[0] * m.m[5] - m.m[1] * m.m[4];
        const s = sqrt(m.m[4] * m.m[4] + m.m[5] * m.m[5]);
        return new Vec2(det / s, s);
    }
    else {
        return new Vec2(0, 0);
    }
}

/** result is in **degrees** */
export const Mat4_getRotation = (m: Mat4) => {
    if (m.m[0] != 0 || m.m[1] != 0) {
        const r = sqrt(m.m[0] * m.m[0] + m.m[1] * m.m[1]);
        return rad2deg(
            m.m[1] > 0
                ? Math.acos(m.m[0] / r)
                : -Math.acos(m.m[0] / r));
    }
    if (m.m[4] != 0 || m.m[5] != 0) {
        const s = Math.sqrt(m.m[4] * m.m[4] + m.m[5] * m.m[5]);
        return rad2deg(
            HALF_PI - (m.m[5] > 0
                ? Math.acos(-m.m[4] / s)
                : -Math.acos(m.m[4] / s)));
    }
    return 0;
}

export const Mat4_getSkew = (m: Mat4) => {
    if (m.m[0] != 0 || m.m[1] != 0) {
        const r = sqrt(m.m[0] * m.m[0] + m.m[1] * m.m[1]);
        return new Vec2(
            Math.atan(m.m[0] * m.m[4] + m.m[1] * m.m[5]) / (r * r),
            0);
    }
    else if (m.m[4] != 0 || m.m[5] != 0) {
        const s = sqrt(m.m[4] * m.m[4] + m.m[5] * m.m[5]);
        return new Vec2(
            0,
            Math.atan(m.m[0] * m.m[4] + m.m[1] * m.m[5]) / (s * s));
    }
    else {
        return new Vec2(0, 0);
    }
}

export const Mat4_invert = (m: Mat4): Mat4 => {
    const out = [];

    const f00 = m.m[10] * m.m[15] - m.m[14] * m.m[11];
    const f01 = m.m[9] * m.m[15] - m.m[13] * m.m[11];
    const f02 = m.m[9] * m.m[14] - m.m[13] * m.m[10];
    const f03 = m.m[8] * m.m[15] - m.m[12] * m.m[11];
    const f04 = m.m[8] * m.m[14] - m.m[12] * m.m[10];
    const f05 = m.m[8] * m.m[13] - m.m[12] * m.m[9];
    const f06 = m.m[6] * m.m[15] - m.m[14] * m.m[7];
    const f07 = m.m[5] * m.m[15] - m.m[13] * m.m[7];
    const f08 = m.m[5] * m.m[14] - m.m[13] * m.m[6];
    const f09 = m.m[4] * m.m[15] - m.m[12] * m.m[7];
    const f10 = m.m[4] * m.m[14] - m.m[12] * m.m[6];
    const f11 = m.m[5] * m.m[15] - m.m[13] * m.m[7];
    const f12 = m.m[4] * m.m[13] - m.m[12] * m.m[5];
    const f13 = m.m[6] * m.m[11] - m.m[10] * m.m[7];
    const f14 = m.m[5] * m.m[11] - m.m[9] * m.m[7];
    const f15 = m.m[5] * m.m[10] - m.m[9] * m.m[6];
    const f16 = m.m[4] * m.m[11] - m.m[8] * m.m[7];
    const f17 = m.m[4] * m.m[10] - m.m[8] * m.m[6];
    const f18 = m.m[4] * m.m[9] - m.m[8] * m.m[5];

    out[0] = m.m[5] * f00 - m.m[6] * f01 + m.m[7] * f02;
    out[4] = -(m.m[4] * f00 - m.m[6] * f03 + m.m[7] * f04);
    out[8] = m.m[4] * f01 - m.m[5] * f03 + m.m[7] * f05;
    out[12] = -(m.m[4] * f02 - m.m[5] * f04 + m.m[6] * f05);

    out[1] = -(m.m[1] * f00 - m.m[2] * f01 + m.m[3] * f02);
    out[5] = m.m[0] * f00 - m.m[2] * f03 + m.m[3] * f04;
    out[9] = -(m.m[0] * f01 - m.m[1] * f03 + m.m[3] * f05);
    out[13] = m.m[0] * f02 - m.m[1] * f04 + m.m[2] * f05;

    out[2] = m.m[1] * f06 - m.m[2] * f07 + m.m[3] * f08;
    out[6] = -(m.m[0] * f06 - m.m[2] * f09 + m.m[3] * f10);
    out[10] = m.m[0] * f11 - m.m[1] * f09 + m.m[3] * f12;
    out[14] = -(m.m[0] * f08 - m.m[1] * f10 + m.m[2] * f12);

    out[3] = -(m.m[1] * f13 - m.m[2] * f14 + m.m[3] * f15);
    out[7] = m.m[0] * f13 - m.m[2] * f16 + m.m[3] * f17;
    out[11] = -(m.m[0] * f14 - m.m[1] * f16 + m.m[3] * f18);
    out[15] = m.m[0] * f15 - m.m[1] * f17 + m.m[2] * f18;

    const det = m.m[0] * out[0]
        + m.m[1] * out[4]
        + m.m[2] * out[8]
        + m.m[3] * out[12];

    for (var i = 0; i < 4; i++) {
        for (var j = 0; j < 4; j++) {
            out[i * 4 + j]! /= det;
        }
    }

    return new Mat4(out as array16<number>);
}

export const Mat4_clone = (m: Mat4): Mat4 => {
    return new Mat4(m.m.slice() as array16<number>);
}

export const M4_IDENTITY = freeze(new Mat4(freeze([
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1,
]) as any));
