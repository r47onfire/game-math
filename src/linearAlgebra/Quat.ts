import { abs, sqrt } from "lib0/math";
import { acos, cos, sin } from "../common";
import { deg2rad } from "../misc";
import { Mat4 } from "./Mat4";
import { Vec3, Vec3_unit } from "./Vec3";

export class Quat {

    constructor(public x: number, public y: number, public z: number, public w: number) {
    }
}

export const Quat_fromAxisAngle = (axis: Vec3, angle: number) => {
    axis = Vec3_unit(axis);
    angle = deg2rad(angle);
    const s = sin(angle / 2);
    return new Quat(
        axis.x * s,
        axis.y * s,
        axis.z * s,
        cos(angle / 2),
    );
}

export const Quat_toMat4 = (q: Quat): Mat4 => {
    const x = q.x;
    const y = q.y;
    const z = q.z;
    const w = q.w;

    return new Mat4([
        1 - 2 * y * y - 2 * z * z,
        2 * x * y - 2 * w * z,
        2 * x * z + 2 * w * y,
        0,
        2 * x * y + 2 * w * z,
        1 - 2 * x * x - 2 * z * z,
        2 * y * z - 2 * w * x,
        0,
        2 * x * z - 2 * w * y,
        2 * y * z + 2 * w * x,
        1 - 2 * x * x - 2 * y * y,
        0,
        0,
        0,
        0,
        1,
    ]);
}

export const Quat_add = (q: Quat, other: Quat) => {
    return new Quat(
        q.x + other.x,
        q.y + other.y,
        q.z + other.z,
        q.w + other.w,
    );
}

export const Quat_sub = (q: Quat, other: Quat) => {
    return new Quat(
        q.x - other.x,
        q.y - other.y,
        q.z - other.z,
        q.w - other.w,
    );
}

export const Quat_mul = (q: Quat, other: Quat) => {
    return new Quat(
        q.x * other.w + q.y * other.z - q.z * other.y
        + q.w * other.x,
        -q.x * other.z + q.y * other.w + q.z * other.x
        + q.w * other.y,
        q.x * other.y - q.y * other.x + q.z * other.w
        + q.w * other.z,
        -q.x * other.x - q.y * other.y - q.z * other.z
        + q.w * other.w,
    );
}

export const Quat_div = (q: Quat, other: Quat) => {
    return Quat_mul(q, Quat_inverse(other));
}

export const Quat_sMul = (q: Quat, scalar: number) => {
    return new Quat(
        q.x * scalar,
        q.y * scalar,
        q.z * scalar,
        q.w * scalar,
    );
}

export const Quat_sDiv = (q: Quat, scalar: number) => {
    return new Quat(
        q.x / scalar,
        q.y / scalar,
        q.z / scalar,
        q.w / scalar,
    );
}

export const Quat_length_squared = (q: Quat) => {
    return q.x * q.x + q.y * q.y + q.z * q.z
        + q.w * q.w;
}

export const Quat_length = (q: Quat) => {
    return sqrt(Quat_length_squared(q));
}

export const Quat_unit = (q: Quat) => {
    return Quat_sDiv(q, Quat_length(q));
}

export const Quat_conjugate = (q: Quat) => {
    return new Quat(-q.x, -q.y, -q.z, q.w);
}

export const Quat_inverse = (q: Quat) => {
    return Quat_sDiv(Quat_conjugate(q), Quat_length_squared(q));
}

export const Quat_equals = (q: Quat, other: Quat) => {
    return q.x === other.x && q.y === other.y && q.z === other.z
        && q.w === other.w;
}

export const Quat_sphericalLerp = (q: Quat, other: Quat, t: number) => {
    const cosHalfTheta = q.x * other.x + q.y * other.y
        + q.z * other.z + q.w * other.w;
    if (abs(cosHalfTheta) >= 1) {
        return Quat_clone(q);
    }
    const halfTheta = acos(cosHalfTheta);
    const sinHalfTheta = sqrt(1 - cosHalfTheta * cosHalfTheta);
    if (abs(sinHalfTheta) < 0.001) {
        return new Quat(
            q.x * 0.5 + other.x * 0.5,
            q.y * 0.5 + other.y * 0.5,
            q.z * 0.5 + other.z * 0.5,
            q.w * 0.5 + other.w * 0.5,
        );
    }
    const ratioA = sin((1 - t) * halfTheta) / sinHalfTheta;
    const ratioB = sin(t * halfTheta) / sinHalfTheta;
    return new Quat(
        q.x * ratioA + other.x * ratioB,
        q.y * ratioA + other.y * ratioB,
        q.z * ratioA + other.z * ratioB,
        q.w * ratioA + other.w * ratioB,
    );
}

export const Quat_rotate = (q: Quat, p: Vec3) => {
    const x = q.x;
    const y = q.y;
    const z = q.z;
    const w = q.w;
    return new Vec3(
        w * w * p.x + 2 * y * w * p.z - 2 * z * w * p.y + x * x * p.x
        + 2 * y * x * p.y + 2 * z * x * p.z - z * z * p.x - y * y * p.x,
        2 * x * y * p.x + y * y * p.y + 2 * z * y * p.z + 2 * w * z * p.x
        - z * z * p.y + w * w * p.y - 2 * x * w * p.z - x * x * p.y,
        2 * x * z * p.x + 2 * y * z * p.y + z * z * p.z - 2 * w * y * p.x
        - y * y * p.z + 2 * w * x * p.y - x * x * p.z + w * w * p.z,
    );
}

export const Quat_clone = (q: Quat) => {
    return new Quat(q.x, q.y, q.z, q.w);
}
