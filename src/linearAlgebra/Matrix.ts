import { max } from "lib0/math";

export class Matrix {
    /** zero-indexed and stored in row-major order,
     * the element at row `i` and column `j` is at index `i * cols + j` */
    data: Float32Array;
    constructor(public rows = 1, public cols = 1) {
        this.data = new Float32Array(rows * cols);
    }
}
export const Matrix_isScalar = (m: Matrix) => {
    return m.rows == 1 && m.cols == 1;
}
export const Matrix_toScalar = (m: Matrix): number => {
    if (!Matrix_isScalar(m)) throw new Error(`Cannot convert ${m.rows}x${m.cols} matrix to scalar`);
    return m.data[0]!;
}
export const Matrix_asColumn = (m: Matrix): Matrix => {
    if (m.rows == 1) return Matrix_transpose(m);
    if (m.cols != 1)
        throw new Error("expected a column vector, but got a matrix");
    return m;
}
export const Matrix_equals = (m: Matrix, other: Matrix) => {
    if (other.rows != m.rows || other.cols != m.cols) return false;
    const r = other.rows, c = other.cols;
    for (var i = 0; i < r; i++) for (var j = 0; j < c; j++) if (Matrix_get(m, i, j) != Matrix_get(other, i, j)) return false;
    return true;
}
export const Matrix_resize_i = (m: Matrix, rows: number, cols: number): Matrix => {
    if (rows < 1 || cols < 1) throw new Error(`invalid dimensions: ${rows}x${cols}`);
    const newLen = rows * cols;
    if (m.data.length < newLen) {
        const newData = new Float32Array(newLen);
        newData.set(m.data);
        m.data = newData;
    }
    m.rows = rows;
    m.cols = cols;
    return m;
}
export const Matrix_fill_i = (m: Matrix, value: number): Matrix => {
    m.data.fill(value, 0, m.rows * m.cols);
    return m;
}
export const Matrix_smear_i = (m: Matrix, rows: number | null, cols: number | null): Matrix => {
    const lastIndex = m.rows * m.cols;
    const last = m.data[lastIndex - 1]!;
    rows ??= m.rows;
    cols ??= m.cols;
    Matrix_resize_i(m, rows, cols);
    m.data.fill(last, lastIndex, rows * cols)
    return m;
}
export const Matrix_setScalar_i = (m: Matrix, value: number): Matrix => {
    Matrix_resize_i(m, 1, 1);
    m.data[0] = value;
    return m;
}
export const Matrix_fromScalar = (x: number): Matrix => {
    const m = new Matrix(1, 1);
    m.data[0] = x;
    return m;
}
export const Matrix_fromVector = (x: number[]) => {
    const m = new Matrix(x.length, 1);
    m.data.set(x);
    return m;
}
export const Matrix_from2DList = (xs: number[][]) => {
    const rows = xs.length;
    const cols = xs.reduce((m, r) => r.length > m ? r.length : m, 0);
    const m = new Matrix(rows, cols);
    for (var r = 0; r < rows; r++) {
        m.data.set(xs[r]!, r * cols);
    }
    return m;
}
export const Matrix_copyFrom = (m: Matrix, from: Matrix) => {
    Matrix_resize_i(m, from.rows, from.cols);
    m.data.set(from.data);
    return m;
}
export const Matrix_put = (m: Matrix, row: number, col: number, data: number) => {
    if (row >= m.rows || col >= m.cols) throw new Error(`row ${row}, col ${col} out of range for ${m.rows}x${m.cols} matrix`);
    m.data[row * m.cols + col] = data;
}
export const Matrix_get = (m: Matrix, row: number, col: number) => {
    if (row >= m.rows || col >= m.cols) throw new Error(`row ${row}, col ${col} out of range for ${m.rows}x${m.cols} matrix`);
    return m.data[row * m.cols + col]!;
}
export const Matrix_cut = (clipboard: Matrix, top: number, left: number, source: Matrix) => {
    if (source.cols < left + clipboard.cols || source.rows < top + clipboard.rows)
        throw new Error(`not enough room to cut from ${clipboard.rows}x${clipboard.cols} matrix into ${source.rows}x${source.cols} at ${top},${left}`);
    for (var selfRow = 0, sourceRow = top; selfRow < clipboard.rows; selfRow++, sourceRow++)
        for (var selfCol = 0, sourceCol = left; selfCol < clipboard.cols; selfCol++, sourceCol++)
            Matrix_put(clipboard, selfRow, selfCol, Matrix_get(source, sourceRow, sourceCol));
}
export const Matrix_paste = (clipboard: Matrix, top: number, left: number, target: Matrix) => {
    if (target.cols < left + clipboard.cols || target.rows < top + clipboard.rows)
        throw new Error(`not enough room to paste ${clipboard.rows}x${clipboard.cols} matrix into ${target.rows}x${target.cols} at ${top},${left}`);
    for (var selfRow = 0, targetRow = top; selfRow < clipboard.rows; selfRow++, targetRow++)
        for (var selfCol = 0, targetCol = left; selfCol < clipboard.cols; selfCol++, targetCol++)
            Matrix_put(target, targetRow, targetCol, Matrix_get(clipboard, selfRow, selfCol));
}
export const Matrix_clone = (m: Matrix) => {
    const m2 = new Matrix();
    Matrix_copyFrom(m2, m);
    return m2;
}
export const Matrix_applyUnary = (m: Matrix, op: (x: number, row: number, col: number) => number): Matrix => {
    for (var i = 0; i < m.rows; i++)
        for (var j = 0; j < m.cols; j++)
            Matrix_put(m, i, j, op(Matrix_get(m, i, j), i, j));
    return m;
}
export const Matrix_applyBinary = (m: Matrix, op: (x: number, y: number, row: number, col: number) => number, right: Matrix): Matrix => {
    zipsize(m, [right]);
    const rows = m.rows, cols = m.cols;
    for (var i = 0; i < rows; i++)
        for (var j = 0; j < cols; j++)
            Matrix_put(m, i, j, op(Matrix_get(m, i, j), Matrix_get(right, i, j), i, j));
    return m;
}
export const Matrix_applyMulti = <A extends number[]>(m: Matrix, op: ((first: number, args: A, row: number, col: number) => number), rest: Matrix[], argArray?: A): Matrix => {
    zipsize(m, rest);
    argArray ??= rest.map(_ => 0) as A;
    for (var i = 0; i < m.rows; i++) {
        for (var j = 0; j < m.cols; j++) {
            for (var a = 0; a <= rest.length; a++) {
                argArray[a] = Matrix_get(rest[a]!, i, j);
            }
            Matrix_put(m, i, j, op(Matrix_get(m, i, j), argArray, i, j));
        }
    }
    return m;
}
export const Matrix_mul_Matrix = (m: Matrix, right: Matrix): Matrix => {
    if (m.cols != right.rows) {
        throw new Error(`dimension mismatch for matrix multiply (${m.rows}x${m.cols} and ${right.rows}x${right.cols})`);
    }
    const aNumRows = m.rows,
        aNumCols = m.cols,
        bNumCols = right.cols,
        out = new Matrix(aNumRows, bNumCols);
    for (var r = 0; r < aNumRows; r++) {
        for (var c = 0; c < bNumCols; c++) {
            var sum = 0;
            for (var i = 0; i < aNumCols; i++) sum += Matrix_get(m, r, i) * Matrix_get(right, i, c);
            Matrix_put(out, r, c, sum);
        }
    }
    return out;
}

const _transposePermutationCache: Map<number, Map<number, number[]>> = new Map;
const _getPermuter = (r: number, c: number): number[] => {
    var colcache = _transposePermutationCache.get(r);
    if (colcache) {
        const cached = colcache.get(c);
        if (cached) return cached;
    } else {
        colcache = new Map;
        _transposePermutationCache.set(r, colcache);
    }
    const n = r * c;
    const map = new Array(n);
    for (var ri = 0; ri < r; ri++)
        for (var ci = 0; ci < c; ci++) map[ci * r + ri] = ri * c + ci;
    colcache.set(c, map);
    return map;
}
export const Matrix_transpose = (m: Matrix): Matrix => {
    const r = m.rows;
    const c = m.cols;
    const data = m.data;
    if (r == 1 || c == 1) {
        // special case for row / column vector: do nothing
    } else if (r == c) {
        // special case for square matrix
        for (var i = 0; i < r; i++) {
            for (var j = i + 1; j < r; j++) {
                const a = i * r + j;
                const b = j * r + i;
                const tmp = data[a]!;
                data[a] = data[b]!;
                data[b] = tmp;
            }
        }
    } else {
        const order = _getPermuter(r, c);
        const temp = new Float32Array(m.data);
        for (var i = 0; i < order.length; i++) {
            m.data[i] = temp[order[i]!]!;
        }
    }
    m.rows = c;
    m.cols = r;
    return m;
}
// For debugging
export const Matrix_dump = (m: Matrix): string => {
    var out = "";
    for (var row = 0; row < m.rows; row++) {
        if (row > 0) out += "\n";
        out += m.data.subarray(row * m.cols, (row + 1) * m.cols).join("\t");
    }
    return out;
}

/** ensures all of the matrices are all the same size or expands 1x1s to match */
const zipsize = (m1: Matrix, l: Matrix[]) => {
    var w = m1.cols, h = m1.rows, i = 0, len1 = l.length;
    for (; i < len1; i++) {
        w = max(l[i]!.cols, w);
        h = max(l[i]!.rows, h);
    }
    var len = l.length;
    for (i = 0; i <= len; i++) {
        const m = i === len ? m1 : l[i]!;
        if (m.rows === 1 && m.cols === 1) Matrix_smear_i(m, h, w);
        else if (m.rows !== h && m.cols !== w) {
            throw new Error(`matrix size mismatch. expected ${h}x${w} or 1x1 but got ${m.rows}x${m.cols}`);
        }
    }
}
