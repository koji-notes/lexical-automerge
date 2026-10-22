import type { StateMachine } from "./StateMachine.js";
import type { DelayedTransitionDefinition, EventObject, InitialTransitionDefinition, InvokeDefinition, MachineContext, Mapper, StateNodeConfig, StateNodeDefinition, StateNodesConfig, TransitionDefinition, TransitionDefinitionMap, TODO, UnknownAction, ParameterizedObject, AnyStateMachine, ProvidedActor, NonReducibleUnknown, EventDescriptor, MetaObject } from "./types.js";
interface StateNodeOptions<TContext extends MachineContext, TEvent extends EventObject, TStateMeta extends MetaObject, TTransitionMeta extends MetaObject> {
    _key: string;
    _parent?: StateNode<TContext, TEvent, TStateMeta, TTransitionMeta>;
    _machine: AnyStateMachine;
}
export declare class StateNode<TContext extends MachineContext = MachineContext, TEvent extends EventObject = EventObject, TStateMeta extends MetaObject = MetaObject, TTransitionMeta extends MetaObject = TStateMeta> {
    /** The raw config used to create the machine. */
    config: StateNodeConfig<TContext, TEvent, TODO, // actors
    TODO, // actions
    TODO, // guards
    TODO, // delays
    TODO, // tags
    TODO, // output
    TODO, // emitted
    TStateMeta, TTransitionMeta>;
    /**
     * The relative key of the state node, which represents its location in the
     * overall state value.
     */
    key: string;
    /** The unique ID of the state node. */
    id: string;
    /**
     * The type of this state node:
     *
     * - `'atomic'` - no child state nodes
     * - `'compound'` - nested child state nodes (XOR)
     * - `'parallel'` - orthogonal nested child state nodes (AND)
     * - `'history'` - history state node
     * - `'final'` - final state node
     */
    type: 'atomic' | 'compound' | 'parallel' | 'final' | 'history';
    /** The string path from the root machine node to this node. */
    path: string[];
    /** The child state nodes. */
    states: StateNodesConfig<TContext, TEvent, TStateMeta, TTransitionMeta>;
    /**
     * The type of history on this state node. Can be:
     *
     * - `'shallow'` - recalls only top-level historical state value
     * - `'deep'` - recalls historical state value at all levels
     */
    history: false | 'shallow' | 'deep';
    /** The action(s) to be executed upon entering the state node. */
    entry: UnknownAction[];
    /** The action(s) to be executed upon exiting the state node. */
    exit: UnknownAction[];
    /** The parent state node. */
    parent?: StateNode<TContext, TEvent, TStateMeta, TTransitionMeta>;
    /** The root machine node. */
    machine: StateMachine<TContext, TEvent, any, // children
    any, // actor
    any, // action
    any, // guard
    any, // delay
    any, // state value
    any, // tag
    any, // input
    any, // output
    any, // emitted
    TStateMeta, any, // state schema
    TTransitionMeta>;
    /**
     * The meta data associated with this state node, which will be returned in
     * State instances.
     */
    meta?: TStateMeta;
    /**
     * The output data sent with the "xstate.done.state._id_" event if this is a
     * final state node.
     */
    output?: Mapper<MachineContext, EventObject, unknown, EventObject> | NonReducibleUnknown;
    /**
     * The order this state node appears. Corresponds to the implicit document
     * order.
     */
    order: number;
    description?: string;
    tags: string[];
    transitions: Map<string, TransitionDefinition<TContext, TEvent, TTransitionMeta>[]>;
    always?: Array<TransitionDefinition<TContext, TEvent, TTransitionMeta>>;
    constructor(
    /** The raw config used to create the machine. */
    config: StateNodeConfig<TContext, TEvent, TODO, // actors
    TODO, // actions
    TODO, // guards
    TODO, // delays
    TODO, // tags
    TODO, // output
    TODO, // emitted
    TStateMeta, TTransitionMeta>, options: StateNodeOptions<TContext, TEvent, TStateMeta, TTransitionMeta>);
    /** The well-structured state node definition. */
    get definition(): StateNodeDefinition<TContext, TEvent, TStateMeta, TTransitionMeta>;
    /** The logic invoked as actors by this state node. */
    get invoke(): Array<InvokeDefinition<TContext, TEvent, ProvidedActor, ParameterizedObject, ParameterizedObject, string, TODO, // TEmitted
    TTransitionMeta>>;
    /** The mapping of events to transitions. */
    get on(): TransitionDefinitionMap<TContext, TEvent, TTransitionMeta>;
    get after(): Array<DelayedTransitionDefinition<TContext, TEvent, TTransitionMeta>>;
    get initial(): InitialTransitionDefinition<TContext, TEvent, TTransitionMeta>;
    /** All the event types accepted by this state node and its descendants. */
    get events(): Array<EventDescriptor<TEvent>>;
    /**
     * All the events that have transitions directly from this state node.
     *
     * Excludes any inert events.
     */
    get ownEvents(): Array<EventDescriptor<TEvent>>;
}
export {};
