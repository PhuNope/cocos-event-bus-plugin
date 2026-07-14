import { _decorator, Component, EventHandler, js } from "cc";
import { GameEventHub } from "../core/GameEventHub";

const { ccclass, property } = _decorator;

@ccclass("GameEventAsset")
export class GameEventAsset extends Component {
    @property
    public className: string = "";

    @property({ type: [EventHandler] })
    private eventHandlers: [EventHandler] = [];

    private unsub: () => void;

    protected onEnable() {
        const classCon = js.getClassByName(this.className);

        if (!classCon) {
            console.log(`Cant find class ${this.className}`);
            return;
        }

        this.unsub = GameEventHub.listen(classCon as any, this, event => {
            EventHandler.emitEvents(this.eventHandlers, event);
        });
    }

    protected onDisable() {
        this.unsub?.();
    }
}
