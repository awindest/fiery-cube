<script lang="ts">
	import { Canvas } from '@threlte/core';
	import Scene from '$components/Scene.svelte';
</script>

<Canvas autoRender={false}>
	<Scene />
</Canvas>

<style>
	:global(body) {
		overflow: hidden;
		margin: 0;
	}
	:global(canvas) {
		display: block;
	}
</style>
