import { sqrt } from "lib0/math";
import { atan2, cos, sin } from "../../common";
import { Mat2, Mat2_eigenvalues, Mat2_eigenvectors, Mat2_inverse, Mat2_mul_Mat2, Mat2_transpose, Vec2, Vec2_clone } from "../../linearAlgebra";
import { deg2rad, rad2deg } from "../../misc";
import { ShapeType, TaggedWithShape } from "./Shape";

export class Ellipse implements TaggedWithShape {
    type = ShapeType.ELLIPSE;
    center: Vec2;
    radiusX: number;
    radiusY: number;
    angle: number;
    constructor(center: Vec2, rx: number, ry: number, degrees: number = 0) {
        this.center = Vec2_clone(center);
        this.radiusX = rx;
        this.radiusY = ry;
        this.angle = degrees;
    }
    // collides(shape: Shape) {
    //     return testEllipseShape(this, shape);
    // }
    // closestPt(p: Vec2): Vec2 {
    //     return this.support(Vec2_sub(p, this.center));
    // }
}

export const Ellipse_fromMat2 = (tr: Mat2) => {
    const inv = Mat2_inverse(tr);
    const M = Mat2_mul_Mat2(Mat2_transpose(inv), inv);
    const e = Mat2_eigenvalues(M), e1 = e[0], e2 = e[1];
    const v = Mat2_eigenvectors(M, e1, e2), v1 = v[0], v2 = v[1];

    const a = 1 / sqrt(e1), b = 1 / sqrt(e2);

    // Make sure we use the semi-major axis for the rotation
    if (a > b) {
        return new Ellipse(
            new Vec2(),
            a,
            b,
            rad2deg(atan2(-v1.y, v1.x)),
        );
    }
    else {
        return new Ellipse(
            new Vec2(),
            b,
            a,
            rad2deg(atan2(-v2.y, v2.x)),
        );
    }
}

export const Ellipse_toMat2 = (ellipse: Ellipse) => {
    const a = deg2rad(ellipse.angle);
    const c = cos(a);
    const s = sin(a);
    return new Mat2(
        c * ellipse.radiusX,
        -s * ellipse.radiusY,
        s * ellipse.radiusX,
        c * ellipse.radiusY,
    );
}
