import { isArray } from "lib0/array";
import { BinaryHeap } from "../BinaryHeap";
import { Graph } from "../graph";

const buildPath = (start: number, goal: number, cameFrom: Map<number, number>) => {
    const path = [];
    var node: number | undefined = goal;
    path.push(node);
    while (node !== start) {
        node = cameFrom.get(node);
        if (node == undefined) return null;
        path.push(node);
    }
    return path.reverse();
}

export const breadthFirstSearch = (
    graph: Graph,
    start: number,
    goal: number,
) => {
    var frontier = [];
    frontier.push(start);

    var cameFrom = new Map<number, number>();
    cameFrom.set(start, start);

    while (frontier.length) {
        var current = frontier.pop();

        if (current === goal) break;

        // TODO: Remove non-null assertion
        for (var next of graph.getNeighbors(current!)) {
            if (!cameFrom.get(next)) {
                frontier.push(next);
                // TODO: Remove non-null assertion
                cameFrom.set(next, current!);
            }
        }
    }
    return buildPath(start, goal, cameFrom);
}

export const dijkstraSearch = (
    graph: Graph,
    start: number,
    goal: number,
) => {
    interface CostNode {
        cost: number;
        node: number;
    }
    const frontier = new BinaryHeap<CostNode>((a, b) => a.cost < b.cost);
    frontier.insert({ cost: 0, node: start });

    const cameFrom = new Map<number, number>();
    cameFrom.set(start, start);
    const costSoFar = new Map<number, number>();
    costSoFar.set(start, 0);

    while (frontier.length) {
        const current = frontier.remove()?.node;

        if (current === goal) {
            break;
        }

        // TODO: Remove non-null assertion
        for (var next of graph.getNeighbors(current!)) {
            const newCost = (costSoFar.get(current!) || 0)
                + graph.travelCost(current!, next);
            if (
                !costSoFar.has(next)
                || newCost < costSoFar.get(next)!
            ) {
                costSoFar.set(next, newCost);
                frontier.insert({ cost: newCost, node: next });
                cameFrom.set(next, current!);
            }
        }
    }

    return buildPath(start, goal, cameFrom);
}

export const aStarSearch = (
    graph: Graph,
    start: number,
    goal: number,
): number[] => {
    interface CostNode {
        cost: number;
        node: number;
    }
    const frontier = new BinaryHeap<CostNode>((a, b) => a.cost < b.cost);
    frontier.insert({ cost: 0, node: start });

    const cameFrom = new Map<number, number>();
    cameFrom.set(start, start);
    const costSoFar = new Map<number, number>();
    costSoFar.set(start, 0);

    while (frontier.length) {
        const current = frontier.remove()?.node;

        if (current === goal) break;

        // TODO: Remove non-null assertion
        for (var next of graph.getNeighbors(current!)) {
            const newCost = (costSoFar.get(current!) || 0)
                + graph.travelCost(current!, next)
                + graph.goalHeuristic(next, goal);
            if (
                !costSoFar.has(next)
                || newCost < costSoFar.get(next)!
            ) {
                costSoFar.set(next, newCost);
                frontier.insert({ cost: newCost, node: next });
                cameFrom.set(next, current!);
            }
        }
    }

    // TODO: Remove non-null assertion
    return buildPath(start, goal, cameFrom)!;
}

export const floodFill = (
    graph: Graph,
    start: number | number[],
    predicate: (node: number) => boolean = () => true,
) => {
    const stack = isArray(start) ? start : [start];
    const fill: Set<number> = new Set();
    while (stack.length) {
        const node = stack.pop()!;
        if (!predicate(node)) continue;
        // Fill
        fill.add(node);
        for (var neighbor of graph.getNeighbors(node)) {
            // If not filled and fillable
            if (!fill.has(neighbor) && predicate(neighbor)) {
                // We need to look around nn later
                stack.push(neighbor);
            }
        }
    }
    return [...fill];
}

export const buildConnectivityMap = (graph: Graph) => {
    const map: Map<number, number> = new Map();
    var index = 0;
    for (var node of graph.nodes) {
        if (map.get(node) !== undefined) {
            // This node has been processed
            continue;
        }
        // Fill all connected nodes
        for (var fill of floodFill(graph, node)) {
            map.set(fill, index);
        }
        index++;
    }
    return map;
}
