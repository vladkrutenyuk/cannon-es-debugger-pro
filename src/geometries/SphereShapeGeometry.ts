import * as THREE from "three";

export class SphereShapeGeometry extends THREE.BufferGeometry {
	constructor(radius = 1, segments = 64) {
		super();
		const veticies: number[] = [];
		const normals: number[] = [];
		const thetaDelta = (1 / segments) * Math.PI * 2;
		let theta = 0;
		for (let i = 0; i < segments; i++) {
			const theta1 = theta;
			const theta2 = theta1 + thetaDelta;

			const x1 = Math.cos(theta1) * radius;
			const y1 = Math.sin(theta1) * radius;
			const x2 = Math.cos(theta2) * radius;
			const y2 = Math.sin(theta2) * radius;

			veticies.push(x1, y1, 0, x2, y2, 0);
			normals.push(x1, y1, 0, x2, y2, 0);

			veticies.push(x1, 0, y1, x2, 0, y2);
			normals.push(x1, 0, y1, x2, 0, y2);

			veticies.push(0, x1, y1, 0, x2, y2);
			normals.push(0, x1, y1, 0, x2, y2);

			theta += thetaDelta;
		}

		this.setAttribute("position", new THREE.Float32BufferAttribute(veticies, 3));
		this.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
		this.computeBoundingBox();
		this.computeBoundingSphere();
	}
}
