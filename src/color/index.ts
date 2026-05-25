import { max, min, round } from "lib0/math";
import { freeze } from "lib0/object";
import { clamp, lerpNumber } from "../misc";
import { CSS_COLOR_MAP } from "./namedColors";

export type CSSColorKeywords = keyof typeof CSS_COLOR_MAP;

export class Color {
    /** Red (0-255). */
    r: number = 255;
    /** Green (0-255). */
    g: number = 255;
    /** Blue (0-255). */
    b: number = 255;

    constructor(r: number, g: number, b: number) {
        this.r = clamp(r, 0, 255);
        this.g = clamp(g, 0, 255);
        this.b = clamp(b, 0, 255);
    }
}

export const Color_fromArray = (arr: [number, number, number]) => {
    return new Color(arr[0], arr[1], arr[2]);
}

/**
 * Create color from hex literal.
 *
 * @example
 * ```js
 * Color.fromHex(0xfcef8d)
 * ```
 */
export const Color_fromHexN = (hex: number) => {
    return new Color(
        (hex >> 16) & 0xff,
        (hex >> 8) & 0xff,
        (hex >> 0) & 0xff,
    );
}
/**
 * Create color from hex string.
 *
 * @example
 * ```js
 * Color.fromHex("#5ba675")
 * Color.fromHex("d46eb3")
 * ```
 */
export const Color_fromHexStr = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    if (!result) throw new Error("Invalid hex color format");

    return new Color(
        parseInt(result[1]!, 16),
        parseInt(result[2]!, 16),
        parseInt(result[3]!, 16),
    );
}

// TODO: use range of [0, 360] [0, 100] [0, 100]?
export const Color_fromHSL = (h: number, s: number, l: number) => {
    if (s == 0) {
        return new Color(255 * l, 255 * l, 255 * l);
    }

    const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
    };

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const r = hue2rgb(p, q, h + 1 / 3);
    const g = hue2rgb(p, q, h);
    const b = hue2rgb(p, q, h - 1 / 3);

    return new Color(
        round(r * 255),
        round(g * 255),
        round(b * 255),
    );
}

/**
 * Create a color from a CSS color name
 *
 * @param cssColor - The color name.
 *
 * @example
 * ```js
 * loadHappy();
 *
 * add([
 *     rect(512, 512, {
 *         radius: [0, 96, 96, 96]
 *     }),
 *     color("#663399"),
 *     pos(40, 40),
 * ]);
 *
 * add([
 *     text("css", { size: 192, font: "happy" }),
 *     pos(90, 310)
 * ]);
 * ```
 *
 * @static
 * @returns The color.
 * @experimental This feature is in experimental phase, it will be fully released in v3001.1.0
 */
export const Color_fromCSS = (cssColor: CSSColorKeywords) => {
    const color = CSS_COLOR_MAP[cssColor];
    if (!color) throw new Error("Invalid CSS color name " + cssColor);

    return Color_fromHexStr(color);
}

export const COLOR_RED = /* @__PURE__ */ freeze(new Color(255, 0, 0));
export const COLOR_GREEN = /* @__PURE__ */ freeze(new Color(0, 255, 0));
export const COLOR_BLUE = /* @__PURE__ */ freeze(new Color(0, 0, 255));
export const COLOR_YELLOW = /* @__PURE__ */ freeze(new Color(255, 255, 0));
export const COLOR_MAGENTA = /* @__PURE__ */ freeze(new Color(255, 0, 255));
export const COLOR_CYAN = /* @__PURE__ */ freeze(new Color(0, 255, 255));
export const COLOR_WHITE = /* @__PURE__ */ freeze(new Color(255, 255, 255));
export const COLOR_BLACK = /* @__PURE__ */ freeze(new Color(0, 0, 0));

export const Color_clone = (c: Color): Color => {
    return new Color(c.r, c.g, c.b);
}

/** Lighten the color (adds RGB by n). */
export const Color_lighten = (c: Color, a: number): Color => {
    return new Color(c.r + a, c.g + a, c.b + a);
}

/** Darkens the color (subtracts RGB by n). */
export const Color_darken = (c: Color, a: number): Color => {
    return Color_lighten(c, -a);
}

export const Color_inverse = (c: Color): Color => {
    return new Color(255 - c.r, 255 - c.g, 255 - c.b);
}

export const Color_mul = (c: Color, other: Color): Color => {
    return new Color(
        c.r * other.r / 255,
        c.g * other.g / 255,
        c.b * other.b / 255,
    );
}

/**
 * Linear interpolate to a destination color.
 *
 * @since v3000.0
 */
export const Color_lerp = (from: Color, to: Color, t: number): Color => {
    return new Color(
        lerpNumber(from.r, to.r, t),
        lerpNumber(from.g, to.g, t),
        lerpNumber(from.b, to.b, t),
    );
}

/**
 * Convert color into HSL format.
 *
 * @since v3001.0
 */
export const Color_toHSL = (c: Color): [h: number, s: number, l: number] => {
    const r = c.r / 255;
    const g = c.g / 255;
    const b = c.b / 255;
    const max_ = max(r, max(g, b)), min_ = min(r, min(g, b));
    var h = (max_ + min_) / 2;
    var s = h;
    const l = h;
    if (max_ == min_) {
        h = s = 0;
    }
    else {
        const d = max_ - min_;
        s = l > 0.5 ? d / (2 - max_ - min_) : d / (max_ + min_);
        switch (max_) {
            case r:
                h = (g - b) / d + (g < b ? 6 : 0);
                break;
            case g:
                h = (b - r) / d + 2;
                break;
            case b:
                h = (r - g) / d + 4;
                break;
        }
        h /= 6;
    }
    return [h, s, l];
}

export const Color_eq = (c: Color, other: Color): boolean => {
    return c.r === other.r
        && c.g === other.g
        && c.b === other.b;
}

/**
 * Return the hex string of color.
 */
export const Color_toHex = (c: Color): string => {
    return "#" + ((1 << 24) + (c.r << 16) + (c.g << 8) + c.b).toString(16).slice(1);
}

/**
 * Return the color converted to an array.
 */
export const Color_toArray = (c: Color): [r: number, g: number, b: number] => {
    return [c.r, c.g, c.b];
}
