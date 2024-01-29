import * as CANNON from "cannon-es"
import * as THREE from "three"
import { DebugSphere } from "./helpers/DebugSphere"
import { CircleEdgeGeometry } from "./helpers/CircleEdgeGeometry"
import { DebugOptions } from "./DebugOptions"

const _v0 = new CANNON.Vec3()
const _v1 = new CANNON.Vec3()
const _v2 = new CANNON.Vec3()
const _q0 = new CANNON.Quaternion()
const _circleEdgeGeometry = new CircleEdgeGeometry(1)
const _boxGeometry = new THREE.BoxGeometry(1, 1, 1)
const _boxEdgesGeometry = new THREE.EdgesGeometry(_boxGeometry)
const _planeGeometry = new THREE.PlaneGeometry(200, 200, 20, 20)
_planeGeometry.translate(0, 0, 0.0001)

type ComplexShape = CANNON.Shape & { geometryId?: number }

/**
 * This is improved pro debugger for [cannon-es](https://github.com/pmndrs/cannon-es) with [three](https://github.com/pmndrs/cannon-es) to visualize all bodies and its shapes of physics world.
 */
export default class CannonEsDebuggerPro {
	private readonly _material: THREE.MeshBasicMaterial
	private readonly _lineMaterial: THREE.LineBasicMaterial
	private readonly _world: CANNON.World
	private readonly _objsGroup: THREE.Group

	private readonly _options: DebugOptions = {
		color: 0x00ff00,
		scale: 1,
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
		this._lineMaterial = new THREE.LineBasicMaterial({ color, toneMapped: false })
	}

	private createObj3d(shape: CANNON.Shape): THREE.Object3D {
		let obj3d: THREE.Object3D | null = null
		const { SPHERE, BOX, PLANE, CYLINDER, CONVEXPOLYHEDRON, TRIMESH, HEIGHTFIELD } =
			CANNON.Shape.types

		const material = this._material
		switch (shape.type) {
			case SPHERE: {
				obj3d = new DebugSphere(this._lineMaterial, _circleEdgeGeometry)
				break
			}
			case BOX: {
				obj3d = new THREE.LineSegments(_boxEdgesGeometry, this._lineMaterial)
				break
			}
			case PLANE: {
				obj3d = new THREE.Mesh(_planeGeometry, material)
				break
			}
			case CYLINDER: {
				const shapeCyl = shape as CANNON.Cylinder
				const geometry = new THREE.CylinderGeometry(
					shapeCyl.radiusTop,
					shapeCyl.radiusBottom,
					shapeCyl.height,
					shapeCyl.numSegments
				)
				obj3d = new THREE.Mesh(geometry, material)
				;(shape as ComplexShape).geometryId = geometry.id
				break
			}
			case CONVEXPOLYHEDRON: {
				obj3d = this.createComplexShapeMesh(createConvexPolyhedronGeometry, shape)
				break
			}
			case TRIMESH: {
				obj3d = this.createComplexShapeMesh(createTrimeshGeometry, shape)
				break
			}
			case HEIGHTFIELD: {
				obj3d = this.createComplexShapeMesh(createHeightfieldGeometry, shape)
				break
			}
		}
		obj3d = obj3d ?? new THREE.Object3D()
		this._objsGroup.add(obj3d)
		return obj3d
	}

	private createComplexShapeMesh<TShape extends CANNON.Shape>(
		fn: (shape: TShape) => THREE.BufferGeometry,
		shape: CANNON.Shape
	): THREE.Mesh {
		const geometry = fn(shape as TShape)
		const mesh = new THREE.Mesh(geometry, this._material)
		;(shape as ComplexShape).geometryId = geometry.id
		this._geometries.set(geometry.id, geometry)
		mesh.userData.isComplexShapeMesh = true
		return mesh
	}

	private scaleObj3d(obj3d: THREE.Object3D, shape: CANNON.Shape | ComplexShape): void {
		const scale = this._options.scale ?? 1
		const { SPHERE, BOX, PLANE, CYLINDER, CONVEXPOLYHEDRON, TRIMESH, HEIGHTFIELD } =
			CANNON.Shape.types
		switch (shape.type) {
			case SPHERE: {
				const { radius } = shape as CANNON.Sphere
				obj3d.scale.set(radius * scale, radius * scale, radius * scale)
				break
			}
			case BOX: {
				obj3d.scale.copy(
					(shape as CANNON.Box).halfExtents as unknown as THREE.Vector3
				)
				obj3d.scale.multiplyScalar(2 * scale)
				break
			}
			case PLANE: {
				break
			}
			case CYLINDER: {
				obj3d.scale.set(1 * scale, 1 * scale, 1 * scale)
				break
			}
			case CONVEXPOLYHEDRON: {
				obj3d.scale.set(1 * scale, 1 * scale, 1 * scale)
				break
			}
			case TRIMESH: {
				obj3d.scale
					.copy((shape as CANNON.Trimesh).scale as unknown as THREE.Vector3)
					.multiplyScalar(scale)
				break
			}
			case HEIGHTFIELD: {
				obj3d.scale.set(1 * scale, 1 * scale, 1 * scale)
				break
			}
		}
	}

	private typeMatch(
		obj3d: THREE.Object3D,
		shape: CANNON.Shape | ComplexShape
	): boolean {
		if (!obj3d) return false
		if (!isMesh(obj3d)) {
			return (
				(obj3d instanceof DebugSphere &&
					shape.type === CANNON.Shape.types.SPHERE) ||
				(obj3d instanceof THREE.LineSegments &&
					shape.type === CANNON.Shape.types.BOX)
			)
		}
		const { geometry } = obj3d
		return (
			(geometry instanceof THREE.PlaneGeometry &&
				shape.type === CANNON.Shape.types.PLANE) ||
			(geometry.id === (shape as ComplexShape).geometryId &&
				shape.type === CANNON.Shape.types.CYLINDER) ||
			(geometry.id === (shape as ComplexShape).geometryId &&
				shape.type === CANNON.Shape.types.CONVEXPOLYHEDRON) ||
			(geometry.id === (shape as ComplexShape).geometryId &&
				shape.type === CANNON.Shape.types.TRIMESH) ||
			(geometry.id === (shape as ComplexShape).geometryId &&
				shape.type === CANNON.Shape.types.HEIGHTFIELD)
		)
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
		if (!isMesh(obj3d) || !obj3d.userData.isComplexShapeMesh) return

		const geometry = this._geometries.get(obj3d.geometry.id)
		if (!geometry) return
		this._geometries.delete(obj3d.geometry.id)
		geometry.dispose()
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

		const shapeWorldPosition = _v0
		const shapeWorldQuaternion = _q0

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

function createTrimeshGeometry(shape: CANNON.Trimesh): THREE.BufferGeometry {
	const geometry = new THREE.BufferGeometry()
	const positions: number[] = []
	const v0 = _v0
	const v1 = _v1
	const v2 = _v2

	for (let i = 0; i < shape.indices.length / 3; i++) {
		shape.getTriangleVertices(i, v0, v1, v2)
		positions.push(v0.x, v0.y, v0.z)
		positions.push(v1.x, v1.y, v1.z)
		positions.push(v2.x, v2.y, v2.z)
	}

	geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
	geometry.computeBoundingSphere()
	geometry.computeVertexNormals()
	return geometry
}

function createConvexPolyhedronGeometry(
	shape: CANNON.ConvexPolyhedron
): THREE.BufferGeometry {
	const geometry = new THREE.BufferGeometry()

	// Add vertices
	const positions: number[] = []
	for (let i = 0; i < shape.vertices.length; i++) {
		const vertex = shape.vertices[i]
		positions.push(vertex.x, vertex.y, vertex.z)
	}
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))

	// Add faces
	const indices: number[] = []
	for (let i = 0; i < shape.faces.length; i++) {
		const face = shape.faces[i]
		const a = face[0]
		for (let j = 1; j < face.length - 1; j++) {
			const b = face[j]
			const c = face[j + 1]
			indices.push(a, b, c)
		}
	}

	geometry.setIndex(indices)
	geometry.computeBoundingSphere()
	geometry.computeVertexNormals()
	return geometry
}

function createHeightfieldGeometry(shape: CANNON.Heightfield): THREE.BufferGeometry {
	const geometry = new THREE.BufferGeometry()
	const s = shape.elementSize || 1 // assumes square heightfield, else i*x, j*y
	const positions = shape.data.flatMap((row, i) =>
		row.flatMap((z, j) => [i * s, j * s, z])
	)
	const indices: number[] = []

	for (let xi = 0; xi < shape.data.length - 1; xi++) {
		for (let yi = 0; yi < shape.data[xi].length - 1; yi++) {
			const stride = shape.data[xi].length
			const index = xi * stride + yi
			indices.push(index + 1, index + stride, index + stride + 1)
			indices.push(index + stride, index + 1, index)
		}
	}

	geometry.setIndex(indices)
	geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
	geometry.computeBoundingSphere()
	geometry.computeVertexNormals()
	return geometry
}

function isMesh<
	TMat extends THREE.Material | THREE.Material[],
	TGeom extends THREE.BufferGeometry = THREE.BufferGeometry
>(obj: THREE.Object3D): obj is THREE.Mesh<TGeom, TMat> {
	return (obj as THREE.Mesh).isMesh || obj.type === "Mesh"
}
