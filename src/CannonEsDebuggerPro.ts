import * as CANNON from "cannon-es"
import * as THREE from "three"
import { DebugOptions } from "./DebugOptions"
import { PlaneGridGeometry } from "./helpers/PlaneGridGeometry"
import { SphereShapeGeometry } from "./helpers/SphereShapeGeometry"
import { BoxEdgesGeometry } from "./helpers/BoxEdgesGeometry"

const _vt = new CANNON.Vec3()
const _qt = new CANNON.Quaternion()
const _sphereShapeGeometry = new SphereShapeGeometry(1)
const _boxEdgesGeometry = new BoxEdgesGeometry(1,1,1)
const _planeGridGeometry = new PlaneGridGeometry(100, 20, 0.001)

type ComplexShape = CANNON.Shape & { geometryId?: number }

/**
 * This is improved pro debugger for [cannon-es](https://github.com/pmndrs/cannon-es)
 * with [three](https://github.com/pmndrs/cannon-es) to visualize all bodies and its shapes of physics world.
 */
export default class CannonEsDebuggerPro {
	private readonly _material: THREE.MeshBasicMaterial
	private readonly _lineMaterial: THREE.LineBasicMaterial
	private readonly _world: CANNON.World
	private readonly _objsGroup: THREE.Group

	private readonly _options: DebugOptions = {
		color: 0x00ff00,
	}
	private _objs3d: THREE.Object3D[] = []

	private _geometries = new Map<number, THREE.BufferGeometry>()

	private _isVisible = true

	public get isVisible() {
		return this._isVisible
	}

	private _isDestroyed = false

	public get isDestroyed() {
		return this._isDestroyed
	}

	private readonly _offset = {
		value: 0.005
	}

	public get offset() {
		return this._offset.value
	}

	/**
	 * This is improved pro debugger for [cannon-es](https://github.com/pmndrs/cannon-es)
	 * with [three](https://github.com/pmndrs/cannon-es) to visualize all bodies and its shapes of physics world.
	 * @param {THREE.Object3D} root - any THREE.Object3D root which will contain debug 3d objects of this instance.
	 * @param {CANNON.World} world - Physics `cannon-es` world you need to debug.
	 * @param {DebugOptions | undefined} options - optional.
	 * @param {THREE.ColorRepresentation} options.color - Sets the wireframe color for debug 3d objects. Default is `0x00ff00` (green).
	 * @param {number} options.scale - Scale factor for all debug 3d objects. Default is `1`.
	 * @param {function} options.onInit - Callback function that runs once, right after a new debug 3d object is added.
	 * @param {function} options.onUpdate - Callback function that runs on every subsequent animation frame.
	 * @example
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
	 * // `options` is optional arg ;)
	 * const options = {
	 * 	color: 0xe60c0c // or 'rgb(228, 14, 88)', '#e60c0c', 'red'
	 * }
	 * const cannonDebugger = new CannonEsDebuggerPro(root, world, options)
	 */
	constructor(root: THREE.Object3D, world: CANNON.World, options: DebugOptions = {}) {
		this._options = options
		this._world = world
		this._objsGroup = new THREE.Group()
		root.add(this._objsGroup)
		const color = this._options.color ?? 0x00ff00
		this._material = new THREE.MeshBasicMaterial({
			color,
			wireframe: true,
			toneMapped: false,
		})
		this._material.onBeforeCompile = (program) => {
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
						transformed += normal * _offset;
						`
				)
		}
		this._lineMaterial = new THREE.LineBasicMaterial({ color, toneMapped: false })
		this._lineMaterial.onBeforeCompile = (program) => {
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
						transformed += normal * _offset;
						`
				)
		}
	}

	private createObj3d(shape: CANNON.Shape): THREE.Object3D {
		let obj3d: THREE.Object3D | null = null
		const { SPHERE, BOX, PLANE, CYLINDER, CONVEXPOLYHEDRON, TRIMESH, HEIGHTFIELD } =
			CANNON.Shape.types

		const material = this._material
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
			case CYLINDER: {
				const geometry = new THREE.CylinderGeometry(
					(shape as CANNON.Cylinder).radiusTop,
					(shape as CANNON.Cylinder).radiusBottom,
					(shape as CANNON.Cylinder).height,
					(shape as CANNON.Cylinder).numSegments
				)
				removeDuplicatedVerteciesAndMakeItSmooth(geometry)
				obj3d = new THREE.Mesh(geometry, material)
				this.registerComplexShapeWithObj3d(obj3d, shape, geometry)
				
				// const geometry = createConvexPolyhedronGeometry(
				// 	shape as CANNON.ConvexPolyhedron
				// )
				// obj3d = new THREE.Mesh(geometry, this._material)
				// this.registerComplexShapeWithObj3d(obj3d, shape, geometry)

				break
			}
			case CONVEXPOLYHEDRON: {
				const geometry = createConvexPolyhedronGeometry(
					shape as CANNON.ConvexPolyhedron
				)
				obj3d = new THREE.Mesh(geometry, this._material)
				this.registerComplexShapeWithObj3d(obj3d, shape, geometry)
				break
			}
			case TRIMESH: {
				const geometry = createTrimeshGeometry(shape as CANNON.Trimesh)
				obj3d = new THREE.Mesh(geometry, this._material)
				this.registerComplexShapeWithObj3d(obj3d, shape, geometry)
				break
			}
			case HEIGHTFIELD: {
				const geometry = createHeightfieldGeometry(shape as CANNON.Heightfield)
				obj3d = new THREE.LineSegments(geometry, this._lineMaterial)
				this.registerComplexShapeWithObj3d(obj3d, shape, geometry)
				break
			}
		}

		if (obj3d) {
			obj3d.userData.shapeType = shape.type
			this._objsGroup.add(obj3d)
		}
		return obj3d ?? new THREE.Object3D()
	}

	private registerComplexShapeWithObj3d(
		obj3d: THREE.Object3D,
		shape: CANNON.Shape,
		geometry: THREE.BufferGeometry
	) {
		;(shape as ComplexShape).geometryId = geometry.id
		this._geometries.set(geometry.id, geometry)
		obj3d.userData.isComplexShapeObj3d = true
	}

	private scaleObj3d(obj3d: THREE.Object3D, shape: CANNON.Shape | ComplexShape): void {
		const { SPHERE, BOX, PLANE, CYLINDER, CONVEXPOLYHEDRON, TRIMESH, HEIGHTFIELD } =
			CANNON.Shape.types
		switch (shape.type) {
			case SPHERE: {
				const { radius } = shape as CANNON.Sphere
				obj3d.scale.set(radius, radius, radius)
				break
			}
			case BOX: {
				obj3d.scale.copy(
					(shape as CANNON.Box).halfExtents as unknown as THREE.Vector3
				)
				obj3d.scale.multiplyScalar(2)
				break
			}
			case TRIMESH: {
				obj3d.scale
					.copy((shape as CANNON.Trimesh).scale as unknown as THREE.Vector3)
				break
			}
		}
	}

	private typeMatch(
		obj3d: THREE.Object3D,
		shape: CANNON.Shape | ComplexShape
	): boolean {
		if (!obj3d) return false
		if (obj3d.userData.isComplexShapeObj3d && hasGeometry(obj3d)) {
			return (
				obj3d.userData.shapeType === shape.type &&
				obj3d.geometry.id === (shape as ComplexShape).geometryId
			)
		}
		return obj3d.userData.shapeType === shape.type
	}

	private updateObj3d(index: number, shape: CANNON.Shape | ComplexShape): boolean {
		let obj3d = this._objs3d[index]
		let didCreateNewObj3d = false

		if (!this.typeMatch(obj3d, shape)) {
			if (obj3d) this.removeObj3d(obj3d)
			this._objs3d[index] = obj3d = this.createObj3d(shape)
			didCreateNewObj3d = true
		}

		this.scaleObj3d(obj3d, shape)
		return didCreateNewObj3d
	}

	private removeObj3d(obj3d: THREE.Object3D) {
		this._objsGroup.remove(obj3d)
		if (!hasGeometry(obj3d) || !obj3d.userData.isComplexShapeObj3d) return

		this._geometries.delete(obj3d.geometry.id)
		obj3d.geometry.dispose()
	}

	/**
	 * @description The `update()` method needs to be called after `cannon` physics world's step
	 * and before `three.js` render to update its state.
	 * @example
	 * const animate = () => {
	 * 	requestAnimationFrame(animate)
	 *
	 * 	world.step(timeStep) // Update cannon-es physics
	 * 	cannonDebugger.update() // Update the CannonEsDebuggerPro
	 * 	renderer.render(scene, camera) // Render the three.js scene
	 * }
	 * animate()
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
				const obj3d = this._objs3d[obj3dIndex]

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

					if (didCreateNewObj3d && this._options.onInit)
						this._options.onInit(body, obj3d, shape)
					if (!didCreateNewObj3d && this._options.onUpdate)
						this._options.onUpdate(body, obj3d, shape)
				}

				obj3dIndex++
			}
		}

		for (let i = obj3dIndex; i < this._objs3d.length; i++) {
			const obj3d = this._objs3d[i]
			if (obj3d) this.removeObj3d(obj3d)
		}

		this._objs3d.length = obj3dIndex
	}

	/**
	 * @param {THREE.ColorRepresentation} color
	 * @description Set wireframe color of debug 3d objects.
	 */
	setColor(color: THREE.ColorRepresentation) {
		this._material.color.set(color)
		this._lineMaterial.color.set(color)
		this._material.needsUpdate = true
		this._lineMaterial.needsUpdate = true
		return this
	}

	/**
	 * @param {boolean} isVisible
	 * @description Use to hide or show back debugs. It doesn't remove and dispose anything.
	 */
	setVisible(isVisible: boolean) {
		this._isVisible = isVisible
		this._objsGroup.visible = isVisible
		return this
	}

	/**
	 * @param {boolean} isVisible
	 * @description Set geometry offset for all debug 3d objects to prevent overlapping with source graphics.
	 */
	setOffset(offset: number) {
		this._offset.value = offset
	}

	/**
	 * @description Removes all debug 3d objects and does `dispose` for all created geometries
	 * of complex shapes. Shared materials won't be disposed and the `update()` method will be still working.
	 * You are able to continue using this instance after calling the method.
	 * If you want to destroy instance fully not to use it anymore then use `destroy()`.
	 */
	clear() {
		this._objs3d = []
		while (this._objsGroup.children.length > 0) {
			this._objsGroup.remove(this._objsGroup.children[0])
		}
		this._geometries.forEach((value) => {
			value.dispose()
		})
		this._geometries.clear()
	}

	/**
	 * @description The method `destroy()` is called to remove all created debug 3d objects and
	 * dispose all created geometries for complex shapes and shared materials of this instance.
	 * After calling `destroy()` the method `update()` won't work anymore and property (read-only) `isDestroyed` will become `true`.
	 */
	destroy() {
		this._isDestroyed = true
		const parent = this._objsGroup.parent
		parent?.remove(this._objsGroup)
		this.clear()
		this._material.dispose()
		this._lineMaterial.dispose()
	}
}

function formatCoord(num: number) {
	if (Math.abs(num) < 1e-10) {
		return "0"
	}
	return num.toString()
}

function buildVertexKey(x: number, y: number, z: number) {
	return `${formatCoord(x)},${formatCoord(y)},${formatCoord(z)}`
}

function createComplexShapeGeoemtry(
	shapeIndices: Int16Array | number[],
	shapeVertices: Float32Array | number[]
): THREE.BufferGeometry {
	const geometry = new THREE.BufferGeometry()

	const positions = []
	const indices = []
	const verticesMap = new Map()

	let index = 0

	for (let i = 0; i < shapeIndices.length; i += 3) {
		for (let j = 0; j < 3; j++) {
			const idx = shapeIndices[i + j]

			const x = shapeVertices[idx * 3]
			const y = shapeVertices[idx * 3 + 1]
			const z = shapeVertices[idx * 3 + 2]
			const vertexKey = buildVertexKey(x, y, z)

			if (verticesMap.has(vertexKey)) {
				indices.push(verticesMap.get(vertexKey))
			} else {
				positions.push(x, y, z)
				verticesMap.set(vertexKey, index)
				indices.push(index)
				index++
			}
		}
	}

	geometry.setIndex(indices)
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
	geometry.computeVertexNormals()
	geometry.computeBoundingBox()
	return geometry
}

function removeDuplicatedVerteciesAndMakeItSmooth(
	geometry: THREE.BufferGeometry
): THREE.BufferGeometry {
	const srcVertices = geometry.attributes.position.array
	const srcIndices = geometry.index ? Array.from(geometry.index.array) : null

	if(!srcIndices) return geometry

	const positions = [] as number[]
	const indices = [] as number[]
	const verticesMap = new Map()

	let index = 0

	for (let i = 0; i < srcIndices.length; i += 3) {
		for (let j = 0; j < 3; j++) {
			const idx = srcIndices[i + j]

			const x = srcVertices[idx * 3]
			const y = srcVertices[idx * 3 + 1]
			const z = srcVertices[idx * 3 + 2]
			const vertexKey = buildVertexKey(x, y, z)

			if (verticesMap.has(vertexKey)) {
				indices.push(verticesMap.get(vertexKey))
			} else {
				positions.push(x, y, z)
				verticesMap.set(vertexKey, index)
				indices.push(index)
				index++
			}
		}
	}

	geometry.setIndex(indices)
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
	geometry.computeVertexNormals()
	return geometry
}


function createTrimeshGeometry(shape: CANNON.Trimesh): THREE.BufferGeometry {
	return createComplexShapeGeoemtry(shape.indices, shape.vertices)
}

function createConvexPolyhedronGeometry(
	shape: CANNON.ConvexPolyhedron
): THREE.BufferGeometry {
	const shapeIndices: number[] = []
	for (let i = 0; i < shape.faces.length; i++) {
		const face = shape.faces[i]
		const a = face[0]
		for (let j = 1; j < face.length - 1; j++) {
			const b = face[j]
			const c = face[j + 1]
			shapeIndices.push(a, b, c)
		}
	}

	const shapeVerticies = [] as number[]
	for (let i = 0; i < shape.vertices.length; i++) {
		const vertex = shape.vertices[i]
		shapeVerticies.push(vertex.x, vertex.y, vertex.z)
	}

	return createComplexShapeGeoemtry(shapeIndices, shapeVerticies)
}

function createHeightfieldGeometry(shape: CANNON.Heightfield): THREE.BufferGeometry {
	const geometry = new THREE.BufferGeometry()
	const s = shape.elementSize || 1
	const vertices = [] as number[]
	const normals = [] as number[]

	for (let xi = 0; xi < shape.data.length; xi++) {
		for (let yi = 0; yi < shape.data[xi].length; yi++) {
			if (xi < shape.data.length - 1) {
				// horiz
				vertices.push(xi * s, yi * s, shape.data[xi][yi])
				vertices.push((xi + 1) * s, yi * s, shape.data[xi + 1][yi])
				normals.push(0, 0, 1)
				normals.push(0, 0, 1)
			}
			if (yi < shape.data[xi].length - 1) {
				// vetical
				vertices.push(xi * s, yi * s, shape.data[xi][yi])
				vertices.push(xi * s, (yi + 1) * s, shape.data[xi][yi + 1])
				normals.push(0, 0, 1)
				normals.push(0, 0, 1)
			}
		}
	}

	geometry.setAttribute(
		"position",
		new THREE.Float32BufferAttribute(new Float32Array(vertices), 3)
	)
	geometry.setAttribute(
		"normal",
		new THREE.Float32BufferAttribute(new Float32Array(normals), 3)
	)
	return geometry
}

function hasGeometry<TObject3D extends THREE.Object3D>(
	obj: TObject3D
): obj is TObject3D & { geometry: THREE.BufferGeometry } {
	return obj.hasOwnProperty("geometry")
}
