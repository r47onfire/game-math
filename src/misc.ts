import { max, min } from "lib0/math";
import { cos, PI } from "./common";
export const clamp = (
    val: number,
    a: number,
    b: number,
): number => {
    return a > b ? clamp(val, b, a) : min(max(val, a), b);
};

/** Assuming angle is in degrees */
export const clampAngle = (degrees: number) => {
    degrees = degrees % 360;
    if (degrees < -180) {
        degrees += 360;
    }
    else if (degrees > 180) {
        degrees -= 360;
    }
    return degrees;
}

export const lerpNumber = (a: number, b: number, t: number) => {
    return a + (b - a) * t;
};

export const lerpAngle = (a: number, b: number, t: number) => {
    return clampAngle(a + clampAngle(b - a) * t);
}

export const map = (
    v: number,
    l1: number,
    h1: number,
    l2: number,
    h2: number,
): number => {
    return l2 + (v - l1) / (h1 - l1) * (h2 - l2);
}

export const mapClamped = (
    v: number,
    l1: number,
    h1: number,
    l2: number,
    h2: number,
): number => {
    return clamp(map(v, l1, h1, l2, h2), l2, h2);
}

/** Like the GLSL function of the same name */
export const step = (edge: number, x: number) => {
    return x < edge ? 0 : 1;
}

/** Like the GLSL function of the same name */
export const smoothstep = (edge0: number, edge1: number, x: number) => {
    x = clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return x * x * (3 - 2 * x);
}

export const wave = <V = number>(
    lo: V,
    hi: V,
    t: number,
    periodicFunction = (t: number) => -cos(t),
    lerp: (a: V, b: V, t: number) => V = lerpNumber as any
): V => {
    return lerp(lo, hi, (periodicFunction(t) + 1) / 2);
};

export const deg2rad = (deg: number): number => {
    return deg * PI / 180;
};

export const rad2deg = (rad: number): number => {
    return rad * 180 / PI;
};

