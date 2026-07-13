const channelRegistry = new Map<Function, string>();

export function getDefaultChannel(target: Function): string | undefined {
    return channelRegistry.get(target);
}

export function DefaultChannel(channel: string): ClassDecorator {
    return function (target: any) {
        channelRegistry.set(target, channel);
    };
}
