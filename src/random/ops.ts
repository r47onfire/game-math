import { isArray } from "lib0/array";
import { add, floor } from "lib0/math";
import { RandomSource } from ".";
import { Color } from "../color";
import { Vec2, Vec2_lerp } from "../linearAlgebra";
import { lerpNumber } from "../misc";
import { swap } from "../sort";


/**
 * Generate a random number between two values.
 *
 * @param a - The minimum value.
 * @param b - The maximum value.
 *
 * @example
 * ```js
 * const rng = ...;
 * const value = Random_floatBetween(rng, 10, 20) // Returns number between 10-20
 * ```
 *
 * @returns A number between a and b.
 */

export const Random_floatBetween = (random: RandomSource, a: number, b: number): number => {
    return lerpNumber(a, b, random());
};

export const Random_intBetween = (random: RandomSource, a: number, b: number): number => {
    return floor(Random_floatBetween(random, a, b));
};

export const Random_floatBelow = (random: RandomSource, a: number): number => {
    return random() * a;
};

export const Random_intBelow = (random: RandomSource, a: number): number => {
    return Random_intBetween(random, 0, a);
};
/**
 * Generate a random 2D vector between two vectors.
 *
 * @param a - The minimum vector.
 * @param b - The maximum vector.
 *
 * @example
 * ```js
 * const rng = new RNG(Date.now())
 * const vec = Random_vec2(rng, vec2(0,0), vec2(100,100))
 * ```
 *
 * @returns A vector between vectors a and b.
 */

export const Random_vec2 = (random: RandomSource, a: Vec2, b: Vec2): Vec2 => {
    return Vec2_lerp(a, b, random());
};
/**
 * Generate a random color between two colors.
 *
 * @param a - The first color.
 * @param b - The second color.
 *
 * @example
 * ```js
 * const rng = ...;
 * const color = Random_color(rng, new Color(0,0,0), new Color(255,255,255))
 * ```
 *
 * @returns A color between colors a and b.
 */

export const Random_color = (random: RandomSource, a: Color, b: Color): Color => {
    return new Color(
        Random_floatBetween(random, a.r, b.r),
        Random_floatBetween(random, a.g, b.g),
        Random_floatBetween(random, a.b, b.b)
    );
};

export const Random_chance = (random: RandomSource, p: number): boolean => {
    return random() <= p;
};

export const Random_shuffle_inPlace = <T>(random: RandomSource, list: T[]): T[] => {
    for (var i = list.length - 1; i > 0; i--) {
        swap(list, i, Random_intBelow(random, i + 1));
    }
    return list;
};

export const Random_sample = <T>(random: RandomSource, list: T[], count: number): T[] => {
    return list.length <= count
        ? list.slice()
        : Random_shuffle_inPlace(random, list.slice()).slice(0, count);
};

export const Random_choice = <T>(random: RandomSource, list: T[]): T => {
    return list[Random_intBelow(random, list.length)]!;
};

// Originally called "roulette" by MF
export const Random_indexWeighted = (random: RandomSource, probabilities: number[]): number => {
    const sum = probabilities.reduce(add, 0);
    // Make a random number
    const value = Random_floatBelow(random, sum);
    // Search for the first index for which the cumulative probability is greater
    var index = 0;
    var probabilitySum = probabilities[0]!;
    while (value > probabilitySum) {
        probabilitySum += probabilities[++index]!;
    }
    return index;
};

// Originally called "gacha" by MF
export const Random_chooseWeighted = <T>(
    random: RandomSource,
    items: [T, number][] | Map<T, number> | Record<string, number>
): T => {

    if (items instanceof Map) {
        items = [...items.entries()];
    } else if (!isArray(items)) {
        items = Object.entries(items) as [T, number][];
    }
    const list = items.map(i => i[0]);
    const probabilities = items.map(i => i[1]);
    return list[Random_indexWeighted(random, probabilities)]!;
};
