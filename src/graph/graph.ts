
export interface Graph {
    /* Returns the reachable neighbors of this location */
    getNeighbors(node: number): number[];
    /* Returns the cost to go from the node to its neighbor */
    travelCost(node: number, neighbor: number): number;
    /* Returns the cost to go from the node to the goal */
    goalHeuristic(node: number, goal: number): number;
    nodes: number[];
}
