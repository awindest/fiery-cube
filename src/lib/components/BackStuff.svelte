<script>
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { EighthGeometry } from '$components/geometries.js';

	const mu = THREE.MathUtils;
	const AMOUNT = 500;

	const geometry = new EighthGeometry().translate(-0.5, -0.5, -0.5);
	const material = new THREE.MeshPhysicalMaterial({
		color: '#840',
		metalness: 0.9,
		roughness: 0.6,
		clearcoat: 0.75
	});

	// Build proxy objects
	const proxy = Array.from({ length: AMOUNT }, () => {
		const o = new THREE.Object3D();
		o.position.setFromSphericalCoords(
			50 + mu.randFloatSpread(6),
			Math.PI * 0.5 + mu.randFloatSpread(Math.PI * 0.5),
			Math.PI * 2 * Math.random()
		);
		o.scale.setScalar(Math.random() * 2 + 1);
		o.rotation.set(
			Math.PI * 2 * Math.random(),
			Math.PI * 2 * Math.random(),
			Math.PI * 2 * Math.random()
		);
		o.userData.rotSpeed = new THREE.Vector3()
			.random()
			.subScalar(0.5)
			.multiplyScalar(Math.PI * 0.25);
		return o;
	});

	let mesh = $state();

	useTask((dt) => {
		if (!mesh) return;
		proxy.forEach((p, i) => {
			const rs = p.userData.rotSpeed;
			p.rotation.x += rs.x * dt;
			p.rotation.y += rs.y * dt;
			p.rotation.z += rs.z * dt;
			p.updateMatrix();
			mesh.setMatrixAt(i, p.matrix);
		});
		mesh.instanceMatrix.needsUpdate = true;
	});
</script>

<T.InstancedMesh bind:ref={mesh} args={[geometry, material, AMOUNT]} frustumCulled={false} />
