import { max } from "lib0/math";
import { between, Comparator } from "../sort";

export class AVLNode<K, V> {
    readonly left: this | null;
    readonly right: this | null;
    readonly height: number;
    constructor(
        public readonly key: K,
        public readonly value: V,
        left: AVLTree<K, V>,
        right: AVLTree<K, V>,
    ) {
        this.left = left as this;
        this.right = right as this;
        this.height = 1 + max(AVLTree_height(left), AVLTree_height(right));
    }
}

export type AVLTree<K, V> = AVLNode<K, V> | null;

export const AVLTree_height = (tree: AVLTree<any, any>) => tree?.height ?? 0;

export type NodeMaker<K, V, N> = new (key: K, value: V, left: N | null, right: N | null) => N;

export const AVLTree_newLeaf = <N extends AVLNode<K, V>, V, K>(key: K, value: V, make: NodeMaker<K, V, N>): N => new make(key, value, null, null);

const rightRotate = <N extends AVLNode<K, V>, V, K>(y: N, make: NodeMaker<K, V, N>): N => {
    const x = y.left!, lr = x.right;
    return new make(x.key, x.value, x.left, new make(y.key, y.value, lr, y.right));
}

const leftRotate = <N extends AVLNode<K, V>, V, K>(x: N, make: NodeMaker<K, V, N>): N => {
    const y = x.right!, rl = y.left;
    return new make(y.key, y.value, new make(x.key, x.value, x.left, rl), y.right);
}

const balanceFactor = (n: AVLTree<any, any>) => n ? AVLTree_height(n.left) - AVLTree_height(n.right) : 0;

const rebalance = <N extends AVLNode<K, V>, V, K>(n: N, make: NodeMaker<K, V, N>): N => {
    const bf = balanceFactor(n);
    if (bf > 1) {
        if (balanceFactor(n.left) < 0) {
            const newLeft = leftRotate(n.left!, make);
            const nWithNewLeft = new make(n.key, n.value, newLeft, n.right);
            return rightRotate(nWithNewLeft, make);
        }
        return rightRotate(n, make);
    }
    if (bf < -1) {
        if (balanceFactor(n.right) > 0) {
            const newRight = rightRotate(n.right!, make);
            const nWithNewRight = new make(n.key, n.value, n.left, newRight);
            return leftRotate(nWithNewRight, make);
        }
        return leftRotate(n, make);
    }
    return n;
}

/**
 * Insert or update data into an existing tree
 * @param root The existing tree
 * @param key The key to insert at
 * @param value The data to insert
 * @param make Function to create new nodes
 * @param comparator Comparator function
 * @returns The updated tree
 */
export const AVLTree_set = <N extends AVLNode<K, V>, K = N["key"], V = N["value"]>(
    root: N | null,
    key: K,
    value: V,
    make: NodeMaker<K, V, N>,
    comparator: Comparator<K>
): N => {
    // Reached a null point = insert
    if (!root) return AVLTree_newLeaf(key, value, make);

    const comparison = comparator(key, root.key);
    if (comparison < 0) {
        return rebalance(new make(root.key, root.value, AVLTree_set(root.left, key, value, make, comparator), root.right), make);
    } else if (comparison > 0) {
        return rebalance(new make(root.key, root.value, root.left, AVLTree_set(root.right, key, value, make, comparator)), make);
    } else {
        // found it, update the data
        return new make(root.key, value, root.left, root.right);
    }
}

/**
 * Update a tree to change the node at the particular time through the function
 * @param root The tree to update
 * @param key The time stamp to be updated
 * @param mapper The function to transform the old value into the new value
 * @returns The updated tree
 */
export function AVLTree_updateByMapping<N extends AVLNode<K, V>, K = N["key"], V = N["value"]>(
    root: N | null,
    key: K,
    mapper: (x: V) => V,
    make: NodeMaker<K, V, N>,
    comparator: Comparator<K>
): N | null {
    if (!root) return null;
    const comparison = comparator(key, root.key);
    // No need to rebalance since we're not adding or removing nodes
    if (comparison < 0) {
        const newLeft = AVLTree_updateByMapping(root.left, key, mapper, make, comparator);
        // if nothing happened, don't make a new node
        if (newLeft === root.left) return root;
        return new make(root.key, root.value, newLeft, root.right);
    } else if (comparison > 0) {
        const newRight = AVLTree_updateByMapping(root.right, key, mapper, make, comparator);
        // if nothing happened, don't make a new node
        if (newRight === root.right) return root;
        return new make(root.key, root.value, root.left, newRight);
    } else {
        const newData = mapper(root.value);
        if (newData === root.value) return root;
        return new make(root.key, newData, root.left, root.right);
    }
}

export const AVLTree_leftmostLeaf = <N extends AVLNode<any, any>>(n: N): N => {
    while (n.left) n = n.left;
    return n;
}

export const AVLTree_inOrderSuccessor = <N extends AVLNode<any, any>>(n: N): N | null => n.right ? AVLTree_leftmostLeaf(n.right) : null;

export const AVLTree_rightmostLeaf = <N extends AVLNode<any, any>>(n: N): N => {
    while (n.right) n = n.right;
    return n;
}

export const AVLTree_inOrderPredecessor = <N extends AVLNode<any, any>>(n: N): N | null => n.left ? AVLTree_rightmostLeaf(n.left) : null;

/**
 * Remove the data stored at a particular key
 * @param root The tree to be modified
 * @param key The key to remove the data of
 * @returns The updated tree
 */
export const AVLTree_delete = <N extends AVLNode<K, V>, K = N["key"], V = N["value"]>(
    root: N | null,
    key: K,
    make: NodeMaker<K, V, N>,
    comparator: Comparator<K>
): N | null => {
    if (!root) return null;
    const comparison = comparator(key, root.key);
    if (comparison < 0) {
        const newLeft = AVLTree_delete(root.left, key, make, comparator);
        // if nothing happened, don't make a new node
        if (newLeft === root.left) return root;
        return rebalance(new make(root.key, root.value, newLeft, root.right), make);
    } else if (comparison > 0) {
        const newRight = AVLTree_delete(root.right, key, make, comparator);
        // if nothing happened, don't make a new node
        if (newRight === root.right) return root;
        return rebalance(new make(root.key, root.value, root.left, newRight), make);
    } else {
        // delete this node
        if (!root.left && !root.right) return null;
        if (!root.left) return root.right;
        if (!root.right) return root.left;
        // two children: replace with in-order successor (min of right)
        const next = AVLTree_leftmostLeaf(root.right);
        return rebalance(new make(next.key, next.value, root.left, AVLTree_delete(root.right, next.key, make, comparator)), make);
    }
}

/**
 * Search a tree for a particular key
 * @param root The tree to search
 * @param key The key to look for
 * @param comparator Comparator function
 * @returns The node or null if the key is not found
 */
export const AVLTree_get = <T extends AVLNode<K, V>, V, K>(root: T | null, key: K, comparator: Comparator<K>,): T | null => {
    while (root) {
        const comparison = comparator(key, root.key);
        if (comparison === 0) return root;
        root = comparison < 0 ? root.left : root.right;
    }
    return null;
}

export const enum AVLTreeWalkOrder {
    PRE_ORDER, IN_ORDER, POST_ORDER
}

/**
 * Traversal of the tree
 * @param root The tree to iterate over
 * @param fn The callback for each iteration
 * @param order The order to walk the tree in - default is in-order (sorted order)
 */
export const AVLTree_walk = <T extends AVLNode<any, any>>(root: T | null, fn: (data: T) => void, order: AVLTreeWalkOrder = AVLTreeWalkOrder.IN_ORDER) => {
    if (!root) return;
    if (order === AVLTreeWalkOrder.PRE_ORDER) fn(root);
    AVLTree_walk(root.left, fn, order);
    if (order === AVLTreeWalkOrder.IN_ORDER) fn(root);
    AVLTree_walk(root.right, fn, order);
    if (order === AVLTreeWalkOrder.POST_ORDER) fn(root);
}

/**
 * Collects the data of all of the items within the range specified
 * @param root The tree to search
 * @param start The start of the range (inclusive)
 * @param end The end of the range (exclusive)
 * @param fn A callback for each value
 * @returns The list with all the nodes in the range
 */
export const AVLTree_getAllInRange = <T extends AVLNode<K, any>, K>(root: T | null, start: K, end: K, fn: (node: T) => void, comparator: Comparator<K>) => {
    if (root) {
        if (comparator(start, root.key) <= 0) AVLTree_getAllInRange(root.left, start, end, fn, comparator);
        if (between(root.key, start, end, comparator)) fn(root);
        if (comparator(root.key, end) <= 0) AVLTree_getAllInRange(root.right, start, end, fn, comparator);
    }
}

/**
 * Get the two points immediately to the left and right of the key value
 * @param tree The tree to search
 * @param key The key at which to look
 * @param comparator Comparator function to determine whether to go left or right
 * @returns [left, right] - the nodes on either side - will be null if off the end of the tree
 */
export const AVLTree_getBookends = <T extends AVLNode<K, any>, K>(tree: T | null, key: K, comparator: Comparator<K>): [before: T | null, after: T | null] => {
    var left: T | null = null;
    var right: T | null = null;

    while (tree !== null) {
        const comparison = comparator(key, tree.key);
        if (comparison === 0) {
            // exact match
            left = tree;
            right ??= AVLTree_inOrderSuccessor(tree);
            break;
        } else if (comparison < 0) {
            // node.t is a candidate successor (strictly > time)
            tree = (right = tree).left;
        } else { // comparison > 0
            // node.t is a candidate predecessor (<= time)
            tree = (left = tree).right;
        }
    }
    return [left, right];
}

export const AVLTree_fromMap = <K, V>(map: Map<K, V>, comparator: Comparator<K>): AVLTree<K, V> => {
    var tree: AVLTree<K, V> = null;
    map.forEach((v, k) => tree = AVLTree_set(tree, k, v, AVLNode, comparator));
    return tree;
}

export const AVLTree_fromObject = <K extends PropertyKey, V>(map: Record<K, V>, comparator: Comparator<K>): AVLTree<K, V> => {
    var tree: AVLTree<K, V> = null;
    (Object.entries(map) as [K, V][]).forEach(({ 0: k, 1: v }) => tree = AVLTree_set(tree, k, v, AVLNode, comparator));
    return tree;
}
