import { GameEvent } from '../GameEvent';

export class OnObjectBoundToEventSystem extends GameEvent {
    public boundObject: any;
    public isStatic: boolean = false;

    constructor();
    constructor(boundObject: any, isStatic: boolean);
    constructor(boundObject?: any, isStatic?: boolean) {
        super();
        if (boundObject !== undefined) {
            this.boundObject = boundObject;
            this.isStatic = isStatic ?? false;
        }
    }

    toString(): string {
        return `${this.isStatic ? 'Static' : 'Dynamic'} ${this.boundObject?.constructor?.name ?? 'Unknown'} bound`;
    }
}
