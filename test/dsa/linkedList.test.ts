import { expect, test } from "bun:test";
import { LinkedList, LinkedList_toArray, LinkedList_fromArray, LinkedList_popN } from "../../src/dsa/linkedList";

test("linked list from array to array roundtrips", () => {
    expect(LinkedList_toArray(LinkedList_fromArray([1, 2, 3]))).toEqual([1, 2, 3]);
});

test("linked list from array has first element the same as first element of array", () => {
    const list = LinkedList_fromArray([1, 2, 3]);
    expect(list).not.toBeNull();
    expect(list!.value).toEqual(1);
});

test("linked list pop N correctly allocates the array", () => {
    const list = LinkedList_fromArray([1, 2, 3, 4]);
    const [items, rest] = LinkedList_popN(list, 2);
    expect(items).toEqual([1, 2]);
    expect(rest).toEqual(LinkedList_fromArray([3, 4]));
});

test("linked list pop N with too many items", () => {
    const list = LinkedList_fromArray([1, 2, 3, 4]);
    const [items, rest] = LinkedList_popN(list, 20);
    expect(items).toEqual([1, 2, 3, 4]);
    expect(rest).toBeNull();
});
