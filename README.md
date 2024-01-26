# @vladkrutenyuk/cannon-es-debugger-pro

<!-- [![Demo Image](https://i.imgur.com/2Bf8KfJ.png)](https://pmndrs.github.io/cannon-es-debugger/) -->

This is improved pro debugger for [cannon-es](https://github.com/pmndrs/cannon-es) with [three](https://github.com/pmndrs/cannon-es) to visualize all bodies and its shapes of physics world.

It was based on [cannon-es-debugger](https://www.npmjs.com/package/cannon-es-debugger). I wasn't completely satisfied with it so I decided to create a **new fixed and improved version** based on it.

In short:
- New clean appereance of sphere and box shapes
- Better types and implementation via class
- Prevent memory leacking on custom complex shapes creation because of collecting custom geometries and not disposing them
- Ability to destroy debugger instance and clean memory

_Read section 'Why use this instead of existed old one?' below in the end of the page._

## Installation


```bash
pnpm add @vladkrutenyuk/cannon-es-debugger-pro
# or use any another package manager (npm, yarn, ...)
```

Make sure you also have `three` and `cannon-es` as dependencies.

```bash
pnpm add three cannon-es
# or use any another package manager (npm, yarn, ...)
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

The `update()` method needs to be called after `cannon` physics world's step and before `three.js` render to update state

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


#### 1. Typing and implementation


🫣 was in `cannon-es-debugger`


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


🥰 now in `@vladkrutenyuk/cannon-es-debugger-pro`


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

//TODO write points about
- New clean appereance of sphere and box shapes
- Prevent memory leacking on custom complex shapes creation because of collecting custom geometries and not disposing them
- Ability to destroy debugger instance and clean memory

//TODO picture/screenshot with debug objects 3d (sphere and boxes)

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
    destroy(): void
}
```

where `DebugOptions` is:

- **`color`** - [THREE.ColorRepresentation](https://threejs.org/docs/#api/en/math/Color) argument that sets the wireframe color, defaults to `0x00ff00`

- **`scale`** - scale factor for all the wireframe meshes, defaults to 1

- **`onInit`** - callback function that runs once, right after a new wireframe mesh is added

- **`onUpdate`** - callback function that runs on every subsequent animation frame