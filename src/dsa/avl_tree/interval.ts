import { max, min } from "lib0/math";
import { between, compareNumbers } from "../sort";
import { AVLNode } from "./avl";


export class IntervalNode<T> extends AVLNode<number, readonly [T, end: number]> {
    readonly leftStart: number;
    readonly rightEnd: number;

    constructor(
        start: number,
        dataAndEnd: readonly [T, end: number],
        left: IntervalTree<T>,
        right: IntervalTree<T>,
    ) {
        if (dataAndEnd[1] < start) throw new Error("end must be >= start");
        super(start, dataAndEnd, left, right);
        this.leftStart = min(start, min(left?.leftStart ?? Infinity, right?.leftStart ?? Infinity));
        this.rightEnd = max(dataAndEnd[1], max(left?.rightEnd ?? -Infinity, right?.rightEnd ?? -Infinity));
    }
}

export type IntervalTree<T> = IntervalNode<T> | null;

/**
 * Find all of the data that intersects with the range
 * @param root The tree to search
 * @param start The start of the interval (inclusive)
 * @param end The end of the interval (inclusive)
 * @returns The list with results
 */
export const IntervalTree_get = <T>(
    root: IntervalNode<T> | null,
    start: number,
    end: number,
): T[] => {
    const out = [];
    const stack: IntervalNode<T>[] = [];
    if (root) stack.push(root);
    while (stack.length) {
        const { key: nStart, value: { 0: value, 1: nEnd }, left, right } = stack.pop()!;
        // if the current node touches the interval, save it
        if (intervalsIntersect(start, end, nStart, nEnd)) out.push(value);
        // if the left tree exists and its span is in the interval, check it
        if (left && intervalsIntersect(start, end, left.leftStart, left.rightEnd)) stack.push(left);
        // if the right tree exists and its span is in the interval, check it
        if (right && intervalsIntersect(start, end, right.leftStart, right.rightEnd)) stack.push(right);
    }
    return out;
}

const intervalsIntersect = (a: number, b: number, x: number, y: number) => {
    return (
        between(a, x, y, compareNumbers) || between(b, x, y, compareNumbers) // [a, b] intersects or is contained within [x, y]
        || between(x, a, b, compareNumbers) || between(y, a, b, compareNumbers) // [x, y] intersects or is contained within [a, b]
    );
}
