import { GameEvent } from '../GameEvent';

export class OnObjectUnboundFromEventSystem extends GameEvent {
    public unboundObject: any;
    public isStatic: boolean = false;

    constructor();
    constructor(unboundObject: any, isStatic: boolean);
    constructor(unboundObject?: any, isStatic?: boolean) {
        super();
        if (unboundObject !== undefined) {
            this.unboundObject = unboundObject;
            this.isStatic = isStatic ?? false;
        }
    }

    toString(): string {
        return `${this.isStatic ? 'Static' : 'Dynamic'} ${this.unboundObject?.constructor?.name ?? 'Unknown'} unbound`;
    }
}
