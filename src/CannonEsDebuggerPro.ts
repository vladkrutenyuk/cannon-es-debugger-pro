import * as CANNON from "cannon-es"
import * as THREE from "three"
import { BoxShapeGeometry } from "./geometries/BoxShapeGeometry"
import { TrimeshShapeGeometry } from "./geometries/TrimeshShapeGeometry"
import { ConvexPolyhedronShapeGeometry } from "./geometries/ConvexPolyhedronShapeGeometry"
import { HeightfieldShapeGeometry } from "./geometries/HeightfieldShapeGeometry"
import { PlaneGridGeometry } from "./geometries/PlaneGridGeometry"
import { SphereShapeGeometry } from "./geometries/SphereShapeGeometry"

type ComplexShape = CANNON.Shape & { geometryId?: number }

type GraphicObj3D = THREE.Object3D & {
	geometry: THREE.BufferGeometry
}

export type CannonEsDebuggerProEventMap = {
	init: {
		body: CANNON.Body
		obj3d: THREE.Object3D
		shape: CANNON.Shape
	}
	update: {
		body: CANNON.Body
		obj3d: THREE.Object3D
		shape: CANNON.Shape
	}
}

/**
 * {@link CannonEsDebuggerPro} is improved and reworked pro debugger for {@link https://github.com/pmndrs/cannon-es | cannon-es} 
 * using {@link https://github.com/mrdoob/three.js | three.js} to visualize all bodies and its shapes of physics world.
 * @see {@link https://github.com/vladkrutenyuk/cannon-es-debugger-pro | Source}
 * @see {@link https://npmjs.com/@vladkrutenyuk/cannon-es-debugger-pro | The page of npm package}
 * @example
 * ```typescript
 * import * as THREE from 'three'
 * import * as CANNON from 'cannon-es'
 * import { CannonEsDebuggerPro } from '@vladkrutenyuk/cannon-es-debugger-pro'
 *
 * const world = new CANNON.World()
 * const scene = new THREE.Scene()
 *
 * const root = new THREE.Group() // or any another THREE.Object3D like
 * scene.add(root)
 *
 * const cannonDebugger = new CannonEsDebuggerPro(root, world, 0xe60c0c, 0.01)
 * ```
 */
export default class CannonEsDebuggerPro extends THREE.EventDispatcher<CannonEsDebuggerProEventMap> {
	private readonly _material: THREE.MeshBasicMaterial
	private readonly _lineMaterial: THREE.LineBasicMaterial
	private readonly _world: CANNON.World
	private readonly _graphicsObjsGroup: THREE.Group
	private readonly _geometries = new Map<number, THREE.BufferGeometry>()
	private _graphicObjs: GraphicObj3D[] = []

	private _isVisible = true
	/**
	 * Flag to check instance's visibility. Read-only. Default is `true`
	 * @remarks Use method {@link CannonEsDebuggerPro.setVisible | setVisible()} to change it.
	 */
	public get isVisible() {
		return this._isVisible
	}

	private _isDestroyed = false
	/**
	 * Flag to check if instance was destroyed. Read-only. Default is `false`
	 * @remarks Use method {@link CannonEsDebuggerPro.destroy | destroy()} to destroy instance.
	 */
	public get isDestroyed() {
		return this._isDestroyed
	}

	private _color: THREE.ColorRepresentation
	/**
	 * Current lines color of debug graphics objects. Read-only. Default is `0x00ff00` (green).
	 * @readonly
	 * @default 0x00ff00
	 * @remarks Use method {@link CannonEsDebuggerPro.setColor | setColor()} to change it.
	 */
	public get color() {
		return this._color
	}

	private readonly _offset = {
		value: 0,
	}
	/**
	 * Current value in meters to push up geometries vertices along its normals of debug graphics objects.
	 * Read-only. Default is 0.005.
	 * @readonly
	 * @default 0.005
	 * @remarks Use method {@link CannonEsDebuggerPro.setOffset | setOffset()} to change it.
	 */
	public get offset() {
		return this._offset.value
	}

	/**
	 * Create a new instance of {@link CannonEsDebuggerPro}
	 * This is improved pro debugger for [cannon-es](https://github.com/pmndrs/cannon-es)
	 * with [three](https://github.com/pmndrs/cannon-es) to visualize all bodies and its shapes of physics world.
	 * @param {THREE.Object3D} root Root which is any implementation of {@link THREE.Object3D} to be parent container of debug graphic objects for this instance.
	 * @param {CANNON.World} world Instance of {@link CANNON.World} you need to debug.
	 * @param {THREE.ColorRepresentation} color (optional) Sets the lines color for debug graphic objects.
	 * Expects a {@link THREE.ColorRepresentation}. Default is `0x00ff00` (green).
	 * @param {number} offset (optional) Value in meters to push up geometries vertices along its normals of debug graphics objects 
	 * to prevent overlapping with source scene objects. Float value with recommended range of hundredths `~0.01` or thousandths `~0.001`. Expects a `Float`. Default is `0.005`. 
	 */
	constructor(
		root: THREE.Object3D,
		world: CANNON.World,
		color: THREE.ColorRepresentation = 0x00ff00,
		offset: number = 0.005
	) {
		super()
		this._world = world
		this._graphicsObjsGroup = new THREE.Group()
		root.add(this._graphicsObjsGroup)
		this._offset.value = offset
		this._color = color
		this._material = new THREE.MeshBasicMaterial({
			color,
			wireframe: true,
			toneMapped: false,
		})
		this._lineMaterial = new THREE.LineBasicMaterial({ color, toneMapped: false })

		const onBeforeCompile: THREE.Material["onBeforeCompile"] = (program) => {
			program.uniforms._offset = this._offset
			program.vertexShader = program.vertexShader
				.replace(
					/*glsl*/ `#include <common>`,
					/*glsl*/ `
						#include <common>
						uniform float _offset;
					`
				)
				.replace(
					/*glsl*/ `#include <begin_vertex>`,
					/*glsl*/ `
						#include <begin_vertex>
						transformed += normalize(normal) * _offset;
						`
				)
		}
		this._material.onBeforeCompile = onBeforeCompile
		this._lineMaterial.onBeforeCompile = onBeforeCompile
	}

	private createObj3d(shape: CANNON.Shape): GraphicObj3D {
		let obj3d: GraphicObj3D | null = null
		const { SPHERE, BOX, PLANE, CYLINDER, CONVEXPOLYHEDRON, TRIMESH, HEIGHTFIELD } =
			CANNON.Shape.types

		switch (shape.type) {
			case SPHERE: {
				obj3d = new THREE.LineSegments(_sphereShapeGeometry, this._lineMaterial)
				break
			}
			case BOX: {
				obj3d = new THREE.LineSegments(_boxEdgesGeometry, this._lineMaterial)
				break
			}
			case PLANE: {
				obj3d = new THREE.LineSegments(_planeGridGeometry, this._lineMaterial)
				break
			}
			case CYLINDER:
			case CONVEXPOLYHEDRON: {
				const geometry = new ConvexPolyhedronShapeGeometry(
					shape as CANNON.ConvexPolyhedron
				)
				obj3d = new THREE.LineSegments(geometry, this._lineMaterial)
				this.registerComplexShapeWithObj3d(obj3d, shape, geometry)
				break
			}
			case TRIMESH: {
				const geometry = new TrimeshShapeGeometry(shape as CANNON.Trimesh)
				obj3d = new THREE.Mesh(geometry, this._material)
				this.registerComplexShapeWithObj3d(obj3d, shape, geometry)
				break
			}
			case HEIGHTFIELD: {
				const geometry = new HeightfieldShapeGeometry(shape as CANNON.Heightfield)
				obj3d = new THREE.LineSegments(geometry, this._lineMaterial)
				this.registerComplexShapeWithObj3d(obj3d, shape, geometry)
				break
			}
			default: {
				obj3d = new THREE.Mesh()
			}
		}
		obj3d.userData.shapeType = shape.type
		this._graphicsObjsGroup.add(obj3d)
		return obj3d
	}

	private registerComplexShapeWithObj3d(
		obj3d: GraphicObj3D,
		shape: CANNON.Shape,
		geometry: THREE.BufferGeometry
	) {
		;(shape as ComplexShape).geometryId = geometry.id
		this._geometries.set(geometry.id, geometry)
		obj3d.userData.isComplexShapeObj3d = true
	}

	private rescaleObj3d(obj3d: GraphicObj3D, shape: CANNON.Shape | ComplexShape): void {
		const { SPHERE, BOX, TRIMESH } = CANNON.Shape.types
		switch (shape.type) {
			case SPHERE: {
				obj3d.scale.setScalar((shape as CANNON.Sphere).radius)
				break
			}
			case BOX: {
				obj3d.scale
					.copy((shape as CANNON.Box).halfExtents as unknown as THREE.Vector3)
					.multiplyScalar(2)
				break
			}
			case TRIMESH: {
				obj3d.scale.copy(
					(shape as CANNON.Trimesh).scale as unknown as THREE.Vector3
				)
				break
			}
		}
	}

	private typeMatch(obj3d: GraphicObj3D, shape: CANNON.Shape | ComplexShape): boolean {
		if (!obj3d) return false
		if (obj3d.userData.isComplexShapeObj3d) {
			return (
				obj3d.userData.shapeType === shape.type &&
				obj3d.geometry.id === (shape as ComplexShape).geometryId
			)
		}
		return obj3d.userData.shapeType === shape.type
	}

	private updateObj3d(index: number, shape: CANNON.Shape | ComplexShape): boolean {
		let obj3d = this._graphicObjs[index]
		let didCreateNewObj3d = false

		if (!this.typeMatch(obj3d, shape)) {
			if (obj3d) this.removeObj3d(obj3d)
			this._graphicObjs[index] = obj3d = this.createObj3d(shape)
			didCreateNewObj3d = true
		}

		this.rescaleObj3d(obj3d, shape)
		return didCreateNewObj3d
	}

	private removeObj3d(obj3d: GraphicObj3D) {
		this._graphicsObjsGroup.remove(obj3d)
		if (!obj3d.userData.isComplexShapeObj3d) return

		this._geometries.delete(obj3d.geometry.id)
		obj3d.geometry.dispose()
	}

	/**
	 * The {@link CannonEsDebuggerPro.update | update()} method needs to be called 
	 * after `cannon` physics world's step
	 * and before `three.js` render to update its state.
	 * @example
	 * ```typescript
	 * const animate = () => {
	 * 	requestAnimationFrame(animate)
	 *
	 * 	world.step(timeStep) // Update cannon-es physics
	 * 	cannonDebugger.update() // Update the CannonEsDebuggerPro
	 * 	renderer.render(scene, camera) // Render the three.js scene
	 * }
	 * animate()
	 * ```
	 * @remarks It won't work after {@link CannonEsDebuggerPro.destroy | destroy()}.
	 */
	update() {
		if (this._isDestroyed) return

		const shapeWorldPosition = _vt
		const shapeWorldQuaternion = _qt

		let obj3dIndex = 0

		for (const body of this._world.bodies) {
			for (let i = 0; i !== body.shapes.length; i++) {
				const shape = body.shapes[i]
				const didCreateNewObj3d = this.updateObj3d(obj3dIndex, shape)
				const obj3d = this._graphicObjs[obj3dIndex]

				if (obj3d) {
					// Get world position
					body.quaternion.vmult(body.shapeOffsets[i], shapeWorldPosition)
					body.position.vadd(shapeWorldPosition, shapeWorldPosition)

					// Get world quaternion
					body.quaternion.mult(body.shapeOrientations[i], shapeWorldQuaternion)

					// Copy to meshes
					obj3d.position.copy(shapeWorldPosition as unknown as THREE.Vector3)
					obj3d.quaternion.copy(
						shapeWorldQuaternion as unknown as THREE.Quaternion
					)

					if (didCreateNewObj3d) {
						_event.init.body = body
						_event.init.obj3d = obj3d
						_event.init.shape = shape
						this.dispatchEvent(_event.init as Required<typeof _event.init>)
					} else {
						_event.update.body = body
						_event.update.obj3d = obj3d
						_event.update.shape = shape
						this.dispatchEvent(
							_event.update as Required<typeof _event.update>
						)
					}
				}

				obj3dIndex++
			}
		}

		for (let i = obj3dIndex; i < this._graphicObjs.length; i++) {
			const obj3d = this._graphicObjs[i]
			if (obj3d) this.removeObj3d(obj3d)
		}

		this._graphicObjs.length = obj3dIndex
	}

	/**
	 * Set lines color of debug graphic objects.
	 * @param {THREE.ColorRepresentation} color.
	 * @remark Use read-only {@link CannonEsDebuggerPro.color | color} property to know current value.
	 */
	setColor(color: THREE.ColorRepresentation) {
		this._material.color.set(color)
		this._lineMaterial.color.set(color)
		this._material.needsUpdate = true
		this._lineMaterial.needsUpdate = true
		return this
	}

	/**
	 * Set visibility of debug graphic objects. It doesn't remove and dispose anything.
	 * @param {boolean} isVisible
	 * @remark Use read-only {@link CannonEsDebuggerPro.isVisible | isVisible} property to know current value.
	 */
	setVisible(isVisible: boolean) {
		this._isVisible = isVisible
		this._graphicsObjsGroup.visible = isVisible
		return this
	}

	/**
	 * Set value in meters to push up geometries vertices along its normals of debug graphics objects.
	 * @param {number} offset Float value with recommended range of hundredths `~0.01` or thousandths `~0.001`.
	 * @remark Use read-only {@link CannonEsDebuggerPro.offset | offset} property to know current value.
	 */
	setOffset(offset: number) {
		this._offset.value = offset
	}

	/**
	 * Removes all debug 3d objects and does `dispose` for all created geometries
	 * of complex shapes. Shared materials won't be disposed and the {@link CannonEsDebuggerPro.update | update()} method will be still working.
	 * You are able to continue using this instance after calling the method.
	 * If you want to destroy instance fully not to use it anymore then use {@link CannonEsDebuggerPro.destroy | destroy()}.
	 */
	clear() {
		this._graphicObjs = []
		while (this._graphicsObjsGroup.children.length > 0) {
			this._graphicsObjsGroup.remove(this._graphicsObjsGroup.children[0])
		}
		this._geometries.forEach((value) => {
			value.dispose()
		})
		this._geometries.clear()
	}

	/**
	 * The method is called to remove all created debug 3d objects and
	 * dispose all created geometries for complex shapes and shared materials of this instance.
	 * After calling {@link CannonEsDebuggerPro.destroy | destroy()} the method {@link CannonEsDebuggerPro.update | update()} won't work anymore 
	 * and property {@link CannonEsDebuggerPro.isDestroyed | isDestroyed} will become `true`.
	 */
	destroy() {
		this._isDestroyed = true
		const parent = this._graphicsObjsGroup.parent
		parent?.remove(this._graphicsObjsGroup)
		this.clear()
		this._material.dispose()
		this._lineMaterial.dispose()
	}
}

const _event: {
	[K in keyof CannonEsDebuggerProEventMap]: { type: K } & Partial<
		CannonEsDebuggerProEventMap[K]
	>
} = {
	init: { type: "init" },
	update: { type: "update" },
}

const _vt = new CANNON.Vec3()
const _qt = new CANNON.Quaternion()
const _sphereShapeGeometry = new SphereShapeGeometry(1)
const _boxEdgesGeometry = new BoxShapeGeometry(1, 1, 1)
const _planeGridGeometry = new PlaneGridGeometry(100, 20, 0.001)