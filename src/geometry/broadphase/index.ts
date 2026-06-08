import { Rect } from "../shape";

export type BroadphaseDataCallback<T> = (obj: T, rect: Rect | undefined) => Rect | undefined;

export interface BroadphaseAlgorithm<T> {
    add(obj: T): void;
    remove(obj: T): void;
    clear(): void;
    /**
     * @param dataCB Passed the old bounding box if on update, or undefined if newly added,
     * should return a bounding box if it's updated or new or undefined if the object didn't
     * have its bounding box updated (can in-place modify the rect)
     */
    update(dataCB: BroadphaseDataCallback<T>): void;
    /**
     * Iterates all object pairs which potentially collide
     * @param checkCB should return true if the object is a valid collision object, e.g. not paused or something.
     * @param pairCb called for each pair of objects that are potentially colliding, return 
     */
    iterPairs(checkCB: (obj: T) => boolean, pairCb: (obj1: T, obj2: T) => void): void;
    /**
     * Retrieves all object which potentially collide with the rectangle
     * @param retrieveCb Called for each. Return true to stop iterating
     */
    retrieve(rect: Rect, retrieveCb: (obj: T) => boolean): void;
}

export * from "./hashgrid";
export * from "./quadtree";
export * from "./sap";

