import { Vec2 } from "../linearAlgebra";
import { cos, sin, TAU } from "../common";
import { deg2rad } from "../misc";

export const createRegularPolygon = (
    radius: number,
    sides: number,
    startAngle: number = 0,
): Vec2[] => {
    startAngle = deg2rad(startAngle);
    var x = radius * cos(startAngle);
    var y = radius * sin(startAngle);
    const angle = TAU / sides;
    const c = cos(angle);
    const s = sin(angle);
    const poly: Vec2[] = [];
    for (var i = 0; i < sides; i++) {
        poly.push(new Vec2(x, y));
        [x, y] = [x * c - y * s, x * s + y * c];
    }
    return poly;
}

export const createStarPolygon = (
    radius1: number,
    radius2: number,
    sides: number,
    startAngle: number = 0,
): Vec2[] => {
    startAngle = deg2rad(startAngle);
    var x = cos(startAngle);
    var y = sin(startAngle);
    const angle = TAU / sides;
    const c = cos(angle);
    const s = sin(angle);
    const poly: Vec2[] = [new Vec2(0)];
    for (var i = 0; i < sides + 1; i++) {
        const radius = i & 1 ? radius2 : radius1;
        poly.push(new Vec2(x * radius, y * radius));
        [x, y] = [x * c - y * s, x * s + y * c];
    }
    return poly;
}

export const createCogPolygon = (
    radius1: number,
    radius2: number,
    sides: number,
    startAngle: number = 0,
): Vec2[] => {
    const angle = TAU / sides;
    // Align startAngle so the cog is horizontal when startAngle is 0
    startAngle = deg2rad(startAngle) - angle / 3;
    var x = cos(startAngle);
    var y = sin(startAngle);
    const c = cos(angle);
    const s = sin(angle);
    const poly: Vec2[] = [new Vec2(0)];
    for (var i = 0; i < sides + 1; i++) {
        const radius = i / 2 & 1 ? radius2 : radius1;
        poly.push(new Vec2(x * radius, y * radius));
        [x, y] = [x * c - y * s, x * s + y * c];
    }
    return poly;
}
