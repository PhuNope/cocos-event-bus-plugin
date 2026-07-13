import { GameEvent } from '../GameEvent';
import { ISubscriberFilter } from '../ISubscriberFilter';
import { BindingInfo } from '../BindingInfo';
import { SubscriberFilterHelper } from './SubscriberFilterHelper';
import { Node } from 'cc';

export class OnlySelf implements ISubscriberFilter {
    public includeChildren: boolean = false;
    public includeParentDepth: number = 0;

    constructor();
    constructor(includeChildren: boolean);
    constructor(includeParentDepth: number);
    constructor(includeChildren: boolean, includeParentDepth: number);
    constructor(a?: boolean | number, b?: number) {
        if (typeof a === 'boolean') {
            this.includeChildren = a;
            if (typeof b === 'number') this.includeParentDepth = b;
        } else if (typeof a === 'number') {
            this.includeParentDepth = a;
        }
    }

    filter(originalEvent: GameEvent, bindings: BindingInfo[]): BindingInfo[] {
        const emitterNode = SubscriberFilterHelper.extractNode(originalEvent.emitter);

        if (emitterNode == null) {
            return bindings.filter(b => originalEvent.emitter === b.subscriber);
        }

        return bindings.filter(b => {
            const node = SubscriberFilterHelper.extractNode(b.subscriber);
            if (node == null) return false;

            if (this.includeChildren && this._isChildOf(node, emitterNode)) {
                return true;
            }

            if (this.includeParentDepth > 0 && this._isWithinParentDepth(node, emitterNode, this.includeParentDepth)) {
                return true;
            }

            return node === emitterNode;
        });
    }

    private _isChildOf(child: Node, parent: Node): boolean {
        if (!child || !parent) return false;
        let current = child.parent;
        while (current) {
            if (current === parent) return true;
            current = current.parent;
        }
        return false;
    }

    private _isWithinParentDepth(node: Node, emitter: Node, depth: number): boolean {
        if (!node || !emitter || depth <= 0) return false;
        let current = node.parent;
        let currentDepth = 0;
        while (current && currentDepth < depth) {
            if (current === emitter) return true;
            current = current.parent;
            currentDepth++;
        }
        return false;
    }

    toString(): string {
        return 'Only self';
    }
}
