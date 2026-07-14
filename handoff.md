# event-bus handoff

## Tổng quan
Cocos Creator 3.8 extension cung cấp event bus system với `GameEvent` base class, `GameEventHub` singleton, decorator-based subscription và `GameEventAsset` cho editor workflow.

## Key Architecture
- **`assets/core/GameEvent.ts`** — abstract base class cho tất cả events
- **`assets/core/GameEventHub.ts`** — singleton event bus (publish/listen/bind/unbind)
- **`assets/utilities/GameEventAsset.ts`** — serializable asset wrapper cho GameEvent (có `@ccclass('GameEventAsset')`, `@property className`)
- **`assets/utilities/PlaybackEvent.ts`** — example component dùng `GameEventAsset` làm property type
- **`assets/utilities/GameEventHandlerComponent.ts`** — component wrapper cho dynamic event handling

## Custom Inspector (vừa thêm)
- **`source/contributions/inspector/comp-game-event-asset.ts`** — custom inspector cho GameEventAsset
- **`source/contributions/inspector/comp-localized.ts`** — reference sample (cùng pattern)
- Đăng ký trong `package.json` tại `contributions.inspector.section.asset`

### Inspector Pattern
- Export: `template`, `$`, `update()`, `ready()`, `close()`
- Dùng `prop.updateCustomPropElements()` từ `source/utils/prop.js`
- Dropdown custom: intercept `p.key === "className"`, tạo `<ui-select>`, xử lý `confirm` event
- **UUID path cho `scene.set-property`:** `self.dump.value.node.value.uuid` (node UUID, KHÔNG phải component UUID)
- Property value trong dump: `{ type: "String", value: event.target.value }`

### Event Class Scanning
- `scanGameEventClasses()` trong inspector: walk `Editor.Project.path/assets/**/*.ts`
- Regex: `/export\s+class\s+(\w+)\s+extends\s+GameEvent/g`
- Dùng `fs.readdirSync` + `fs.readFileSync` (không cần external deps như `glob`)

## GameEvent Subclasses (trong package)
| Class | File |
|-------|------|
| `OnEventSystemStarted` | `assets/core/SystemEvents/OnEventSystemStarted.ts` |
| `OnEventRaised` | `assets/core/SystemEvents/OnEventRaised.ts` |
| `OnObjectBoundToEventSystem` | `assets/core/SystemEvents/OnObjectBoundToEventSystem.ts` |
| `OnObjectUnboundFromEventSystem` | `assets/core/SystemEvents/OnObjectUnboundFromEventSystem.ts` |

User-defined events trong Cocos project sẽ có file riêng; inspector scanner detect tất cả runtime.

## Troubleshooting History
1. **`Cannot find module 'glob'`** — xoá `require("glob")` không dùng trong inspector (module không có trong dependencies, gây crash extension → asset-db mount failure → cascading import errors)
2. **`Set property failed: [object Object] does not exist`** — đang dùng `self.dump.value.uuid` là component UUID object, không phải string
3. **`Set property failed: undefined does not exist`** — thử sai UUID paths (`_uuid`, fallback chain)
4. **Fix:** dùng `self.dump.value.node.value.uuid` (node UUID, giống `comp-localized.ts`)

## Asset-db Mount
Cấu hình trong `package.json` tại `contributions.asset-db.mount`:
- `path: "./assets"`, `readonly: true`
- Mount vào `db://event-bus/` (theo package name)
- Code manual mount trong `source/main.ts` `load()` đã bị **comment** (thay bằng declarative mount)

## Build
```bash
npm run build
# Output: dist/ (tsc compile source/ → dist/)
# tsconfig extends base.tsconfig.json, exclude assets/
```

## Project Structure (relevant)
```
source/
  main.ts                          — extension entry (load/unload)
  utils/prop.js                    — inspector utility library
  contributions/inspector/
    comp-localized.ts              — sample inspector (node component)
    comp-game-event-asset.ts       — GameEventAsset inspector (mới thêm)
assets/                            — mounted as db://event-bus/
  core/
    GameEvent.ts
    GameEventHub.ts
    GameEventHubComponent.ts
    SystemEvents/
      ...
  utilities/
    GameEventAsset.ts              — key file, có @property className
    GameEventHandlerComponent.ts
    PlaybackEvent.ts
@types/schema/package/             — JSON schema cho package.json
```
