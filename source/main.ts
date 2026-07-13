// @ts-ignore
import packageJSON from "../package.json";

declare const Editor: any;

/**
 * @en
 * @zh 为扩展的主进程的注册方法
 */
export const methods: { [key: string]: (...any: any) => any } = {};

/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
export function load() {
    // try {
    //     if (Editor?.assetdb) {
    //         const path = require('path');
    //         const assetsPath = path.join(__dirname, '../assets');
    //         Editor.assetdb.mount(assetsPath, packageJSON.name, (err: any) => {
    //             if (err) {
    //                 console.error(`[event-bus] Failed to mount assets at db://${packageJSON.name}/:`, err.message);
    //             } else {
    //                 console.log(`[event-bus] Assets mounted at db://${packageJSON.name}/`);
    //             }
    //         });
    //     }
    // } catch (e) {
    //     console.error(`[event-bus] Error during load:`, e);
    // }
}

/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
export function unload() {
    // try {
    //     if (Editor?.assetdb) {
    //         Editor.assetdb.unmount(packageJSON.name);
    //         console.log(`[event-bus] Assets unmounted from db://${packageJSON.name}/`);
    //     }
    // } catch (e) {
    //     console.error(`[event-bus] Error during unload:`, e);
    // }
}
