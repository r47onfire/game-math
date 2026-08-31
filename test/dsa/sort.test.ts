import { test, expect } from "bun:test";
import { insertionSort } from "lib0/sort.js";
import { Random_choice } from "../../src";

const list = Array.from({ length: 1000 }, (_, i) => i);

test.each([
    ["insertion sort", insertionSort]
])("%s", (_, f) => {
    for (var i = 0; i < 10000; i++) {
        const items = Array.from({ length: 10000 }, () => ({ foo: Random_choice(Math.random, list) }));
        const realSorted = items.toSorted((a, b) => a.foo - b.foo);
        f(items, (a, b) => a.foo - b.foo);
        for (var i = 0; i < items.length; i++) {
            expect(realSorted[i]).toBe(items[i]);
        }
    }
});
