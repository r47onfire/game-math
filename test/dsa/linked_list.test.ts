import { expect, test } from "bun:test";
import { LinkedList, LinkedList_toArray, LinkedList_fromArray } from "../../src/dsa/linked_list";

test("linked list from array to array roundtrips", () => {
    expect(LinkedList_toArray(LinkedList_fromArray([1, 2, 3]))).toEqual([1, 2, 3]);
});

test("linked list from array has first element the same as first element of array", () => {
    var list: LinkedList<number> = LinkedList_fromArray([1, 2, 3]);
    expect(list).not.toBeNull();
    expect(list!.value).toEqual(1);
});
