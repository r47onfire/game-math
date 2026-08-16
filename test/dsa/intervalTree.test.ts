import { expect, test } from "bun:test";
import { AVLTree_set } from "../../src/dsa/avlTree/avl";
import { IntervalNode, IntervalTree, IntervalTree_get } from "../../src/dsa/avlTree/interval";
import { compareNumbers } from "../../src/dsa/sort";

test("finds intervals that intersect with range", () => {
    var tree: IntervalTree<string> = null;

    // Insert intervals: [start, end] => data
    // [0,   5] => "A"
    //    [3,   8] => "B"
    //       [6,  10] => "C"
    //              [12, 15] => "D"
    tree = AVLTree_set<IntervalNode<string>>(tree, 0, ["A", 5], IntervalNode, compareNumbers);
    tree = AVLTree_set<IntervalNode<string>>(tree, 3, ["B", 8], IntervalNode, compareNumbers);
    tree = AVLTree_set<IntervalNode<string>>(tree, 6, ["C", 10], IntervalNode, compareNumbers);
    tree = AVLTree_set<IntervalNode<string>>(tree, 12, ["D", 15], IntervalNode, compareNumbers);

    expect(IntervalTree_get(tree, 4, 7).sort()).toEqual(["A", "B", "C"]);
});

test("returns empty when no intervals intersect", () => {
    var tree: IntervalTree<string> = null;

    tree = AVLTree_set<IntervalNode<string>>(tree, 0, ["A", 5], IntervalNode, compareNumbers);
    tree = AVLTree_set<IntervalNode<string>>(tree, 10, ["B", 15], IntervalNode, compareNumbers);

    // Query [6, 9] should find nothing
    expect(IntervalTree_get(tree, 6, 9)).toEqual([]);
});

test("finds intervals when it touches lower or upper boundary", () => {
    var tree: IntervalTree<string> = null;

    tree = AVLTree_set<IntervalNode<string>>(tree, 0, ["A", 5], IntervalNode, compareNumbers);
    tree = AVLTree_set<IntervalNode<string>>(tree, 5, ["B", 10], IntervalNode, compareNumbers);

    // Upper boundary is not included, lower boundary is included
    expect(IntervalTree_get(tree, 5, 5)).toEqual(["B"]);
});

test("on empty tree returns empty array", () => {
    expect(IntervalTree_get(null, 0, 10)).toEqual([]);
});

test("large range finds all intervals", () => {
    var tree: IntervalNode<number> | null = null;

    for (let i = 0; i < 5; i++) {
        tree = AVLTree_set<IntervalNode<number>>(tree, i * 2, [i, i * 2 + 3], IntervalNode, compareNumbers);
    }

    // Query a very large range
    expect(IntervalTree_get(tree, -100, 100).sort()).toEqual([0, 1, 2, 3, 4]);
});

test("single point on boundary", () => {
    var tree: IntervalTree<string> = null;

    tree = AVLTree_set<IntervalNode<string>>(tree, 0, ["A", 3], IntervalNode, compareNumbers);
    tree = AVLTree_set<IntervalNode<string>>(tree, 5, ["B", 8], IntervalNode, compareNumbers);
    tree = AVLTree_set<IntervalNode<string>>(tree, 10, ["C", 15], IntervalNode, compareNumbers);

    // Upper boundary is not included
    expect(IntervalTree_get(tree, 3, 3)).toEqual([]);
    // Lower boundary is included
    expect(IntervalTree_get(tree, 0, 0)).toEqual(["A"]);
});

test("works ok with negative time values", () => {
    var tree: IntervalTree<string> = null;

    tree = AVLTree_set<IntervalNode<string>>(tree, -10, ["A", -5], IntervalNode, compareNumbers);
    tree = AVLTree_set<IntervalNode<string>>(tree, -3, ["B", 3], IntervalNode, compareNumbers);
    tree = AVLTree_set<IntervalNode<string>>(tree, 5, ["C", 10], IntervalNode, compareNumbers);

    // Query [-7, -1] should find A and B
    expect(IntervalTree_get(tree, -7, -1).sort()).toEqual(["A", "B"]);
});

test("partial overlap", () => {
    var tree: IntervalTree<string> = null;

    tree = AVLTree_set<IntervalNode<string>>(tree, 0, ["A", 5], IntervalNode, compareNumbers);
    tree = AVLTree_set<IntervalNode<string>>(tree, 7, ["B", 12], IntervalNode, compareNumbers);
    tree = AVLTree_set<IntervalNode<string>>(tree, 3, ["C", 10], IntervalNode, compareNumbers);

    // Query [4, 8] overlaps with A, B, and C
    expect(IntervalTree_get(tree, 4, 8).sort()).toEqual(["A", "B", "C"]);
});