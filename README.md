# Cocos Event Bus

[![Cocos Creator](https://img.shields.io/badge/Cocos%20Creator-%E2%89%A53.8.2-8A2BE2)](https://www.cocos.com/creator)
[![TypeScript](https://img.shields.io/badge/TypeScript-%E2%89%A56.0.3-3178C6)](https://www.typescriptlang.org/)

**Cocos Event Bus** là một event bus system cho **Cocos Creator (>= 3.8.2)**, cung cấp cơ chế publish/subscribe linh hoạt để giao tiếp giữa các Component, Node, và toàn bộ scene trong game. Plugin này được mount tại `db://event-bus/` sau khi cài đặt và enable trong extensions.

---

## Mục lục

- [Tính năng](#tính-năng)
- [Cài đặt](#cài-đặt)
- [Yêu cầu](#yêu-cầu)
- [Sử dụng cơ bản](#sử-dụng-cơ-bản)
  - [1. Định nghĩa một Event](#1-định-nghĩa-một-event)
  - [2. Publish Event](#2-publish-event)
  - [3. Subscribe với Decorator (`@OnGameEvent`)](#3-subscribe-với-decorator-ongameevent)
  - [4. Subscribe động với `GameEventHub.listen()`](#4-subscribe-động-với-gameeventhublisten)
  - [5. Component `GameEventHandlerComponent`](#5-component-gameeventhandlercomponent)
- [Subscriber Priority](#subscriber-priority)
- [Channel](#channel)
- [Event Cancellation](#event-cancellation)
- [Shared Events](#shared-events)
- [Subscriber Filters](#subscriber-filters)
  - [OnlySelf](#onlyself)
  - [SameSceneAsEmitter](#samesceneasemitter)
  - [WithTag](#withtag)
  - [WithPriority](#withpriority)
  - [InsideCollider2D](#insidecollider2d)
- [System Events](#system-events)
  - [OnEventSystemStarted](#oneventsystemstarted)
  - [OnEventRaised](#oneventraised)
  - [OnObjectBoundToEventSystem / OnObjectUnboundFromEventSystem](#onobjectboundtoeventsystem--onobjectunboundfromeventsystem)
- [Utilities](#utilities)
  - [GameEventHubComponent](#gameeventhubcomponent)
  - [GameEventAsset](#gameeventasset)
  - [PublishOnAnimatorEvent](#publishonaniatorevent)
  - [PlaybackEvent](#playbackevent)
- [API Reference](#api-reference)
  - [GameEventHub (Static Methods)](#gameeventhub-static-methods)
  - [GameEvent (Instance Methods)](#gameevent-instance-methods)
  - [SubscriberPriority](#subscriberpriority-1)
  - [Decorators](#decorators)
- [Cấu trúc thư mục](#cấu-trúc-thư-mục)
- [Development](#development)

---

## Tính năng

- **Singleton Event Bus** — `GameEventHub` quản lý tất cả subscriber và event propagation tập trung
- **Priority-based Propagation** — Event được gửi theo thứ tự: Essential → High → Medium → Low → Cleanup
- **Event Cancellation** — Bất kỳ subscriber nào (Essential hoặc High/Medium/Low) cũng có thể dừng propagation
- **Channel** — Event có thể định tuyến qua các channel khác nhau, với `@DefaultChannel` decorator
- **Subscriber Filters** — Chỉ gọi những subscriber thỏa điều kiện (ví dụ: cùng node, cùng scene, cùng tag, nằm trong collider)
- **Decorator-driven Binding** — Dùng `@OnGameEvent` để tự động bind method vào event, `GameEventHub.bind()` làm phần còn lại
- **Dynamic Binding** — `GameEventHub.listen()` cho phép subscribe/unsubscribe linh hoạt trong runtime
- **Copy-on-Write** — Event mặc định được copy trước khi gửi đến từng subscriber để tránh side effect
- **Shared Events** — Option để dùng chung một instance cho tất cả subscriber (tăng performance nếu không cần isolation)
- **Execution Time Tracking** — Tự động warning nếu event propagation vượt quá ngưỡng thời gian (mặc định 50ms)
- **System Events** — Event bus tự emit các system event để phục vụ debugging, tooling, logging
- **ScriptableObject-style Event Assets** — `GameEventAsset` cho phép tạo và cấu hình event từ Editor Inspector
- **Animation-triggered Events** — `PublishOnAnimatorEvent` cho phép publish event tại các thời điểm cụ thể trong animation
- **Inspector tùy chỉnh** — Extension đi kèm hỗ trợ component `LocalizedText` với dropdown chọn key i18n

---

## Cài đặt

```bash
# Clone hoặc copy thư mục extension vào project Cocos Creator
# {project}/extensions/event-bus/

# Cài đặt dependencies
npm install

# Build extension (TypeScript compile)
npm run build
```

Sau đó:
1. Mở Cocos Creator
2. Vào **Extensions → Extension Manager**
3. Enable **event-bus**
4. Restart editor nếu cần

Sau khi enable, thư mục `assets/` của plugin được mount tại `db://event-bus/`. Bạn có thể import các module từ đường dẫn này:

```typescript
import { GameEvent } from "db://event-bus/core/GameEvent";
import { GameEventHub } from "db://event-bus/core/GameEventHub";
```

---

## Yêu cầu

| Package | Version |
|---------|---------|
| Cocos Creator | >= 3.8.2 |
| Node.js | >= 12 |
| TypeScript | >= 6.0.3 |

---

## Sử dụng cơ bản

### 1. Định nghĩa một Event

Tất cả event phải kế thừa từ class `GameEvent`:

```typescript
// assets/scripts/events/PlayerDiedEvent.ts
import { GameEvent } from "db://event-bus/core/GameEvent";

export class PlayerDiedEvent extends GameEvent {
    constructor(
        public killerId: number,
        public killerName: string,
        public damage: number
    ) {
        super();
    }
}
```

Với Channel:

```typescript
import { GameEvent } from "db://event-bus/core/GameEvent";

export class PlayerJoinedEvent extends GameEvent {
    constructor(public playerId: number) {
        super();
        this.channel = "multiplayer";
    }
}
```

### 2. Publish Event

Có ba cách để publish một event:

**Cách 1 — Dùng `GameEventHub.publish()`:**

```typescript
import { GameEventHub } from "db://event-bus/core/GameEventHub";
import { PlayerDiedEvent } from "./events/PlayerDiedEvent";

const event = new PlayerDiedEvent(42, "Boss", 100);
GameEventHub.publish(this.node, event);
```

**Cách 2 — Dùng method `.publish()` trên event instance:**

```typescript
const event = new PlayerDiedEvent(42, "Boss", 100);
event.publish(this.node);
```

**Cách 3 — Publish delayed:**

```typescript
// Publish sau 2 giây
GameEventHub.publishDelayed(this.node, event, 2.0);

// hoặc
event.publishDelayed(this.node, 2.0);
```

### 3. Subscribe với Decorator (`@OnGameEvent`)

Đây là cách subscribe gọn gàng, khai báo — thích hợp cho Component.

```typescript
import { _decorator, Component, Node } from "cc";
import { OnGameEvent } from "db://event-bus/decorators/OnGameEvent";
import { GameEventHub } from "db://event-bus/core/GameEventHub";
import { SubscriberPriority } from "db://event-bus/core/SubscriberPriority";
import { PlayerDiedEvent } from "./events/PlayerDiedEvent";

const { ccclass } = _decorator;

@ccclass("PlayerHealth")
export class PlayerHealth extends Component {
    private _hp: number = 100;

    onEnable(): void {
        // Bind tất cả method có @OnGameEvent
        GameEventHub.bind(this);
    }

    onDisable(): void {
        // Unbind khi component bị disable
        GameEventHub.unbind(this);
    }

    // Subscribe với priority mặc định (High)
    @OnGameEvent(PlayerDiedEvent)
    onPlayerDied(event: PlayerDiedEvent): void {
        console.log(`${event.killerName} killed player with ${event.damage} damage`);
    }

    // Subscribe với priority cụ thể
    @OnGameEvent(PlayerDiedEvent, SubscriberPriority.Low)
    onPlayerDiedLowPriority(event: PlayerDiedEvent): void {
        // Chạy sau các subscriber High và Medium
    }
}
```

### 4. Subscribe động với `GameEventHub.listen()`

Dùng khi cần subscribe/unsubscribe linh hoạt trong runtime:

```typescript
import { GameEventHub } from "db://event-bus/core/GameEventHub";
import { PlayerDiedEvent } from "./events/PlayerDiedEvent";
import { SubscriberPriority } from "db://event-bus/core/SubscriberPriority";

export class ScoreManager {
    private _unsubscribers: (() => void)[] = [];

    start(): void {
        const unsub = GameEventHub.listen(
            PlayerDiedEvent,
            this,
            (event: PlayerDiedEvent) => {
                this.onPlayerDied(event);
            },
            SubscriberPriority.Medium
        );
        this._unsubscribers.push(unsub);
    }

    private onPlayerDied(event: PlayerDiedEvent): void {
        console.log(`ScoreManager: player killed by ${event.killerName}`);
    }

    cleanup(): void {
        this._unsubscribers.forEach(unsub => unsub());
        this._unsubscribers = [];
    }
}
```

### 5. Component `GameEventHandlerComponent`

Một `Component` sẵn dùng, cho phép gán event class và callback trực tiếp trên Inspector:

```typescript
// Tạo component từ code
import { GameEventHandlerComponent } from "db://event-bus/utilities/GameEventHandlerComponent";
import { PlayerDiedEvent } from "./events/PlayerDiedEvent";

const handler = this.node.addComponent(GameEventHandlerComponent);
handler.setEventClass(PlayerDiedEvent);
handler.setPriority(SubscriberPriority.High);
handler.setCallback((event) => {
    console.log("Player died via handler component");
});
```

---

## Subscriber Priority

Mỗi subscriber được gán một priority, quyết định thứ tự xử lý:

| Priority | Order | Mục đích |
|----------|-------|----------|
| `Essential` | Đầu tiên | Luôn chạy, không thể bị filter hay cancel bởi filter |
| `High` | Thứ 2 | Logic quan trọng |
| `Medium` | Thứ 3 | Default |
| `Low` | Cuối cùng | Logic không quan trọng, logging |
| `Cleanup` | Sau cùng | Dọn dẹp sau khi event kết thúc |

**Lưu ý:**
- `Essential` và `Cleanup` luôn được gọi, **bỏ qua mọi subscriber filter** và **không thể bị cancel**
- `High` → `Medium` → `Low` có thể bị cancel bởi bất kỳ subscriber nào trong chuỗi
- Nếu event bị cancel ở phase `High`, các subscriber `Medium` và `Low` sẽ **không được gọi**

```typescript
// Khai báo qua decorator
@OnGameEvent(PlayerDiedEvent, SubscriberPriority.Essential)
onEssential(event: PlayerDiedEvent): void {}

// Khai báo qua listen()
GameEventHub.listen(PlayerDiedEvent, this, callback, SubscriberPriority.Low);
```

---

## Channel

Channel cho phép phân luồng event độc lập. Subscriber chỉ nhận event nếu cùng filter channel (mặc định là empty string).

**Cách 1 — Set channel trong constructor:**

```typescript
export class PlayerJoinedEvent extends GameEvent {
    constructor(public playerId: number) {
        super();
        this.channel = "multiplayer";
    }
}
```

**Cách 2 — Dùng `@DefaultChannel` decorator:**

```typescript
import { GameEvent } from "db://event-bus/core/GameEvent";
import { DefaultChannel } from "db://event-bus/decorators/DefaultChannel";

@DefaultChannel("multiplayer")
export class PlayerJoinedEvent extends GameEvent {}
```

**Cách 3 — Set channel khi publish:**

```typescript
const event = new PlayerJoinedEvent(1);
event.setChannel("lobby");
event.publish(this.node);
```

Channel có thể dùng để phân tách event domain (ví dụ: `"gameplay"`, `"ui"`, `"network"`, `"audio"`).

---

## Event Cancellation

Bất kỳ subscriber nào cũng có thể cancel event, dừng propagation cho các subscriber còn lại:

```typescript
import { GameEvent } from "db://event-bus/core/GameEvent";

export class DamageEvent extends GameEvent {
    constructor(public amount: number) {
        super();
    }
}

// Subscriber cancel event
@OnGameEvent(DamageEvent, SubscriberPriority.High)
onDamage(event: DamageEvent): void {
    if (this.isInvincible) {
        event.stopPropagation(this);
        // Propagation kết thúc — các subscriber Medium, Low không được gọi
    }
}
```

**Event không thể bị cancel nếu:**
- Thuộc priority `Essential` hoặc `Cleanup`
- Event được đánh dấu `nonCancellable`

```typescript
event.nonCancellableFlag();
// hoặc nonCancellableFlag() được gọi trong constructor
```

---

## Shared Events

Mặc định, mỗi subscriber nhận một **bản copy riêng** của event (copy-on-write) — tránh side effect nhưng tốn bộ nhớ. Nếu bạn muốn tất cả subscriber dùng chung một instance, dùng `sharedFlag()`:

```typescript
const event = new PlayerDiedEvent(42, "Boss", 100);
event.sharedFlag();  // Tất cả subscriber nhận cùng instance
event.publish(this.node);

// hoặc
event.sharedFlag().publish();
```

Sử dụng shared event khi:
- Event là immutable
- Cần performance tối đa
- Không quan tâm tới side effect giữa các subscriber

---

## Subscriber Filters

Subscriber filters cho phép kiểm soát chính xác **subscriber nào được gọi** dựa trên ngữ cảnh runtime. Filters được set trên event (không phải subscriber).

```typescript
event.withFilter(new OnlySelf());
event.withFilter(new SameSceneAsEmitter());
event.withFilter(new WithTag("enemy"));
event.withFilter(new WithPriority(SubscriberPriority.High));
event.withFilter(new InsideCollider2D(collider));
```

Có thể kết hợp nhiều filter:

```typescript
event
    .withFilter(new OnlySelf())
    .withFilter(new SameSceneAsEmitter());
```

### Chú ý
- Subscriber `Essential` và `Cleanup` **luôn bỏ qua filter**
- Filter chỉ ảnh hưởng đến các priority `High`, `Medium`, `Low`

---

### OnlySelf

Chỉ gọi các subscriber trên **cùng Node** (hoặc component trên Node đó) với emitter.

```typescript
event.withFilter(new OnlySelf());
event.withFilter(new OnlySelf(true));          // Bao gồm cả children
event.withFilter(new OnlySelf(false, 2));      // Bao gồm parent lên 2 cấp
event.withFilter(new OnlySelf(true, 2));       // Bao gồm children + parent lên 2 cấp
```

### SameSceneAsEmitter

Chỉ gọi các subscriber ở **cùng Scene** với emitter.

```typescript
event.withFilter(new SameSceneAsEmitter());
// Hữu ích khi nhiều scene cùng chạy (multi-scene editing / additive loading)
```

### WithTag

Chỉ gọi các subscriber trên Node có `name` trùng với tag.

```typescript
event.withFilter(new WithTag("enemy"));
// Chỉ subscriber trên Node "enemy" mới được gọi
```

### WithPriority

Chỉ gọi subscriber có priority cụ thể (ghi đè priority mặc định). Hiếm khi dùng vì priority đã được xử lý ở tầng propagation.

```typescript
event.withFilter(new WithPriority(SubscriberPriority.Essential));
```

### InsideCollider2D

Chỉ gọi các subscriber có Node **nằm trong** `Collider2D.worldBounds`.

```typescript
import { Collider2D } from "cc";
import { InsideCollider2D } from "db://event-bus/core/Filters/InsideCollider2D";

const collider = this.getComponent(Collider2D)!;
event.withFilter(new InsideCollider2D(collider));
// Chỉ subscriber trong vùng collider mới nhận event
```

---

## System Events

Event bus tự động emit các system event — đây là các event nội bộ, giúp bạn theo dõi và debug hệ thống.

### OnEventSystemStarted

Được emit **một lần duy nhất** khi `GameEventHub` khởi tạo xong (gọi từ `GameEventHubComponent.start()` hoặc `ensureInitialized()`).

```typescript
import { OnEventSystemStarted } from "db://event-bus/core/SystemEvents/OnEventSystemStarted";
import { OnGameEvent } from "db://event-bus/decorators/OnGameEvent";

@OnGameEvent(OnEventSystemStarted, SubscriberPriority.Essential)
onSystemStarted(): void {
    console.log("Event bus is ready!");
}
```

### OnEventRaised

Được emit **mỗi khi có event được publish** (kể cả system event). Chứa thông tin chi tiết về event, emitter, subscribers.

```typescript
import { OnEventRaised } from "db://event-bus/core/SystemEvents/OnEventRaised";

@OnGameEvent(OnEventRaised, SubscriberPriority.Low)
onEventRaised(systemEvent: OnEventRaised): void {
    console.log(`Event: ${systemEvent.eventRaised?.constructor?.name}`);
    console.log(`Emitter: ${systemEvent.emitter?.name}`);
    console.log(`Subscribers called: ${systemEvent.subscribersCalledString}`);
}
```

### OnObjectBoundToEventSystem / OnObjectUnboundFromEventSystem

Được emit khi một đối tượng bind/unbind khỏi event bus.

```typescript
import { OnObjectBoundToEventSystem } from "db://event-bus/core/SystemEvents/OnObjectBoundToEventSystem";
import { OnObjectUnboundFromEventSystem } from "db://event-bus/core/SystemEvents/OnObjectUnboundFromEventSystem";

@OnGameEvent(OnObjectBoundToEventSystem)
onBound(systemEvent: OnObjectBoundToEventSystem): void {
    console.log(`Bound: ${systemEvent.boundObject?.constructor?.name} (static: ${systemEvent.isStatic})`);
}

@OnGameEvent(OnObjectUnboundFromEventSystem)
onUnbound(systemEvent: OnObjectUnboundFromEventSystem): void {
    console.log(`Unbound: ${systemEvent.unboundObject?.constructor?.name} (static: ${systemEvent.isStatic})`);
}
```

---

## Utilities

### GameEventHubComponent

Component dùng để **kích hoạt** `GameEventHub` trên scene. Bạn nên gắn component này vào một Node trong scene (ví dụ: `GameManager`) hoặc dùng persistent node.

```typescript
// assets/scripts/GameBootstrap.ts
import { _decorator, Component } from "cc";
import { GameEventHubComponent } from "db://event-bus/core/GameEventHubComponent";

const { ccclass } = _decorator;

@ccclass("GameBootstrap")
export class GameBootstrap extends Component {
    start(): void {
        const hub = this.node.addComponent(GameEventHubComponent);
        hub.triggerEventOnStart = true;   // Emit OnEventSystemStarted
        hub.executionMsLimit = 50;         // Warning nếu event chạy quá 50ms
    }
}
```

**Properties:**

| Property | Default | Mô tả |
|----------|---------|-------|
| `triggerEventOnStart` | `true` | Tự động emit `OnEventSystemStarted` ở `start()` |
| `executionMsLimit` | `50` | Ngưỡng thời gian (ms) để warning khi event propagation quá lâu |

### GameEventAsset

Cho phép tạo và cấu hình event từ **Editor Inspector** — kéo-thả tương tự ScriptableObject.

```typescript
import { GameEventAsset } from "db://event-bus/utilities/GameEventAsset";
import { PlayerDiedEvent } from "./events/PlayerDiedEvent";

// Tạo asset
const asset = new GameEventAsset();
asset.initialize(new PlayerDiedEvent(0, "", 0));
asset.channel = "gameplay";
asset.shared = false;
asset.nonCancellable = false;

// Publish qua asset
asset.publish(this.node);
```

Thường dùng kết hợp với `@property`:

```typescript
import { _decorator, Component } from "cc";
import { GameEventAsset } from "db://event-bus/utilities/GameEventAsset";

const { ccclass, property } = _decorator;

@ccclass("Trap")
export class Trap extends Component {
    @property({ type: GameEventAsset })
    public onTriggerEvent: GameEventAsset | null = null;

    onTrigger(): void {
        this.onTriggerEvent?.publish(this.node);
    }
}
```

### PublishOnAnimatorEvent

Component cho phép **publish event tại các thời điểm cụ thể trong animation**.

```typescript
import { PublishOnAnimatorEvent } from "db://event-bus/utilities/PublishOnAnimatorEvent";
import { PlaybackEvent } from "db://event-bus/utilities/PlaybackEvent";

const publisher = this.node.addComponent(PublishOnAnimatorEvent);

const pe = new PlaybackEvent();
pe.playbackTime = 0.5;          // Publish ở 50% animation
pe.associatedEvent = myEventAsset;  // Event asset cần publish
publisher.playbackEvents.push(pe);
```

Trên Editor Inspector, bạn có thể config trực tiếp:
1. Gắn `PublishOnAnimatorEvent` vào Node có component `Animation`
2. Add `PlaybackEvent` vào list
3. Set `playbackTime` (0.0 → 1.0, tỷ lệ phần trăm animation)
4. Kéo `GameEventAsset` vào `associatedEvent`

### PlaybackEvent

Dữ liệu model cho `PublishOnAnimatorEvent`:

| Property | Type | Default | Mô tả |
|----------|------|---------|-------|
| `playbackTime` | `number` | `0` | Thời điểm publish (tỷ lệ 0.0 → 1.0 của animation) |
| `associatedEvent` | `GameEventAsset \| null` | `null` | Event asset được publish tại thời điểm đó |

---

## API Reference

### GameEventHub (Static Methods)

| Method | Signature | Mô tả |
|--------|-----------|-------|
| `instance` | `GameEventHub` | Singleton instance |
| `isInitialized` | `boolean` | Kiểm tra đã khởi tạo chưa |
| `publish` | `(emitter: any, gameEvent: GameEvent): void` | Publish event ngay lập tức |
| `publishDelayed` | `(emitter: any, gameEvent: GameEvent, delayInSeconds: number): void` | Publish event sau khoảng delay |
| `listen` | `<T>(eventClass, subscriber, action, priority?): () => void` | Subscribe động, trả về hàm unsubscribe |
| `bind` | `(subscriber: any): void` | Bind subscriber (quét `@OnGameEvent`) |
| `unbind` | `(subscriber: any): void` | Unbind subscriber |
| `resetInstance` | `(): void` | Reset singleton (test/destroy) |

### GameEvent (Instance Methods)

| Method | Signature | Mô tả |
|--------|-----------|-------|
| `publish` | `(emitter?: any): void` | Publish event |
| `publishDelayed` | `(emitter: any, delay: number): void` | Publish delayed event |
| `setChannel` | `(channel: string): this` | Set channel |
| `setEmitter` | `(emitter: any): this` | Set emitter |
| `sharedFlag` | `(): this` | Bật shared mode (tất cả subscriber dùng chung instance) |
| `unique` | `(): this` | Tắt shared mode (mặc định) |
| `nonCancellableFlag` | `(): this` | Bật non-cancellable |
| `cancellable` | `(): this` | Tắt non-cancellable |
| `stopPropagation` | `(canceller: any): void` | Dừng propagation |
| `withFilter` | `(filter: ISubscriberFilter): this` | Thêm subscriber filter |
| `seal` | `(): this` | Khóa event (không cho thay đổi property) |
| `copyEvent` | `(): this` | Clone một bản copy mới (sẵn sàng để raise) |

### SubscriberPriority

```
Essential = 0
High      = 1
Medium    = 2
Low       = 3
Cleanup   = 4
```

### Decorators

| Decorator | Target | Mô tả |
|-----------|--------|-------|
| `@OnGameEvent(eventClass?, priority?)` | Method | Đánh dấu method là event handler cho event class |
| `@DefaultChannel(channel: string)` | Class | Đặt channel mặc định cho một event class |
| `@SystemEvent()` | Class | Đánh dấu class là system event |

---

## Cấu trúc thư mục

```
event-bus/
├── assets/                          # Mounted tại db://event-bus/
│   ├── index.ts                     # Public exports
│   ├── tsconfig.json
│   ├── core/
│   │   ├── GameEventHub.ts          # Singleton event bus
│   │   ├── GameEvent.ts             # Abstract base event
│   │   ├── GameEventHubComponent.ts # Component init hub
│   │   ├── GameEventsHelper.ts      # Helper utilities
│   │   ├── BindingInfo.ts           # Dynamic/Static binding info
│   │   ├── SubscriberPriority.ts    # Priority enum
│   │   ├── PropagationResult.ts     # Propagation result model
│   │   ├── ISubscriberFilter.ts     # Filter interface
│   │   ├── Filters/
│   │   │   ├── OnlySelf.ts
│   │   │   ├── SameSceneAsEmitter.ts
│   │   │   ├── WithTag.ts
│   │   │   ├── WithPriority.ts
│   │   │   ├── InsideCollider2D.ts
│   │   │   ├── OnlyEssentialAndCleanup.ts
│   │   │   └── SubscriberFilterHelper.ts
│   │   └── SystemEvents/
│   │       ├── OnEventRaised.ts
│   │       ├── OnEventSystemStarted.ts
│   │       ├── OnObjectBoundToEventSystem.ts
│   │       ├── OnObjectUnboundFromEventSystem.ts
│   │       └── EventActorData.ts
│   ├── decorators/
│   │   ├── OnGameEvent.ts
│   │   ├── DefaultChannel.ts
│   │   └── SystemEvent.ts
│   └── utilities/
│       ├── GameEventAsset.ts
│       ├── GameEventHandlerComponent.ts
│       ├── PublishOnAnimatorEvent.ts
│       └── PlaybackEvent.ts
├── source/                          # Extension code
│   ├── main.ts
│   ├── utils/
│   │   └── prop.js
│   └── contributions/
│       └── inspector/
│           └── comp-localized.ts
├── scripts/
│   └── preinstall.js
├── package.json
├── tsconfig.json
└── README.md
```

---

## Development

```bash
# Build extension
npm run build

# Type-check assets (không emit, chỉ check)
npx tsc --project assets/tsconfig.json --noEmit
```

Extension code nằm trong `source/`, code library nằm trong `assets/`. Sau khi sửa code, chạy `npm run build` để compile TypeScript, rồi restart Cocos Creator để load extension mới.

> **Note**: Khi phát triển, bạn có thể cần export Interface Definition từ Cocos Creator (`Developer → Export Interface Definition`) nếu `@cocos/creator-types` chưa tương thích.
