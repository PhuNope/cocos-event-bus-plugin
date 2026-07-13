import { SubscriberPriority } from './SubscriberPriority';

export abstract class BindingInfo {
    public bindingKey: string = '';
    public priority: SubscriberPriority = SubscriberPriority.Medium;
    public subscriber: any;

    constructor(subscriber: any) {
        this.subscriber = subscriber;
    }

    abstract invoke(args?: any[]): void;
}

export class DynamicSubscriberBindingInfo extends BindingInfo {
    private _action: (...args: any[]) => void;

    constructor(action: (...args: any[]) => void, priority: SubscriberPriority, subscriber: any, bindingKey: string) {
        super(subscriber);
        this._action = action;
        this.priority = priority;
        this.bindingKey = bindingKey;
    }

    invoke(args?: any[]): void {
        if (args && args.length >= 1) {
            this._action(args[0]);
        } else {
            this._action();
        }
    }
}

export class StaticSubscriberBindingInfo extends BindingInfo {
    private _method: (...args: any[]) => void;
    private _hasParam: boolean;

    constructor(
        method: (...args: any[]) => void,
        priority: SubscriberPriority,
        subscriber: any,
        bindingKey: string,
        hasParam: boolean
    ) {
        super(subscriber);
        this._method = method;
        this.priority = priority;
        this.bindingKey = bindingKey;
        this._hasParam = hasParam;
    }

    invoke(args?: any[]): void {
        if (this._hasParam && args && args.length >= 1) {
            this._method.call(this.subscriber, args[0]);
        } else {
            this._method.call(this.subscriber);
        }
    }
}
