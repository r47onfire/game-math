import { ceil, floor, max, min } from "lib0/math";
import { BroadphaseAlgorithm } from ".";
import { Vec2 } from "../../linearAlgebra";
import { Rect, Rect_clone, Shape, Shape_bbox } from "../shape";

export class HashGrid<T> implements BroadphaseAlgorithm<T> {
    #bounds: Rect;
    #cellSize: number;
    #columns: number;
    #grid: T[][] = [];
    #hashesForObject = new Map<T, number[]>();
    #objectsToAddOnNextUpdate: T[] = [];
    #objectToShape = new Map<T, Shape>;

    constructor(bounds: Rect, gridSize = 64) {
        this.#bounds = Rect_clone(bounds);
        this.#cellSize = gridSize;
        this.#clampBoundsToCellSize();
        this.#columns = floor(this.#bounds.width / this.#cellSize);
    }

    add(obj: T) {
        this.#objectsToAddOnNextUpdate.push(obj);
    }

    remove(obj: T) {
        // Remove the object from all cells it is contained in
        const hashes = this.#hashesForObject.get(obj);
        if (hashes) {
            for (var i = 0; i < hashes.length; i++) {
                this.#removeObjectFromGridByHash(obj, hashes[i]!);
            }
        }
        this.#hashesForObject.delete(obj);
        this.#objectsToAddOnNextUpdate = this.#objectsToAddOnNextUpdate.filter(o => o !== obj);
    }

    clear(clearShapesForObject = true) {
        this.#grid = [];
        this.#objectsToAddOnNextUpdate = [];
        this.#hashesForObject.clear();
        if (clearShapesForObject) this.#objectToShape.clear();
    }

    update(dataCB: (obj: T, shape: Shape | undefined) => Shape | undefined) {
        // process existing objects
        const oldSet = new Set<number>();
        const newSet = new Set<number>();
        for (const [obj, oldHashes] of this.#hashesForObject) {
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
            const newShape = dataCB(obj, this.#objectToShape.get(obj));
            if (!newShape) continue;
            this.#objectToShape.set(obj, newShape);
            // Retrieve the old hashes
            for (var i = 0; i < oldHashes.length; i++) {
                oldSet.add(oldHashes[i]!);
            }
            // Get the hashes of the updated world bbox
            const newHashes = this.#hashRect(Shape_bbox(newShape));
            for (var i = 0; i < newHashes.length; i++) {
                newSet.add(newHashes[i]!);
            }
            // Check if there is a difference between old and new hashes
            if (oldSet.symmetricDifference(newSet).size > 0) {
                // Remove the object from cells it no longer occupies
                oldSet.difference(newSet).forEach(hash => {
                    this.#removeObjectFromGridByHash(obj, hash);
                });
                // Add the object to newly occupied cells
                newSet.difference(oldSet).forEach(hash => {
                    this.#addObjectToGridByHash(obj, hash);
                });
                // Replace the hashes
                oldHashes.length = 0;
                for (var i = 0; i < newHashes.length; i++) {
                    oldHashes.push(newHashes[i]!);
                }
            }
            oldSet.clear();
            newSet.clear();
        }
        // add all new things
        for (var i = 0; i < this.#objectsToAddOnNextUpdate.length; i++) {
            const obj = this.#objectsToAddOnNextUpdate[i]!;
            const shape = dataCB(obj, undefined);
            if (!shape) continue;
            this.#objectToShape.set(obj, shape);
            const bbox = Shape_bbox(shape);
            if (!this.#isInside(bbox)) {
                this.#resizeToFit(bbox);
            }
            // Add the object to all cells covered by its bbox
            const hashes = this.#hashRect(bbox);
            for (var i = 0; i < hashes.length; i++) {
                this.#addObjectToGridByHash(obj, hashes[i]!);
            }
            this.#hashesForObject.set(obj, hashes);
            // Done with this one
            this.#objectsToAddOnNextUpdate.splice(i--, 1);
        }
    }

    iterPairs(
        checkCB: (obj: T) => boolean,
        pairCb: (obj1: T, obj2: T) => void,
    ) {
        const checked = new Set<T>();
        const collisions = new Set<T>();
        for (const [obj1, hashes] of this.#hashesForObject) {
            if (!checkCB(obj1)) continue;
            checked.add(obj1);
            for (var i = 0; i < hashes.length; i++) {
                const hash = hashes[i]!;
                for (const obj2 of this.#grid[hash]!) {
                    if (checkCB(obj2) && !checked.has(obj2)) {
                        collisions.add(obj2);
                    }
                }
            }
            for (const obj2 of collisions) {
                pairCb(obj1, obj2);
            }
            collisions.clear();
        }
    }

    retrieve(rect: Rect, retrieveCb: (obj: T) => boolean) {
        // Get the hashes of the covered cells
        const hashes = this.#hashRect(rect);
        // Collect the objects inside the cells
        const hits = new Set<T>();
        for (var i = 0; i < hashes.length; i++) {
            const cell = this.#grid[hashes[i]!];
            if (cell) {
                for (var i = 0; i < cell.length; i++) {
                    const obj = cell[i]!;
                    if (!hits.has(obj)) {
                        hits.add(obj);
                        if (retrieveCb(obj)) return;
                    }
                }
            }
        }
    }

    #hashPoint(point: Vec2) {
        const x = floor((point.x - this.#bounds.pos.x) / this.#cellSize);
        const y = floor((point.y - this.#bounds.pos.y) / this.#cellSize);
        return x + y * this.#columns;
    }

    #hashRect(rect: Rect) {
        rect = Rect_clone(rect);

        // Clamp rect
        // TODO: remove this once update resizes too
        if (rect.pos.x < this.#bounds.pos.x) {
            const diff = this.#bounds.pos.x - rect.pos.x;
            rect.pos.x = this.#bounds.pos.x;
            rect.width -= diff;
        }
        if (rect.pos.y < this.#bounds.pos.y) {
            const diff = this.#bounds.pos.y - rect.pos.y;
            rect.pos.y = this.#bounds.pos.y;
            rect.height -= diff;
        }
        if (rect.pos.x + rect.width > this.#bounds.pos.x + this.#bounds.width) {
            rect.width = this.#bounds.pos.x + this.#bounds.width - rect.pos.x;
        }
        if (rect.pos.y + rect.height > this.#bounds.pos.y + this.#bounds.height) {
            rect.height = this.#bounds.pos.y + this.#bounds.height - rect.pos.y;
        }

        // Calculate hashes
        const w = floor(this.#bounds.width / this.#cellSize);
        var hash = this.#hashPoint(rect.pos);
        const hashes = [];
        const rw = ceil(rect.width / this.#cellSize);
        const rh = ceil(rect.height / this.#cellSize);
        for (var y = 0; y <= rh; y++) {
            for (var x = 0; x <= rw; x++) {
                hashes.push(hash);
                hash++;
            }
            hash += w - rw - 1;
        }
        return hashes;
    }

    #addObjectToGridByHash(obj: T, hash: number) {
        if (!this.#grid[hash]) {
            this.#grid[hash] = [];
        }
        this.#grid[hash].push(obj);
    }

    #removeObjectFromGridByHash(obj: T, hash: number) {
        const objects = this.#grid[hash]!;
        const index = objects.indexOf(obj);
        if (index >= 0) {
            // Order doesn't matter here
            objects[index] = objects.pop()!;
        }
    }

    #isInside(bbox: Rect) {
        return bbox.pos.x >= this.#bounds.pos.x
            && bbox.pos.y >= this.#bounds.pos.y
            && bbox.pos.x + bbox.width <= this.#bounds.pos.x + this.#bounds.width
            && bbox.pos.y + bbox.height
            <= this.#bounds.pos.y + this.#bounds.height;
    }

    #resizeToFit(bbox: Rect) {
        // Rectangle union
        this.#bounds.width = max(
            this.#bounds.pos.x + this.#bounds.width,
            bbox.pos.x + bbox.width,
        ) - (this.#bounds.pos.x = min(this.#bounds.pos.x, bbox.pos.x));
        this.#bounds.height = max(
            this.#bounds.pos.y + this.#bounds.height,
            bbox.pos.y + bbox.height,
        ) - (this.#bounds.pos.y = min(this.#bounds.pos.y, bbox.pos.y));

        this.#clampBoundsToCellSize();
        this.#columns = floor(this.#bounds.width / this.#cellSize);

        // TODO: Recalculate hashes instead of restarting from scratch
        // TODO: maybe use a 2D array instead?
        const objects = [...this.#hashesForObject.keys()];

        this.clear(false);

        for (const obj of objects) {
            this.add(obj);
        }
    }

    #clampBoundsToCellSize() {
        this.#bounds.pos.x = floor(this.#bounds.pos.x / this.#cellSize)
            * this.#cellSize;
        this.#bounds.pos.y = floor(this.#bounds.pos.y / this.#cellSize)
            * this.#cellSize;
        this.#bounds.width = ceil(this.#bounds.width / this.#cellSize)
            * this.#cellSize;
        this.#bounds.height = ceil(this.#bounds.height / this.#cellSize)
            * this.#cellSize;
    }
}
