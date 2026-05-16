import { sqrt } from "lib0/math";
import { atan2, cos, sin, tan } from "../common";
import { deg2rad, rad2deg } from "../misc";
import { Mat2 } from "./Mat2";
import { Vec2 } from "./Vec2";

export class Mat23 {
    // 2x3 matrix, 2 rows and 3 columns, the last row is implicitly (0, 0, 1)
    // | a c e |
    // | b d f |
    // | 0 0 1 |
    // Acts like a Mat2 + Vec2, but that would be 3 objects for 1 matrix
    constructor(
        public a: number = 1,
        public b: number = 0,
        public c: number = 0,
        public d: number = 1,
        public e: number = 0,
        public f: number = 0,
    ) {
    }
}
export const Mat23_from_Mat2 = (m: Mat2) => {
    return new Mat23(
        m.a,
        m.b,
        m.c,
        m.d,
        0,
        0,
    );
}
export const Mat23_to_Mat2 = (m: Mat23) => {
    return new Mat2(
        m.a,
        m.b,
        m.c,
        m.d,
    );
}
// | 1 0 x |
// | 0 1 y |
// | 0 0 1 |
export const Mat23_fromTranslation = (t: Vec2) => {
    return new Mat23(
        1,
        0,
        0,
        1,
        t.x,
        t.y,
    );
}
// | c -s 0 |
// | s  c 0 |
// | 0 0 1 |
export const Mat23_fromRotation = (radians: number) => {
    const c = cos(radians);
    const s = sin(radians);
    return new Mat23(
        c,
        s,
        -s,
        c,
        0,
        0,
    );
}
// | x 0 0 |
// | 0 y 0 |
// | 0 0 1 |
export const Mat23_fromScale = (s: Vec2): Mat23 => {
    return new Mat23(
        s.x,
        0,
        0,
        s.y,
        0,
        0,
    );
}
// | 1 x 0 |
// | y 1 0 |
// | 0 0 1 |
export const Mat23_fromSkew = (s: Vec2): Mat23 => {
    const x = tan(s.x);
    const y = tan(s.y);
    return new Mat23(
        1,
        y,
        x,
        1,
        0,
        0,
    );
}
export const Mat23_clone = (m: Mat23) => {
    return new Mat23(
        m.a,
        m.b,
        m.c,
        m.d,
        m.e,
        m.f,
    );
}
export const Mat23_copyFrom = (self: Mat23, m: Mat23) => {
    self.a = m.a;
    self.b = m.b;
    self.c = m.c;
    self.d = m.d;
    self.e = m.e;
    self.f = m.f;
    _Mat23_inverse_map.set(self, _Mat23_inverse_map.get(m)!);
    return self;
}
// | 1 0 0 |
// | 0 1 0 |
// | 0 0 1 |
export const Mat23_setIdentity = (m: Mat23) => {
    m.a = 1;
    m.b = 0;
    m.c = 0;
    m.d = 1;
    m.e = 0;
    m.f = 0;
    _Mat23_inverse_map.delete(m);
    return m;
}
export const Mat23_setTRS = (m: Mat23, x: number, y: number, angle: number, sx: number, sy: number) => {
    const radians = deg2rad(angle);
    const c = cos(radians);
    const s = sin(radians);
    m.a = c * sx;
    m.b = s * sx;
    m.c = -s * sy;
    m.d = c * sy;
    m.e = x;
    m.f = y;
}
export const Mat23_mul_Mat23 = (m: Mat23, other: Mat23): Mat23 => {
    return new Mat23(
        other.a * m.a + other.b * m.c,
        other.a * m.b + other.b * m.d,
        other.c * m.a + other.d * m.c,
        other.c * m.b + other.d * m.d,
        other.e * m.a + other.f * m.c + m.e,
        other.e * m.b + other.f * m.d + m.f,
    );
}
// | a c e |   | 1 0 x |
// | b d f | * | 0 1 y |
// | 0 0 1 |   | 0 0 1 |
export const Mat23_translateSelfV = (m: Mat23, t: Vec2): Mat23 => {
    m.e += t.x * m.a + t.y * m.c;
    m.f += t.x * m.b + t.y * m.d;
    _Mat23_inverse_map.delete(m);
    return m;
}
// | a c e |   | 1 0 x |
// | b d f | * | 0 1 y |
// | 0 0 1 |   | 0 0 1 |
export const Mat23_translateSelf = (m: Mat23, x: number, y: number): Mat23 => {
    m.e += x * m.a + y * m.c;
    m.f += x * m.b + y * m.d;
    _Mat23_inverse_map.delete(m);
    return m;
}
// | a c e |   | c -s 0 |
// | b d f | * | s  c 0 |
// | 0 0 1 |   | 0  0 1 |
export const Mat23_rotateSelf = (m: Mat23, degrees: number): Mat23 => {
    const radians = deg2rad(degrees);
    const c = cos(radians);
    const s = sin(radians);
    const oldA = m.a;
    const oldB = m.b;
    m.a = c * m.a + s * m.c;
    m.b = c * m.b + s * m.d;
    m.c = c * m.c - s * oldA;
    m.d = c * m.d - s * oldB;
    _Mat23_inverse_map.delete(m);
    return m;
}
// | a c e |   | x 0 0 |
// | b d f | * | 0 y 0 |
// | 0 0 1 |   | 0 0 1 |
export const Mat23_scaleSelfV = (m: Mat23, s: Vec2): Mat23 => {
    m.a *= s.x;
    m.b *= s.x;
    m.c *= s.y;
    m.d *= s.y;
    _Mat23_inverse_map.delete(m);
    return m;
}
// | a c e |   | x 0 0 |
// | b d f | * | 0 y 0 |
// | 0 0 1 |   | 0 0 1 |
export const Mat23_scaleSelf = (m: Mat23, x: number, y: number): Mat23 => {
    m.a *= x;
    m.b *= x;
    m.c *= y;
    m.d *= y;
    _Mat23_inverse_map.delete(m);
    return m;
}
// | a c e |   | 1 x 0 |
// | b d f | * | y 1 0 |
// | 0 0 1 |   | 0 0 1 |
export const Mat23_skewSelfV = (m: Mat23, s: Vec2): Mat23 => {
    const x = tan(deg2rad(s.x));
    const y = tan(deg2rad(s.y));
    const oldA = m.a;
    const oldB = m.b;
    m.a += m.c * y;
    m.b += m.d * y;
    m.c += oldA * x;
    m.d += oldB * x;
    _Mat23_inverse_map.delete(m);
    return m;
}
// | a c e |   | 1 x 0 |
// | b d f | * | y 1 0 |
// | 0 0 1 |   | 0 0 1 |
export const Mat23_skewSelf = (m: Mat23, x: number, y: number): Mat23 => {
    x = tan(deg2rad(x));
    y = tan(deg2rad(y));
    const oldA = m.a;
    const oldB = m.b;
    m.a += m.c * y;
    m.b += m.d * y;
    m.c += oldA * x;
    m.d += oldB * x;
    _Mat23_inverse_map.delete(m);
    return m;
}
export const Mat23_mul_Mat23_i = (m: Mat23, other: Mat23): Mat23 => {
    const a = other.a * m.a + other.b * m.c;
    const b = other.a * m.b + other.b * m.d;
    const c = other.c * m.a + other.d * m.c;
    const d = other.c * m.b + other.d * m.d;
    const e = other.e * m.a + other.f * m.c + m.e;
    const f = other.e * m.b + other.f * m.d + m.f;
    m.a = a;
    m.b = b;
    m.c = c;
    m.d = d;
    m.e = e;
    m.f = f;
    _Mat23_inverse_map.delete(m);
    return m;
}
// | a c e |   | x |
// | b d f | * | y |
// | 0 0 1 |   | 1 |
export const Mat23_transform_Vec2 = (m: Mat23, p: Vec2) => {
    return new Vec2(
        m.a * p.x + m.c * p.y + m.e,
        m.b * p.x + m.d * p.y + m.f,
    );
}
// | a c e |   | x |
// | b d f | * | y |
// | 0 0 1 |   | 1 |
export const Mat23_transformPointV_m = (m: Mat23, p: Vec2, out: Vec2): Vec2 => {
    const tmp = p.x;
    out.x = m.a * p.x + m.c * p.y + m.e;
    out.y = m.b * tmp + m.d * p.y + m.f;
    return out;
}
// | a c e |   | x |
// | b d f | * | y |
// | 0 0 1 |   | 0 |
export const Mat23_transformVectorV_m = (m: Mat23, v: Vec2, out: Vec2): Vec2 => {
    const tmp = v.x;
    out.x = m.a * v.x + m.c * v.y;
    out.y = m.b * tmp + m.d * v.y;
    return out;
}
// | a c e |   | x |
// | b d f | * | y |
// | 0 0 1 |   | 1 |
export const Mat23_transformPoint_m = (m: Mat23, x: number, y: number, out: Vec2): Vec2 => {
    const tmp = x;
    out.x = m.a * x + m.c * y + m.e;
    out.y = m.b * tmp + m.d * y + m.f;
    return out;
}
// | a c e |   | x |
// | b d f | * | y |
// | 0 0 1 |   | 0 |
export const Mat23_transformVector_m = (m: Mat23, x: number, y: number, out: Vec2): Vec2 => {
    const tmp = x;
    out.x = m.a * x + m.c * y;
    out.y = m.b * tmp + m.d * y;
    return out;
}

export const Mat23_det = (m: Mat23) => {
    return m.a * m.d - m.b * m.c;
}

const _Mat23_inverse_map = new WeakMap<Mat23, Mat23>();
export const Mat23_inverse = (m: Mat23) => {
    if (_Mat23_inverse_map.has(m)) return _Mat23_inverse_map.get(m)!;
    const det = Mat23_det(m);
    const inverse = new Mat23(
        m.d / det,
        -m.b / det,
        -m.c / det,
        m.a / det,
        (m.c * m.f - m.d * m.e) / det,
        (m.b * m.e - m.a * m.f) / det,
    );
    _Mat23_inverse_map.set(m, inverse);
    return inverse;
}
// The translation is directly accessible
export const Mat23_getTranslation = (m: Mat23) => {
    return new Vec2(m.e, m.f);
}
// Using atan2(y, x) = angle
// since a = sx * cos(angle)
//       b = sx * sin(angle)
// and atan2 does y / x, thus sx is eliminated
/** result is in **degrees** */
export const Mat23_getRotation = (m: Mat23) => {
    if (m.a || m.b) {
        return rad2deg(
            atan2(m.b, m.a),
        );
    }
    else {
        return 90 - rad2deg(atan2(m.d, m.c));
    }
}
// Using cos^2 + sin^2 = 1, thus sqrt(a^2 + b^2) contains the scale
// since a = sx * cos(angle)
//       b = sx * sin(angle)
export const Mat23_getScale = (m: Mat23) => {
    const d = Mat23_det(m);
    if (d != 0) {
        if (m.a || m.b) {
            const r = sqrt(m.a * m.a + m.b * m.b);
            return new Vec2(r, d / r);
        }
        else if (m.c || m.d) {
            const s = sqrt(m.c * m.c + m.d * m.d);
            return new Vec2(d / s, s);
        }
    }
    return new Vec2(0);
}
export const Mat23_getSkew = (m: Mat23) => {
    if (m.a || m.b) {
        return new Vec2(
            rad2deg(atan2(m.a * m.c + m.b * m.d, m.a * m.a + m.b * m.b)),
            0,
        );
    }
    else if (m.c || m.d) {
        return new Vec2(
            0,
            rad2deg(atan2(m.a * m.c + m.b * m.d, m.c * m.c + m.d * m.d)),
        );
    }
    return new Vec2(0);
}
