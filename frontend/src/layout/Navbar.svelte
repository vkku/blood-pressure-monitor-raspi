<script lang="ts">
    import { onMount } from 'svelte';
    import { currentUser, darkMode } from '../stores/appStore';
    import { alerts } from '../stores/alertsStore';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let unreadAlertsCount = 0;
    let mobileMenuOpen = false;

    $: unreadAlertsCount = $alerts.filter(a => !a.is_read).length;

    onMount(() => {
        if (typeof window !== 'undefined') {
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                currentUser.set(JSON.parse(storedUser));
            }

            const storedDarkMode = localStorage.getItem('darkMode');
            if (storedDarkMode) {
                darkMode.set(storedDarkMode === 'true');
                if (storedDarkMode === 'true') {
                    document.body.classList.add('dark');
                }
            }
        }
    });

    function toggleDarkMode() {
        darkMode.update(val => {
            const newVal = !val;
            localStorage.setItem('darkMode', String(newVal));
            document.body.classList.toggle('dark', newVal);
            return newVal;
        });
    }

    function logout() {
        localStorage.removeItem('currentUser');
        currentUser.set(null);
        mobileMenuOpen = false;
        dispatch('navigate', 'login');
    }

    function goTo(view: string) {
        mobileMenuOpen = false;
        dispatch('navigate', view);
    }

    function toggleMobileMenu() {
        mobileMenuOpen = !mobileMenuOpen;
    }
</script>

<nav class="navbar">
    <div class="nav-container">
        <button class="logo" on:click={() => goTo($currentUser ? 'dashboard' : 'home')}>
            <span class="logo-icon">🩺</span>
            <span class="logo-text">BP Monitor</span>
        </button>

        <!-- Desktop Navigation -->
        <div class="nav-links desktop-only">
            {#if $currentUser}
                <button class="nav-btn" on:click={() => goTo('dashboard')}>
                    <span class="nav-icon">📊</span>
                    <span>Dashboard</span>
                </button>
                <button class="nav-btn" on:click={() => goTo('readings')}>
                    <span class="nav-icon">📋</span>
                    <span>Readings</span>
                </button>
                <button class="nav-btn primary" on:click={() => goTo('add-reading')}>
                    <span class="nav-icon">➕</span>
                    <span>Add</span>
                </button>
                <button class="nav-btn" on:click={() => goTo('alerts')}>
                    <span class="nav-icon">🔔</span>
                    <span>Alerts</span>
                    {#if unreadAlertsCount > 0}
                        <span class="badge">{unreadAlertsCount}</span>
                    {/if}
                </button>
                <button class="nav-btn" on:click={() => goTo('users')}>
                    <span class="nav-icon">👤</span>
                    <span>Users</span>
                </button>
                <button class="nav-btn icon-only" on:click={toggleDarkMode} aria-label="Toggle dark mode">
                    {$darkMode ? '☀️' : '🌙'}
                </button>
                <button class="nav-btn logout" on:click={logout}>Logout</button>
            {:else}
                <button class="nav-btn" on:click={() => goTo('login')}>Login</button>
                <button class="nav-btn primary" on:click={() => goTo('register')}>Get Started</button>
            {/if}
        </div>

        <!-- Mobile Menu Button -->
        <div class="mobile-controls mobile-only">
            {#if $currentUser}
                <button class="nav-btn icon-only" on:click={toggleDarkMode} aria-label="Toggle dark mode">
                    {$darkMode ? '☀️' : '🌙'}
                </button>
            {/if}
            <button class="hamburger" on:click={toggleMobileMenu} aria-label="Menu" class:active={mobileMenuOpen}>
                <span></span>
                <span></span>
                <span></span>
            </button>
        </div>
    </div>

    <!-- Mobile Navigation -->
    {#if mobileMenuOpen}
        <div class="mobile-menu">
            {#if $currentUser}
                <button class="mobile-nav-btn" on:click={() => goTo('dashboard')}>
                    <span class="nav-icon">📊</span>
                    Dashboard
                </button>
                <button class="mobile-nav-btn" on:click={() => goTo('readings')}>
                    <span class="nav-icon">📋</span>
                    Readings
                </button>
                <button class="mobile-nav-btn primary" on:click={() => goTo('add-reading')}>
                    <span class="nav-icon">➕</span>
                    Add Reading
                </button>
                <button class="mobile-nav-btn" on:click={() => goTo('alerts')}>
                    <span class="nav-icon">🔔</span>
                    Alerts
                    {#if unreadAlertsCount > 0}
                        <span class="badge">{unreadAlertsCount}</span>
                    {/if}
                </button>
                <button class="mobile-nav-btn" on:click={() => goTo('users')}>
                    <span class="nav-icon">👤</span>
                    Users
                </button>
                <div class="mobile-menu-divider"></div>
                <button class="mobile-nav-btn logout" on:click={logout}>
                    <span class="nav-icon">🚪</span>
                    Logout
                </button>
            {:else}
                <button class="mobile-nav-btn" on:click={() => goTo('login')}>
                    <span class="nav-icon">🔑</span>
                    Login
                </button>
                <button class="mobile-nav-btn primary" on:click={() => goTo('register')}>
                    <span class="nav-icon">🚀</span>
                    Get Started
                </button>
            {/if}
        </div>
    {/if}
</nav>

<!-- Bottom Navigation for Mobile -->
{#if $currentUser}
    <nav class="bottom-nav mobile-only">
        <button class="bottom-nav-btn" on:click={() => goTo('dashboard')}>
            <span class="bottom-nav-icon">📊</span>
            <span class="bottom-nav-label">Home</span>
        </button>
        <button class="bottom-nav-btn" on:click={() => goTo('readings')}>
            <span class="bottom-nav-icon">📋</span>
            <span class="bottom-nav-label">Readings</span>
        </button>
        <button class="bottom-nav-btn add-btn" on:click={() => goTo('add-reading')}>
            <span class="add-icon">+</span>
        </button>
        <button class="bottom-nav-btn" on:click={() => goTo('alerts')}>
            <span class="bottom-nav-icon">🔔</span>
            <span class="bottom-nav-label">Alerts</span>
            {#if unreadAlertsCount > 0}
                <span class="bottom-badge">{unreadAlertsCount}</span>
            {/if}
        </button>
        <button class="bottom-nav-btn" on:click={() => goTo('users')}>
            <span class="bottom-nav-icon">👤</span>
            <span class="bottom-nav-label">Profile</span>
        </button>
    </nav>
{/if}

<style>
    .navbar {
        position: sticky;
        top: 0;
        z-index: 1000;
        background: var(--nav-bg);
        color: var(--nav-text);
        box-shadow: var(--shadow-md);
    }

    .nav-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-sm) var(--spacing-md);
        max-width: 1400px;
        margin: 0 auto;
    }

    .logo {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        background: none;
        border: none;
        color: var(--nav-text);
        cursor: pointer;
        padding: var(--spacing-sm);
        border-radius: var(--radius-sm);
        transition: background 0.2s;
    }

    .logo:hover {
        background: var(--nav-hover);
    }

    .logo-icon {
        font-size: 1.5rem;
    }

    .logo-text {
        font-size: var(--font-lg);
        font-weight: 700;
        letter-spacing: -0.5px;
    }

    .nav-links {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
    }

    .nav-btn {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        padding: var(--spacing-sm) var(--spacing-md);
        border: none;
        background: none;
        color: var(--nav-text);
        font-size: var(--font-sm);
        font-weight: 500;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.2s;
        position: relative;
    }

    .nav-btn:hover {
        background: var(--nav-hover);
    }

    .nav-btn.primary {
        background: var(--primary-color);
        color: white;
    }

    .nav-btn.primary:hover {
        background: var(--primary-hover);
    }

    .nav-btn.logout {
        color: #fca5a5;
    }

    .nav-btn.logout:hover {
        background: rgba(239, 68, 68, 0.2);
        color: #fecaca;
    }

    .nav-btn.icon-only {
        padding: var(--spacing-sm);
        font-size: 1.25rem;
    }

    .nav-icon {
        font-size: 1rem;
    }

    .badge {
        position: absolute;
        top: 2px;
        right: 2px;
        background: var(--danger-color);
        color: white;
        font-size: 0.65rem;
        font-weight: 700;
        min-width: 18px;
        height: 18px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    }

    /* Mobile Menu */
    .mobile-controls {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
    }

    .hamburger {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 5px;
        width: 44px;
        height: 44px;
        padding: 10px;
        border: none;
        background: none;
        cursor: pointer;
    }

    .hamburger span {
        display: block;
        width: 24px;
        height: 2px;
        background: var(--nav-text);
        border-radius: 2px;
        transition: all 0.3s ease;
    }

    .hamburger.active span:nth-child(1) {
        transform: rotate(45deg) translate(5px, 5px);
    }

    .hamburger.active span:nth-child(2) {
        opacity: 0;
    }

    .hamburger.active span:nth-child(3) {
        transform: rotate(-45deg) translate(5px, -5px);
    }

    .mobile-menu {
        display: flex;
        flex-direction: column;
        padding: var(--spacing-sm);
        background: rgba(0, 0, 0, 0.3);
        animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .mobile-nav-btn {
        display: flex;
        align-items: center;
        gap: var(--spacing-md);
        padding: var(--spacing-md);
        border: none;
        background: none;
        color: var(--nav-text);
        font-size: var(--font-base);
        font-weight: 500;
        text-align: left;
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: background 0.2s;
        position: relative;
    }

    .mobile-nav-btn:hover {
        background: var(--nav-hover);
    }

    .mobile-nav-btn.primary {
        background: var(--primary-color);
        margin: var(--spacing-sm) 0;
    }

    .mobile-nav-btn.logout {
        color: #fca5a5;
    }

    .mobile-menu-divider {
        height: 1px;
        background: rgba(255, 255, 255, 0.1);
        margin: var(--spacing-sm) 0;
    }

    /* Bottom Navigation */
    .bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        justify-content: space-around;
        align-items: center;
        background: var(--card-bg);
        border-top: 1px solid var(--border-color);
        padding: var(--spacing-xs) 0;
        padding-bottom: max(var(--spacing-xs), env(safe-area-inset-bottom));
        z-index: 1000;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
    }

    .bottom-nav-btn {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        padding: var(--spacing-xs) var(--spacing-sm);
        border: none;
        background: none;
        color: var(--text-secondary);
        cursor: pointer;
        transition: color 0.2s;
        position: relative;
        min-width: 60px;
    }

    .bottom-nav-btn:active {
        color: var(--primary-color);
    }

    .bottom-nav-icon {
        font-size: 1.25rem;
    }

    .bottom-nav-label {
        font-size: 0.65rem;
        font-weight: 500;
    }

    .bottom-nav-btn.add-btn {
        position: relative;
        top: -15px;
    }

    .add-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
        color: white;
        font-size: 2rem;
        font-weight: 300;
        border-radius: 50%;
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
    }

    .bottom-badge {
        position: absolute;
        top: 0;
        right: 10px;
        background: var(--danger-color);
        color: white;
        font-size: 0.6rem;
        font-weight: 700;
        min-width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    }

    /* Responsive */
    .desktop-only {
        display: flex;
    }

    .mobile-only {
        display: none;
    }

    @media (max-width: 768px) {
        .desktop-only {
            display: none;
        }

        .mobile-only {
            display: flex;
        }

        .logo-text {
            font-size: var(--font-base);
        }
    }

    /* TV screens */
    @media (min-width: 1920px) {
        .nav-container {
            padding: var(--spacing-md) var(--spacing-xl);
        }

        .nav-btn {
            padding: var(--spacing-md) var(--spacing-lg);
            font-size: var(--font-base);
        }

        .logo-icon {
            font-size: 2rem;
        }
    }
</style>
