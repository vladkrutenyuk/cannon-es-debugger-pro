import type * as CANNON from "cannon-es"
import type * as THREE from "three"

export interface DebugOptions {
	/**
	 * Sets the wireframe color for debug 3d objects.
	 * Default is 0x00ff00 (green)
	 */
	color?: THREE.ColorRepresentation
	/**
	 * Scale factor for all debug 3d objects.
	 * Default is 1
	 */
	scale?: number
	/**
	 * Callback function that runs once, right after a new debug 3d object is added.
	 */
	onInit?: (body: CANNON.Body, obj3d: THREE.Object3D, shape: CANNON.Shape) => void
	/**
	 * Callback function that runs on every subsequent animation frame.
	 */
	onUpdate?: (body: CANNON.Body, obj3d: THREE.Object3D, shape: CANNON.Shape) => void
}