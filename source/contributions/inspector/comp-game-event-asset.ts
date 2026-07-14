const prop = require("../../../source/utils/prop.js");

type Selector<$> = { $: Record<keyof $, any | null> } & {
    dump: any;
};

export const template = `<div class="autoProps"></div>`;

export const $ = {
    autoProps: ".autoProps",
};

function scanGameEventClasses(): string[] {
    const fs = require("fs");
    const path = require("path");

    const assetsPath = path.join(Editor.Project.path, "assets");
    const pattern = /export\s+class\s+(\w+)\s+extends\s+GameEvent/g;
    const classes: Set<string> = new Set();

    function walkDir(dir: string): void {
        let entries: string[];
        try {
            entries = fs.readdirSync(dir);
        } catch {
            return;
        }
        for (const entry of entries) {
            const full = path.join(dir, entry);
            let stat;
            try {
                stat = fs.statSync(full);
            } catch {
                continue;
            }
            if (stat.isDirectory()) {
                walkDir(full);
            } else if (entry.endsWith(".ts")) {
                try {
                    const content = fs.readFileSync(full, "utf8");
                    let match: RegExpExecArray | null;
                    while ((match = pattern.exec(content)) !== null) {
                        classes.add(match[1]);
                    }
                } catch {
                    // skip files that can't be read
                }
            }
        }
    }

    walkDir(assetsPath);
    return Array.from(classes).sort();
}

export function update(this: Selector<typeof $>, dump: any) {
    this.dump = dump;
    const self = this;

    prop.updateCustomPropElements(
        this.$.autoProps,
        [],
        dump,
        (element: any, p: any) => {
            if (p.key === "className") {
                const sel = element.querySelector(".eventClassSelect");
                if (sel) {
                    sel.value = p.dump.value;
                    return;
                }
                element.innerHTML = "";

                const label = document.createElement("ui-label");
                label.setAttribute("slot", "label");
                label.innerText = "Event Class";

                const select = document.createElement("ui-select");
                select.setAttribute("slot", "content");
                select.className = "eventClassSelect";
                const eventClasses = scanGameEventClasses();
                select.innerHTML = eventClasses.map(k =>
                    `<option value="${k}">${k}</option>`
                ).join("");
                (select as any).value = p.dump.value;

                select.addEventListener("confirm", async (event: any) => {
                    await Editor.Message.request("scene", "set-property", {
                        uuid: self.dump.value.node.value.uuid,
                        path: p.dump.path,
                        dump: { type: "String", value: event.target.value },
                    });
                    await Editor.Message.request("scene", "snapshot");
                });

                element.appendChild(label);
                element.appendChild(select);
            } else {
                element.render(p.dump);
            }
        }
    );
}

export function ready() {
}

export function close() {
}
