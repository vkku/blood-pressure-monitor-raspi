<script lang="ts">
    import { onMount } from 'svelte';
    import { currentUser, darkMode } from '../stores/appStore';
    import { alerts } from '../stores/alertsStore';
    import { browser } from '$app/environment';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let unreadAlertsCount = 0;

    $: unreadAlertsCount = alerts.filter(a => !a.is_read).length;

    onMount(() => {
        if (browser) {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                currentUser.set(JSON.parse(storedUser));
            }

            const storedDarkMode = localStorage.getItem('darkMode');
            if (storedDarkMode) {
                darkMode.set(storedDarkMode === 'true');
            }
        }
    });

    function logout() {
        localStorage.removeItem('currentUser');
        currentUser.set(null);
        dispatch('navigate', 'login');
    }

    function goTo(view: string) {
        dispatch('navigate', view);
    }
</script>

<style>
    .navbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem 2rem;
        background: var(--nav-bg);
        color: var(--nav-text);
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .nav-links {
        display: flex;
        gap: 1rem;
    }

    .nav-links a {
        color: var(--nav-text);
        text-decoration: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        transition: background 0.2s;
        cursor: pointer;
    }

    .nav-links a:hover {
        background: var(--nav-hover);
    }

    .alerts {
        position: relative;
    }

    .alert-badge {
        position: absolute;
        top: -8px;
        right: -8px;
        background: #ef4444;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 12px;
    }
</style>

<nav class="navbar">
    <div class="logo">
        <h1>🩺 Blood Pressure Monitor</h1>
    </div>

    <div class="nav-links">
        {#if $currentUser}
            <a on:click={() => goTo('dashboard')}>Dashboard</a>
            <a on:click={() => goTo('readings')}>Readings</a>
            <a on:click={() => goTo('users')}>Users</a>
            <div class="alerts">
                <a on:click={() => goTo('alerts')}>Alerts</a>
                {#if unreadAlertsCount > 0}
                    <span class="alert-badge">{unreadAlertsCount}</span>
                {/if}
            </div>
            <button on:click={logout}>Logout</button>
        {:else}
            <a on:click={() => goTo('login')}>Login</a>
            <a on:click={() => goTo('register')}>Register</a>
        {/if}
    </div>
</nav>

<slot />
