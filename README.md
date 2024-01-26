# @vladkrutenyuk/cannon-es-debugger-pro

<!-- [![Demo Image](https://i.imgur.com/2Bf8KfJ.png)](https://pmndrs.github.io/cannon-es-debugger/) -->

This is improved pro debugger for [cannon-es](https://github.com/pmndrs/cannon-es) with [three](https://github.com/pmndrs/cannon-es) to visualize all bodies and its shapes of physics world.

It was based on [cannon-es-debugger](https://www.npmjs.com/package/cannon-es-debugger). I wasn't completely satisfied with it so I decided to create a **new fixed and improved version** based on it.

In short:
- New pretty appearance of sphere and box shapes to make scene more readable.
- Better types and implementation via class.
- Prevent memory leaking on custom complex shapes creation because of collecting custom geometries and not disposing them.
- Ability to destroy debugger instance and clean memory.

_Read section 'Why use this instead of existed old one?' below in the end of the page._

## Installation


```bash
pnpm add @vladkrutenyuk/cannon-es-debugger-pro
# or via 'npm i ...', 'yarn add ...' and so on
```

Make sure you also have `three` and `cannon-es` as dependencies.

```bash
pnpm add three cannon-es
# or via 'npm i ...', 'yarn add ...' and so on
```


## Usage


##### 1. Initialization

```ts
import { CannonEsDebuggerPro } from '@vladkrutenyuk/cannon-es-debugger-pro'

const scene = new THREE.Scene()
const world = new CANNON.World()

const root = new THREE.Group() // or any another root which is THREE.Object3D
scene.add(root)

const cannonDebugger = new CannonEsDebuggerPro(root, world)
```

with options:

```ts
const options = {
    color: 0xe60c0c // or 'rgb(228, 14, 88)', '#e60c0c', 'red'
}

const cannonDebugger = new CannonEsDebuggerPro(root, world, options)
```


##### 2. Update

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


##### 3. Destroy and dispose

The `destory()` method removes all debug 3d objects and disposes all created geometries for complex shape and materials.
After calling `destroy` the method `update()` won't work anymore and property (read-only) `isDestroyed` will become `true`.

```ts
cannonDebugger.update() // update happened

cannonDebugger.isDestroyed // > false
cannonDebugger.destroy() // remove all debug 3d objects and dispose its geometries, materials
cannonDebugger.isDestroyed // > true

cannonDebugger.update() // and now it does nothing
```

##
## Why use this instead of existed old one? What improvements?


#### 1. New pretty shapes appereance
//TODO put images for comparing
- Sphere looks like 3 perpendicular to each other circle edges. (like sphere colliders in Unity)
- Box looks like just edge lines of quads without diagonals in them. (like box colliders in Unity)
- Plane is bigger (200mx200m)

#### 2. Typing and implementation
- It is implemented as `class` and instance just has its type `CannonEsDebuggerPro` instead of implemention via `function` where instance can be typed only as `ReturnType<...>`.
- `THREE.Object3D` root instead of `THREE.Scene` scene argument.

🔞 in `cannon-es-debugger`

```typescript
function CannonDebugger(scene: THREE.Scene, ...) {
    ...
    function update() { ... }
    return { update }
}

// so, we need this to create typed variable:
let cannonDebugger: ReturnType<CannonDebugger> = new CannonDebugger(...)

// also, it provides only THREE.Scene as root:
const root = new THREE.Group()
new CannonDebugger(root, ...) //! TypeError

```


😎👍 now in `@vladkrutenyuk/cannon-es-debugger-pro`


```typescript
// implementation:
class CannonEsDebugger { 
    constructor(root: THREE.Object3D, ...) { ... }
    ...
}

// thus:
class AnyYourClass {
    cannonDebugger: CannonEsDebugger

    constructor() {
        // able to use any THREE.Object3D
        const root = new THREE.Group()
        this.cannonDebugger = new CannonEsDebugger(root, ...)
    }
}
```

#### 3. Solved memory issues
Original `cannon-es-debugger` doesn't clear scene from created meshes and doesn't dispose created geoemtry for comples shape after its removing.

#### 4. Destroying and disposing
The method `destroy()` is called to remove all created debug 3d objects and dispose eveything created for them (materials, geoemtries).

##
## API

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
    
    get isDestroyed(): boolean

    update(): void
    clear(): void
    destroy(): void
}
```

where **`DebugOptions`** is:

- `color`
    * Sets the wireframe color ([THREE.ColorRepresentation](https://threejs.org/docs/#api/en/math/Color)) for debug 3d objects.
    * Default is 0x00ff00 (green).

- `scale`
    * Scale factor for all debug 3d objects.
    * Default is 1.

- `onInit`
    * Callback function that runs once, right after a new debug 3d object is added.

- `onUpdate`
    * Callback function that runs on every subsequent animation frame.