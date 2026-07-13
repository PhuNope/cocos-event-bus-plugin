import { _decorator, Component } from 'cc';
import { GameEvent } from '../core/GameEvent';
import { GameEventHub } from '../core/GameEventHub';
import { SubscriberPriority } from '../core/SubscriberPriority';

const { ccclass, property } = _decorator;

export type GameEventCallback = (event: GameEvent) => void;

@ccclass('GameEventHandlerComponent')
export class GameEventHandlerComponent extends Component {
    private _unsub: (() => void) | null = null;

    private _eventClass: { new(...args: any[]): GameEvent } | null = null;
    private _priority: SubscriberPriority = SubscriberPriority.Medium;
    private _callback: GameEventCallback | null = null;

    setEventClass(ctor: { new(...args: any[]): GameEvent }): void {
        this._eventClass = ctor;
    }

    setCallback(callback: GameEventCallback): void {
        this._callback = callback;
    }

    setPriority(priority: SubscriberPriority): void {
        this._priority = priority;
    }

    onEnable(): void {
        if (!this._eventClass || !this._callback) return;

        this._unsub = GameEventHub.listen(
            this._eventClass,
            this,
            (event: GameEvent) => {
                this._callback!(event);
            },
            this._priority
        );
    }

    onDisable(): void {
        this._unsub?.();
        this._unsub = null;
    }

    onDestroy(): void {
        this._unsub?.();
        this._unsub = null;
    }
}
