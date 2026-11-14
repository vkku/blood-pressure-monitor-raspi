<script lang="ts">
	import { writable } from 'svelte/store';

	interface User {
		id: number;
		name: string;
		username: string;
	}

	export const currentUser = writable<User | null>(null);
	export const users = writable<User[]>([]);
	export const darkMode = writable(false);
</script>
