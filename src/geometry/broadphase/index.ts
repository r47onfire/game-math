import { Rect, Shape } from "../shape";

export interface BroadphaseAlgorithm<T> {
    add(obj: T): void;
    remove(obj: T): void;
    clear(): void;
    /**
     * @param dataCB Passed the old shape if on update, or undefined if newly added, should return a shape if it's updated or new or undefined if the object didn't have its shape updated (can in-place modify the shape)
     */
    update(dataCB: (obj: T, shape: Shape | undefined) => Shape | undefined): void;
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

