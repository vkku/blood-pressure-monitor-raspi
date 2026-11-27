import { writable } from 'svelte/store';

export interface Alert {
	id: number;
	alert_type: string;
	message: string;
	severity: string;
	is_read: boolean;
	created_at: string;
}

export const alerts = writable<Alert[]>([]);
