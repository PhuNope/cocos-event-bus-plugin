import { _decorator } from 'cc';
import { GameEventAsset } from './GameEventAsset';

const { ccclass } = _decorator;
const property = _decorator.property as any;

@ccclass('PlaybackEvent')
export class PlaybackEvent {
    @property
    public playbackTime: number = 0;

    @property({ type: GameEventAsset })
    public associatedEvent: GameEventAsset | null = null;

    public lastTriggeredLoop: number = -1;
}
