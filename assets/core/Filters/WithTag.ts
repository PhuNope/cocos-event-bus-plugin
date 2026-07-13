import { GameEvent } from '../GameEvent';
import { ISubscriberFilter } from '../ISubscriberFilter';
import { BindingInfo } from '../BindingInfo';
import { SubscriberFilterHelper } from './SubscriberFilterHelper';

export class WithTag implements ISubscriberFilter {
    private _tag: string;

    constructor(tag: string) {
        this._tag = tag;
    }

    filter(originalEvent: GameEvent, bindings: BindingInfo[]): BindingInfo[] {
        return bindings.filter(b => {
            const node = SubscriberFilterHelper.extractNode(b.subscriber);
            return node != null && node.name === this._tag;
        });
    }

    toString(): string {
        return `Only with tag ${this._tag}`;
    }
}
