import { GameEvent } from '../GameEvent';
import { EventActorData } from './EventActorData';

export class OnEventRaised extends GameEvent {
    public emitter: EventActorData | null = null;
    public eventRaised: GameEvent | null = null;
    public subscribers: EventActorData[] = [];
    public subscribersCalledCount: number = 0;
    public totalSubscribersCount: number = 0;
    public subscribersCalledString: string = '';

    constructor();
    constructor(emitter: EventActorData, eventRaised: GameEvent, subscribers: EventActorData[], totalSubscribersCount: number);
    constructor(emitter?: EventActorData, eventRaised?: GameEvent, subscribers?: EventActorData[], totalSubscribersCount?: number) {
        super();
        if (emitter && eventRaised && subscribers) {
            this.emitter = emitter;
            this.eventRaised = eventRaised;
            this.subscribers = subscribers;
            this.subscribersCalledCount = this.subscribers?.length ?? 0;
            this.totalSubscribersCount = totalSubscribersCount ?? 0;
            this.formatSubscriberCallMessage();
        }
    }

    private formatSubscriberCallMessage(): void {
        if (this.subscribersCalledCount === 0 && this.totalSubscribersCount === 0) {
            this.subscribersCalledString = 'No subscribers';
        } else if (this.subscribersCalledCount !== this.totalSubscribersCount) {
            this.subscribersCalledString = `${this.subscribersCalledCount}/${this.totalSubscribersCount} subscriber(s) called`;
        } else {
            this.subscribersCalledString = `${this.subscribersCalledCount} subscribers called`;
        }
    }

    toString(): string {
        return `${this.eventRaised?.constructor?.name ?? 'Unknown'} raised`;
    }
}
