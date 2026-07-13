import { GameEvent } from '../core/GameEvent';
import { ISubscriberFilter } from '../core/ISubscriberFilter';

export class GameEventAsset {
    public gameEvent: GameEvent | null = null;
    public channel: string = '';
    public shared: boolean = false;
    public nonCancellable: boolean = false;
    public filters: ISubscriberFilter[] | null = null;

    initialize(gameEvent: GameEvent): void {
        this.gameEvent = gameEvent.copyEvent();
    }

    feedEventProperties(): void {
        if (!this.gameEvent) return;

        this.gameEvent.setChannel(this.channel);
        this.gameEvent.setEmitter(this);

        if (this.shared) {
            this.gameEvent.sharedFlag();
        } else {
            this.gameEvent.unique();
        }

        if (this.nonCancellable) {
            this.gameEvent.nonCancellableFlag();
        } else {
            this.gameEvent.cancellable();
        }

        this.gameEvent.withFilters(this.filters);
    }

    publish(emitter?: any): void {
        this.feedEventProperties();
        this.gameEvent!.publish(emitter ?? this);
    }

    toString(): string {
        return this.gameEvent?.constructor?.name ?? 'GameEventAsset';
    }
}
