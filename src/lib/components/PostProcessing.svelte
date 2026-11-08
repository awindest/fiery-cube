<script>
	import { useTask, useThrelte } from '@threlte/core';
	import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
	import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
	import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
	import { FXAAPass } from 'three/addons/postprocessing/FXAAPass.js';
	import { noise3d } from '$components/noise.js';

	let { time = { value: 0 }, aspect = { value: 1 } } = $props();

	const { renderer, scene, camera, size, renderStage } = useThrelte();

	const composer = new EffectComposer(renderer);
	const renderPass = new RenderPass(scene, camera.current);
	composer.addPass(renderPass);

	const outputPass = new OutputPass();
	outputPass.material.onBeforeCompile = (shader) => {
		shader.uniforms.time = time;
		shader.uniforms.aspect = aspect;
		shader.fragmentShader = shader.fragmentShader
			.replace(
				`precision highp float;`,
				`
          #define S(a, b, c) smoothstep(a, b, c)
          precision highp float;
          uniform float time;
          uniform float aspect;
          mat2 rot(float a){return mat2(cos(a), -sin(a), sin(a), cos(a));}
          ${noise3d}
          #include <common>
          `
			)
			.replace(
				`gl_FragColor = texture2D( tDiffuse, vUv );`,
				`
          vec2 postUV = (vUv - 0.5) * vec2(aspect, 1.) * 2.;
          float u = length(postUV);
          float effectLim = S(1., 1.5, u);
          vec2 dir = vec2(-postUV.y, postUV.x);
          float noise = snoise(vec3(postUV, time * 0.25));
          vec2 shift = dir * noise * effectLim * 0.025;
          gl_FragColor = texture2D(tDiffuse, vUv + shift);
          gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1, 0.5, 0), effectLim * 0.01);
          `
			);
	};
	composer.addPass(outputPass);
	composer.addPass(new FXAAPass());

	// keep the pass in sync with the active camera
	$effect(() => {
		renderPass.camera = $camera;
	});

	// resize
	$effect(() => {
		composer.setSize($size.width, $size.height);
	});
	$effect(() => () => composer.dispose());

	useTask(() => composer.render(), { stage: renderStage, autoInvalidate: false });
</script>
