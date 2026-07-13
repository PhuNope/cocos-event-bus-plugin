export function SystemEvent(): ClassDecorator {
    return function (target: any) {
        target.__systemEvent = true;
    };
}

export function isSystemEvent(target: Function): boolean {
    return (target as any).__systemEvent === true;
}
