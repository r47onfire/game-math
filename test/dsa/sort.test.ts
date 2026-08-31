import { expect, test } from "bun:test";
import { insertionSort, Random_choice } from "../../src";

const list = Array.from({ length: 1000 }, (_, i) => i);

test.each([
    ["insertion sort", insertionSort]
])("%s", (_, f) => {
    const items = Array.from({ length: 10000 }, (_, i) => ({ n: Random_choice(Math.random, list), i }));
    const realSorted = items.toSorted((a, b) => a.n - b.n);
    f(items, (a, b) => a.n - b.n);
    expect(items.map(x => x.i)).toEqual(realSorted.map(x => x.i));
});
