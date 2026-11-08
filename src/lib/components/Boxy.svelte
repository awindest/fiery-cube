<script>
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';
	import { SimplexNoise } from 'three/addons/math/SimplexNoise.js';
	import { BoxyGeometry } from '$components/geometries.js';
	import { SplitSampler } from '$components/SplitSampler.js';
	import { noise4d } from '$components/noise.js';
	import ParticleEmitter from '$components/ParticleEmitter.svelte';

	let { time = { value: 0 } } = $props();

	const CHAMFER = 0.05;
	const ROUNDNESS = 0.1;
	const simplex = new SimplexNoise();

	const splitPointUniform = { value: new THREE.Vector3() };
	const splitSampler = new SplitSampler(CHAMFER, ROUNDNESS, splitPointUniform.value);

	const geometry = new BoxyGeometry(CHAMFER, ROUNDNESS);

	const material = new THREE.MeshPhysicalMaterial({
		vertexColors: true,
		metalness: 0.95,
		roughness: 0.05,
		clearcoat: 0.25,
		onBeforeCompile: (shader) => {
			shader.uniforms.time = time;
			shader.uniforms.splitPoint = splitPointUniform;

			shader.vertexShader = `
        uniform vec3 splitPoint;
        attribute vec3 moves;
        attribute float geometryID;
        varying float vGID;
        varying vec3 vPos;
        ${shader.vertexShader}
      `.replace(
				`#include <begin_vertex>`,
				`#include <begin_vertex>
        float splitWidth = 0.1;
        vec3 pos = position;
        pos += (splitPoint + moves * splitWidth) * abs(moves);
        transformed = pos;
        vPos = transformed;
        vGID = geometryID;
        `
			);

			shader.fragmentShader = `
        uniform float time;
        varying float vGID;
        varying vec3 vPos;
        ${noise4d}

        float sdRoundBox(vec3 p, vec3 b, float r){
          vec3 q = abs(p) - b + r;
          return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0) - r;
        }

        float getNoise(vec3 pos){
          return snoise(vec4(pos, time * 0.125));
        }

        float fbm(vec3 x){
          float v = 0.0;
          float a = 0.5;
          vec3 shift = vec3(0.5);
          for(int i = 0; i < 5; ++i){
            v += a * getNoise(x);
            x = x * 2. + shift;
            a *= 0.5;
          }
          return v;
        }
        ${shader.fragmentShader}
      `.replace(
				`#include <opaque_fragment>`,
				`#include <opaque_fragment>
        float nVal = fbm(vPos * 0.5);
        float f = smoothstep(0.0, 0.5, abs(nVal));
        float negF = 1. - f;
        vec3 noiseCol = vec3(1, 0.4 - (pow(negF, 0.25)) * 0.1 * 3., 0.);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, noiseCol, f);
        float sBox = sdRoundBox(vPos, vec3(1. - 0.2), 0.05);
        float fBox = 1. - smoothstep(0.05, 0.25, sBox);
        fBox = pow(fBox, 0.75);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1, 0.2, 0), fBox);
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1, 0.6, 0.4), 1. - smoothstep(0.05, 0.15, sBox));
        if(floor(vGID + 0.1) > 7.){
          gl_FragColor.rgb = vColor.rgb;
        }
        `
			);
		}
	});

	const rotX = Math.PI * 2 * Math.random();
	const rotY = Math.PI * 2 * Math.random();

	let meshRef = $state(null);
	// Reactive matrix passed down to particles; updated every frame - not necessary
	// let particleWorldMatrix = $state.raw(new THREE.Matrix4());
	const particleWorldMatrix = new THREE.Matrix4(); // no $state
	let particlesReady = $state(false);

	function setSplitPoint(t) {
		const tloc = t * 0.05;
		const x = simplex.noise(tloc, 100);
		const y = simplex.noise(tloc, 200);
		const z = simplex.noise(tloc, 300);
		splitPointUniform.value.set(x, y, z).multiplyScalar(0.75);
	}

	useTask((dt) => {
		if (!meshRef) return;
		setSplitPoint(time.value);
		meshRef.rotation.x += dt * 0.25 * 0.31;
		meshRef.rotation.y += dt * 0.25 * 0.27;
		meshRef.updateMatrixWorld();
		particleWorldMatrix.copy(meshRef.matrixWorld);
		// particleWorldMatrix = particleWorldMatrix ???
		// Signal particles are ready to initialise once we have a real matrix
		if (!particlesReady) particlesReady = true;
	});
</script>

<T.Mesh bind:ref={meshRef} {geometry} {material} rotation={[rotX, rotY, 0]} />

{#if particlesReady}
	<ParticleEmitter
		{splitSampler}
		initMatrix={particleWorldMatrix}
		worldMatrix={particleWorldMatrix}
	/>
{/if}
