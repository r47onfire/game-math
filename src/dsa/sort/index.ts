export type Comparator<T> = (a: T, b: T) => number;
export const compareNumbers: Comparator<number> = (a, b) => a - b;
export const between = <T>(x: T, low: T, high: T, comparator: Comparator<T>) => comparator(x, low) >= 0 && comparator(x, high) < 0;

export const insertionSort = <T>(a: T[], cmp: Comparator<T>) => {
    for (var i = 1; i < a.length; i++) {
        for (var j = i - 1; j >= 0; j--) {
            if (cmp(a[j]!, a[j + 1]!) <= 0) break;
            swap(a, j, j + 1);
        }
    }
}

export const swap = <T>(a: T[], i: number, j: number) => {
    const temp = a[i]!;
    a[i] = a[j]!;
    a[j] = temp;
}
