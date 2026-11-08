<script>
	import { T, useTask } from '@threlte/core';
	import * as THREE from 'three';

	/** @type {import('$components/SplitSampler.js').SplitSampler} */

	// worldMatrix is an external reference so Boxy can sync the world matrix each frame
	let {
		splitSampler,
		initMatrix = new THREE.Matrix4(),
		worldMatrix = new THREE.Matrix4()
	} = $props();

	const AMOUNT = 50000;
	const DURATION = 6;

	const mediators = {
		p: new THREE.Vector3(),
		n: new THREE.Vector3(),
		normalMatrix: new THREE.Matrix3()
	};

	function buildGeometry() {
		const pos = [];
		const nor = [];
		const timing = [];
		const nMat = mediators.normalMatrix.getNormalMatrix(initMatrix);

		for (let i = 0; i < AMOUNT; i++) {
			splitSampler.sample(mediators.p, mediators.n);
			pos.push(...mediators.p.applyMatrix4(initMatrix));
			nor.push(...mediators.n.applyNormalMatrix(nMat));
			const dur = DURATION * (Math.random() * 0.5 + 0.5);
			const tim = Math.random() * dur;
			const dis = (Math.random() * 0.8 + 0.2) * 2;
			const siz = Math.random() ** 4 * 0.6 + 0.4;
			timing.push(tim, dur, dis, siz);
		}

		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
		g.setAttribute('timing', new THREE.Float32BufferAttribute(timing, 4));
		return g;
	}

	const geometry = buildGeometry();

	const material = new THREE.PointsMaterial({
		size: 0.15,
		transparent: true,
		depthWrite: false,
		blending: THREE.AdditiveBlending,
		onBeforeCompile: (shader) => {
			shader.vertexShader = `
        attribute vec4 timing;
        varying float action;
        varying float vFinish;

        float graphOut(float k){
          float decK = k - 1.;
          return decK * decK * decK + 1.;
        }

        ${shader.vertexShader}
      `
				.replace(
					`#include <begin_vertex>`,
					`#include <begin_vertex>
          action = clamp((timing.x / timing.y), 0., 1.);
          transformed = position + normal * graphOut(action) * timing.z;
          `
				)
				.replace(
					`gl_PointSize = size;`,
					`
          float sizeRatio = smoothstep(0., 0.05, action) - smoothstep(0.75, 1., action);
          vFinish = smoothstep(0.8, 0.85, action) - smoothstep(0.85, 0.9, action);
          sizeRatio = max(sizeRatio, vFinish);
          gl_PointSize = size * sizeRatio * timing.w;
          `
				);

			shader.fragmentShader = `
        varying float action;
        varying float vFinish;
        ${shader.fragmentShader}
      `.replace(
				`vec4 diffuseColor = vec4( diffuse, opacity );`,
				`
        vec2 uv = gl_PointCoord.xy - 0.5;
        float dist = length(uv) * 2.;
        vec3 col = mix(vec3(1, 0.6, 0.4), vec3(1, 0.75, 0), smoothstep(0., 0.75, action));
        col = mix(col, vec3(1, 0.25, 0), smoothstep(0.1, 1. - 0.5 * action, dist));
        col = mix(col, vec3(0.25, 0.1, 0) * 0.5, smoothstep(0.25, 0.75, action));
        float a = 1. - smoothstep(0.5, 1. - 0.2 * action, dist);
        a *= 1. - smoothstep(0.95, 1., action);
        a = max(a, 1. - smoothstep(0., 1., dist));
        col = mix(col, vec3(1, 1, 0.5), vFinish);
        vec4 diffuseColor = vec4(col, a);
        `
			);
		}
	});

	useTask((dt) => {
		const pos = geometry.attributes.position;
		const nor = geometry.attributes.normal;
		const timings = geometry.attributes.timing;
		const nMat = mediators.normalMatrix.getNormalMatrix(worldMatrix);

		for (let i = 0; i < AMOUNT; i++) {
			let timingVal = timings.getX(i) + dt;
			const durationVal = timings.getY(i);

			if (timingVal > durationVal) {
				const dur = DURATION * (Math.random() * 0.5 + 0.5);
				timings.setY(i, dur);
				timings.setZ(i, (Math.random() * 0.8 + 0.2) * 2);
				timings.setW(i, Math.random() ** 4 * 0.6 + 0.4);
				timingVal = 0;
				splitSampler.sample(mediators.p, mediators.n);
				mediators.p.applyMatrix4(worldMatrix);
				mediators.n.applyNormalMatrix(nMat);
				pos.setXYZ(i, mediators.p.x, mediators.p.y, mediators.p.z);
				nor.setXYZ(i, mediators.n.x, mediators.n.y, mediators.n.z);
			}
			timings.setX(i, timingVal);
		}

		pos.needsUpdate = true;
		nor.needsUpdate = true;
		timings.needsUpdate = true;
	});
</script>

<T.Points {geometry} {material} frustumCulled={false} />
