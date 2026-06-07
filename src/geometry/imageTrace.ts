import { last } from "lib0/array";
import { abs, sqrt } from "lib0/math";
import { V2_BOTTOM, V2_BOTTOM_LEFT, V2_BOTTOM_RIGHT, V2_LEFT, V2_RIGHT, V2_TOP, V2_TOP_LEFT, V2_TOP_RIGHT, Vec2, Vec2_clone, Vec2_distance, Vec2_equals, Vec2_set } from "../linearAlgebra";

export const traceRegion = (
    width: number,
    height: number,
    isInRegion: (x: number, y: number) => boolean,
): Vec2[] => {
    // Directions for clockwise boundary tracing (Moore-neighborhood)
    const directions = [
        V2_RIGHT,
        V2_BOTTOM_RIGHT,
        V2_BOTTOM,
        V2_BOTTOM_LEFT,
        V2_LEFT,
        V2_TOP_LEFT,
        V2_TOP,
        V2_TOP_RIGHT,
    ];

    // Find a starting pixel in the region
    var start: Vec2 | null = null;
    for (var y = 0; y < height && !start; y++) {
        for (var x = 0; x < width && !start; x++) {
            if (isInRegion(x, y)) {
                start = new Vec2(x, y);
                break;
            }
        }
    }
    if (!start) return [];

    const outline: Vec2[] = [];
    var current = Vec2_clone(start);
    var prevDir = 0;

    do {
        outline.push(Vec2_clone(current));
        // Search neighbors clockwise from previous direction - 2
        var dir = (prevDir + 6) % 8;
        for (var i = 0; i < 8; i++) {
            const d = directions[(dir + i) % 8]!;
            const nx = current.x + d.x;
            const ny = current.y + d.y;
            if (
                nx >= 0 && nx < width && ny >= 0 && ny < height
                && isInRegion(nx, ny)
            ) {
                Vec2_set(current, nx, ny);
                prevDir = (dir + i) % 8;
                break;
            }
        }
    } while (
        current.x !== start.x || current.y !== start.y || outline.length === 1
    );

    return outline;
}

export const simplifyClosed = (points: Vec2[], epsilon: number): Vec2[] => {
    const open = points.slice();
    if (open.length > 1 && Vec2_distance(open[0]!, last(open)) < 1e-3) {
        open.pop();
    }
    const simplified = RDP(open, epsilon);

    simplified.push(simplified[0]!);
    return simplified;
}

// Calculates the perpendicular distance between c and the line formed by a, b
const perpDistance = (c: Vec2, a: Vec2, b: Vec2): number => {
    const A = b.y - a.y;
    const B = a.x - b.x;
    const C = b.x * a.y - a.x * b.y;

    return abs(A * c.x + B * c.y + C) / sqrt(A * A + B * B);
}

// Ramer–Douglas–Peucker algorithm used to simplify the polygons
// TODO: make this in-place?
const RDP = (points: Vec2[], epsilon: number): Vec2[] => {
    if (points.length < 3) return points;

    var start_indx = 0;
    var end_indx = points.length - 1;
    var max_dist = 0;
    var max_indx = 0;

    for (var i = start_indx + 1; i < end_indx; i++) {
        var d = perpDistance(points[i]!, points[start_indx]!, points[end_indx]!);
        if (d > max_dist) {
            max_dist = d;
            max_indx = i;
        }
    }

    if (Vec2_equals(points[0]!, last(points))) {
        points = points.slice(0, -1);
    }

    if (max_dist > epsilon) {
        var l = RDP(points.slice(start_indx, max_indx + 1), epsilon);
        var r = RDP(points.slice(max_indx, end_indx + 1), epsilon);

        return [...l.slice(0, -1), ...r];
    }
    else {
        return [points[start_indx]!, points[end_indx]!];
    }
}
