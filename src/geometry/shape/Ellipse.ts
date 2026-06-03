import { sqrt } from "lib0/math";
import { atan2, cos, PI, sin } from "../../common";
import { Mat2, Mat23, Mat23_getRotation, Mat23_getScale, Mat23_transformPointV_m, Mat2_eigenvalues, Mat2_eigenvectors, Mat2_inverse, Mat2_mul_Mat2, Mat2_transpose, Mat3_fromMat2, Mat3_rotate_i, Mat3_scale_i, Mat3_toMat2, Vec2, Vec2_add_m, Vec2_addComponents_m, Vec2_clone, Vec2_rotate_a_m, Vec2_rotate_a, Vec2_scaleC_m, Vec2_sub, Vec2_subC_m, Vec2_unit_m } from "../../linearAlgebra";
import { deg2rad, rad2deg } from "../../misc";
import { Rect } from "./Rect";
import { Shape } from "./Shape";
import { RandomSource } from "../../random";

export class Ellipse implements Shape {
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
    transform(tr: Mat23): Ellipse {
        if (this.angle === 0 && Mat23_getRotation(tr) === 0) {
            // No rotation, so we can just take the scale and translation
            return new Ellipse(
                Mat23_transformPointV_m(tr, this.center, new Vec2()),
                tr.a * this.radiusX,
                tr.d * this.radiusY,
            );
        }
        else {
            // Rotation. We can't just add angles, as the scale can squeeze the
            // ellipse and thus change the angle.
            // Get the transformation which maps the unit circle onto the ellipse
            // Transform the transformation matrix with the rotation+scale matrix
            const angle = Mat23_getRotation(tr);
            const scale = Mat23_getScale(tr);
            const M = Mat3_rotate_i(Mat3_scale_i(Mat3_fromMat2(Ellipse_toMat2(this)), scale.x, scale.y), angle);
            // Return the ellipse made from the transformed unit circle
            const ellipse = Ellipse_fromMat2(Mat3_toMat2(M));
            Mat23_transformPointV_m(tr, this.center, ellipse.center);
            return ellipse;
        }
    }
    bbox(r?: Rect): Rect {
        const { center, radiusX, radiusY } = this;
        if (this.angle == 0) {
            // No rotation, so the semi-major and semi-minor axis give the extends
            if (r) {
                Vec2_addComponents_m(center, -radiusX, -radiusY, r.pos);
                r.width = radiusX * 2;
                r.height = radiusY * 2;
                return r;
            }
            else {
                return new Rect(Vec2_subC_m(center, -radiusX, -radiusY, new Vec2()), radiusX * 2, radiusY * 2);
            }
        }
        else {
            // Rotation. We need to find the maximum x and y distance from the
            // center of the rotated ellipse
            const angle = deg2rad(this.angle);
            const c = cos(angle);
            const s = sin(angle);
            const ux = radiusX * c;
            const uy = radiusX * s;
            const vx = radiusY * s;
            const vy = radiusY * c;

            const halfwidth = sqrt(ux * ux + vx * vx);
            const halfheight = sqrt(uy * uy + vy * vy);

            if (r) {
                Vec2_addComponents_m(center, -halfwidth, -halfheight, r.pos);
                r.width = halfwidth * 2;
                r.height = halfheight * 2;
                return r;
            }
            else {
                return new Rect(Vec2_subC_m(center, -halfwidth, -halfheight, new Vec2()), halfwidth * 2, halfheight * 2);
            }
        }
    }
    area() {
        return this.radiusX * this.radiusY * PI;
    }
    clone(): Ellipse {
        return new Ellipse(this.center, this.radiusX, this.radiusY, this.angle);
    }
    collides(shape: Shape) {
        return testEllipseShape(this, shape);
    }
    contains(point: Vec2) {
        // Both methods work, but the second one is faster
        /*let T = this.toTransform()
        point = point.sub(this.center)
        point = T.inverse.transform(point)
        return testCirclePoint(new Circle(vec2(), 1), point)*/
        point = Vec2_sub(point, this.center);
        const angle = deg2rad(this.angle);
        const c = cos(angle);
        const s = sin(angle);
        const vx = point.x * c + point.y * s;
        const vy = -point.x * s + point.y * c;
        return vx * vx / (this.radiusX * this.radiusX)
            + vy * vy / (this.radiusY * this.radiusY) < 1;
    }
    raycast(origin: Vec2, direction: Vec2) {
        return raycastEllipse(origin, direction, this);
    }
    random(rng: RandomSource) {
        // TODO: generate point in unit disc, then transform to this ellipse
        return this.center;
    }
    support(direction: Vec2) {
        // Axis aligned
        if (this.angle === 0.0) {
            const axis = new Vec2();
            Vec2_unit_m(direction, axis);
            Vec2_scaleC_m(axis, this.radiusX, this.radiusY, axis);
            Vec2_add_m(axis, this.center, axis);
            return axis;
        }
        // Rotated
        else {
            const axis = new Vec2();
            Vec2_unit_m(direction, axis);
            Vec2_rotate_a_m(axis, -deg2rad(this.angle), axis);
            Vec2_scaleC_m(axis, this.radiusX, this.radiusY, axis);
            Vec2_rotate_a_m(axis, deg2rad(this.angle), axis);
            Vec2_add_m(axis, this.center, axis);
            return axis;
        }
    }
    get gjkCenter() {
        return this.center;
    }
    closestPt(p: Vec2): Vec2 {
        return this.support(Vec2_sub(p, this.center));
    }
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
