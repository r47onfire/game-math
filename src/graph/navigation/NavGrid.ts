import { abs, floor, max, sqrt } from "lib0/math";
import { aStarSearch, buildConnectivityMap, type Graph } from "..";
import { Vec2 } from "../../linearAlgebra";

/**
 * A navigation grid is a graph consisting of connected grid cells.
 *
 * The cells are numbered in row-major order.
 */
export class NavGrid implements Graph {
    #columns: number;
    #rows: number;
    #tileWidth: number;
    #tileHeight: number;
    #diagonals: boolean;
    #connMap: number[];
    #isConnected: (a: number, b: number) => boolean;

    /**
     * @param data - Grid data
     * @param options - Navigation options
     */
    constructor(
        width: number,
        height: number,
        isConnected: (a: number, b: number) => boolean,
        diagonals = false, tileWidth = 1, tileHeight = 1,
    ) {
        this.#columns = width;
        this.#rows = height;
        this.#tileWidth = tileWidth;
        this.#tileHeight = tileHeight;
        this.#diagonals = diagonals;
        this.#connMap = new Array(this.#columns * this.#rows).fill(-1);
        this.#isConnected = isConnected;

        buildConnectivityMap(this).forEach((index, node) => this.#connMap[node] = index);
    }

    #getTile(x: number, y: number): number {
        const column = floor(x / this.#tileWidth);
        const row = floor(y / this.#tileHeight);
        return row * this.#columns + column;
    }

    #getTileX(tile: number): number {
        return tile % this.#columns;
    }

    #getTileY(tile: number): number {
        return floor(tile / this.#columns);
    }

    get nodes(): number[] {
        return [...new Array(this.#columns * this.#rows).keys()];
    }

    getNeighbors(tile: number): number[] {
        const neighbors = [];
        const x = tile % this.#columns;
        // x > 0
        if (x > 0) {
            neighbors.push(tile - 1);
            if (this.#diagonals) {
                if (tile >= this.#columns) {
                    neighbors.push(tile - this.#columns - 1);
                }
                if (tile < (this.#rows - 1) * this.#columns) {
                    neighbors.push(tile + this.#columns - 1);
                }
            }
        }
        // y > 0
        if (tile >= this.#columns) {
            neighbors.push(tile - this.#columns);
        }
        // y < height
        if (tile < (this.#rows - 1) * this.#columns) {
            neighbors.push(tile + this.#columns);
        }
        // x < width
        if (x < this.#columns - 1) {
            neighbors.push(tile + 1);
            if (this.#diagonals) {
                if (tile >= this.#columns) {
                    neighbors.push(tile - this.#columns + 1);
                }
                if (tile < (this.#rows - 1) * this.#columns) {
                    neighbors.push(tile + this.#columns + 1);
                }
            }
        }

        return neighbors.filter(other => this.#isConnected(tile, other));
    }

    travelCost(a: number, b: number) {
        // Manhattan distance
        const x = abs(this.#getTileX(a) - this.#getTileX(b));
        const y = abs(this.#getTileY(a) - this.#getTileY(b));
        return max(x, y);
    }

    goalHeuristic(a: number, b: number) {
        // Euclidean distance
        const x = this.#getTileX(a) - this.#getTileX(b);
        const y = this.#getTileY(a) - this.#getTileY(b);
        return sqrt(x * x + y * y);
    }

    getPath(start: number, goal: number): number[] {
        // Tiles are not within the grid
        const maxNode = this.#columns * this.#rows;
        if (
            start === null || goal === null || start < 0 || start >= maxNode
            || goal < 0 || goal >= maxNode
        ) {
            return [];
        }

        // Tiles are not within the same section
        if (this.#connMap[start] !== this.#connMap[goal]) {
            return [];
        }

        // Same grid square
        if (start === goal) {
            return [start, goal];
        }

        return [start, ...aStarSearch(this, start, goal), goal];
    }

    getWaypointPath(
        start: Vec2,
        goal: Vec2,
    ): Vec2[] {
        const path = this.getPath(
            this.#getTile(start.x, start.y),
            this.#getTile(goal.x, goal.y),
        );

        if (!path) {
            return [];
        }

        // Center of tile
        const dx = floor(this.#tileWidth / 2);
        const dy = floor(this.#tileHeight / 2);
        return [
            start,
            ...path.slice(1, -1).map(tile => new Vec2(
                this.#getTileX(tile) * this.#tileWidth + dx,
                this.#getTileY(tile) * this.#tileWidth + dy,
            )),
            goal,
        ];
    }
}