import { writable, get } from 'svelte/store';

export interface User {
	id: number;
	name: string;
	username: string;
}

export const currentUser = writable<User | null>(null);
export const users = writable<User[]>([]);
export const darkMode = writable(false);

// Helper to get current user synchronously (for use in non-reactive contexts)
export function getCurrentUser(): User | null {
	return get(currentUser);
}
