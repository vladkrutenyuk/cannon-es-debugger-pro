import * as THREE from "three"

export class CircleEdgeGeometry extends THREE.BufferGeometry {
	constructor(radius = 1, segments = 64) {
		super()
		const points: THREE.Vector3[] = []
		for (let i = 0; i <= segments; i++) {
			const theta = (i / segments) * Math.PI * 2
			points.push(
				new THREE.Vector3(Math.cos(theta) * radius, Math.sin(theta) * radius, 0)
			)
		}

		this.setFromPoints(points)
	}
}
