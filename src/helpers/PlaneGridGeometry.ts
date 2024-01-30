import * as THREE from "three"

export class PlaneGridGeometry extends THREE.BufferGeometry {
    constructor(size = 10, divisions = 10, offsetZ = 0) {
        super()
		const step = size / divisions
		const halfSize = size / 2

		const vertices = [] as number[]

		for (let i = 0, k = -halfSize; i <= divisions; i++, k += step) {
			vertices.push(-halfSize, k, offsetZ, halfSize, k, offsetZ)
			vertices.push(k, -halfSize, offsetZ, k, halfSize, offsetZ)
		}

		this.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
    }
}
