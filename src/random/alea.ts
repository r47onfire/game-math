// Algorithm by Johannes Baagøe
// The original article isn't online anymore, but there is a snapshot on internet archive:
// http://web.archive.org/web/20101106000458/http://baagoe.com/en/RandomMusings/javascript/
// This is the slim TypeScript variant of this implementation:
// https://github.com/coverslide/node-alea

import { RandomSource } from ".";

const getRandomSeeds = () => {
    return [
        Math.random().toString(36).slice(2),
        Math.random().toString(36).slice(2),
        Math.random().toString(36).slice(2),
    ];
};

const TWO_TO_32 = 0x100000000;

const getMash = () => {
    var n = 0xefc8249d;

    return (seed: string): number => {
        for (var i = 0; i < seed.length; i++) {
            n += seed.charCodeAt(i);
            var h = 0.02519603282416938 * n;
            n = h >>> 0;
            h -= n;
            h *= n;
            n = h >>> 0;
            h -= n;
            n += h * TWO_TO_32;
        }
        return (n >>> 0) / TWO_TO_32;
    };
};

export const alea = (...seeds: string[]): RandomSource => {

    const mash = getMash();
    const s = [mash(" "), mash(" "), mash(" ")];
    var c = 1;

    seeds = seeds.length > 0 ? seeds : getRandomSeeds();

    seeds.forEach((seed) => {
        s.forEach((_, i) => {
            s[i]! -= mash(seed);

            if (s[i]! < 0) {
                s[i]! += 1;
            }
        });
    });

    return () => {
        const t = 2091639 * s[0]! + c / TWO_TO_32;
        c = t | 0; // quicker floor
        s[0] = s[1]!;
        s[1] = s[2]!;
        return s[2] = t - c;
    };
};
