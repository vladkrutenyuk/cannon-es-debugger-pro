# @vladkrutenyuk/cannon-es-debugger-pro


This is improved pro debugger for [cannon-es](https://github.com/pmndrs/cannon-es) with [three](https://github.com/pmndrs/cannon-es) to visualize all bodies and its shapes of physics world.

It was based on [cannon-es-debugger](https://www.npmjs.com/package/cannon-es-debugger). I wasn't completely satisfied with it so I decided to create a **new fixed and improved version** based on it.


![Demo screenshot of @vladkrutenyuk/cannon-es-debugger-pro and comparing with @cannon-es-debugger](https://i.imgur.com/Tet6Pun.png)

- New pretty and clean appearance to make scene more readable.
  - Reworked debug graphics objects and its geoemtries.
  - New `offset` parameter to prevent overlapping instead of `scale`.

- True memory management
  - Prevent memory leaking and disposing custom geometries created for complex shapes.
  - Ability to destroy debugger instance if its no longer used.
  - New methods - `clean` and `destroy`.

- Better types and implementation
  - Class instead of function
  - Events instead of callback args.
  - Parameters changing after initialization - `setColor`, `setOffset`, `setVisible`.

> Read section **"Why use this instead of existed old one?"** below after 'Usage' section.

## Installation 🤓

```bash
pnpm add @vladkrutenyuk/cannon-es-debugger-pro
# or via 'npm i ...', 'yarn add ...' and so on
```

⚠️ Make sure you also have `three` and `cannon-es` as dependencies.

```bash
pnpm add three cannon-es
# or via 'npm i ...', 'yarn add ...' and so on
```

## Usage 🧐


#### Initialization 

```ts
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { CannonEsDebuggerPro } from '@vladkrutenyuk/cannon-es-debugger-pro';

const world = new CANNON.World();
const scene = new THREE.Scene();
const root = new THREE.Group(); // or any another THREE.Object3D like
scene.add(root);

// optional, default is 0x00ff00
const color = 0xe60c0c; // or 'rgb(228, 14, 88)', '#e60c0c', 'red'
// optional, defailt is 0.005
const offset = 0.009;

const cannonDebugger = new CannonEsDebuggerPro(root, world, color, offset);
```

#### Update

The `update()` method needs to be called after `cannon` physics world's step and before `three.js` render to update its state.

```ts
const animate = () => {
  requestAnimationFrame(animate);

  world.step(timeStep); // Update cannon-es physics
  cannonDebugger.update(); // Update the CannonEsDebuggerPro
  renderer.render(scene, camera); // Render the three.js scene
};
animate();
```



# Why use this instead of existed old one? What improvements? 🤩😍

> _"...existed old one" means [cannon-es-debugger](https://www.npmjs.com/package/cannon-es-debugger) package._


## 1. Pretty and clean appearance
Make scene where a lot of objects and bodies readable and clean again.\
See comparison image in the top of the page.

### Reworked debug graphics objects and its geoemtreis

- **Sphere**\
Custom shematic visualization of sphere shape instead of mesh with default icosahedron geometry.\
Geometry is built for `THREE.LineSegments` way.\
Thus, now it's combination of 3 perpendicular to each other edge-circles for each dimension. Looks like sphere colliders in Unity.

- **Box**\
Only quad faces without diagonales of trianguilation (grid-like style).\
Geometry is built for `THREE.LineSegments` way.

- **ConvexPolyhedron**\
This shape debug graphic geometry is built for `THREE.LineSegments` way. Thus, `ConvexPolyhedron` is displayed as it is, even if its faces contain more then 3 verticies (polygonal), for example `Cylinder` shape.

- **Plane**\
Only quad faces without diagonales of trianguilation (grid-like style). \
Geometry is built for `THREE.LineSegments` way.\
Also it has bigger size (100x100 instead of 10x10) because physical plane is infinite.

- **Heightfield**\
Only quad faces without diagonales of trianguilation (grid-like style).\
Geometry is built for `THREE.LineSegments` way.

### Geometry offset

There is new parameter `offset` instead of old `scale`.\
It's float value in meters to push up geometries vertices along its normals of debug graphics objects to prevent overlapping with source scene objects.

Recommended range of hundredths `~0.01` or thousandths `~0.001`.
Default is `0.005`. 

The method `setOffset()` is used to change it.

## 2. Solved memory issues
Original `cannon-es-debugger` doesn't clear scene from created meshes and doesn't dispose created geometry for complex shape after its removing.

This version does **disposing** for complex geometry when its body shape removed. Also it happens on new `clear()`, `destroy()` methods (read below in the next point).

## 3. Destroying, disposing and clearing
The method `destroy()` is called to remove all created debug 3d objects and dispose all created geometries for complex shapes and shared materials of this instance.

After calling `destroy()` the method `update()` won't work anymore and property (read-only) `isDestroyed` will become `true`.

```ts
cannonDebugger.update(); // update happened

cannonDebugger.isDestroyed; // > false
cannonDebugger.destroy(); // remove all debug 3d objects and dispose its geometries, materials
cannonDebugger.isDestroyed; // > true

cannonDebugger.update(); // and now it does nothing
```

If you need just clear scene from debugs but you still need this cannon debugger instance then you are able to use `clear()` method. It does the same but shared materials won't be disposed and the `update()` method will be still working.

But oftenly, it's necessary to hide and show back debugs. In this case the better way is to use the `setVisible()` method. It doesn't remove and dispose anything.

```ts
// hide
cannonDebugger.setVisible(false);

// show back
cannonDebugger.setVisible(true);
```

## 4. Events
`CannonEsDebuggerPro` class extends `THREE.EventDispatcher` and uses it to dispatch `update`, `init` events. Old version's callbacks (`onInit`, `onUpdate`) are not longer used anymore.

**Comparing:**

🔞 in `cannon-es-debugger`
```typescript
cannonDebugger = new CannonDebugger(scene, world, {
    onInit: (body, obj3d, shape) => {
        console.log('inited')
    },
    onUpdate: (body, obj3d, shape) => {
        console.log('updated')
    }   
});
```

😎👍 now in `@vladkrutenyuk/cannon-es-debugger-pro`
```typescript
cannonDebugger = new CannonEsDebuggerPro(root, world);

cannonDebugger.addEventListener('init', (event) => {
    const { body, obj3d, shape } = event
    console.log(`inited obj-${obj3d.id} body-${body.id} shape-${shape.id}`)
});

cannonDebugger.addEventListener('update', (event) => {
    const { body, obj3d, shape } = event
    console.log(`updated obj-${obj3d.id} body-${body.id} shape-${shape.id}`)
});
```

## 5. Typing and implementation

**Changes:**

- This version is implemented via `class` and instance just has its type `CannonEsDebuggerPro` instead of old implemention via `function` where instance can be typed only as `ReturnType<...>`.

- `THREE.Object3D` root instead of `THREE.Scene` scene argument.

**Comparing:**

🔞 in `cannon-es-debugger`

```typescript
// implementation
function CannonDebugger(scene: THREE.Scene, ...) { ... }

// thus, we need this to create typed variable:
cannonDebugger: ReturnType<typeof CannonDebugger>;

this.cannonDebugger = new CannonDebugger(...);

// also, it provides only THREE.Scene as root:
const root = new THREE.Group();
new CannonDebugger(root, ...); //! TypeError

```


😎👍 now in `@vladkrutenyuk/cannon-es-debugger-pro`


```typescript
// implementation
class CannonEsDebuggerPro { 
    constructor(root: THREE.Object3D, ...) { ... }
    ...
}

// thus
class AnyYourClass {
    cannonDebuggerPro: CannonEsDebuggerPro;

    constructor() {
        // able to use any THREE.Object3D
        const root = new THREE.Group();
        this.cannonDebuggerPro = new CannonEsDebuggerPro(root, ...);
    }
}
```

## Types 🧑‍🏫

**Kind of API.**

```ts
import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// Helper types for THREE.EventDispatcher
export type CannonEsDebuggerProEventMap = {
	init: {
		body: CANNON.Body;
		obj3d: THREE.Object3D;
		shape: CANNON.Shape;
	};
	update: {
		body: CANNON.Body;
		obj3d: THREE.Object3D;
		shape: CANNON.Shape;
	};
};
type CannonEsDebuggerProEventType = Extract<keyof CannonEsDebuggerProEventMap, string>;

export class CannonEsDebuggerPro extends THREE.EventDispatcher<CannonEsDebuggerProEventMap> {
    constructor(
        root: THREE.Object3D, 
        world: CANNON.World,
        color: THREE.ColorRepresentation = 0x00ff00,
        offset: number = 0.005
    );

    // Accessors
    get color(): THREE.ColorRepresentation;
    get offset(): number;
    get isVisible(): boolean;
    get isDestroyed(): boolean;

    // Main methods
    update(): void;
    clear(): void;
    destroy(): void;

    // Customization methods
    setVisible(isVisible: boolean): this;
    setColor(color: THREE.ColorRepresentation): this;
    setOffset(offset: number): this;

    // THREE.EventDispatcher methods
    addEventListener<T extends CannonEsDebuggerProEventType>(
        type: T,
        listener: THREE.EventListener<CannonEsDebuggerProEventMap[T], T, this>,
    ): void;
    hasEventListener<T extends CannonEsDebuggerProEventType>(
        type: T,
        listener: THREE.EventListener<CannonEsDebuggerProEventMap[T], T, this>,
    ): boolean;
    removeEventListener<T extends CannonEsDebuggerProEventType>(
        type: T,
        listener: THREE.EventListener<CannonEsDebuggerProEventMap[T], T, this>,
    ): void;
}
```

## Donate 🥺🙏
🌐 ERC-20 wallet (USDC / USDT / ETH):\
`0xF348AB28dB048CbFF18095b428ac9Da4f1A7a90e`

## Social media / links 💃💅


- [Telegram (@vladkrutenyuk)](https://t.me/vladkrutenyuk)

- [Instagram (@vlad_krutenyuk)](https://instagram.com/vlad_krutenyuk)

- [Twitter/X (@vladkrutenyuk)](https://x.com/vladkrutenyuk)

- [Twitch (vladdyusha)](https://twitch.tv/vladdyusha)

- [kvy-4° (My funny telegram channel)](https://t.me/kvvy4)

- [https://kvy.world](https://kvy.world)

---

_meow :3_