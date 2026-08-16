import { from as Array_from } from "lib0/array";

class LinkedListNode<T> {
    readonly length: number;
    readonly next: this | null;
    constructor(public readonly value: T, next: LinkedList<T>) {
        this.next = next as this;
        this.length = LinkedList_length(next) + 1;
    }
}

export type LinkedList<T> = LinkedListNode<T> | null;
export const LinkedList_push = <T>(top: LinkedList<T>, value: T): LinkedListNode<T> => {
    return new LinkedListNode(value, top);
}
export const LinkedList_length = (ll: LinkedList<any>): number => {
    return ll ? ll.length : 0;
}
export const LinkedList_pop = <T extends NonNullable<LinkedList<any>>>(ll: T): [value: T["value"], rest: T | null] => {
    return [ll.value, ll.next];
}
export const LinkedList_popN = <T extends NonNullable<LinkedList<any>>>(ll: T | null, popAmount: number): [values: T["value"][], rest: T | null] => {
    const out: T["value"][] = Array_from({ length: LinkedList_length(ll) });
    var i = 0;
    for (; popAmount > 0 && ll; popAmount--) {
        const { 0: value, 1: rest } = LinkedList_pop(ll!);
        out[i++] = value;
        ll = rest as any;
    }
    return [out, ll];
}
export const LinkedList_pushAll = <T>(ll: LinkedList<T>, moreValues: T[]): LinkedList<T> => {
    for (var i = moreValues.length - 1; i >= 0; i--) ll = LinkedList_push(ll, moreValues[i]!);
    return ll;
}
export const LinkedList_fromArray = <T>(array: T[]): LinkedList<T> => {
    return LinkedList_pushAll(null, array);
}
export const LinkedList_toArray = <T>(list: LinkedList<T>): T[] => {
    return LinkedList_popN(list, Infinity)[0];
}
export const LinkedList_concat = <T>(first: LinkedList<T>, second: LinkedList<T>): LinkedList<T> => {
    return LinkedList_pushAll(second, LinkedList_toArray(first));
}
export const LinkedList_reverse = <T>(list: LinkedList<T>): LinkedList<T> => {
    var result: LinkedList<T> = null;
    for (; list; list = list.next) {
        result = LinkedList_push(result, list.value);
    }
    return result;
}
