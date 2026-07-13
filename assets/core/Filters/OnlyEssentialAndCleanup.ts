import { GameEvent } from '../GameEvent';
import { ISubscriberFilter } from '../ISubscriberFilter';
import { BindingInfo } from '../BindingInfo';

export class OnlyEssentialAndCleanup implements ISubscriberFilter {
    filter(originalEvent: GameEvent, bindings: BindingInfo[]): BindingInfo[] {
        return [];
    }

    toString(): string {
        return 'OnlyEssentialAndCleanup';
    }
}
