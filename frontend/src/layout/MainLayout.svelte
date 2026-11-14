<script lang="ts">
	import Navbar from '../layout/Navbar.svelte';
</script>

<Navbar />

<div class="container">
	<slot />
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		min-height: calc(100vh - 80px);
	}
</style>
