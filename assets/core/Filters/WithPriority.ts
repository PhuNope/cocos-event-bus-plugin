import { GameEvent } from '../GameEvent';
import { ISubscriberFilter } from '../ISubscriberFilter';
import { BindingInfo } from '../BindingInfo';
import { SubscriberPriority } from '../SubscriberPriority';
import { GameEventsHelper } from '../GameEventsHelper';

export class WithPriority implements ISubscriberFilter {
    private _priority: SubscriberPriority;

    constructor(priority: SubscriberPriority) {
        this._priority = priority;
    }

    filter(originalEvent: GameEvent, bindings: BindingInfo[]): BindingInfo[] {
        return bindings.filter(b => GameEventsHelper.getBindingPriority(b) === this._priority);
    }

    toString(): string {
        return `Only with priority: ${this._priority}`;
    }
}
