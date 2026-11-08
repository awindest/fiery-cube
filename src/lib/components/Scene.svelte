<script>
	import { T, useThrelte, useTask } from '@threlte/core';
	import { OrbitControls } from '@threlte/extras';
	import * as THREE from 'three';
	import { PMREMGenerator } from 'three';
	import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
	import Boxy from '$components/Boxy.svelte';
	import BackStuff from '$components/BackStuff.svelte';
	import PostProcessing from '$components/PostProcessing.svelte';

	const { renderer, scene } = useThrelte();

	// Global uniforms passed down to children
	const gu = {
		time: { value: 0 },
		aspect: { value: window.innerWidth / window.innerHeight }
	};

	// Set up environment once renderer is available

	const pmremGenerator = new PMREMGenerator(renderer);
	const room = new RoomEnvironment();

	// Warm orange-fire tint for the environment light
	room.children[0].color.set('#f80');
	room.children[0].intensity = 100;
	room.traverse((child) => {
		if (child.material && child.material.isMeshLambertMaterial) {
			child.material.emissive.set('#f80');
			child.material.emissiveIntensity = 0.5;
		}
	});

	const envTex = pmremGenerator.fromScene(room, 0.04).texture;
	scene.environment = envTex;

	// const bakTex = pmremGenerator.fromScene(room, 0.04).texture;
	scene.background = envTex;

	useTask((dt) => {
		gu.time.value += dt;
		gu.aspect.value = window.innerWidth / window.innerHeight;
	});
</script>

<T.PerspectiveCamera makeDefault fov={45} near={1} far={1000} position={[0, 0, 7]}>
	<OrbitControls enableDamping enablePan={false} minDistance={4} maxDistance={10} />
</T.PerspectiveCamera>

<PostProcessing time={gu.time} aspect={gu.aspect} />

<Boxy time={gu.time} />
<BackStuff />
