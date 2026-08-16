import { last } from "lib0/array";
import { Vec2 } from "../linearAlgebra";
import { orient } from "./utils";
import { swap } from "../dsa/sort";

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
const someInTriangle = (vertices: Vec2[], concaveIndices: Set<number>, a: Vec2, b: Vec2, c: Vec2) => {
    for (const i of concaveIndices) {
        const p = vertices[i]!;
        if ((p !== a) && (p !== b) && (p !== c) && pointInTriangle(p, a, b, c)) {
            return true;
        }
    }

    return false;
}

const isEar = (a: Vec2, b: Vec2, c: Vec2, vertices: Vec2[], concaveIndices: Set<number>) => {
    return isOrientedCcw(a, b, c) && !someInTriangle(vertices, concaveIndices, a, b, c);
}

/** Returns the indices of the polygon decomposition into triangles.
 * result is always a multiple of 3 length. triangles many not necessarily be the same winding */
export const triangulate = (pts: Vec2[]): number[] => {

    const len = pts.length;

    if (len < 3) return [];
    if (len === 3) return [0, 1, 2];

    var nextIdx: number[] = [];
    var prevIdx: number[] = [];
    for (var i = 0; i < len; i++) {
        nextIdx[i] = i + 1;
        prevIdx[i] = i - 1;
    }
    nextIdx[prevIdx[0] = len - 1] = 0;

    if (!isOrientedCcwPolygon(pts)) {
        var temp = prevIdx;
        prevIdx = nextIdx;
        nextIdx = temp;
    }

    const triangles: number[] = [];
    const concaveIndices = new Set<number>();
    const updateVertexConvexity = (i: number) => {
        const prev = prevIdx[i]!;
        const next = nextIdx[i]!;
        if (!isOrientedCcw(pts[prev]!, pts[i]!, pts[next]!)) concaveIndices.add(i);
        else concaveIndices.delete(i);
    }
    for (var i = 0; i < pts.length; i++) updateVertexConvexity(i);

    var nVertices = pts.length, current = 0, skipped = 0, next, prev;
    while (nVertices > 3) {
        next = nextIdx[current]!;
        prev = prevIdx[current]!;
        const a = pts[prev]!;
        const b = pts[current]!;
        const c = pts[next]!;
        if (isEar(a, b, c, pts, concaveIndices)) {
            triangles.push(prev, current, next);
            nextIdx[prev] = next;
            prevIdx[next] = prev;
            concaveIndices.delete(current);
            updateVertexConvexity(prev);
            updateVertexConvexity(next);
            nVertices--;
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
