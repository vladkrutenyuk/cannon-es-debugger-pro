import * as CANNON from "cannon-es"
import * as THREE from "three"
import CannonEsDebuggerPro from "../CannonEsDebuggerPro"
import * as LILGUI from "three/examples/jsm/libs/lil-gui.module.min"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

console.log("demo.ts")

function init(root: HTMLDivElement) {
	// Scene
	const scene = new THREE.Scene()
	scene.fog = new THREE.Fog(0x000000, 500, 1000)
	// scene.background = new THREE.Color(0xaaaaaa)
	const camera = new THREE.PerspectiveCamera()
	camera.far = 100
	camera.near = 2
	camera.position.set(5, 4, 5)
	camera.lookAt(new THREE.Vector3())

	// renderer
	const renderer = new THREE.WebGLRenderer({
		antialias: true,
		logarithmicDepthBuffer: true,
	})
	renderer.shadowMap.enabled = true
	renderer.shadowMap.type = THREE.PCFSoftShadowMap

	renderer.setPixelRatio(2)
	renderer.setClearColor(scene.fog.color)
	root.append(renderer.domElement)
	renderer.domElement.tabIndex = 0
	renderer.domElement.style.touchAction = "none"
	renderer.domElement.focus()

	// orbit controls
	const orbitControls = new OrbitControls(camera, renderer.domElement)

	// Lights
	const ambientLight = new THREE.AmbientLight(0xffffff, 0.05)
	ambientLight.position.setY(5)
	scene.add(ambientLight)

	const spotLight = new THREE.SpotLight(0xffffff, 5, 10, Math.PI / 3, 1)
	spotLight.position.set(0, 4, 0)
	spotLight.castShadow = true
	scene.add(spotLight)

	spotLight.shadow.mapSize.width = 1024;  // Увеличьте для лучшего качества
	spotLight.shadow.mapSize.height = 1024; // Увеличьте для лучшего качества

	// Resizing
	const resizeHandler = () => {
		const width = root.offsetWidth
		const height = root.offsetHeight
		camera.aspect = width / height
		camera.updateProjectionMatrix()
		renderer.setSize(width, height)
	}
	const resizeObserver = new ResizeObserver(resizeHandler)
	resizeObserver.observe(root)
	resizeHandler()

	// physics init
	const world = new CANNON.World()
	world.gravity.set(0, -9.81, 0)
	world.allowSleep = true
	world.defaultContactMaterial.friction = 0.4

	world.broadphase = new CANNON.NaiveBroadphase()

	const solver = new CANNON.GSSolver()
	solver.iterations = 5
	solver.tolerance = 0.2
	world.solver = new CANNON.SplitSolver(solver)

	// debugger
	const cannonDebugger = new CannonEsDebuggerPro(scene, world, {
		// scale: 1.005,
		onInit: (body, obj3d, shape) => {
			console.log(`init body-${body.id} shape-${shape.id} obj3d-${obj3d.id}`)
		},
	})
	const autoUpdateObj = {
		autoUpdate: true,
	}

	const axes = new THREE.AxesHelper(100)
	axes.position.set(0.01, 0.01, 0.01)
	scene.add(axes)

	// bodies

	const bodies = [] as CANNON.Body[]
	const meshes = [] as THREE.Mesh[]
	const bodyProps = {
		world,
		scene,
		callback: (body: CANNON.Body, mesh: THREE.Mesh) => {
			bodies.push(body)
			meshes.push(mesh)
		},
	}
	addBox(bodyProps)
	addCylinder(bodyProps)
	addHeightfield(bodyProps)
	addPlane(bodyProps)
	addSphere(bodyProps)
	addTrimesh(bodyProps)

	const updateMeshPositions = () => {
		for (let i = 0; i < meshes.length; i++) {
			//@ts-ignore
			meshes[i].position.copy(bodies[i].position)
			//@ts-ignore
			meshes[i].quaternion.copy(bodies[i].quaternion)
		}
	}

	// animate

	const animate = () => {
		requestAnimationFrame(animate)

		world.fixedStep()
		autoUpdateObj.autoUpdate && cannonDebugger.update()
		updateMeshPositions()
		renderer.render(scene, camera)
	}
	animate()

	// gui

	const gui = new LILGUI.GUI()

	const visibleObj = { visible: true }
	gui.add(visibleObj, "visible").onChange((visible) => {
		cannonDebugger.setVisible(visible)
	})
	gui.addColor({ color: "#00ff00" }, "color").onChange((color) => {
		cannonDebugger.setColor(color)
	})
	gui.add(autoUpdateObj, "autoUpdate").name("Auto update")

	const btns = {
		clear: () => {
			console.log("clear")
			cannonDebugger.clear()
		},
		destroy: () => {
			console.log("destroy")
			cannonDebugger.destroy()
		},
		update: () => {
			console.log("manual update")
			cannonDebugger.update()
		},
	} as const

	for (let key in btns) {
		gui.add(btns, key as keyof typeof btns)
	}
}

const mass = 7
const material = new THREE.MeshStandardMaterial({ color: "#ccc" })

function addPlane(props: {
	world: CANNON.World
	scene: THREE.Scene
	callback?: (body: CANNON.Body, mesh: THREE.Mesh) => void
}) {
	// Physics
	const shape = new CANNON.Plane()
	const body = new CANNON.Body({ mass: 0 })
	body.addShape(shape)
	body.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
	props.world.addBody(body)

	// Graphics
	const geometry = new THREE.PlaneGeometry(100, 100, 1, 1)
	const material = new THREE.MeshStandardMaterial({ color: "#666" })
	const mesh = new THREE.Mesh(geometry, material)
	// mesh.rotateX(-Math.PI/2)
	// position and quaternion of the mesh are set by updateMeshPositions...
	mesh.castShadow = true
	mesh.receiveShadow = true
	props.scene.add(mesh)

	props.callback && props.callback(body, mesh)
}

function addBox(props: {
	world: CANNON.World
	scene: THREE.Scene
	callback?: (body: CANNON.Body, mesh: THREE.Mesh) => void
}) {
	const size = 1

	// Physics
	const halfExtents = new CANNON.Vec3(size * 0.5, size * 0.5, size * 0.5)
	const shape = new CANNON.Box(halfExtents)
	const body = new CANNON.Body({ mass })
	body.addShape(shape)
	body.position.set(2, 2, 0.5)
	props.world.addBody(body)

	// Graphics
	const geometry = new THREE.BoxGeometry(size, size, size)
	const mesh = new THREE.Mesh(geometry, material)
	// position and quaternion of the mesh are set by updateMeshPositions...
	mesh.castShadow = true
	mesh.receiveShadow = true
	props.scene.add(mesh)

	props.callback && props.callback(body, mesh)
}

function addSphere(props: {
	world: CANNON.World
	scene: THREE.Scene
	callback?: (body: CANNON.Body, mesh: THREE.Mesh) => void
}) {
	const size = 0.7

	// Physics
	const body = new CANNON.Body({ mass })
	const shape = new CANNON.Sphere(size)
	body.addShape(shape)
	body.position.set(-0.5, 2, -1)
	props.world.addBody(body)

	// Graphics
	const geometry = new THREE.SphereGeometry(size)
	const mesh = new THREE.Mesh(geometry, material)
	// position and quaternion of the mesh are set by updateMeshPositions...
	mesh.castShadow = true
	mesh.receiveShadow = true
	props.scene.add(mesh)

	props.callback && props.callback(body, mesh)
}

function addCylinder(props: {
	world: CANNON.World
	scene: THREE.Scene
	callback?: (body: CANNON.Body, mesh: THREE.Mesh) => void
}) {
	const size = 1
	const radialSegments = 15

	// Physics
	const body = new CANNON.Body({ mass })
	const shape = new CANNON.Cylinder(size * 0.5, size * 0.5, size, radialSegments)
	body.addShape(shape)
	body.position.set(0, 2, 1.5)
	props.world.addBody(body)

	// Graphics
	const geometry = new THREE.CylinderGeometry(
		size * 0.5,
		size * 0.5,
		size,
		radialSegments
	)
	const mesh = new THREE.Mesh(geometry, material)
	// position and quaternion of the mesh are set by updateMeshPositions...
	mesh.castShadow = true
	mesh.receiveShadow = true
	props.scene.add(mesh)

	props.callback && props.callback(body, mesh)
}

function addTrimesh(props: {
	world: CANNON.World
	scene: THREE.Scene
	callback?: (body: CANNON.Body, mesh: THREE.Mesh) => void
}) {
	const radius = 1
	const tube = 0.3
	const radialSegments = 16

	// Physics
	const body = new CANNON.Body({ mass })
	const shape = CANNON.Trimesh.createTorus(radius, tube, radialSegments, 16)
	body.addShape(shape)
	body.position.set(-3, 2, -1)
	body.quaternion.setFromEuler(Math.PI * 0.1, 0, 0)
	props.world.addBody(body)

	// Graphics
	const geometry = new THREE.TorusGeometry(radius, tube, radialSegments, 16)
	const mesh = new THREE.Mesh(geometry, material)
	// position and quaternion of the mesh are set by updateMeshPositions...
	mesh.castShadow = true
	mesh.receiveShadow = true
	props.scene.add(mesh)

	props.callback && props.callback(body, mesh)
}

function addHeightfield(props: {
	world: CANNON.World
	scene: THREE.Scene
	callback?: (body: CANNON.Body, mesh: THREE.Mesh) => void
}) {
	const sizeX = 20 // number of vertices in the X axis
	const sizeY = 20 // number of vertices in the Y axis
	const elementSize = 0.3 // cell width
	const depth = 0.6

	// Physics
	const body = new CANNON.Body({ mass: 0 })
	const matrix: number[][] = []
	for (let i = 0; i < sizeX; i++) {
		matrix.push([])
		for (let j = 0; j < sizeY; j++) {
			const height =
				Math.cos((i / (sizeX - 1)) * Math.PI * 2) *
				Math.cos((j / (sizeY - 1)) * Math.PI * 2) *
				depth
			matrix[i].push(height)
		}
	}
	const shape = new CANNON.Heightfield(matrix, { elementSize })
	body.addShape(
		shape,
		new CANNON.Vec3(
			(-(sizeX - 1) / 2) * elementSize,
			(-(sizeY - 1) / 2) * elementSize,
			0
		)
	)
	body.position.set(0, depth, -6)
	body.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
	props.world.addBody(body)

	// Graphics
	const geometry = new THREE.PlaneGeometry(
		(sizeX - 1) * elementSize,
		(sizeY - 1) * elementSize,
		sizeX - 1,
		sizeY - 1
	)
	for (let i = 0; i < sizeX; i++) {
		for (let j = 0; j < sizeY; j++) {
			const height =
				Math.cos((i / (sizeX - 1)) * Math.PI * 2) *
				Math.cos((j / (sizeY - 1)) * Math.PI * 2) *
				depth

			geometry.attributes.position.setZ(i * sizeX + j, height)
		}
	}
	geometry.computeBoundingSphere()
	geometry.computeVertexNormals()
	const mesh = new THREE.Mesh(geometry, material)
	// position and quaternion of the mesh are set by updateMeshPositions...
	mesh.castShadow = true
	mesh.receiveShadow = true
	props.scene.add(mesh)

	props.callback && props.callback(body, mesh)
}

const root = document.querySelector("#root") as HTMLDivElement | null
root && init(root)
