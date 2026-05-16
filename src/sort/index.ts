export const insertionSort = <T>(a: T[], cmp: (a: T, b: T) => boolean) => {
    for (var i = 1; i < a.length; i++) {
        for (var j = i - 1; j >= 0; j--) {
            if (cmp(a[j]!, a[j + 1]!)) break;
            swap(a, j, j + 1);
        }
    }
}

export const swap = <T>(a: T[], i: number, j: number) => {
    const temp = a[i]!;
    a[i] = a[j]!;
    a[j] = temp;
}
