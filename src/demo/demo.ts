import * as CANNON from "cannon-es"
import * as THREE from "three"
import CannonEsDebuggerPro from "../CannonEsDebuggerPro"
import * as LILGUI from "three/examples/jsm/libs/lil-gui.module.min"

console.log("demo.ts")

function init(root: HTMLDivElement) {
	// renderer
	const renderer = new THREE.WebGLRenderer({
		antialias: true,
		logarithmicDepthBuffer: true,
	})
	root.append(renderer.domElement)
	renderer.domElement.tabIndex = 0
	renderer.domElement.style.touchAction = "none"
	renderer.domElement.focus()

	// scene
	const scene = new THREE.Scene()
	const camera = new THREE.PerspectiveCamera()
	scene.background = new THREE.Color(0xaaaaaa)
	camera.position.set(15, 10, 15)
	camera.lookAt(new THREE.Vector3())

	// resizing
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
	world.gravity.set(0, -9.8, 0)
	world.allowSleep = true
	world.defaultContactMaterial.friction = 0.4

    world.broadphase = new CANNON.NaiveBroadphase()

	const solver = new CANNON.GSSolver()
	solver.iterations = 5
	solver.tolerance = 0.2
	world.solver = new CANNON.SplitSolver(solver)

	const cannonDebugger = new CannonEsDebuggerPro(scene, world, {
		onInit: (body, obj3d, shape) => {
			console.log(`init body-${body.id} shape-${shape.id} obj3d-${obj3d.id}`)
		},
	})

	const autoUpdateObj = {
		autoUpdate: true,
	}

    // animate

	const animate = () => {
		requestAnimationFrame(animate)

		world.fixedStep()
		autoUpdateObj.autoUpdate && cannonDebugger.update()
		renderer.render(scene, camera)
	}
	animate()

	const sphereBody = new CANNON.Body({ mass: 1 }).addShape(new CANNON.Sphere(2))
	sphereBody.position.y = 6
	world.addBody(sphereBody)

	const boxBody = new CANNON.Body({ mass: 1 }).addShape(
		new CANNON.Box(new CANNON.Vec3(3, 2, 2)),
		new CANNON.Vec3(4, 3, -7)
	)
	boxBody.position.y = 6
	world.addBody(boxBody)

	const groundBody = new CANNON.Body({ mass: 0 }).addShape(new CANNON.Plane())
	groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0)
	world.addBody(groundBody)

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

const root = document.querySelector("#root") as HTMLDivElement | null
root && init(root)
