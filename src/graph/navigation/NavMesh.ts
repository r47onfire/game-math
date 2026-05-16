import { sqrt } from "lib0/math";
import { aStarSearch, type Graph } from "..";
import { Vec2, Vec2_add, Vec2_addC, Vec2_clone, Vec2_scale_sv, Vec2_sub, Vec2_unit } from "../../linearAlgebra";

class NavEdge {
    polygon: WeakRef<NavPolygon>;

    constructor(public a: Vec2, public b: Vec2, polygon: NavPolygon) {
        this.polygon = new WeakRef(polygon);
    }
}

const NavEdge_isLeft = (edge: NavEdge, x: number, y: number) => {
    return ((edge.b.x - edge.a.x) * (y - edge.a.y)
            - (x - edge.a.x) * (edge.b.y - edge.a.y));
};

const NavEdge_middle = (edge: NavEdge) => {
    return Vec2_scale_sv(Vec2_add(edge.a, edge.b), .5);
}

class NavPolygon {
    // I don't know if set a default affects how the code is did
    // TODO: Remove non-null assertion
    #edges!: NavEdge[];
    #centroid!: Vec2;
    #id: number;

    constructor(id: number) {
        this.#id = id;
    }

    get id() {
        return this.#id;
    }

    set edges(edges: NavEdge[]) {
        this.#edges = edges;
        var centerX = 0;
        var centerY = 0;
        var area = 0;
        for (var edge of this.#edges) {
            edge.polygon = new WeakRef(this);
            const cross = edge.a.x * edge.b.y - edge.a.y * edge.b.x;
            centerX += (edge.a.x + edge.b.x) * cross;
            centerY += (edge.a.y + edge.b.y) * cross;
            area += cross;
        }
        area /= 2;
        this.#centroid = new Vec2(centerX / (6 * area), centerY / (6 * area));
    }

    get edges(): NavEdge[] {
        return this.#edges;
    }

    get centroid(): Vec2 {
        return this.#centroid;
    }

    // https://web.archive.org/web/20130126163405/http://geomalgorithms.com/a03-_inclusion.html
    /*contains(x: number, y: number) {
        var wn = 0;

        for (var edge of this._edges) {
            if (edge.a.y <= y) {
                if (edge.b.y > y) {
                    if (edge.isLeft(x, y) > 0) {
                        ++wn;
                    }
                }
            } else {
                if (edge.b.y <= y) {
                    if (edge.isLeft(x, y) < 0) {
                        --wn;
                    }
                }
            }
        }
        return wn;
    }*/

    contains(p: Vec2) {
        var c = false;

        for (var e of this.edges) {
            if (
                ((e.b.y > p.y) != (e.a.y > p.y))
                && (p.x < (e.a.x - e.b.x) * (p.y - e.b.y) / (e.a.y - e.b.y) + e.b.x)
            ) {
                c = !c;
            }
        }

        return c;
    }
}

export class NavMesh implements Graph {
    #polygons: NavPolygon[];
    #pointCache: { [key: string]: Vec2 };
    #edgeCache: { [key: string]: NavEdge };

    constructor() {
        this.#polygons = [];
        this.#pointCache = {};
        this.#edgeCache = {};
    }

    #addPoint(p: Vec2) {
        var point = this.#pointCache[`${p.x}_${p.y}`];
        if (point) {
            return point;
        }
        point = Vec2_clone(p);
        this.#pointCache[`${p.x}_${p.y}`] = point;
        return point;
    }

    #addEdge(edge: NavEdge): NavEdge {
        const key = `${edge.a.x}_${edge.a.y}-${edge.b.x}_${edge.b.y}`;
        this.#edgeCache[key] = edge;
        return edge;
    }

    #findEdge(a: Vec2, b: Vec2) {
        const key = `${a.x}_${a.y}-${b.x}_${b.y}`;
        return this.#edgeCache[key];
    }

    #findCommonEdge(a: NavPolygon, b: NavPolygon): NavEdge | null {
        for (var edge of a.edges) {
            const e = this.#findEdge(edge.b, edge.a);
            // TODO: Remove non-null assertion
            if (e && e.polygon.deref()!.id === b.id) {
                return e;
            }
        }
        return null;
    }
    get nodes(): number[] {
        return [...this.#polygons.keys()];
    }

    addPolygon(vertices: Vec2[]) {
        const polygon = new NavPolygon(this.#polygons.length);
        const edges = vertices.map((v, index) =>
            new NavEdge(v, vertices[(index + 1) % vertices.length]!, polygon)
        );
        polygon.edges = edges;
        this.#polygons.push(polygon);
        for (var edge of polygon.edges) {
            this.#addEdge(edge);
        }
        return polygon;
    }

    addRect(topleft: Vec2, size: Vec2) {
        const a = this.#addPoint(topleft);
        const b = this.#addPoint(Vec2_addC(topleft, size.x, 0));
        const c = this.#addPoint(Vec2_add(topleft, size));
        const d = this.#addPoint(Vec2_addC(topleft, 0, size.y));
        return this.addPolygon([a, b, c, d]);
    }

    #getLocation(p: Vec2): NavPolygon | null {
        for (var polygon of this.#polygons) {
            if (polygon.contains(p)) {
                return polygon;
            }
        }
        return null;
    }

    getNeighbors(index: number): number[] {
        const neighbors = [];
        for (var edge of this.#polygons[index]!.edges) {
            // Lookup polygons with reverse edge
            const pairEdge = this.#findEdge(edge.b, edge.a);
            if (pairEdge) {
                const pairPolygon = pairEdge.polygon.deref();
                if (pairPolygon) {
                    neighbors.push(pairPolygon.id);
                }
            }
        }
        return neighbors;
    }

    travelCost() {
        return 1;
    }

    goalHeuristic(indexA: number, indexB: number) {
        const a = this.#polygons[indexA]!;
        const b = this.#polygons[indexB]!;
        const x = a.centroid.x - b.centroid.x;
        const y = a.centroid.y - b.centroid.y;
        return sqrt(x * x + y * y);
    }

    getPath(start: number, goal: number): number[] {
        // Points are not within the navigation mesh
        if (start === undefined || goal === undefined) {
            return [];
        }

        // Same polygon
        if (start === goal) {
            return [start, goal];
        }

        return aStarSearch(this, start, goal);
    }

    /**
     * @param edges true=edges, false=centroids
     */
    getWaypointPath(start: Vec2, goal: Vec2, edges = false): Vec2[] {

        const startPolygon = this.#getLocation(start);
        const goalPolygon = this.#getLocation(goal);

        // Points are not within the navigation mesh
        if (startPolygon === undefined || goalPolygon === undefined) {
            return [];
        }

        // TODO: Remove non-null assertion
        const path = this.getPath(startPolygon!.id, goalPolygon!.id);

        // No path was found
        if (!path) {
            return [];
        }

        if (edges) {
            const edges = [];
            for (var i = 1; i < path.length; i++) {
                const p1 = this.#polygons[path[i - 1]!]!;
                const p2 = this.#polygons[path[i]!]!;
                const edge = this.#findCommonEdge(p1, p2);
                // TODO: Remove non-null assertion
                const mid = NavEdge_middle(edge!);
                edges.push(Vec2_add(mid, Vec2_scale_sv(Vec2_unit(Vec2_sub(p2.centroid, mid)), 4)));
            }
            return [start, ...edges, goal];
        }
        else {
            return [
                start,
                ...path.slice(1, -1).map(index =>
                    this.#polygons[index]!.centroid
                ),
                goal,
            ];
        }
    }
}
