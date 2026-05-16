import { RandomSource } from ".";

// basic ANSI C LCG
const A = 1103515245;
const C = 12345;
const M = 2147483648;
export const LCG = (seed: number): RandomSource => {
    return () => {
        seed = (A * seed + C) % M;
        return seed / M;
    }
}
