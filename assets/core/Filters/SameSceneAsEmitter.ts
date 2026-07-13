import { GameEvent } from '../GameEvent';
import { ISubscriberFilter } from '../ISubscriberFilter';
import { BindingInfo } from '../BindingInfo';
import { SubscriberFilterHelper } from './SubscriberFilterHelper';

export class SameSceneAsEmitter implements ISubscriberFilter {
    filter(originalEvent: GameEvent, bindings: BindingInfo[]): BindingInfo[] {
        const emitterNode = SubscriberFilterHelper.extractNode(originalEvent.emitter);
        if (emitterNode == null) {
            return bindings;
        }

        const emitterScene = emitterNode.scene;
        return bindings.filter(b => {
            const subscriberNode = SubscriberFilterHelper.extractNode(b.subscriber);
            return subscriberNode != null && subscriberNode.scene === emitterScene;
        });
    }

    toString(): string {
        return 'Only in the same scene as the emitter';
    }
}
