export const sin = Math.sin;
export const cos = Math.cos;
export const tan = Math.tan;
export const PI = Math.PI;
export const TAU = PI * 2;
export const HALF_PI = PI / 2;
export const atan2 = Math.atan2;
export const asin = Math.asin;
export const acos = Math.acos;
export const atan = Math.atan;

export const isinstance = <C>(obj: any, cls: abstract new (...args: any[]) => C): obj is C => {
    return obj instanceof cls;
}

export const issubclass = <A, B>(sub: abstract new (...args: any[]) => A, super_: abstract new (...args: any[]) => B): A extends B ? true : B extends A ? false : boolean => {
    return sub.prototype instanceof super_ as any;
}

const idMap = new WeakMap<object, number>();
var idCounter = 0;
export const id = (obj: object): number => {
    if (!idMap.has(obj)) idMap.set(obj, idCounter++);
    return idMap.get(obj)!;
}

export const rotate32 = (x: number, shr: number) => (x << shr) | (x >> (32 - shr));
