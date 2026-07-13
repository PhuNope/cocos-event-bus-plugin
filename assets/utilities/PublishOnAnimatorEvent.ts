import { _decorator, Component, Animation } from 'cc';
import { PlaybackEvent } from './PlaybackEvent';

const { ccclass } = _decorator;
const property = _decorator.property as any;

const PLAYBACK_EPSILON = 0.05;

@ccclass('PublishOnAnimatorEvent')
export class PublishOnAnimatorEvent extends Component {
    @property({ type: [PlaybackEvent] })
    public playbackEvents: PlaybackEvent[] = [];

    private _animation: Animation | null = null;
    private _completedLoops: number = 0;

    onLoad(): void {
        this._animation = this.getComponent(Animation);
    }

    start(): void {
        if (this._animation) {
            this._animation.on(Animation.EventType.PLAY, this._onAnimationPlay, this);
        }
    }

    private _onAnimationPlay(): void {
        this._completedLoops = 0;
        for (const pe of this.playbackEvents) {
            pe.lastTriggeredLoop = -1;
        }
        this.schedule(this._checkPlayback, 0);
    }

    private _checkPlayback(): void {
        if (!this._animation) {
            this.unschedule(this._checkPlayback);
            return;
        }

        const state = this._animation.getState(this._animation.defaultClip?.name ?? '');
        if (!state || !state.isPlaying) {
            this.unschedule(this._checkPlayback);
            return;
        }

        const currentTime = state.current;
        const duration = state.duration;
        const normalizedTime = duration > 0 ? currentTime / duration : 0;
        const loops = Math.floor(normalizedTime);

        if (loops > this._completedLoops) {
            this._completedLoops = loops;
        }

        const phase = normalizedTime % 1;

        for (const pe of this.playbackEvents) {
            if (pe.lastTriggeredLoop === this._completedLoops) continue;
            if (Math.abs(phase - pe.playbackTime) <= PLAYBACK_EPSILON) {
                pe.associatedEvent?.publish(this.node);
                pe.lastTriggeredLoop = this._completedLoops;
            }
        }
    }

    onDestroy(): void {
        if (this._animation) {
            this._animation.off(Animation.EventType.PLAY, this._onAnimationPlay, this);
        }
        this.unschedule(this._checkPlayback);
    }
}
