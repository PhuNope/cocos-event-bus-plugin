import { GameEvent } from './GameEvent';
import { BindingInfo } from './BindingInfo';

export interface ISubscriberFilter {
    filter(originalEvent: GameEvent, bindings: BindingInfo[]): BindingInfo[];
}
