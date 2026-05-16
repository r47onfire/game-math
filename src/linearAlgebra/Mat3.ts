import { Mat2 } from "./Mat2";

class Mat3 {
    // m11 m12 m13
    // m21 m22 m23
    // m31 m32 m33

    constructor(
        public m11: number,
        public m12: number,
        public m13: number,
        public m21: number,
        public m22: number,
        public m23: number,
        public m31: number,
        public m32: number,
        public m33: number,
    ) {
    }
}

export const Mat3_fromMat2 = (m: Mat2) => {
    return new Mat3(
        m.a,
        m.b,
        0,
        m.c,
        m.d,
        0,
        0,
        0,
        1,
    );
}

export const Mat3_toMat2 = (m: Mat3) => {
    return new Mat2(
        m.m11,
        m.m12,
        m.m21,
        m.m22,
    );
}

export const Mat3_mul_Mat3 = (m: Mat3, other: Mat3): Mat3 => {
    return new Mat3(
        m.m11 * other.m11 + m.m12 * other.m21 + m.m13 * other.m31,
        m.m11 * other.m12 + m.m12 * other.m22 + m.m13 * other.m32,
        m.m11 * other.m13 + m.m12 * other.m23 + m.m13 * other.m33,
        m.m21 * other.m11 + m.m22 * other.m21 + m.m23 * other.m31,
        m.m21 * other.m12 + m.m22 * other.m22 + m.m23 * other.m32,
        m.m21 * other.m13 + m.m22 * other.m23 + m.m23 * other.m33,
        m.m31 * other.m11 + m.m32 * other.m21 + m.m33 * other.m31,
        m.m31 * other.m12 + m.m32 * other.m22 + m.m33 * other.m32,
        m.m31 * other.m13 + m.m32 * other.m23 + m.m33 * other.m33,
    );
}

export const Mat3_det = (m: Mat3): number => {
    return m.m11 * m.m22 * m.m33 + m.m12 * m.m23 * m.m31
        + m.m13 * m.m21 * m.m32 - m.m13 * m.m22 * m.m31
        - m.m12 * m.m21 * m.m33 - m.m11 * m.m23 * m.m32;
}

export const Mat3_rotate_i = (m: Mat3, radians: number) => {
    const c = cos(radians);
    const s = sin(radians);
    const oldA = m.m11;
    const oldB = m.m12;
    m.m11 = c * m.m11 + s * m.m21;
    m.m12 = c * m.m12 + s * m.m22;
    m.m21 = c * m.m21 - s * oldA;
    m.m22 = c * m.m22 - s * oldB;
    return m;
}

export const Mat3_scale_i = (m: Mat3, x: number, y: number) => {
    m.m11 *= x;
    m.m12 *= x;
    m.m21 *= y;
    m.m22 *= y;
    return m;
}

export const Mat3_inverse = (m: Mat3): Mat3 => {
    const det = Mat3_det(m);
    return new Mat3(
        (m.m22 * m.m33 - m.m23 * m.m32) / det,
        (m.m13 * m.m32 - m.m12 * m.m33) / det,
        (m.m12 * m.m23 - m.m13 * m.m22) / det,
        (m.m23 * m.m31 - m.m21 * m.m33) / det,
        (m.m11 * m.m33 - m.m13 * m.m31) / det,
        (m.m13 * m.m21 - m.m11 * m.m23) / det,
        (m.m21 * m.m32 - m.m22 * m.m31) / det,
        (m.m12 * m.m31 - m.m11 * m.m32) / det,
        (m.m11 * m.m22 - m.m12 * m.m21) / det,
    );
}

export const Mat3_transpose = (m: Mat3): Mat3 => {
    return new Mat3(
        m.m11,
        m.m21,
        m.m31,
        m.m12,
        m.m22,
        m.m32,
        m.m13,
        m.m23,
        m.m33,
    );
}
