import { last } from "lib0/array";
import { Vec2 } from "../linearAlgebra";
import { orient } from "./utils";
import { swap } from "../sort";

/** true if the angle is oriented counter clockwise */
const isOrientedCcw = (a: Vec2, b: Vec2, c: Vec2) => orient(a, b, c) > 0;

/** true if the polygon is oriented counter clockwise */
const isOrientedCcwPolygon = (polygon: Vec2[]) => {
    var total = 0;
    var prev = last(polygon);
    for (var i = 0; i < polygon.length; i++) {
        const p = polygon[i]!;
        total += (p.x - prev.x) * (p.y + prev.y);
        prev = p;
    }
    return total < 0;
}

/** true if a and b are on the same side of the line c->d */
const onSameSide = (a: Vec2, b: Vec2, c: Vec2, d: Vec2) => {
    const px = d.x - c.x, py = d.y - c.y;
    // return det(p, a-c) * det(p, b-c) >= 0
    const l = px * (a.y - c.y) - py * (a.x - c.x);
    const m = px * (b.y - c.y) - py * (b.x - c.x);
    return l * m > 0;
}

/** true if p is contained in the triangle abc  */
const pointInTriangle = (p: Vec2, a: Vec2, b: Vec2, c: Vec2) => {
    return onSameSide(p, a, b, c) && onSameSide(p, b, a, c)
        && onSameSide(p, c, a, b);
}

/** true if any vertex in the list `vertices' is in the triangle abc. */
const someInTriangle = (vertices: Vec2[], a: Vec2, b: Vec2, c: Vec2) => {
    for (const p of vertices) {
        if ((p !== a) && (p !== b) && (p !== c) && pointInTriangle(p, a, b, c)) {
            return true;
        }
    }

    return false;
}

const isEar = (a: Vec2, b: Vec2, c: Vec2, vertices: Vec2[]) => {
    return isOrientedCcw(a, b, c) && !someInTriangle(vertices, a, b, c);
}

/** Returns the indices of the polygon decomposition into triangles.
 * result is always a multiple of 3 length. triangles many not necessarily be the same winding */
export const triangulate = (pts: Vec2[]): number[] => {

    const len = pts.length;

    if (len < 3) return [];
    if (len === 3) return [0, 1, 2];

    var prevIdx = pts.map((_, i) => (i + len - 1) % len);
    var nextIdx = pts.map((_, i) => (i + 1) % len);

    if (!isOrientedCcwPolygon(pts)) {
        var temp = prevIdx;
        prevIdx = nextIdx;
        nextIdx = temp;
    }

    const triangles: number[] = [];
    var nVertices = pts.length;
    var current = 1;
    var skipped = 0;
    var next;
    var prev;
    while (nVertices > 3) {
        next = nextIdx[current]!;
        prev = prevIdx[current]!;
        const a = pts[prev]!;
        const b = pts[current]!;
        const c = pts[next]!;
        if (isEar(a, b, c, pts)) {
            triangles.push(prev, current, next);
            nextIdx[prev] = next;
            prevIdx[next] = prev;
            --nVertices;
            skipped = 0;
        }
        else if (++skipped > nVertices) {
            // give up
            return [];
        }
        current = next;
    }
    next = nextIdx[current]!;
    prev = prevIdx[current]!;
    triangles.push(prev, current, next);

    return triangles;
}

export const ensureCounterclockwiseWindingIndicesInplace = (pts: Vec2[], indices: number[]) => {
    for (var i = 0; i < indices.length; i += 3) {
        if (!isOrientedCcw(pts[indices[i]!]!, pts[indices[i + 1]!]!, pts[indices[i + 2]!]!)) {
            swap(indices, i + 1, i + 2);
        }
    }
}
