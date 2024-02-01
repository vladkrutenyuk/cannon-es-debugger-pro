import * as THREE from "three"

export class BoxEdgesGeometry extends THREE.BufferGeometry {
     /**
     * Create a new instance of {@link BoxGeometry}
     * @param width Width; that is, the length of the edges parallel to the X axis. Optional; Expects a `Float`. Default `1`
     * @param height Height; that is, the length of the edges parallel to the Y axis. Optional; Expects a `Float`. Default `1`
     * @param depth Depth; that is, the length of the edges parallel to the Z axis. Optional; Expects a `Float`. Default `1`
     * @param widthSegments Number of segmented rectangular faces along the width of the sides. Optional; Expects a `Integer`. Default `1`
     * @param heightSegments Number of segmented rectangular faces along the height of the sides. Optional; Expects a `Integer`. Default `1`
     * @param depthSegments Number of segmented rectangular faces along the depth of the sides. Optional; Expects a `Integer`. Default `1`
     */
	constructor(width: number = 1, height: number = 1, depth: number = 1) {
		super()
        const x = width * 0.5 // x
        const y = height * 0.5 // y
        const z = depth * 0.5 // z

        const points = [
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

		const position = new THREE.Float32BufferAttribute(points, 3)
		const normal = new THREE.Float32BufferAttribute(points, 3)
		this.setAttribute("position", position)
		this.setAttribute("normal", normal)
	}
}
