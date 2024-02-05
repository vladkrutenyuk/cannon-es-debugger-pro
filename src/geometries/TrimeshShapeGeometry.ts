import * as THREE from "three";
import * as CANNON from "cannon-es";

export class TrimeshShapeGeometry extends THREE.BufferGeometry {
	constructor(shape: CANNON.Trimesh) {
		super();

		const positions: number[] = [];
		const indices: number[] = [];
		const verticesMap = new Map<string, number>();

		let index = 0;

		for (let i = 0; i < shape.indices.length; i += 3) {
			for (let j = 0; j < 3; j++) {
				const idx = shape.indices[i + j];

				const x = shape.vertices[idx * 3] as number | undefined;
				const y = shape.vertices[idx * 3 + 1] as number | undefined;
				const z = shape.vertices[idx * 3 + 2] as number | undefined;
				if (x === undefined || y === undefined || z === undefined) {
					console.error(
						"TrimeshShapeGeometry error;",
						"Some vertcicies by indicies are undefined;",
						`x = ${x} = shape.verticies[${idx * 3}];`,
						`y = ${y} = shape.verticies[${idx * 3 + 1}];`,
						`z = ${z} = shape.verticies[${idx * 3 + 2}];`,
						"Please check and revise geometry you use for CANNON.Trimesh;",
						`Body id = ${shape.body?.id}, shape id = ${shape.id};`
					);
					continue
				}
				const vertexKey = buildVertexKey(x, y, z);

				if (verticesMap.has(vertexKey)) {
					indices.push(verticesMap.get(vertexKey)!);
				} else {
					positions.push(x, y, z);
					verticesMap.set(vertexKey, index);
					indices.push(index);
					index++;
				}
			}
		}

		this.setIndex(indices);
		this.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
		this.computeVertexNormals();
		this.computeBoundingBox();
		this.computeBoundingSphere();
	}
}

function formatCoord(num: number): string {
	if (Math.abs(num) < 1e-10) {
		return "0";
	}
	return `${num}`;
}

function buildVertexKey(x: number, y: number, z: number) {
	return `${formatCoord(x)},${formatCoord(y)},${formatCoord(z)}`;
}
