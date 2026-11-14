<script lang="ts">
    import Navbar from './layout/Navbar.svelte';
    import Dashboard from './routes/Dashboard.svelte';
    import Readings from './routes/Readings.svelte';
    import Users from './routes/Users.svelte';
    import Alerts from './routes/Alerts.svelte';
    import Login from './routes/Login.svelte';
    import Register from './routes/Register.svelte';
    import AddReading from './routes/AddReading.svelte';
    import Home from './routes/index.svelte';

    let currentView = 'home';
    let viewProps: any = {};

    function navigate(view: string, props: any = {}) {
        currentView = view;
        viewProps = props;
    }
</script>

<Navbar on:navigate={navigate} />

<div class="container">
    {#if currentView === 'home'}
        <Home on:navigate={navigate} />
    {:else if currentView === 'dashboard'}
        <Dashboard on:navigate={navigate} />
    {:else if currentView === 'readings'}
        <Readings on:navigate={navigate} />
    {:else if currentView === 'users'}
        <Users on:navigate={navigate} />
    {:else if currentView === 'alerts'}
        <Alerts on:navigate={navigate} />
    {:else if currentView === 'login'}
        <Login on:navigate={navigate} />
    {:else if currentView === 'register'}
        <Register on:navigate={navigate} />
    {:else if currentView === 'add-reading'}
        <AddReading on:navigate={navigate} />
    {/if}
</div>

<style>
    .container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
        min-height: calc(100vh - 80px);
    }
</style>

