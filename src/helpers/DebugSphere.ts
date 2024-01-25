import * as THREE from "three"
import { CircleEdgeGeometry } from "./CircleEdgeGeometry"

export class DebugSphere extends THREE.Object3D {
	readonly geometry: CircleEdgeGeometry
	readonly material: THREE.LineBasicMaterial

	constructor(material: THREE.LineBasicMaterial, geometry: CircleEdgeGeometry) {
		super()

		const circle1 = new THREE.LineLoop(geometry, material)

		const circle2 = new THREE.LineLoop(geometry, material)
		circle2.rotateX(Math.PI * 0.5)

		const circle3 = new THREE.LineLoop(geometry, material)
		circle3.rotateX(Math.PI * 0.5)
		circle3.rotateY(Math.PI * 0.5)

		this.add(circle1, circle2, circle3)

		this.geometry = geometry
		this.material = material
	}
}
