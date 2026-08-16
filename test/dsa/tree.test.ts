import { describe, expect, test } from "bun:test";
import { AVLNode, AVLTree, AVLTree_delete, AVLTree_getBookends, AVLTree_set, AVLTree_updateByMapping, AVLTree_walk } from "../../src/dsa/avlTree";
import { compareNumbers } from "../../src/dsa/sort";

test("AVLTree_walk keeps things in sorted order", () => {
    var tree: AVLTree<number, number> = null;
    var elements = [3, 5, 2, 4, 7, 8, 1, 0, 9, 6, 10, 11, 20, 19, 16, 17, 12, 13, 15, 14, 18];
    for (var i of elements) {
        tree = AVLTree_set(tree, i, i, AVLNode, compareNumbers);
    }
    const list: number[] = [];
    AVLTree_walk(tree, x => list.push(x.value));
    expect(list).toEqual(elements.toSorted((a, b) => a - b));
});

test("AVLTree_set replaces existing values", () => {
    var tree: AVLTree<number, number> = null;
    tree = AVLTree_set(tree, 5 as number, 10, AVLNode, compareNumbers);
    tree = AVLTree_set(tree, 3 as number, 20, AVLNode, compareNumbers);
    tree = AVLTree_set(tree, 7 as number, 30, AVLNode, compareNumbers);

    // Update existing value
    tree = AVLTree_set(tree, 5 as number, 100, AVLNode, compareNumbers);

    const list: number[] = [];
    AVLTree_walk(tree, x => list.push(x.value));
    expect(list).toEqual([20, 100, 30]);
});

describe("AVLTree_updateByMapping", () => {
    test("updates values at specific keys", () => {
        var tree: AVLTree<number, number> = null;
        var elements = [1, 3, 5, 7, 9];
        for (var i of elements) {
            tree = AVLTree_set(tree, i, i * 10, AVLNode, compareNumbers);
        }

        // Update value at time 5 by doubling it
        tree = AVLTree_updateByMapping(tree, 5 as number, (d: number) => d * 2, AVLNode, compareNumbers);

        const list: number[] = [];
        AVLTree_walk(tree, x => list.push(x.value));
        expect(list).toEqual([10, 30, 100, 70, 90]);
    });

    test("with no matching key returns original tree", () => {
        var tree: AVLTree<number, number> = null;
        tree = AVLTree_set(tree, 5 as number, 50, AVLNode, compareNumbers);


        expect(AVLTree_updateByMapping(tree, 10 as number, (d: number) => d * 2, AVLNode, compareNumbers)).toBe(tree);
    });

    test("identity mapper returns original tree", () => {
        var tree: AVLTree<number, number> = null;
        tree = AVLTree_set(tree, 5 as number, 50, AVLNode, compareNumbers);

        expect(AVLTree_updateByMapping(tree, 5 as number, (x: number) => x, AVLNode, compareNumbers)).toBe(tree);
    });
});

describe("AVLTree_delete", () => {
    test("removes matching keys from tree", () => {
        var tree: AVLTree<number, number> = null;
        var elements = [5, 3, 7, 1, 9, 4, 6];
        for (var i of elements) {
            tree = AVLTree_set(tree, i, i * 10, AVLNode, compareNumbers);
        }

        // Remove a value
        const newTree = AVLTree_delete(tree, 5 as number, AVLNode as any, compareNumbers);

        const list: number[] = [];
        AVLTree_walk(newTree, x => list.push(x.value));
        expect(list).toEqual([10, 30, 40, 60, 70, 90]);

        list.length = 0;
        AVLTree_walk(tree, x => list.push(x.value));
        // Check that the original tree was not modified
        expect(list).toEqual([10, 30, 40, 50, 60, 70, 90]);
    });

    test("remove non-existent time returns original tree", () => {
        var tree: AVLTree<number, number> = null;
        tree = AVLTree_set(tree, 5, 50, AVLNode, compareNumbers);

        expect(AVLTree_delete(tree, 10 as number, AVLNode as any, compareNumbers)).toBe(tree);
    });

    test("remove the only element from a tree returns a null tree", () => {
        var tree: AVLTree<number, number> = null;
        tree = AVLTree_set(tree, 5, 10, AVLNode, compareNumbers);

        expect(AVLTree_delete(tree, 5 as number, AVLNode as any, compareNumbers)).toBeNull();
    });

    test("remove from empty tree returns null", () => {
        expect(AVLTree_delete(null, 5, AVLNode, compareNumbers)).toBeNull();
    });
});
describe("AVLTree_getBookends", () => {
    test("exact match uses the matched as the left of the interval", () => {
        var tree: AVLTree<number, number> = null;
        var elements = [1, 3, 5, 7, 9];
        for (var i of elements) {
            tree = AVLTree_set(tree, i, i * 10, AVLNode, compareNumbers);
        }

        const [left, right] = AVLTree_getBookends(tree, 5 as number, compareNumbers);
        expect(left).not.toBeNull();
        expect(left!.key).toEqual(5);
        expect(left!.value).toEqual(50);
        expect(right).not.toBeNull();
        expect(right!.key).toEqual(7);
        expect(right!.value).toEqual(70);
    });

    test("finds value between nodes", () => {
        var tree: AVLTree<number, number> = null;
        tree = AVLTree_set(tree, 1 as number, 10, AVLNode, compareNumbers);
        tree = AVLTree_set(tree, 5 as number, 50, AVLNode, compareNumbers);
        tree = AVLTree_set(tree, 9 as number, 90, AVLNode, compareNumbers);

        const [left, right] = AVLTree_getBookends(tree, 3 as number, compareNumbers);
        expect(left).not.toBeNull();
        expect(left!.key).toEqual(1);
        expect(left!.value).toEqual(10);
        expect(right).not.toBeNull();
        expect(right!.key).toEqual(5);
        expect(right!.value).toEqual(50);
    });

    test("finds value before all nodes", () => {
        var tree: AVLTree<number, number> = null;
        tree = AVLTree_set(tree, 5 as number, 50, AVLNode, compareNumbers);
        tree = AVLTree_set(tree, 9 as number, 90, AVLNode, compareNumbers);

        const [left, right] = AVLTree_getBookends(tree, 1 as number, compareNumbers);
        expect(left).toBeNull();
        expect(right).not.toBeNull();
        expect(right!.key).toEqual(5);
        expect(right!.value).toEqual(50);
    });

    test("finds value after all nodes", () => {
        var tree: AVLTree<number, number> = null;
        tree = AVLTree_set(tree, 1 as number, 10, AVLNode, compareNumbers);
        tree = AVLTree_set(tree, 5 as number, 50, AVLNode, compareNumbers);

        const [left, right] = AVLTree_getBookends(tree, 9 as number, compareNumbers);
        expect(left).not.toBeNull();
        expect(left!.key).toEqual(5);
        expect(left!.value).toEqual(50);
        expect(right).toBeNull();
    });

    test("empty tree returns all null", () => {
        const [left, right] = AVLTree_getBookends(null, 5, compareNumbers);
        expect(left).toBeNull();
        expect(right).toBeNull();
    });
});
