import { GameEvent } from './GameEvent';
import { SubscriberPriority } from './SubscriberPriority';
import { BindingInfo } from './BindingInfo';

export class GameEventsHelper {
    static getEventBindingKey(eventOrType: GameEvent | { new(...args: any[]): GameEvent } | string): string {
        if (typeof eventOrType === 'string') {
            return eventOrType;
        }
        if (typeof eventOrType === 'function') {
            return eventOrType.name;
        }
        return eventOrType.constructor.name;
    }

    static getEventName(eventClass: { new(...args: any[]): GameEvent } | string): string {
        if (typeof eventClass === 'string') {
            return eventClass;
        }
        return eventClass.name;
    }

    static isSystemEvent(eventClass: { new(...args: any[]): GameEvent }): boolean {
        return !!(eventClass as any).__systemEvent;
    }

    static getBindingPriority(binding: BindingInfo): SubscriberPriority {
        return binding.priority;
    }
}
