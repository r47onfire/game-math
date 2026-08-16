import { expect, test } from "bun:test";
import { AVLNode, AVLTree, AVLTree_delete, AVLTree_get, AVLTree_getBookends, AVLTree_set } from "../../src/dsa/avlTree";

type Key = readonly [number, number];
const lexComparator = (a: Key, b: Key) => {
    if (a[0] < b[0]) return -1;
    if (a[0] > b[0]) return 1;
    if (a[1] < b[1]) return -1;
    if (a[1] > b[1]) return 1;
    return 0;
};

test("avl supports 2-tuple keys with primary ordering", () => {
    var tree: AVLTree<Key, string> = null;

    const k1: Key = [1, 0];
    const k2: Key = [2, 0];
    const k3: Key = [2, 1];
    const k4: Key = [3, 0];

    tree = AVLTree_set(tree, k1, "a", AVLNode, lexComparator);
    tree = AVLTree_set(tree, k3, "c", AVLNode, lexComparator);
    tree = AVLTree_set(tree, k2, "b", AVLNode, lexComparator);
    tree = AVLTree_set(tree, k4, "d", AVLNode, lexComparator);

    // exact search
    const foundK2 = AVLTree_get(tree, k2, lexComparator);
    expect(foundK2).not.toBeNull();
    expect(foundK2!.value).toBe("b");

    // bookends for a middle value between k2 and k3
    const [left, right] = AVLTree_getBookends(tree, [2, 0.5], lexComparator);
    expect(left).not.toBeNull();
    expect(right).not.toBeNull();
    expect(left!.key).toEqual(k2);
    expect(right!.key).toEqual(k3);

    // remove k2
    tree = AVLTree_delete(tree, k2, AVLNode as any, lexComparator);
    const afterRemove = AVLTree_get(tree, k2, lexComparator);
    expect(afterRemove).toBeNull();

    // bookends around removed key now should be k1 and k3
    const [l2, r2] = AVLTree_getBookends(tree, k2, lexComparator);
    expect(l2).not.toBeNull();
    expect(r2).not.toBeNull();
    expect(l2!.key).toEqual(k1);
    expect(r2!.key).toEqual(k3);
});
