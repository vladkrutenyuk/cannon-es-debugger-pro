import * as CANNON from "cannon-es";
import * as THREE from "three";

const _vt = new CANNON.Vec3();
export class ConvexPolyhedronShapeGeometry extends THREE.BufferGeometry {
	constructor(shape: CANNON.ConvexPolyhedron) {
		super();
		const normalArray = [] as number[];
		const positionArray = [] as number[];
		for (let i = 0; i < shape.faces.length; i++) {
			const indicies = shape.faces[i];

			for (let j = 0; j < indicies.length; j++) {
				const idx = indicies[j];
				const nextIdx = indicies[(j + 1) % indicies.length];
				const vertex = shape.vertices[idx];
				const nextVertex = shape.vertices[nextIdx];

				positionArray.push(vertex.x, vertex.y, vertex.z);
				_vt.set(vertex.x, vertex.y, vertex.z).normalize();
				normalArray.push(_vt.x, _vt.y, _vt.z);

				positionArray.push(nextVertex.x, nextVertex.y, nextVertex.z);
				_vt.set(nextVertex.x, nextVertex.y, nextVertex.z).normalize();
				normalArray.push(_vt.x, _vt.y, _vt.z);
			}
		}

		const position = new THREE.Float32BufferAttribute(positionArray, 3);
		const normal = new THREE.Float32BufferAttribute(normalArray, 3);
		this.setAttribute("position", position);
		this.setAttribute("normal", normal);
		this.computeBoundingBox();
		this.computeBoundingSphere();
	}
}
