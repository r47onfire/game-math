import { RandomSource } from ".";

export const xorshift32 = (seed: number): RandomSource => {
    seed ??= 1;
    return () => {
        seed ^= seed << 13;
        seed ^= seed >> 17;
        seed ^= seed << 5;
        return seed / 0xffffffff;
    }
}
