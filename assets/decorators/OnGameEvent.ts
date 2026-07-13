import { SubscriberPriority } from '../core/SubscriberPriority';
import { GameEvent } from '../core/GameEvent';

export interface OnGameEventEntry {
    methodName: string;
    eventID?: { new(...args: any[]): GameEvent };
    priority: SubscriberPriority;
}

const registry = new Map<Function, OnGameEventEntry[]>();

export function getOnGameEventEntries(target: Function): OnGameEventEntry[] {
    return registry.get(target) ?? [];
}

export function OnGameEvent(
    eventID?: { new(...args: any[]): GameEvent },
    priority: SubscriberPriority = SubscriberPriority.High
): MethodDecorator {
    return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
        const ctor = target.constructor;
        if (!registry.has(ctor)) {
            registry.set(ctor, []);
        }
        registry.get(ctor)!.push({
            methodName: propertyKey as string,
            eventID,
            priority,
        });
    };
}
