<script lang="ts">
    import ReadingForm from '../components/ReadingForm.svelte';
    import { currentUser } from '../stores/appStore';
    import { readings } from '../stores/readingsStore';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let successMessage = '';

    async function handleFormSubmit(event: CustomEvent) {
        const reading = event.detail;
        const user = $currentUser;
        if (!user) {
            dispatch('navigate', 'login');
            return;
        }
        
        try {
            const response = await fetch('/api/users/' + user.id + '/readings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(reading)
            });

            if (response.ok) {
                const newReading = await response.json();
                readings.update(current => [newReading, ...current]);
                successMessage = 'Reading saved successfully!';
                setTimeout(() => {
                    successMessage = '';
                    dispatch('navigate', 'readings');
                }, 2000);
            } else {
                alert('Failed to save reading');
            }
        } catch (err) {
            alert('Failed to save reading. Please try again.');
        }
    }
</script>

<style>
    .page {
        max-width: 600px;
        margin: 0 auto;
    }

    .success-message {
        padding: 1rem;
        background: #d1fae5;
        color: #065f46;
        border-radius: 8px;
        text-align: center;
        margin-bottom: 1rem;
    }

    .voice-input-btn {
        display: block;
        width: 100%;
        padding: 1rem;
        background: #8b5cf6;
        color: white;
        border: none;
        border-radius: 8px;
        font-size: 1rem;
        cursor: pointer;
        margin-bottom: 1rem;
    }

    .voice-input-btn:hover {
        opacity: 0.9;
    }

    .voice-icon {
        margin-right: 0.5rem;
    }
</style>

<div class="page">
    <h1 style="text-align: center; margin-bottom: 2rem;">Record Blood Pressure</h1>

    {#if successMessage}
        <div class="success-message">{successMessage}</div>
    {/if}

    <button class="voice-input-btn">
        <span class="voice-icon">🎤</span>
        Voice Input (Coming Soon)
    </button>

    <ReadingForm on:submit={handleFormSubmit} />
</div>
