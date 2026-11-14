<script lang="ts">
    import { onMount } from 'svelte';
    import { currentUser } from '../stores/appStore';
    import { browser } from '$app/environment';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    interface User {
        id: number;
        name: string;
        username: string;
    }

    let users: User[] = [];
    let selectedUser = '';
    let loading = true;

    onMount(async () => {
        if (!browser) return;

        const user = currentUser;
        if (!user) {
            dispatch('navigate', 'login');
            return;
        }

        try {
            const response = await fetch('/api/users');
            if (response.ok) {
                users = await response.json();
            }
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            loading = false;
        }
    });

    function selectUser(userId: number) {
        currentUser.set(users.find(u => u.id === userId));
        localStorage.setItem('currentUser', JSON.stringify(users.find(u => u.id === userId)));
        dispatch('navigate', 'dashboard');
    }
</script>

<style>
    .users-page {
        max-width: 600px;
        margin: 0 auto;
    }

    .user-card {
        background: var(--card-bg);
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .user-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.15);
    }

    .user-card.current {
        border: 2px solid var(--primary-color);
    }

    .user-card h3 {
        margin-top: 0;
        color: var(--text-color);
    }

    .user-card p {
        color: var(--text-secondary);
        margin: 0.5rem 0 0;
    }

    .add-user-btn {
        display: block;
        width: 100%;
        padding: 1rem;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
        margin-top: 1rem;
    }

    .add-user-btn:hover {
        opacity: 0.9;
    }

    .empty-state {
        text-align: center;
        padding: 2rem;
        color: var(--text-secondary);
    }
</style>

<div class="users-page">
    <h2>Select User</h2>

    {#if loading}
        <p>Loading users...</p>
    {:else}
        {#if users.length === 0}
            <div class="empty-state">
                <p>No users found. Please register a new user.</p>
                <button class="add-user-btn" on:click={() => dispatch('navigate', 'register')}>Register New User</button>
            </div>
        {:else}
            {#each users as user (user.id)}
                <div 
                    class="user-card {$currentUser.id === user.id ? 'current' : ''}"
                    on:click={() => selectUser(user.id)}
                >
                    <h3>{user.name}</h3>
                    <p>@{user.username}</p>
                    {#if $currentUser.id === user.id}
                        <p style="color: var(--primary-color); font-weight: 500;">Currently selected</p>
                    {/if}
                </div>
            {/each}
        {/if}

        <button class="add-user-btn" on:click={() => dispatch('navigate', 'register')}>+ Add New User</button>
    {/if}
</div>
