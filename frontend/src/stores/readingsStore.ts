<script lang="ts">
	import { writable } from 'svelte/store';

	interface BloodPressureReading {
		id: number;
		user_id: number;
		systolic: number;
		diastolic: number;
		heart_rate: number;
		measurement_time: string;
		notes: string;
		medication: string;
		body_position: string;
		arm_used: string;
		activity_level: string;
	}

	export const readings = writable<BloodPressureReading[]>([]);
	export const currentReading = writable<Partial<BloodPressureReading>>({});
</script>
