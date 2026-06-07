import type { BroadphaseAlgorithm } from ".";
import { Vec2, Vec2_subC } from "../../linearAlgebra";
import { Rect, Shape, Shape_bbox } from "../shape";

const enum Quadrant { NW = 0, NE = 1, SE = 2, SW = 3, NONE = -1 }

/**
 * A quadtree structure
 */
export class Quadtree<T> implements BroadphaseAlgorithm<T> {
    readonly bounds: Rect;
    readonly maxObjects: number;
    readonly maxLevels: number;
    level: number;
    nodes: Quadtree<T>[] = [];
    #objects: T[] = [];
    #objectToShapeMap = new Map<T, Shape>();

    #objectsToAddOnNextUpdate: T[] = [];

    /**
     * Creates a new quadtree
     * @param bounds - The bounds of this node.
     * @param maxObjects - The maximum amount of objects before triggering a split.
     * @param maxLevels - The maximum amount of levels before no more splits are made.
     * @param level - The current level.
     */
    constructor(
        bounds: Rect,
        maxObjects: number = 8,
        maxLevels: number = 4,
        level: number = 0,
    ) {
        this.bounds = bounds;
        this.maxObjects = maxObjects;
        this.maxLevels = maxLevels;
        this.level = level;
    }

    /**
     * True if this node is a leaf node.
     */
    get #isLeaf() {
        return this.nodes.length === 0;
    }

    /**
     * Splits the node, but doesn't redistribute objects
     */
    subdivide() {
        const level = this.level + 1;
        const width = this.bounds.width / 2;
        const height = this.bounds.height / 2;
        const x = this.bounds.pos.x;
        const y = this.bounds.pos.y;

        const pos = [
            new Vec2(x, y),
            new Vec2(x + width, y),
            new Vec2(x + width, y + height),
            new Vec2(x, y + height),
        ];

        for (var i = 0; i < 4; i++) {
            this.nodes[i] = new Quadtree(
                new Rect(pos[i]!, width, height),
                this.maxObjects,
                this.maxLevels,
                level,
            );
        }
    }

    /**
     * Tries to merge and collapse nodes which are no longer overpopulated.
     */
    #merge() {
        if (this.nodes.length > 0) {
            var count = this.#objects.length;
            var allLeaves = true;
            for (var i = 0; i < 4; i++) {
                this.nodes[i]!.#merge();
                allLeaves &&= this.nodes[i]!.#isLeaf;
                count += this.nodes[i]!.#objects.length;
            }

            if (allLeaves && count <= this.maxObjects) {
                for (var i = 0; i < 4; i++) {
                    this.#objects.push(...this.nodes[i]!.#objects);
                }
                this.nodes = [];
            }
        }
    }

    /**
     * Returns the quadrant this rect fits in or -1 if it doesn't fit any quadrant
     * @param rect - The rect to test with.
     *
     * @returns The index of the quadrant fitting the rect completely, or -1 if none.
     */
    #getQuadrant(rect: Rect): Quadrant {
        const boundsCenterX = this.bounds.pos.x + (this.bounds.width / 2);
        const boundsCenterY = this.bounds.pos.y + (this.bounds.height / 2);
        // West - If the right side is left of the center
        if (rect.pos.x + rect.width < boundsCenterX) {
            // Northwest - If the bottom side is above the center
            if (rect.pos.y + rect.height < boundsCenterY) {
                return Quadrant.NW;
            }
            // Southwest - If the top side is below the center
            else if (rect.pos.y >= boundsCenterY) {
                return Quadrant.SW;
            }
        }
        // East - If the left side is right of the center
        else if (rect.pos.x >= boundsCenterX) {
            // Northeast - If the bottom side is above the center
            if (rect.pos.y + rect.height < boundsCenterY) {
                return Quadrant.NE;
            }
            // Southeast - If the top side is below the center
            else if (rect.pos.y >= boundsCenterY) {
                return Quadrant.SE;
            }
        }
        return Quadrant.NONE;
    }

    /**
     * Returns the quadrants this rect intersects
     * @param rect - The rect to test with. Note that this rect is assumed to be within the node.
     *
     * @returns the list of quadrant indices
     */
    #getQuadrants(rect: Rect): Quadrant[] {
        const boundsCenterX = this.bounds.pos.x + (this.bounds.width / 2);
        const boundsCenterY = this.bounds.pos.y + (this.bounds.height / 2);
        const quadrants: number[] = [];

        // West - The left side is left of the center
        if (rect.pos.x < boundsCenterX) {
            // Northwest - If the top side is above the center
            if (rect.pos.y < boundsCenterY) {
                quadrants.push(Quadrant.NW);
            }
            // Northeast - If the bottom side is below the center
            if (rect.pos.y + rect.height > boundsCenterY) {
                quadrants.push(Quadrant.SW);
            }
        }
        // East - If the right side is right of the center
        if (rect.pos.x + rect.width > boundsCenterX) {
            // Northeast - If the top side is above the center
            if (rect.pos.y < boundsCenterY) {
                quadrants.push(Quadrant.NE);
            }
            // Southeast - If the bottom side is below the center
            if (rect.pos.y + rect.height > boundsCenterY) {
                quadrants.push(Quadrant.SE);
            }
        }
        return quadrants;
    }

    /**
     * Inserts the object with the given rectangle
     * @param obj - The object to add
     * @param bbox - The bounding box of the object
     */
    insert(obj: T, bbox: Rect): void {
        // If we reached max objects, subdivide and redistribute
        if (this.#objects.length >= this.maxObjects) {
            if (this.nodes.length === 0 && this.level < this.maxLevels) {
                this.subdivide();
                // Redistribute objects
                var j = 0;
                for (var i = 0; i < this.#objects.length; i++) {
                    const obj = this.#objects[i]!;
                    const bbox = Shape_bbox(this.#objectToShapeMap.get(obj)!);
                    const index = this.#getQuadrant(bbox);
                    if (index !== Quadrant.NONE) {
                        this.nodes[index]!.insert(obj, bbox);
                    }
                    else {
                        this.#objects[j++] = obj;
                    }
                }
                this.#objects.length = j;
            }
        }

        // Check if the object fits in a smaller quadrant
        if (this.nodes.length) {
            const index = this.#getQuadrant(bbox);

            if (index !== Quadrant.NONE) {
                this.nodes[index]!.insert(obj, bbox);
                return;
            }
        }

        this.#objects.push(obj);
    }

    /**
     * Add the object
     * @param obj - The object to add
     */
    add(obj: T) {
        this.#objectsToAddOnNextUpdate.push(obj);
    }

    /**
     * Retrieves all objects potentially intersecting the rectangle
     * @param rect - The rect to test with
     *
     * @returns A set of objects potentially intersecting the rectangle
     */
    retrieve(rect: Rect, retrieveCb: (obj: T) => boolean): void {
        for (var i = 0; i < this.#objects.length; i++) {
            retrieveCb(this.#objects[i]!);
        }

        if (this.nodes.length) {
            const indices = this.#getQuadrants(rect);
            for (var i = 0; i < indices.length; i++) {
                this.nodes[indices[i]!]!.retrieve(rect, retrieveCb);
            }
        }
    }

    /**
     * Removes the object
     * @param obj - The object to remove
     * @param fast - No node collapse if true
     * @returns true if it was removed
     */
    remove(obj: T, fast = false): boolean {
        var index = this.#objects.indexOf(obj);
        if (index > -1) {
            this.#objects.splice(index, 1);
            if (!fast) {
                this.#merge();
            }
            return true;
        }

        for (var i = 0; i < this.nodes.length; i++) {
            if (this.nodes[i]!.remove(obj, fast)) {
                if (!fast) {
                    this.#merge();
                }
                return true;
            }
        }

        return false;
    }

    /**
     * True if the rectangle is completely outside this node's bounds
     * @param bbox - The bounding box to test
     */
    #isInside(bbox: Rect) {
        return bbox.pos.x >= this.bounds.pos.x
            && bbox.pos.y >= this.bounds.pos.y
            && bbox.pos.x + bbox.width <= this.bounds.pos.x + this.bounds.width
            && bbox.pos.y + bbox.height
            <= this.bounds.pos.y + this.bounds.height;
    }

    /**
     * Updates all objects in this node and the objects of its children
     * @param root - The tree root, since insertion happens from the root
     */
    updateNode(orphans: [T, Rect][], dataCB: (obj: T, shape: Shape | undefined) => Shape | undefined) {
        var i = 0;
        while (i < this.#objects.length) {
            const obj = this.#objects[i]!;
            // Check if this world area changed since last frame
            // const versions = Quadtree.versionsForObject.get(obj);
            // if (
            //     versions![0] === getTransformVersion(obj)
            //     && versions![1] === getRenderAreaVersion(obj)
            //     && versions![2] === getLocalAreaVersion(obj)
            // ) {
            //     i++;
            //     continue;
            // }

            // if (objectTransformNeedsUpdate(obj)) {
            //     calcTransform(obj, obj.transform);
            // }
            // else {
            //     versions![0] = getTransformVersion(obj);
            // }
            // versions![1] = getRenderAreaVersion(obj);
            // versions![2] = getLocalAreaVersion(obj);
            const oldShape = this.#objectToShapeMap.get(obj);
            const newShape = dataCB(obj, oldShape);
            if (!newShape) continue;
            this.#objectToShapeMap.set(obj, newShape);
            const bbox = Shape_bbox(newShape);
            // If the object is outside the bounds, remove it and add it to the root later
            if (!this.#isInside(bbox)) {
                orphans.push([obj, bbox]);
                this.#objects.splice(i, 1);
                continue; // Don't increase i, the object at i was removed
            }
            else if (this.nodes.length > 0) {
                // If the object fits in a quadrant, remove it and add it to the quadrant
                const index = this.#getQuadrant(bbox);
                if (index !== Quadrant.NONE) {
                    // Use fast without merge, since it may remove the quadrant we are going to add it to
                    this.nodes[index]!.insert(obj, bbox);
                    this.#objects.splice(i, 1);
                    continue; // Don't increase i, the object at i was removed
                }
            }
            i++;
        }
        // Update sub quadrants
        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i]!.updateNode(orphans, dataCB);
        }
    }

    /**
     * Update this tree
     */
    update(dataCB: (obj: T, shape: Shape | undefined) => Shape | undefined) {
        const orphans: [T, Rect][] = [];
        this.updateNode(orphans, dataCB);
        // Reinsert all objects that were removed because they went outside the bounds of their quadrant
        for (var i = 0; i < orphans.length; i++) {
            this.insert(orphans[i]![0], orphans[i]![1]);
        }
        // Insert all the objects that are new
        for (var i = 0; i < this.#objectsToAddOnNextUpdate.length; i++) {
            const obj = this.#objectsToAddOnNextUpdate[i]!;
            const shape = dataCB(obj, undefined);
            if (!shape) continue;
            this.insert(obj, Shape_bbox(shape));
            // Done with this one
            this.#objectsToAddOnNextUpdate.splice(i--, 1);
        }
    }

    /**
     * Clears this node and collapses it
     */
    clear() {
        this.#objects.length = 0;

        // Do we need this? It only makes sense if someone is still holding a reference to a node
        for (var i = 0; i < this.nodes.length; i++) {
            this.nodes[i]!.clear();
        }

        this.nodes = [];
    }

    /**
     * Gathers all collision pairs in this node and child nodes
     * @param ancestorObjects - Objects in one of the node's ancestors
     * @param pairs - The pairs being gathered
     */
    #gatherPairs(
        ancestorObjects: T[],
        checkCB: (obj: T) => boolean,
        pairCb: (obj1: T, obj2: T) => void,
    ) {
        // The objects in this node potentially collide with each other
        for (var i = 0; i < this.#objects.length; i++) {
            if (!checkCB(this.#objects[i]!)) continue;
            // Note that we don't create doubles, since j = i + 1
            for (var j = i + 1; j < this.#objects.length; j++) {
                if (checkCB(this.#objects[j]!)) {
                    pairCb(this.#objects[i]!, this.#objects[j]!);
                }
            }
        }

        // The objects in this node potentially collide with ancestor objects
        for (var i = 0; i < this.#objects.length; i++) {
            if (!checkCB(this.#objects[i]!)) continue;
            // Note that we don't create doubles, since the lists are disjoint
            for (var j = 0; j < ancestorObjects.length; j++) {
                if (checkCB(ancestorObjects[j]!)) {
                    pairCb(this.#objects[i]!, ancestorObjects[j]!);
                }
            }
        }

        // Check child nodes if any
        if (this.nodes.length) {
            // Add the local objects to the ancestors
            ancestorObjects = ancestorObjects.concat(this.#objects);
            for (var i = 0; i < this.nodes.length; i++) {
                this.nodes[i]!.#gatherPairs(ancestorObjects, checkCB, pairCb);
            }
        }
    }

    iterPairs(
        checkCB: (obj: T) => boolean,
        pairCb: (obj1: T, obj2: T) => void,
    ) {
        this.#gatherPairs([], checkCB, pairCb);
    }
}

export class ResizingQuadtree<T> implements BroadphaseAlgorithm<T> {
    #root: Quadtree<T>;
    #objectsToAddOnNextUpdate: T[] = [];
    constructor(
        bounds: Rect,
        maxObjects: number = 8,
        maxLevels: number = 4,
    ) {
        this.#root = new Quadtree(bounds, maxObjects, maxLevels, 0);
    }

    add(obj: T) {
        this.#objectsToAddOnNextUpdate.push(obj);
    }
    #addAndMaybeResize(obj: T, bbox: Rect): void {
        const increaseLevel = (node: Quadtree<T>) => {
            node.level++;
            for (const n of node.nodes) {
                increaseLevel(n);
            }
        };
        const rootbounds = this.#root.bounds;
        const isLeft = bbox.pos.x < rootbounds.pos.x;
        // Note: Even though an object can be so large that it extends to the right as well, we prioritize left
        const isRight = !isLeft
            && bbox.pos.x + bbox.width
            > rootbounds.pos.x + rootbounds.width;
        const isCenter = !(isLeft || isRight);
        const isTop = bbox.pos.y < rootbounds.pos.y;
        // Note: Even though an object can be so large that it extends to the bottom as well, we prioritize top
        const isBottom = !isTop
            && bbox.pos.y + bbox.height
            > rootbounds.pos.y + rootbounds.height;
        const isMiddle = !(isTop || isBottom);
        if (isTop && (isLeft || isCenter)) {
            /**
             * X X O => N N
             * O O O    N O
             * O O O
             */
            // Create new root
            const node = new Quadtree<T>(
                // New bounds
                new Rect(
                    Vec2_subC(rootbounds.pos, rootbounds.width, rootbounds.height),
                    rootbounds.width * 2,
                    rootbounds.height * 2,
                ),
                this.#root.maxObjects,
                this.#root.maxLevels,
                0,
            );
            // Subdivide top level
            node.subdivide();
            // Replace bottom right node with old root
            increaseLevel(this.#root);
            node.nodes[Quadrant.SE] = this.#root;
            // Replace root with new node
            this.#root = node;

            // Retry
            return this.#addAndMaybeResize(obj, bbox);
        }
        else if (isLeft && (isMiddle || isBottom)) {
            /**
             * O O O => N O
             * X O O    N N
             * X O O
             */
            // Create new root
            const node = new Quadtree<T>(
                // New bounds
                new Rect(
                    Vec2_subC(rootbounds.pos, rootbounds.width, 0),
                    rootbounds.width * 2,
                    rootbounds.height * 2
                ),
                this.#root.maxObjects,
                this.#root.maxLevels,
                0,
            );
            // Subdivide top level
            node.subdivide();
            // Replace top right node with old root
            increaseLevel(this.#root);
            node.nodes[Quadrant.NE] = this.#root;
            // Replace root with new node
            this.#root = node;

            // Retry
            return this.#addAndMaybeResize(obj, bbox);
        }
        else if (isRight && (isTop || isMiddle)) {
            /**
             * O O X => N N
             * O O X    O N
             * O O O
             */
            // Create new root
            const node = new Quadtree<T>(
                // New bounds
                new Rect(
                    Vec2_subC(rootbounds.pos, 0, rootbounds.height),
                    rootbounds.width * 2,
                    rootbounds.height * 2
                ),
                this.#root.maxObjects,
                this.#root.maxLevels,
                0,
            );
            // Subdivide top level
            node.subdivide();
            // Replace bottom left node with old root
            increaseLevel(this.#root);
            node.nodes[Quadrant.SW] = this.#root;
            // Replace root with new node
            this.#root = node;

            // Retry
            return this.#addAndMaybeResize(obj, bbox);
        }
        else if (isBottom && (isCenter || isRight)) {
            /**
             * O O O => O N
             * O O O    N N
             * O X X
             */
            // Create new root
            const node = new Quadtree<T>(
                // New bounds
                new Rect(
                    rootbounds.pos,
                    rootbounds.width * 2,
                    rootbounds.height * 2
                ),
                this.#root.maxObjects,
                this.#root.maxLevels,
                0,
            );
            // Subdivide top level
            node.subdivide();
            // Replace top left node with old root
            increaseLevel(this.#root);
            node.nodes[Quadrant.NW] = this.#root;
            // Replace root with new node
            this.#root = node;

            // Retry
            return this.add(obj);
        }
        else {
            this.#root.insert(obj, bbox);
        }
    }

    remove(obj: T): void {
        this.#root.remove(obj);
        // TODO: If it can shrink, shrink. Not the best idea though, as this can oscillate
    }

    clear(): void {
        this.#root.clear();
    }

    update(dataCB: (obj: T, shape: Shape | undefined) => Shape | undefined): void {
        const orphans: [T, Rect][] = [];
        this.#root.updateNode(orphans, dataCB);
        // Reinsert all objects that were removed because they went outside the bounds of their quadrant
        for (var i = 0; i < orphans.length; i++) {
            this.add(orphans[i]![0]);
        }
        // Insert all the objects that are new
        for (var i = 0; i < this.#objectsToAddOnNextUpdate.length; i++) {
            const obj = this.#objectsToAddOnNextUpdate[i]!;
            const shape = dataCB(obj, undefined);
            if (!shape) continue;
            this.#addAndMaybeResize(obj, Shape_bbox(shape));
            // Done with this one
            this.#objectsToAddOnNextUpdate.splice(i--, 1);
        }
    }

    iterPairs(
        checkCB: (obj: T) => boolean, pairCb: (obj1: T, obj2: T) => void,
    ): void {
        this.#root.iterPairs(checkCB, pairCb);
    }

    get bounds() {
        return this.#root.bounds;
    }

    get nodes() {
        return this.#root.nodes;
    }

    retrieve(rect: Rect, retrieveCb: (obj: T) => boolean) {
        return this.#root.retrieve(rect, retrieveCb);
    }
}

export const makeQuadtree = <T>(
    pos: Vec2,
    width: number,
    height: number,
    maxObjects: number = 8,
    maxLevels: number = 4,
    resizing: boolean = false,
) => {
    if (resizing) {
        return new ResizingQuadtree<T>(
            new Rect(pos, width, height),
            maxObjects,
            maxLevels,
        );
    }
    else {
        return new Quadtree<T>(
            new Rect(pos, width, height),
            maxObjects,
            maxLevels,
            0,
        );
    }
}
