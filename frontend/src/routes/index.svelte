<script lang="ts">
    import { onMount } from 'svelte';
    import { currentUser } from '../stores/appStore';
    import { browser } from '$app/environment';

    const dispatch = createEventDispatcher();

    onMount(() => {
        if (browser) {
            if (localStorage.getItem('currentUser')) {
                dispatch('navigate', 'dashboard');
            }
        }
    });
</script>

<style>
    .landing-page {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: calc(100vh - 80px);
        text-align: center;
        padding: 2rem;
    }

    .landing-content {
        max-width: 600px;
    }

    h1 {
        font-size: 2.5rem;
        margin-bottom: 1rem;
        color: var(--text-color);
    }

    h2 {
        font-size: 1.5rem;
        color: var(--text-secondary);
        margin-bottom: 2rem;
    }

    .features {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
    }

    .feature {
        padding: 1.5rem;
        background: var(--card-bg);
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .feature-icon {
        font-size: 2rem;
        margin-bottom: 0.5rem;
    }

    .feature h3 {
        margin-bottom: 0.5rem;
    }

    .feature p {
        color: var(--text-secondary);
    }

    .buttons {
        display: flex;
        gap: 1rem;
        justify-content: center;
        margin-top: 2rem;
    }

    .btn {
        padding: 1rem 2rem;
        font-size: 1.1rem;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .btn-primary {
        background: var(--primary-color);
        color: white;
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.3);
    }

    .btn-secondary {
        background: var(--card-bg);
        color: var(--primary-color);
        border: 2px solid var(--primary-color);
    }

    .btn-secondary:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(59, 130, 246, 0.2);
    }

    @media (max-width: 640px) {
        h1 {
            font-size: 2rem;
        }

        .features {
            grid-template-columns: 1fr;
        }

        .buttons {
            flex-direction: column;
        }
    }
</style>

<div class="landing-page">
    <div class="landing-content">
        <h1>🩺 Blood Pressure Monitor</h1>
        <h2>Track, analyze, and manage your blood pressure with ease</h2>

        <div class="features">
            <div class="feature">
                <div class="feature-icon">📊</div>
                <h3>Daily Trends</h3>
                <p>Visualize your blood pressure trends with easy-to-read charts</p>
            </div>
            <div class="feature">
                <div class="feature-icon">🔔</div>
                <h3>Smart Alerts</h3>
                <p>Get notified about high/low blood pressure and irregular heart rates</p>
            </div>
            <div class="feature">
                <div class="feature-icon">👥</div>
                <h3>Family Sharing</h3>
                <p>Multiple user profiles with shared data view for your family</p>
            </div>
            <div class="feature">
                <div class="feature-icon">📱</div>
                <h3>Mobile Friendly</h3>
                <p>Responsive design that works perfectly on all devices</p>
            </div>
        </div>

        <div class="buttons">
            <button class="btn btn-primary" on:click={() => dispatch('navigate', 'register')}>Get Started</button>
            <button class="btn btn-secondary" on:click={() => dispatch('navigate', 'login')}>Login</button>
        </div>
    </div>
</div>
