<script lang="ts">
    import Navbar from './layout/Navbar.svelte';
    import Dashboard from './routes/dashboard.svelte';
    import Readings from './routes/readings.svelte';
    import Users from './routes/users.svelte';
    import Alerts from './routes/alerts.svelte';
    import Login from './routes/login.svelte';
    import Register from './routes/register.svelte';
    import AddReading from './routes/add-reading.svelte';
    import Home from './routes/index.svelte';
    import { currentUser } from './stores/appStore';

    let currentView = 'home';

    function handleNavigate(event: CustomEvent) {
        const view = event.detail;
        if (view) {
            currentView = view;
        }
    }
</script>

<div class="app-wrapper">
    <Navbar on:navigate={handleNavigate} />

    <main class="main-content" class:has-bottom-nav={$currentUser}>
        <div class="container">
            {#if currentView === 'home'}
                <Home on:navigate={handleNavigate} />
            {:else if currentView === 'dashboard'}
                <Dashboard on:navigate={handleNavigate} />
            {:else if currentView === 'readings'}
                <Readings on:navigate={handleNavigate} />
            {:else if currentView === 'users'}
                <Users on:navigate={handleNavigate} />
            {:else if currentView === 'alerts'}
                <Alerts on:navigate={handleNavigate} />
            {:else if currentView === 'login'}
                <Login on:navigate={handleNavigate} />
            {:else if currentView === 'register'}
                <Register on:navigate={handleNavigate} />
            {:else if currentView === 'add-reading'}
                <AddReading on:navigate={handleNavigate} />
            {/if}
        </div>
    </main>
</div>

<style>
    .app-wrapper {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
    }

    .main-content {
        flex: 1;
        padding: var(--spacing-md);
    }

    .main-content.has-bottom-nav {
        padding-bottom: calc(70px + var(--spacing-md));
    }

    .container {
        max-width: 1400px;
        margin: 0 auto;
        width: 100%;
    }

    @media (max-width: 480px) {
        .main-content {
            padding: var(--spacing-sm);
        }

        .main-content.has-bottom-nav {
            padding-bottom: calc(80px + var(--spacing-sm));
        }
    }

    @media (min-width: 768px) {
        .main-content.has-bottom-nav {
            padding-bottom: var(--spacing-md);
        }
    }

    /* TV screens */
    @media (min-width: 1920px) {
        .main-content {
            padding: var(--spacing-xl);
        }

        .container {
            max-width: 1800px;
        }
    }
</style>

