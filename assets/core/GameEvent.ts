import { ISubscriberFilter } from './ISubscriberFilter';

type HubActions = {
    publish: (emitter: any, event: any) => void;
    publishDelayed: (emitter: any, event: any, delay: number) => void;
};

export abstract class GameEvent {
    private static _hub: HubActions | null = null;

    static _registerHub(hub: HubActions): void {
        GameEvent._hub = hub;
    }
    public channel: string = '';
    public emitter: any = null;
    public shared: boolean = false;
    public filters: ISubscriberFilter[] | null = null;
    public nonCancellable: boolean = false;
    public cancelledBy: any = null;
    public cancelled: boolean = false;
    public sealed_: boolean = false;
    public numberOfInvocations: number = 0;
    public executionTime: number = 0;
    public timestamp: number = 0;

    setChannel(channel: string): this {
        if (this.sealed_) {
            throw new Error('Channel cannot be changed on a sealed event.');
        }
        this.channel = channel;
        return this;
    }

    setEmitter(emitter: any): this {
        if (this.sealed_) {
            throw new Error('Cannot change properties on a sealed event.');
        }
        this.emitter = emitter;
        return this;
    }

    registerTimestamp(): this {
        if (this.sealed_) {
            throw new Error('Cannot change properties on a sealed event.');
        }
        this.timestamp = Date.now();
        return this;
    }

    cancellable(): this {
        if (this.sealed_) {
            throw new Error('Cannot change properties on a sealed event.');
        }
        this.nonCancellable = false;
        return this;
    }

    nonCancellableFlag(): this {
        if (this.sealed_) {
            throw new Error('Cannot change properties on a sealed event.');
        }
        this.nonCancellable = true;
        return this;
    }

    stopPropagation(canceller: any): void {
        if (this.nonCancellable) {
            console.warn(`${canceller?.toString()} attempted to cancel a non-cancellable event. Propagation will continue.`);
            return;
        }
        this.cancelled = true;
        this.cancelledBy = canceller;
    }

    sharedFlag(): this {
        if (this.sealed_) {
            throw new Error('Cannot change properties on a sealed event.');
        }
        this.shared = true;
        return this;
    }

    unique(): this {
        if (this.sealed_) {
            throw new Error('Cannot change properties on a sealed event.');
        }
        this.shared = false;
        return this;
    }

    withFilter(filter: ISubscriberFilter): this {
        if (this.sealed_) {
            throw new Error('Cannot change properties on a sealed event.');
        }
        if (!this.filters) {
            this.filters = [];
        }
        this.filters.push(filter);
        return this;
    }

    withFilters(filters: ISubscriberFilter[] | null): this {
        if (this.sealed_) {
            throw new Error('Cannot change properties on a sealed event.');
        }
        this.filters = filters;
        return this;
    }

    setNumberOfInvocations(count: number): this {
        this.numberOfInvocations = count;
        return this;
    }

    setExecutionTime(time: number): this {
        this.executionTime = time;
        return this;
    }

    seal(): this {
        this.sealed_ = true;
        return this;
    }

    publish(): void;
    publish(emitter: any): void;
    publish(emitter?: any): void {
        if (emitter !== undefined) {
            this.setEmitter(emitter);
        }
        if (this.emitter == null) {
            throw new Error('Emitter cannot be null.');
        }
        const hub = GameEvent._hub;
        if (!hub) throw new Error('GameEventHub not registered. Import GameEventHub first.');
        hub.publish(this.emitter, this);
    }

    publishDelayed(emitter: any, delay: number): void;
    publishDelayed(delay: number): void;
    publishDelayed(emitterOrDelay: any, delay?: number): void {
        if (delay === undefined) {
            delay = emitterOrDelay;
            if (this.emitter == null) {
                throw new Error('Emitter cannot be null.');
            }
            const hub = GameEvent._hub;
            if (!hub) throw new Error('GameEventHub not registered. Import GameEventHub first.');
            hub.publishDelayed(this.emitter, this, delay as number);
        } else {
            this.setEmitter(emitterOrDelay);
            const hub = GameEvent._hub;
            if (!hub) throw new Error('GameEventHub not registered. Import GameEventHub first.');
            hub.publishDelayed(emitterOrDelay, this, delay);
        }
    }

    copyEvent(): this {
        const copy = this.clone();
        copy.timestamp = Date.now();
        copy.cancelled = false;
        copy.cancelledBy = null;
        copy.numberOfInvocations = 0;
        copy.executionTime = 0;
        copy.sealed_ = false;
        return copy;
    }

    protected clone(): this {
        const cloned = Object.create(Object.getPrototypeOf(this));
        for (const key of Object.keys(this)) {
            const val = (this as any)[key];
            if (key === 'filters') {
                cloned.filters = val ? [...val] : null;
            } else if (Array.isArray(val)) {
                cloned[key] = [...val];
            } else {
                cloned[key] = val;
            }
        }
        return cloned;
    }
}
