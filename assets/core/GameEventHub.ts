import { GameEvent } from './GameEvent';
import { SubscriberPriority } from './SubscriberPriority';
import { PropagationResult } from './PropagationResult';
import { GameEventsHelper } from './GameEventsHelper';
import { ISubscriberFilter } from './ISubscriberFilter';
import { getOnGameEventEntries } from '../decorators/OnGameEvent';
import { getDefaultChannel } from '../decorators/DefaultChannel';
import { OnEventRaised } from './SystemEvents/OnEventRaised';
import { EventActorData } from './SystemEvents/EventActorData';
import { OnEventSystemStarted } from './SystemEvents/OnEventSystemStarted';
import { OnObjectBoundToEventSystem } from './SystemEvents/OnObjectBoundToEventSystem';
import { OnObjectUnboundFromEventSystem } from './SystemEvents/OnObjectUnboundFromEventSystem';
import { OnlyEssentialAndCleanup } from './Filters/OnlyEssentialAndCleanup';
import { BindingInfo, DynamicSubscriberBindingInfo, StaticSubscriberBindingInfo } from './BindingInfo';

const PRIORITY_PHASE_ORDER = [
    SubscriberPriority.High,
    SubscriberPriority.Medium,
    SubscriberPriority.Low,
];

export { BindingInfo, DynamicSubscriberBindingInfo, StaticSubscriberBindingInfo };

export class GameEventHub {
    private static _instance: GameEventHub | null = null;
    private _bindingRegistry: Map<string, BindingInfo[]> = new Map();
    public executionMsLimit: number = 50;
    public triggerEventOnStart: boolean = true;

    static get instance(): GameEventHub {
        if (!GameEventHub._instance) {
            GameEventHub._instance = new GameEventHub();
        }
        return GameEventHub._instance;
    }

    static get isInitialized(): boolean {
        return GameEventHub._instance != null;
    }

    static get bindingRegistry(): Map<string, BindingInfo[]> {
        return GameEventHub._instance?._bindingRegistry ?? new Map();
    }

    static resetInstance(): void {
        GameEventHub._instance = null;
    }

    ensureInitialized(): void {
        if (!this.triggerEventOnStart) return;
        const evt = new OnEventSystemStarted() as GameEvent;
        this._raiseEvent(this, evt);
    }

    static publish<TEvent extends GameEvent>(emitter: any, gameEvent: TEvent): void {
        GameEventHub.instance._raiseEvent(emitter, gameEvent);
    }

    static publishDelayed<TEvent extends GameEvent>(emitter: any, gameEvent: TEvent, delayInSeconds: number): void {
        setTimeout(() => {
            GameEventHub.instance._raiseEvent(emitter, gameEvent);
        }, delayInSeconds * 1000);
    }

    static listen<TEvent extends GameEvent>(
        eventClass: { new(...args: any[]): TEvent },
        subscriber: any,
        action: (event: TEvent) => void,
        priority: SubscriberPriority = SubscriberPriority.Medium
    ): () => void {
        return GameEventHub.instance._listen(eventClass, subscriber, action as (event: any) => void, priority);
    }

    static bind(subscriber: any): void {
        GameEventHub.instance._bind(subscriber);
    }

    static unbind(subscriber: any): void {
        GameEventHub.instance._unbind(subscriber);
    }

    private _raiseEvent<TEvent extends GameEvent>(emitter: any, ogGameEvent: TEvent): void {
        if (emitter == null) {
            console.error('Emitter cannot be null. Please provide a valid object reference.');
            return;
        }

        const gameEvent = ogGameEvent.copyEvent();
        if (!gameEvent.channel) {
            const defaultChannel = getDefaultChannel(gameEvent.constructor as any);
            if (defaultChannel) {
                gameEvent.setChannel(defaultChannel);
            }
        }

        gameEvent.setEmitter(emitter);
        gameEvent.registerTimestamp();
        gameEvent.seal();

        this._cleanBindingRegistry(gameEvent);

        const eventKey = GameEventsHelper.getEventBindingKey(gameEvent);
        const subscribers = this._bindingRegistry.get(eventKey) ?? [];

        const startTime = Date.now();
        const subscribersCalled: any[] = [];

        const essentialResult = this._propagatePhase(gameEvent, subscribers, SubscriberPriority.Essential, false);
        subscribersCalled.push(...essentialResult.subscribersInvoked);

        if (!essentialResult.propagationStopped) {
            const filteredSubscribers = this._applyEventFilters(gameEvent, subscribers);

            for (const phase of PRIORITY_PHASE_ORDER) {
                const result = this._propagatePhase(gameEvent, filteredSubscribers, phase, true);
                subscribersCalled.push(...result.subscribersInvoked);
                if (result.propagationStopped) break;
            }
        }

        const cleanupResult = this._propagatePhase(gameEvent, subscribers, SubscriberPriority.Cleanup, false);
        subscribersCalled.push(...cleanupResult.subscribersInvoked);

        const elapsed = Date.now() - startTime;
        gameEvent.setExecutionTime(elapsed);
        gameEvent.setNumberOfInvocations(subscribersCalled.length);
        this._checkExecutionTime(gameEvent);

        if (emitter !== this) {
            this._notifyTools(subscribersCalled, gameEvent);
        }
    }

    private _propagatePhase(
        gameEvent: GameEvent,
        subscribers: BindingInfo[],
        priority: SubscriberPriority,
        breakIfCancelled: boolean
    ): PropagationResult {
        const result = new PropagationResult();
        const filtered = subscribers.filter(s => s.priority === priority);
        if (filtered.length === 0) return result;

        const phaseResult = this._propagate(gameEvent, filtered, breakIfCancelled);
        result.subscribersInvoked.push(...phaseResult.subscribersInvoked);

        if (breakIfCancelled && phaseResult.propagationStopped) {
            const canceller = phaseResult.subscribersInvoked[phaseResult.subscribersInvoked.length - 1];
            gameEvent.stopPropagation(canceller);
            result.propagationStopped = true;
        }

        return result;
    }

    private _propagate(
        gameEvent: GameEvent,
        subscribers: BindingInfo[],
        breakIfCancelled: boolean
    ): PropagationResult {
        const result = new PropagationResult();

        for (const sub of subscribers) {
            try {
                const evtForSub = gameEvent.shared ? gameEvent : gameEvent.copyEvent();
                result.subscribersInvoked.push(sub.subscriber);
                sub.invoke([evtForSub]);

                if (evtForSub.cancelled) {
                    result.propagationStopped = true;
                    if (breakIfCancelled) break;
                }
            } catch (e: any) {
                console.error(`Error invoking event on ${sub.subscriber}:`, e);
            }
        }

        return result;
    }

    private _checkExecutionTime(gameEvent: GameEvent): void {
        if (gameEvent.executionTime > this.executionMsLimit) {
            console.warn(
                `Event ${gameEvent.constructor.name} took ${gameEvent.executionTime}ms (${gameEvent.numberOfInvocations} invokes) to execute.`
            );
        }
    }

    private _applyEventFilters(gameEvent: GameEvent, bindings: BindingInfo[]): BindingInfo[] {
        let result = [...bindings];
        if (!gameEvent.filters) return result;

        for (const filter of gameEvent.filters) {
            if (!filter) continue;
            try {
                result = filter.filter(gameEvent, result);
            } catch (e: any) {
                console.error(`Error in filter ${filter.constructor.name}: ${e.message}`);
            }
        }

        return result;
    }

    private _cleanBindingRegistry(gameEvent: GameEvent): void {
        const eventKey = GameEventsHelper.getEventBindingKey(gameEvent);
        const bindings = this._bindingRegistry.get(eventKey);
        if (!bindings) return;

        const remaining = bindings.filter(b => b.subscriber != null);
        if (remaining.length === 0) {
            this._bindingRegistry.delete(eventKey);
        } else if (remaining.length < bindings.length) {
            this._bindingRegistry.set(eventKey, remaining);
        }
    }

    private _notifyTools(subscribers: any[], gameEvent: GameEvent): void {
        const emitter = gameEvent.emitter;
        const emitterActor = new EventActorData(emitter?.constructor?.name ?? 'Unknown', emitter);
        const subscriberActors = subscribers.map((s: any) => new EventActorData(
            s?.constructor?.name ?? 'Unknown', s
        ));

        const key = GameEventsHelper.getEventBindingKey(gameEvent);
        const totalCount = this._bindingRegistry.get(key)?.length ?? 0;
        const evt = new OnEventRaised(emitterActor, gameEvent, subscriberActors, totalCount) as GameEvent;
        evt.withFilter(new OnlyEssentialAndCleanup());
        evt.nonCancellableFlag();
        this._raiseEvent(this, evt);
    }

    private _listen<TEvent extends GameEvent>(
        eventClass: { new(...args: any[]): TEvent },
        subscriber: any,
        action: (event: any) => void,
        priority: SubscriberPriority
    ): () => void {
        const bindingKey = GameEventsHelper.getEventBindingKey(eventClass);
        const binding = new DynamicSubscriberBindingInfo(action, priority, subscriber, bindingKey);
        this._addBindingInfo(binding, subscriber);

        const boundEvt = new OnObjectBoundToEventSystem(subscriber, false) as GameEvent;
        boundEvt.withFilter(new OnlyEssentialAndCleanup());
        boundEvt.nonCancellableFlag();
        this._raiseEvent(this, boundEvt);

        return () => this._removeBindingInfo(binding);
    }

    private _bind(subscriber: any): void {
        const ctor = subscriber.constructor;
        const entries = getOnGameEventEntries(ctor);

        for (const entry of entries) {
            if (!entry.eventID) {
                console.warn(
                    `Method ${entry.methodName} on ${ctor?.name} has no eventID specified in @OnGameEvent decorator. Skipping.`
                );
                continue;
            }

            const bindingKey = GameEventsHelper.getEventBindingKey(entry.eventID);
            const method = subscriber[entry.methodName];
            if (typeof method !== 'function') {
                console.warn(`Method ${entry.methodName} not found on ${ctor?.name}. Skipping.`);
                continue;
            }

            const boundMethod = method.bind(subscriber);
            const hasParam = method.length > 0;
            const binding = new StaticSubscriberBindingInfo(boundMethod, entry.priority, subscriber, bindingKey, hasParam);

            if (!this._isAlreadyBound(binding)) {
                this._addBindingInfo(binding, subscriber);
            }
        }

        const boundEvt = new OnObjectBoundToEventSystem(subscriber, true) as GameEvent;
        boundEvt.withFilter(new OnlyEssentialAndCleanup());
        boundEvt.nonCancellableFlag();
        this._raiseEvent(this, boundEvt);
    }

    private _unbind(subscriber: any): void {
        let wasUnbound = false;

        for (const [key, bindings] of this._bindingRegistry.entries()) {
            const before = bindings.length;
            const remaining = bindings.filter(b => b.subscriber !== subscriber);

            if (remaining.length < before) {
                wasUnbound = true;
            }

            if (remaining.length === 0) {
                this._bindingRegistry.delete(key);
            } else {
                this._bindingRegistry.set(key, remaining);
            }
        }

        if (wasUnbound) {
            const unboundEvt = new OnObjectUnboundFromEventSystem(subscriber, true) as GameEvent;
            unboundEvt.withFilter(new OnlyEssentialAndCleanup());
            unboundEvt.nonCancellableFlag();
            this._raiseEvent(this, unboundEvt);
        }
    }

    private _removeBindingInfo(binding: BindingInfo): void {
        const list = this._bindingRegistry.get(binding.bindingKey);
        if (list) {
            const idx = list.indexOf(binding);
            if (idx >= 0) list.splice(idx, 1);
            if (list.length === 0) this._bindingRegistry.delete(binding.bindingKey);
        }

        const unboundEvt = new OnObjectUnboundFromEventSystem(binding.subscriber, false) as GameEvent;
        unboundEvt.withFilter(new OnlyEssentialAndCleanup());
        unboundEvt.nonCancellableFlag();
        this._raiseEvent(this, unboundEvt);
    }

    private _addBindingInfo(binding: BindingInfo, subscriber: any): void {
        if (!binding.bindingKey) {
            console.error(`Binding key is empty for subscriber ${subscriber?.constructor?.name}`);
            return;
        }

        if (this._bindingRegistry.has(binding.bindingKey)) {
            this._bindingRegistry.get(binding.bindingKey)!.push(binding);
        } else {
            this._bindingRegistry.set(binding.bindingKey, [binding]);
        }
    }

    private _isAlreadyBound(binding: BindingInfo): boolean {
        const list = this._bindingRegistry.get(binding.bindingKey);
        if (!list) return false;
        return list.some(
            b => b.subscriber === binding.subscriber &&
                b instanceof StaticSubscriberBindingInfo &&
                (b as StaticSubscriberBindingInfo).bindingKey === binding.bindingKey
        );
    }
}

GameEvent._registerHub(GameEventHub);
