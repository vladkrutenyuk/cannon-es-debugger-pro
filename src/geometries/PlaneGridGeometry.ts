import * as THREE from "three"

export class PlaneGridGeometry extends THREE.BufferGeometry {
	constructor(size = 10, divisions = 10, offsetZ = 0) {
		super()
		const step = size / divisions
		const halfSize = size / 2

		const vertices = [] as number[]
		const normals = [] as number[]

		for (let i = 0, k = -halfSize; i <= divisions; i++, k += step) {
			vertices.push(-halfSize, k, offsetZ, halfSize, k, offsetZ)
			vertices.push(k, -halfSize, offsetZ, k, halfSize, offsetZ)
			normals.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1)
		}

		this.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
		this.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3))
	}
}
