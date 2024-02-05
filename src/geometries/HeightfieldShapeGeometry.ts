import * as CANNON from "cannon-es";
import * as THREE from "three";

export class HeightfieldShapeGeometry extends THREE.BufferGeometry {
	constructor(shape: CANNON.Heightfield) {
		super();
		const s = shape.elementSize || 1;
		const vertices: number[] = [];
		const normals: number[] = [];

		for (let xi = 0; xi < shape.data.length; xi++) {
			for (let yi = 0; yi < shape.data[xi].length; yi++) {
				if (xi < shape.data.length - 1) {
					// horiz
					vertices.push(xi * s, yi * s, shape.data[xi][yi]);
					vertices.push((xi + 1) * s, yi * s, shape.data[xi + 1][yi]);
					normals.push(0, 0, 1, 0, 0, 1);
				}
				if (yi < shape.data[xi].length - 1) {
					// vetical
					vertices.push(xi * s, yi * s, shape.data[xi][yi]);
					vertices.push(xi * s, (yi + 1) * s, shape.data[xi][yi + 1]);
					normals.push(0, 0, 1, 0, 0, 1);
				}
			}
		}

		this.setAttribute(
			"position",
			new THREE.Float32BufferAttribute(new Float32Array(vertices), 3)
		);
		this.setAttribute(
			"normal",
			new THREE.Float32BufferAttribute(new Float32Array(normals), 3)
		);
	}
}
