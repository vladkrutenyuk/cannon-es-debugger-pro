# @vladkrutenyuk/cannon-es-debugger-pro

<!-- [![Demo Image](https://i.imgur.com/2Bf8KfJ.png)](https://pmndrs.github.io/cannon-es-debugger/) -->

This is improved pro debugger for [cannon-es](https://github.com/pmndrs/cannon-es) with [three](https://github.com/pmndrs/cannon-es) to visualize all bodies and its shapes of physics world.

It was based on [cannon-es-debugger](https://www.npmjs.com/package/cannon-es-debugger). I wasn't completely satisfied with it so I decided to create a **new fixed and improved version** based on it.

In short:
- [x] New pretty appearance of sphere, box and plane shapes to make scene more readable.
- [x] Prevent memory leaking on custom complex shapes creation because of collecting custom geometries and not disposing them.
- [x] Ability to destroy debugger instance and clean memory.
- [x] Better types and implementation via class.

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
import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { CannonEsDebuggerPro } from '@vladkrutenyuk/cannon-es-debugger-pro'

const world = new CANNON.World()
const scene = new THREE.Scene()
const root = new THREE.Group() // or any another THREE.Object3D like
scene.add(root)

// `options` is optional arg ;)
const options = {
    color: 0xe60c0c // or 'rgb(228, 14, 88)', '#e60c0c', 'red'
}
const cannonDebugger = new CannonEsDebuggerPro(root, world, options)
```

#### Update

The `update()` method needs to be called after `cannon` physics world's step and before `three.js` render to update its state.

```ts
const animate = () => {
  requestAnimationFrame(animate)

  world.step(timeStep) // Update cannon-es physics
  cannonDebugger.update() // Update the CannonEsDebuggerPro
  renderer.render(scene, camera) // Render the three.js scene
}
animate()
```



## Why use this instead of existed old one? What improvements? 🤩😍

> "existed old one" means [cannon-es-debugger](https://www.npmjs.com/package/cannon-es-debugger) package


### 1. New pretty shapes appereance
//TODO put images for comparing
- Sphere looks like 3 perpendicular to each other circle edges. (like sphere colliders in Unity)
- Box looks like just edge lines of quads without diagonals in them. (like box colliders in Unity)
- Plane is bigger (200mx200m)

### 2. Solved memory issues
Original `cannon-es-debugger` doesn't clear scene from created meshes and doesn't dispose created geometry for complex shape after its removing.

This version does **disposing** for complex geometry when its body shape removed. Also it happens on new `clear()`, `destroy()` methods (read below in the next point).

### 3. Destroying, disposing and clearing
The method `destroy()` is called to remove all created debug 3d objects and dispose all created geometries for complex shapes and shared materials of this instance.

After calling `destroy()` the method `update()` won't work anymore and property (read-only) `isDestroyed` will become `true`.

```ts
cannonDebugger.update() // update happened

cannonDebugger.isDestroyed // > false
cannonDebugger.destroy() // remove all debug 3d objects and dispose its geometries, materials
cannonDebugger.isDestroyed // > true

cannonDebugger.update() // and now it does nothing
```

If you need just clear scene from debugs but you still need this cannon debugger instance then you are able to use `clear()` method. It does the same but shared materials won't be disposed and the `update()` method will be still working.

But oftenly, it's necessary to hide and show back debugs. In this case the better way is to use the `setVisible()` method. It doesn't remove and dispose anything.

```ts
// hide
cannonDebugger.setVisible(false)

// show back
cannonDebugger.setVisible(true)
```

### 4. Typing and implementation
**Changes:**
- This version is implemented via `class` and instance just has its type `CannonEsDebuggerPro` instead of old implemention via `function` where instance can be typed only as `ReturnType<...>`.
- `THREE.Object3D` root instead of `THREE.Scene` scene argument.

**Comparing:**

🔞 in `cannon-es-debugger`

```typescript
// implementation
function CannonDebugger(scene: THREE.Scene, ...) { ... }

// thus, we need this to create typed variable:
cannonDebugger: ReturnType<typeof CannonDebugger>

this.cannonDebugger = new CannonDebugger(...)

// also, it provides only THREE.Scene as root:
const root = new THREE.Group()
new CannonDebugger(root, ...) //! TypeError

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
    cannonDebuggerPro: CannonEsDebuggerPro

    constructor() {
        // able to use any THREE.Object3D
        const root = new THREE.Group()
        this.cannonDebuggerPro = new CannonEsDebuggerPro(root, ...)
    }
}
```


##
## API 🧑‍🏫

```ts
import * as THREE from 'three'
import * as CANNON from 'cannon-es'

export type DebugOptions = {
    color?: THREE.ColorRepresentation
    scale?: number
    onInit?: (body: CANNON.Body, obj3d: THREE.Object3D, shape: CANNON.Shape) => void
    onUpdate?: (body: CANNON.Body, obj3d: THREE.Object3D, shape: CANNON.Shape) => void
}

export class CannonEsDebuggerPro {
    constructor(root: THREE.Object3D, world: CANNON.World, options?: DebugOptions): void
    
    get isVisible(): boolean
    get isDestroyed(): boolean

    update(): void
    clear(): void
    destroy(): void

    setVisible(isVisible: boolean): this
    setColor(color: THREE.ColorRepresentation): this
}
```

where **`DebugOptions`** is:

- `color`
    * Sets the wireframe color ([THREE.ColorRepresentation](https://threejs.org/docs/#api/en/math/Color)) for debug 3d objects.
    * Default is `0x00ff00` (green).

- `scale`
    * Scale factor for all debug 3d objects.
    * Default is `1`.

- `onInit`
    * Callback function that runs once, right after a new debug 3d object is added.

- `onUpdate`
    * Callback function that runs on every subsequent animation frame.

---


[Telegram (@vladkrutenyuk)](https://t.me/vladkrutenyuk)
[Instagram (@vlad_krutenyuk)](https://instagram.com/vlad_krutenyuk)
[Twitter/X (@vladkrutenyuk)](https://x.com/vladkrutenyuk)
[Twitch (vladdyusha)](https://twitch.tv/vladdyusha)

[kvy-4° (My funny telegram channel)](https://t.me/kvvy4)

https://kvy.world

---

_meow :3_