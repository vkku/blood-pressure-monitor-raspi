<script lang="ts">
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let name = '';
    let username = '';
    let password = '';
    let error = '';
    let loading = false;

    async function handleSubmit(e: Event) {
        e.preventDefault();
        error = '';
        loading = true;

        try {
            const response = await fetch('/api/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, password })
            });

            if (response.ok) {
                const user = await response.json();
                // Note: In a real app, you'd want to log the user in automatically
                error = 'Registration successful! Please login.';
            } else {
                error = 'Failed to register. Username may already exist.';
            }
        } catch (err) {
            error = 'Failed to register. Please try again.';
        } finally {
            loading = false;
        }
    }
</script>

<style>
    .form-container {
        max-width: 400px;
        margin: 4rem auto;
        padding: 2rem;
        background: var(--card-bg);
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    h2 {
        text-align: center;
        margin-bottom: 2rem;
    }

    .form-group {
        margin-bottom: 1.5rem;
    }

    label {
        display: block;
        margin-bottom: 0.5rem;
        font-weight: 500;
    }

    input {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-size: 1rem;
    }

    button {
        width: 100%;
        padding: 0.75rem;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.2s;
    }

    button:hover {
        background: var(--primary-hover);
    }

    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .error {
        color: #ef4444;
        text-align: center;
        margin-bottom: 1rem;
    }

    .link {
        text-align: center;
        margin-top: 1rem;
    }

    .link button {
        color: var(--primary-color);
        background: none;
        border: none;
        padding: 0;
        font: inherit;
        cursor: pointer;
    }

    .link button:hover {
        text-decoration: underline;
    }
</style>

<div class="form-container">
    <h2>Register</h2>

    {#if error}
        <p class="error">{error}</p>
    {/if}

    <form on:submit={handleSubmit}>
        <div class="form-group">
            <label for="name">Full Name</label>
            <input
                type="text"
                id="name"
                bind:value={name}
                required
                placeholder="Enter your full name"
            />
        </div>

        <div class="form-group">
            <label for="username">Username</label>
            <input
                type="text"
                id="username"
                bind:value={username}
                required
                placeholder="Choose a username"
            />
        </div>

        <div class="form-group">
            <label for="password">Password</label>
            <input
                type="password"
                id="password"
                bind:value={password}
                required
                placeholder="Choose a password"
            />
        </div>

        <button type="submit" disabled={loading}>
            {#if loading} Registering... {:else} Register {/if}
        </button>
    </form>

    <p class="link">
        Already have an account? <button type="button" class="link-btn" on:click={() => dispatch('navigate', 'login')}>Login</button>
    </p>
</div>
