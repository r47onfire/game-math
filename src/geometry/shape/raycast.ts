import { Vec2 } from "../../linearAlgebra";

export type RaycastHit<T> = {
    fraction: number;
    normal: Vec2;
    point: Vec2;
    gridPos?: Vec2;
    data?: T;
};

export type RaycastResult<T> = RaycastHit<T> | null;
