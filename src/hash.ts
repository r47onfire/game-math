import { imul } from "lib0/math";
import { asin, PI, sin } from "./common";
import { Vec2 } from "./linearAlgebra/Vec2";


export const javaHash = (s: string) => {
    var hash = 0;
    for (var i = 0; i < s.length; i++) hash = (imul(hash, 31) + s.charCodeAt(i)) | 0;
    return hash;
}

export const szudzikPair = (x: number, y: number) => {
    // from http://szudzik.com/ElegantPairing.pdf
    return x >= y ? (x * x) + x + y : (y * y) + x;
}

export const szudzikPairSigned = (x: number, y: number) => {
    // from https://www.vertexfragment.com/ramblings/cantor-szudzik-pairing-functions/
    const a = x >= 0 ? 2 * x : (-2 * x) - 1;
    const b = y >= 0 ? 2 * y : (-2 * y) - 1;
    return szudzikPair(a, b) / 2;
}

const mash = (t: number) => {
    return (.5 + asin(sin(65432 * t)) / PI) % 1;
}

export const mashToPoint = (t: number) => {
    const rand1 = mash(t);
    const rand2 = mash(rand1);
    return new Vec2(rand1 * 2 - 1, rand2 * 2 - 1);
}

export const mashPoint = (p: Vec2) => {
    return mash(szudzikPairSigned(p.x, p.y));
}
