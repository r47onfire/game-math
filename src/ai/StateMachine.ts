type EnterCallback = (sm: StateMachine, previous: string) => void;
type WhileInStateCallback = (sm: StateMachine, current: string) => void;
type ExitCallback = (sm: StateMachine, next: string) => void;
type TransitionCallback = (sm: StateMachine, from: string, to: string) => void;

class State {
    trs: Record<string, TransitionCallback> = {};
    enter?: EnterCallback;
    update?: WhileInStateCallback;
    draw?: WhileInStateCallback;
    exit?: ExitCallback;
    constructor(public name: string) {
    }
}

/**
 * A finite state machine
 */
export class StateMachine {
    #stateMap: Record<string, State> = {};
    #currentState: State | undefined;

    /**
     * Create a machine given the states and initial state
     * @param states - The states the machine can be in
     * @param initialState - The initial state it will enter if given
     */
    constructor(states: string[]) {
        states.forEach(name => {
            this.#stateMap[name] = new State(name);
        });
    }

    /**
     * Make the machine enter a state
     * @param name - The new state
     */
    enterState(name: string) {
        const oldStateName = this.#currentState?.name || "";

        // Exit old state
        this.#currentState?.exit?.(this, name);
        this.#currentState?.trs[name]?.(this, oldStateName, name);

        // Enter new state
        this.#currentState = this.#stateMap[name];
        this.#currentState!.enter?.(this, oldStateName);
    }

    didUpdate() {
        const state = this.#currentState;
        if (!state) return;
        state.update?.(this, state.name);
    }

    didDraw() {
        const state = this.#currentState;
        if (!state) return;
        state.draw?.(this, state.name);
    }

    /**
     * Set a callback for when the machine enters a state
     * @param name - The state
     * @param cb - The callback
     */
    onStateEnter(name: string, cb: EnterCallback) {
        const state = this.#stateMap[name];
        if (state) {
            state.enter = cb;
        }
    }

    /**
     * Set a callback for when the machine updates while in a state
     * @param name - The state
     * @param cb - The callback
     */
    onStateUpdate(name: string, cb: WhileInStateCallback) {
        const state = this.#stateMap[name];
        if (state) {
            state.update = cb;
        }
    }

    /**
     * Set a callback for when the machine draws while in a state
     * @param name - The state
     * @param cb - The callback
     */
    onStateDraw(name: string, cb: WhileInStateCallback) {
        const state = this.#stateMap[name];
        if (state) {
            state.draw = cb;
        }
    }

    /**
     * Set a callback for when the machine exits a state
     * @param name - The state
     * @param cb - The callback
     */
    onStateExit(name: string, cb: ExitCallback) {
        const state = this.#stateMap[name];
        if (state) {
            state.exit = cb;
        }
    }

    /**
     * Set a callback for when the machine transitions from one state to the other state
     * @param from - The state which is exited
     * @param to - The state which is entered
     * @param cb - The callback
     */
    onStateTransition(from: string, to: string, cb: TransitionCallback) {
        const state = this.#stateMap[from];
        if (state) {
            state.trs[to] = cb;
        }
    }
}
