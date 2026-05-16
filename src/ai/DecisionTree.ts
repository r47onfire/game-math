import { add, log2 } from "lib0/math";
import { values } from "lib0/object";
import { Random_floatBelow, RandomSource } from "../random";
type Predicate = (value: any) => boolean;

export class DecisionNode {
    #attribute: string;
    #children: DecisionNode[] = [];
    #totalWeight = 0;
    constructor(attribute: string) {
        this.#attribute = attribute;
    }

    addValueNode(value: any, attribute: string): DecisionNode {
        const node = new ByValueDecisionNode(value, attribute);
        this.#children.push(node);
        return node;
    }

    addPredicateNode(predicate: Predicate, attribute: string): DecisionNode {
        const node = new ByPredicateDecisionNode(predicate, attribute);
        this.#children.push(node);
        return node;
    }

    addWeightNode(weight: any, attribute: string): DecisionNode {
        if (weight === 0) {
            throw new Error("Weighted nodes cannot have 0 probability");
        }
        if (this.#children.length > 0 && this.#totalWeight == 0) {
            throw new Error("Weighted nodes cannot be mixed with other nodes");
        }
        const node = new WeightedDecisionNode(weight, attribute);
        this.#children.push(node);
        this.#totalWeight += weight;
        return node;
    }

    evaluate(answers: any, random: RandomSource): string {
        if (this.#children.length === 0) {
            return this.#attribute;
        }
        else {
            // We need to pick a random node
            if (this.#totalWeight) {
                const dice = Random_floatBelow(random, this.#totalWeight);
                var sum = 0;
                for (var node of this.#children) {
                    sum += (node as WeightedDecisionNode).weight;
                    if (dice < sum) {
                        return node.evaluate(answers, random);
                    }
                }
            }
            // We need to evaluate until a node asserts true
            else {
                const value = answers[this.#attribute];
                for (var node of this.#children) {
                    if (node.assert(value)) {
                        return node.evaluate(answers, random);
                    }
                }
            }
        }
        throw new Error("Corrupted decision tree");
    }

    assert(value: any): boolean {
        return false;
    }
}

class ByValueDecisionNode extends DecisionNode {
    #value: any;

    constructor(value: any, attribute: string) {
        super(attribute);
        this.#value = value;
    }

    assert(value: any): boolean {
        return this.#value == value;
    }
}

class ByPredicateDecisionNode extends DecisionNode {
    #predicate: Predicate;

    constructor(predicate: Predicate, attribute: string) {
        super(attribute);
        this.#predicate = predicate;
    }

    assert(value: any): boolean {
        return this.#predicate(value);
    }
}

class WeightedDecisionNode extends DecisionNode {
    weight: number;

    constructor(weight: number, attribute: string) {
        super(attribute);
        this.weight = weight;
    }

    assert(value: any): boolean {
        return false;
    }
}

const sum = (values: number[]) => {
    return values.reduce(add, 0);
}

const distinct = (values: any[]) => {
    return [...new Set(values)];
}

const entropy = (outcomes: boolean[]) => {
    var positive = 0;
    for (var outcome of outcomes) {
        if (outcome) {
            positive++;
        }
    }
    const negative = (outcomes.length - positive) / outcomes.length;
    positive = positive / outcomes.length;
    return -(positive * (positive ? log2(positive) : 0)
        + negative * (negative ? log2(negative) : 0));
}

const gain = (values_: any[], outcomes: boolean[]) => {
    const splitByAttribute: Record<string, boolean[]> = {};
    for (var i = 0; i < values_.length; i++) {
        const value = values_[i];
        (splitByAttribute[value] ??= []).push(outcomes[i]!);
    }
    return entropy(outcomes) - sum(values(splitByAttribute).map(o => entropy(o) * o.length / outcomes.length));
}

export class DecisionTree {
    root: DecisionNode;

    constructor(attribute: string) {
        this.root = new DecisionNode(attribute);
    }

    evaluate(answers: any, random: RandomSource): string {
        return this.root.evaluate(answers, random);
    }
}

/**
 * Computes a decision tree from example data
 * @param data - Example data, a list of columns, where each column contains values for an attribute in attributes.
 * @param attributes - The names of the columns.
 * @param outcomes - The outcomes for each row.
 */
export const DecisionTree_fromExamples = (
    data: any[][],
    attributes: string[],
    outcomes: boolean[],
) => {
    const indexOfAttributeToSplitOn = (
        data: any[][],
        attributes: string[],
        outcomes: boolean[],
    ) => {
        const gains = attributes.map((_, index) =>
            gain(data[index]!, outcomes)
        );
        const maxGain = Math.max(...gains);
        const index = gains.indexOf(maxGain);
        return index;
    }
    const createBranches = (
        node: DecisionNode,
        data: any[][],
        attributes: string[],
        outcomes: boolean[],
        index: number,
    ) => {
        const attributeColumn = data[index]!;
        const values = distinct(attributeColumn);
        // Remove the attribute column
        const a = attributes.filter((_, i) => i != index);
        data = data.filter((_, i) => i != index);
        // Create a branch for each possible value of the attribute
        for (var value of values) {
            // Only filter the outcome for now, if the entropy is small, we will create a leaf
            const o = outcomes.filter((_, index) => attributeColumn[index] === value);
            if (entropy(o) === 0) { // Or very small??
                // Leaf
                node.addValueNode(value, o[0] ? "true" : "false");
            }
            else {
                // Branch
                const d = data.map(column =>
                    column.filter((_, index) => attributeColumn[index] === value)
                );
                // Split on the attribute with the most information gain
                const index = indexOfAttributeToSplitOn(d, a, o);
                const n = node.addValueNode(value, attributes[index]!);
                createBranches(n, d, a, o, index);
            }
        }
    }
    // Split on the attribute with the most information gain
    const index = indexOfAttributeToSplitOn(data, attributes, outcomes);
    const tree = new DecisionTree(attributes[index]!);
    createBranches(tree.root, data, attributes, outcomes, index);
    return tree;
}