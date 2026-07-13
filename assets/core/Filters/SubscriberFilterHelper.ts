import { Node } from 'cc';
import { Component } from 'cc';

export class SubscriberFilterHelper {
    static extractNode(obj: any): Node | null {
        if (obj instanceof Node) {
            return obj;
        }
        if (obj instanceof Component) {
            return obj.node;
        }
        return null;
    }

    static extractComponent(obj: any): Component | null {
        if (obj instanceof Component) {
            return obj;
        }
        return null;
    }

    static isComponent(obj: any): boolean {
        return obj instanceof Component;
    }

    static isNode(obj: any): boolean {
        return obj instanceof Node;
    }
}
