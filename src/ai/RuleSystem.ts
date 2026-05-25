import { max, min } from "lib0/math";

type Predicate = (system: RuleSystem) => boolean;
type Action = (system: RuleSystem) => void;

export abstract class Rule {
    #predicate: Predicate;
    sv: number;
    constructor(predicate: Predicate, salience: number) {
        this.#predicate = predicate;
        this.sv = salience;
    }

    // TODO: this is a useless wrapper
    check(system: RuleSystem): boolean {
        return this.#predicate(system);
    }

    abstract do(system: RuleSystem): void;
}

class ActionRule extends Rule {
    #action: Action;
    constructor(predicate: Predicate, action: Action, sortOrder: number) {
        super(predicate, sortOrder);
        this.#action = action;
    }

    do(system: RuleSystem): void {
        this.#action(system);
    }
}

class AssertRule extends Rule {
    #fact;
    #grade;
    constructor(
        predicate: Predicate,
        fact: string,
        grade: number,
        salience: number,
    ) {
        super(predicate, salience);
        this.#fact = fact;
        this.#grade = grade;
    }

    do(system: RuleSystem): void {
        system.assert(this.#fact, this.#grade);
    }
}

class RetractRule extends Rule {
    #fact;
    #grade;
    constructor(
        predicate: Predicate,
        fact: string,
        grade: number,
        salience: number,
    ) {
        super(predicate, salience);
        this.#fact = fact;
        this.#grade = grade;
    }

    do(system: RuleSystem) {
        system.retract(this.#fact, this.#grade);
    }
}

export class RuleSystem {
    // Rules to evaluate and execute
    #rules: Rule[] = [];
    // Asserted facts
    #facts = new Map<string, number>();

    /**
     * Adds a rule which runs an action if its predicate evaluates to true.
     * @param predicate - Predicate to evaluate. A function taking the system as parameter.
     * @param action - Action to execute. A function taking the system as parameter.
     * @param salience - Priority of the rule.
     */
    addRuleExecutingAction(
        predicate: Predicate,
        action: Action,
        salience: number = 0,
    ) {
        this.addRule(new ActionRule(predicate, action, salience));
    }

    /**
     * Add a rule which asserts a fact if its predicate evaluates to true.
     * @param predicate - Predicate to evaluate. A function taking the system as parameter.
     * @param fact - The fact to assert.
     * @param grade - The optional grade to use when asserting the fact.
     * @param salience - Priority of the rule.
     */
    addRuleAssertingFact(
        predicate: Predicate,
        fact: string,
        grade: number = 1,
        salience: number = 0,
    ) {
        this.addRule(new AssertRule(predicate, fact, grade, salience));
    }

    /**
     * Add a rule which retracts a fact if its predicate evaluates to true.
     * @param predicate - Predicate to evaluate. A function taking the system as parameter.
     * @param fact - The fact to retract.
     * @param grade - The optional grade to use when retracting the fact.
     * @param salience - Priority of the rule.
     */
    addRuleRetractingFact(
        predicate: Predicate,
        fact: string,
        grade: number = 1,
        salience: number = 0,
    ) {
        this.addRule(new RetractRule(predicate, fact, grade, salience));
    }

    /**
     * Add a custom rule.
     * @param rule - The rule to add.
     */
    addRule(rule: Rule) {
        this.#rules.push(rule);
    }

    /**
     * Removes all rules.
     */
    removeAllRules() {
        this.#rules.length = 0;
    }

    /**
     * Executes all rules for which the predicate evaluates to true.
     */
    execute() {
        this.#rules.sort((a, b) => a.sv - b.sv);
        for (var  rule of this.#rules) {
            if (rule.check(this)) {
                rule.do(this);
            }
        }
    }

    /**
     * Asserts a fact.
     * @param fact - The fact to assert.
     * @param grade - The optional grade to use.
     */
    assert(fact: string, grade: number = 1) {
        this.#facts.set(fact, min(1, this.#gradeForFact(fact) + grade));
    }

    /**
     * Retracts a fact.
     * @param fact - The fact to retract.
     * @param grade - The optional grade to use.
     */
    retract(fact: string, grade: number = 1) {
        this.#facts.set(fact, max(0, this.#gradeForFact(fact) - grade));
    }

    /**
     * Returns the grade for the specified fact.
     * @param fact - The fact to obtain the grade from.
     *
     * @returns The grade for the fact.
     */
    #gradeForFact(fact: string) {
        return this.#facts.get(fact) || 0;
    }

    /**
     * Resets the facts to empty state.
     */
    reset() {
        this.#facts.clear();
    }
}
