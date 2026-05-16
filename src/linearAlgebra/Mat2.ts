import { abs, sqrt } from "lib0/math";
import { V2_RIGHT, Vec2 } from "./Vec2";

export class Mat2 {
    // 2x2 matrix
    // | a b |
    // | c d |

    constructor(public a: number, public b: number, public c: number, public d: number) {
    }
}

export const Mat2_mul_Mat2 = (m: Mat2, other: Mat2) => {
    return new Mat2(
        m.a * other.a + m.b * other.c,
        m.a * other.b + m.b * other.d,
        m.c * other.a + m.d * other.c,
        m.c * other.b + m.d * other.d,
    );
}

export const Mat2_transformPoint = (m: Mat2, point: Vec2): Vec2 => {
    return new Vec2(
        m.a * point.x + m.b * point.y,
        m.c * point.x + m.d * point.y,
    );
}

export const Mat2_inverse = (m: Mat2) => {
    const det = Mat2_det(m);
    return new Mat2(
        m.d / det,
        -m.b / det,
        -m.c / det,
        m.a / det,
    );
}

export const Mat2_transpose = (m: Mat2) => {
    return new Mat2(
        m.a,
        m.c,
        m.b,
        m.d,
    );
}

export const Mat2_eigenvalues = (m_: Mat2) => {
    const m = Mat2_trace(m_) / 2;
    const d = Mat2_det(m_);
    const e1 = m + sqrt(m * m - d);
    const e2 = m - sqrt(m * m - d);
    return [e1, e2];
}

export const Mat2_eigenvectors = (m: Mat2, e1: number, e2: number) => {
    if (m.c != 0) {
        return [[e1 - m.d, m.c], [e2 - m.d, m.c]];
    }
    else if (m.b != 0) {
        return [[m.b, e1 - m.a], [m.b, e2 - m.a]];
    }
    else {
        if (abs(Mat2_transformPoint(m, V2_RIGHT).x - e1) < Number.EPSILON) {
            return [[1, 0], [0, 1]];
        }
        else {
            return [[0, 1], [1, 0]];
        }
    }
}

export const Mat2_det = (m: Mat2) => {
    return m.a * m.d - m.b * m.c;
}

export const Mat2_trace = (m: Mat2) => {
    return m.a + m.d;
}

export const Mat2_fromRotation = (radians: number) => {
    const c = cos(radians);
    const s = sin(radians);
    return new Mat2(
        c,
        s,
        -s,
        c,
    );
}

export const Mat2_fromScale = (x: number, y: number) => {
    return new Mat2(x, 0, 0, y);
}
