import { floor } from "lib0/math";
import { swap } from "../sort";

export class BinaryHeap<T> {
    #items: T[];
    #compareFn: (a: T, b: T) => boolean;

    /**
     * Creates a binary heap with the given compare function
     * Not passing a compare function will give a min heap
     */
    constructor(compareFn = (a: T, b: T) => a < b) {
        this.#compareFn = compareFn;
        this.#items = [];
    }

    /**
     * Insert an item into the binary heap
     */
    insert(item: T) {
        this.#items.push(item);
        this.#moveUp(this.#items.length - 1);
    }

    /**
     * Remove the smallest item from the binary heap in case of a min heap
     * or the greatest item from the binary heap in case of a max heap
     */
    remove() {
        if (this.#items.length === 0) {
            return null;
        }
        const item = this.#items[0];
        const lastItem = this.#items.pop();
        if (this.#items.length !== 0) {
            this.#items[0] = lastItem as T;
            this.#moveDown(0);
        }
        return item;
    }

    /**
     * Remove all items
     */
    clear() {
        this.#items.length = 0;
    }

    #moveUp(pos: number) {
        while (pos > 0) {
            const parent = floor((pos - 1) / 2);
            if (!this.#compareFn(this.#items[pos]!, this.#items[parent]!)) {
                if (this.#items[pos]! >= this.#items[parent]!) {
                    break;
                }
            }
            swap(this.#items, pos, parent);
            pos = parent;
        }
    }

    #moveDown(pos: number) {
        while (pos < floor(this.#items.length / 2)) {
            var child = 2 * pos + 1;
            if (
                child < this.#items.length - 1
                && !this.#compareFn(this.#items[child]!, this.#items[child + 1]!)
            ) {
                ++child;
            }
            if (this.#compareFn(this.#items[pos]!, this.#items[child]!)) {
                break;
            }
            swap(this.#items, pos, child);
            pos = child;
        }
    }

    /**
     * Returns the amount of items
     */
    get length() {
        return this.#items.length;
    }
}
