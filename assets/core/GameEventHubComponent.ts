import { _decorator, Component } from 'cc';
import { GameEventHub } from './GameEventHub';

const { ccclass } = _decorator;
const property = _decorator.property as any;

@ccclass('GameEventHubComponent')
export class GameEventHubComponent extends Component {
    @property
    public triggerEventOnStart: boolean = true;

    @property
    public executionMsLimit: number = 50;

    onLoad(): void {
        const hub = GameEventHub.instance;
        hub.executionMsLimit = this.executionMsLimit;
        hub.triggerEventOnStart = this.triggerEventOnStart;
    }

    start(): void {
        GameEventHub.instance.ensureInitialized();
    }
}
