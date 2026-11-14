<script lang="ts">
	import { browser } from '$app/environment';
	import { localStorage } from '@macfja/svelte-local-storage';

	export let key: string;
	export let defaultValue: string;

	const { store, ...handlers } = localStorage(key, defaultValue);

	if (browser && typeof window !== 'undefined') {
		// Browser storage is already handled by the library
	}

	export { store, ...handlers };
</script>
