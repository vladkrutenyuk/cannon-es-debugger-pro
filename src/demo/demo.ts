console.log("demo.ts")

import * as CANNON from "cannon-es"
import * as THREE from "three"
import CannonEsDebuggerPro from "../CannonEsDebuggerPro"

function init(root: HTMLDivElement) {
	const scene = new THREE.Scene()
	const camera = new THREE.PerspectiveCamera()
	const renderer = new THREE.WebGLRenderer({
		antialias: true,
		logarithmicDepthBuffer: true,
	})

	root.append(renderer.domElement)

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

	renderer.domElement.tabIndex = 0
	renderer.domElement.style.touchAction = "none"
	renderer.domElement.focus()

	const world = new CANNON.World()
	const cannonDebugger = new CannonEsDebuggerPro(scene, world, {
		onInit(body, obj3d, shape) {
			console.log(`init body-${body.id} shape-${shape.id} obj3d-${obj3d.id}`)
		},
		onUpdate(body, obj3d, shape) {
			// console.log(`update body-${body.id} shape-${shape.id}`)
		},
	})

	const animate = () => {
		requestAnimationFrame(animate)

		world.fixedStep()
		cannonDebugger.update()
		renderer.render(scene, camera)
	}
	animate()

	scene.background = new THREE.Color(0xaaaaaa)
	camera.position.set(15, 10, 15)
	camera.lookAt(new THREE.Vector3())

	scene.add(new THREE.GridHelper(50, 25))

	const sphereBody = new CANNON.Body().addShape(new CANNON.Sphere(2))
	world.addBody(sphereBody)

	const boxBody = new CANNON.Body().addShape(
		new CANNON.Box(new CANNON.Vec3(3, 2, 2)),
		new CANNON.Vec3(4, 3, -7)
	)
	world.addBody(boxBody)

	setTimeout(() => {
		cannonDebugger.clear()
		console.log("clear")
	}, 1500)

	setTimeout(() => {
		cannonDebugger.destroy()
		console.log("destroy")
	}, 2500)
}

const root = document.querySelector("#root") as HTMLDivElement | null
root && init(root)
