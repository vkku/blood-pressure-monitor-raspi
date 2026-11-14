<script lang="ts">
	import { writable } from 'svelte/store';

	interface Alert {
		id: number;
		user_id: number;
		alert_type: string;
		message: string;
		severity: string;
		is_read: boolean;
		created_at: string;
	}

	export const alerts = writable<Alert[]>([]);
</script>
