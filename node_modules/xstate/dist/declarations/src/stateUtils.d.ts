import { MachineSnapshot } from "./State.js";
import type { StateNode } from "./StateNode.js";
import { ActionArgs, AnyEventObject, AnyMachineSnapshot, AnyStateNode, AnyTransitionDefinition, DelayedTransitionDefinition, EventObject, ExecutableActionObject, InitialTransitionConfig, InitialTransitionDefinition, MachineContext, StateValue, TransitionDefinition, TODO, UnknownAction, ParameterizedObject, AnyTransitionConfig, AnyActorScope, MetaObject } from "./types.js";
type StateNodeIterable<TContext extends MachineContext, TE extends EventObject> = Iterable<StateNode<TContext, TE, any, any>>;
type AnyStateNodeIterable = StateNodeIterable<any, any>;
export declare function isAtomicStateNode(stateNode: AnyStateNode): boolean;
export declare function getProperAncestors(stateNode: AnyStateNode, toStateNode: AnyStateNode | undefined): Array<typeof stateNode>;
export declare function getAllStateNodes(stateNodes: Iterable<AnyStateNode>): Set<AnyStateNode>;
export declare function getStateValue(rootNode: AnyStateNode, stateNodes: AnyStateNodeIterable): StateValue;
export declare function isInFinalState(stateNodeSet: Set<AnyStateNode>, stateNode: AnyStateNode): boolean;
export declare const isStateId: (str: string) => boolean;
export declare function getCandidates<TEvent extends EventObject>(stateNode: StateNode<any, TEvent, any, any>, receivedEventType: TEvent['type']): Array<TransitionDefinition<any, TEvent, any>>;
/** All delayed transitions from the config. */
export declare function getDelayedTransitions(stateNode: AnyStateNode): Array<DelayedTransitionDefinition<MachineContext, EventObject, any>>;
export declare function formatTransition(stateNode: AnyStateNode, descriptor: string, transitionConfig: AnyTransitionConfig): AnyTransitionDefinition;
export declare function formatTransitions<TContext extends MachineContext, TEvent extends EventObject>(stateNode: AnyStateNode): Map<string, TransitionDefinition<TContext, TEvent, any>[]>;
/**
 * Collects route transitions from all descendants with explicit IDs. Called
 * once on the root node to avoid O(N²) repeated traversals.
 */
export declare function formatRouteTransitions(rootStateNode: AnyStateNode): void;
export declare function formatInitialTransition<TContext extends MachineContext, TEvent extends EventObject, TTransitionMeta extends MetaObject>(stateNode: StateNode<TContext, TEvent, any, TTransitionMeta>, _target: string | undefined | InitialTransitionConfig<TContext, TEvent, TODO, TODO, TODO, TODO, TODO, TTransitionMeta>): InitialTransitionDefinition<TContext, TEvent, TTransitionMeta>;
/**
 * Returns the relative state node from the given `statePath`, or throws.
 *
 * @param statePath The string or string array relative path to the state node.
 */
export declare function getStateNodeByPath(stateNode: AnyStateNode, statePath: string | string[]): AnyStateNode;
/**
 * Returns the state nodes represented by the current state value.
 *
 * @param stateValue The state value or State instance
 */
export declare function getStateNodes(stateNode: AnyStateNode, stateValue: StateValue): Array<AnyStateNode>;
export declare function transitionNode<TContext extends MachineContext, TEvent extends EventObject>(stateNode: AnyStateNode, stateValue: StateValue, snapshot: MachineSnapshot<TContext, TEvent, any, any, any, any, any, any>, event: TEvent): Array<TransitionDefinition<TContext, TEvent, any>> | undefined;
type Microstep = readonly [AnyMachineSnapshot, ExecutableActionObject[]];
export declare function initialMicrostep(root: AnyStateNode, preInitialState: AnyMachineSnapshot, actorScope: AnyActorScope, initEvent: AnyEventObject, internalQueue: AnyEventObject[]): Microstep;
export interface BuiltinAction {
    (): void;
    type: `xstate.${string}`;
    resolve: (actorScope: AnyActorScope, snapshot: AnyMachineSnapshot, actionArgs: ActionArgs<any, any, any>, actionParams: ParameterizedObject['params'] | undefined, action: unknown, extra: unknown) => [
        newState: AnyMachineSnapshot,
        params: unknown,
        actions?: UnknownAction[]
    ];
    retryResolve: (actorScope: AnyActorScope, snapshot: AnyMachineSnapshot, params: unknown) => void;
    execute: (actorScope: AnyActorScope, params: unknown) => void;
}
export declare function resolveActionsAndContext(currentSnapshot: AnyMachineSnapshot, event: AnyEventObject, actorScope: AnyActorScope, actions: UnknownAction[], internalQueue: AnyEventObject[], deferredActorIds: string[] | undefined): AnyMachineSnapshot;
export declare function macrostep(snapshot: AnyMachineSnapshot, event: EventObject, actorScope: AnyActorScope, internalQueue: AnyEventObject[]): {
    snapshot: typeof snapshot;
    microsteps: Microstep[];
};
/**
 * Resolves a partial state value with its full representation in the state
 * node's machine.
 *
 * @param stateValue The partial state value to resolve.
 */
export declare function resolveStateValue(rootNode: AnyStateNode, stateValue: StateValue): StateValue;
export {};
