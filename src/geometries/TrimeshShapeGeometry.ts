import * as THREE from "three"
import * as CANNON from 'cannon-es'

export class TrimeshShapeGeometry extends THREE.BufferGeometry {
	constructor(
		shape: CANNON.Trimesh
	) {
		super()

		const positions = []
		const indices = []
		const verticesMap = new Map()

		let index = 0

		for (let i = 0; i < shape.indices.length; i += 3) {
			for (let j = 0; j < 3; j++) {
				const idx = shape.indices[i + j]

				const x = shape.vertices[idx * 3]
				const y = shape.vertices[idx * 3 + 1]
				const z = shape.vertices[idx * 3 + 2]
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

		this.setIndex(indices)
		this.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3))
		this.computeVertexNormals()
		this.computeBoundingBox()
		this.computeBoundingSphere()
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

