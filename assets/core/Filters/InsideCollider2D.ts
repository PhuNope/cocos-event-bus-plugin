import { GameEvent } from '../GameEvent';
import { ISubscriberFilter } from '../ISubscriberFilter';
import { BindingInfo } from '../BindingInfo';
import { SubscriberFilterHelper } from './SubscriberFilterHelper';
import { Collider2D, Vec2 } from 'cc';

export class InsideCollider2D implements ISubscriberFilter {
    private _collider: Collider2D;

    constructor(collider: Collider2D) {
        this._collider = collider;
    }

    filter(originalEvent: GameEvent, bindings: BindingInfo[]): BindingInfo[] {
        const bounds = this._collider.worldAABB;
        return bindings.filter(b => {
            const subscriberNode = SubscriberFilterHelper.extractNode(b.subscriber);
            if (subscriberNode == null) return false;
            const pos = subscriberNode.worldPosition;
            return bounds.contains(new Vec2(pos.x, pos.y));
        });
    }

    toString(): string {
        return 'InsideCollider2D';
    }
}
