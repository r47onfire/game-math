import { BroadphaseAlgorithm } from ".";
import { Rect, Shape, Shape_bbox } from "../shape";

/**
 * Left or right edge of an object's bbox, or top or bottom in vertical mode
 */
class SapEdge<T> {
    x: number;
    constructor(public obj: T, public isLeft: boolean) {
        this.x = 0;
    }
}

export class SweepAndPrune<T> implements BroadphaseAlgorithm<T> {
    #edges: SapEdge<T>[] = [];
    #objects = new Map<T, [SapEdge<T>, SapEdge<T>]>();
    #objectToShape = new Map<T, Shape>();

    #isVertical: boolean;
    constructor(vertical = false) {
        this.#isVertical = vertical;
    }

    /**
     * Add the object and its edges to the list
     * @param obj - The object to add
     */
    add(obj: T) {
        const left = new SapEdge(obj, true);
        const right = new SapEdge(obj, false);
        this.#edges.push(left);
        this.#edges.push(right);
        this.#objects.set(obj, [left, right]);
    }

    /**
     * Remove the object and its edges from the list
     * @param obj - The object to remove
     */
    remove(obj: T) {
        const pair = this.#objects.get(obj);
        if (pair) {
            this.#edges.splice(this.#edges.indexOf(pair[0]), 1);
            this.#edges.splice(this.#edges.indexOf(pair[1]), 1);
            this.#objects.delete(obj);
        }
    }

    clear() {
        this.#edges = [];
        this.#objects.clear();
    }

    /**
     * Update edges and sort
     */
    update(dataCB: (obj: T, shape: Shape | undefined) => Shape | undefined) {
        // Update edge data
        for (const [obj, edges] of this.#objects.entries()) {

            const newShape = dataCB(obj, this.#objectToShape.get(obj));
            if (!newShape) continue;
            this.#objectToShape.set(obj, newShape);

            // // Check if this world area changed since last frame
            // const versions = this.versionsForObject.get(obj);
            // if (
            //     versions![0] === getTransformVersion(obj)
            //     && versions![1] === getRenderAreaVersion(obj)
            //     && versions![2] === getLocalAreaVersion(obj)
            // ) {
            //     // No change
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

            const bbox = Shape_bbox(newShape);
            edges[1].x = (edges[0].x = this.#isVertical ? bbox.pos.y : bbox.pos.x) + (this.#isVertical ? bbox.height : bbox.width);
        }
        // Insertion sort is ~O(n) for nearly-sorted lists - which this will be
        // on all but the first iteration. The builtin Array.sort() can't make
        // this guarantee of speed -- JS engines typically use various other sorting
        // algorithms (introsort, mergesort, selection sort, treesort, etc.) that don't
        // have this nice property.
        //
        // There's an insertionSort() function elsewhere, but inlining it and swap() here
        // offers some speed benefits especially with dumber JS optimizers that
        // won't or can't automatically inline "hot" functions.
        for (var i = 1; i < this.#edges.length; i++) {
            for (var j = i - 1; j >= 0; j--) {
                if (this.#edges[j]!.x < this.#edges[j + 1]!.x) break;
                const temp = this.#edges[j]!;
                this.#edges[j] = this.#edges[j + 1]!;
                this.#edges[j + 1] = temp;
            }
        }
    }

    /**
     * Iterates all object pairs which potentially collide
     */
    iterPairs(checkCB: (obj: T) => boolean, pairCb: (obj1: T, obj2: T) => void) {
        const touching = new Set<T>();

        for (const edge of this.#edges) {
            if (edge.isLeft) {
                if (checkCB(edge.obj)) {
                    for (const obj of touching) {
                        if (checkCB(obj)) {
                            pairCb(obj, edge.obj);
                        }
                    }
                }
                touching.add(edge.obj);
            }
            else {
                touching.delete(edge.obj);
            }
        }
    }

    retrieve(rect: Rect, retrieveCb: (obj: T) => void) {
        const left = this.#isVertical ? rect.pos.y : rect.pos.x;
        const right = left + (this.#isVertical ? rect.width : rect.height);
        const hits = new Set<T>();
        for (const edge of this.#edges) {
            if (edge.isLeft) {
                if (edge.x < right) {
                    hits.add(edge.obj);
                }
            }
            else {
                if (edge.x < left) {
                    hits.delete(edge.obj);
                }
            }
        }
        hits.forEach(retrieveCb);
    }
}
