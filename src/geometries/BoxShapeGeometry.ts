import * as THREE from "three";

export class BoxShapeGeometry extends THREE.BufferGeometry {
	constructor(width: number = 1, height: number = 1, depth: number = 1) {
		super();
		const positionArray = buildArray(width, height, depth);
		const position = new THREE.Float32BufferAttribute(positionArray, 3);
		const normal = new THREE.Float32BufferAttribute(_normals, 3);
		this.setAttribute("position", position);
		this.setAttribute("normal", normal);
		this.computeBoundingBox();
		this.computeBoundingSphere();
	}
}

const _normals = buildArray(1, 1, 1);
function buildArray(_x: number, _y: number, _z: number): number[] {
	const x = 0.5 * _x;
	const y = 0.5 * _y;
	const z = 0.5 * _z;
	return (
		// prettier-ignore
		[
        -x, -y, z,
        x, -y, z,
    
        x, -y, z,
        x, -y, -z,
    
        x, -y, -z,
        -x, -y, -z,
    
        -x, -y, -z,
        -x, -y, z,
    
        -x, y, z,
        x, y, z,
    
        x, y, z,
        x, y, -z,
    
        x, y, -z,
        -x, y, -z,
    
        -x, y, -z,
        -x, y, z,
    
        x, -y, z,
        x, y, z,
    
        -x, -y, -z,
        -x, y, -z,
    
        x, -y, -z,
        x, y, -z,
    
        -x, -y, z,
        -x, y, z,
    ]
	);
}
