<script lang="ts">
    import ReadingForm from '../components/ReadingForm.svelte';
    import { currentUser } from '../stores/appStore';
    import { readings } from '../stores/readingsStore';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let successMessage = '';
    let isSubmitting = false;
    let formComponent: ReadingForm;

    async function handleFormSubmit(event: CustomEvent) {
        if (isSubmitting) return; // Prevent double submission
        
        const reading = event.detail;
        const user = $currentUser;
        if (!user) {
            dispatch('navigate', 'login');
            return;
        }
        
        isSubmitting = true;
        
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
                formComponent?.resetForm();
                setTimeout(() => {
                    successMessage = '';
                    dispatch('navigate', 'dashboard');
                }, 1500);
            } else {
                alert('Failed to save reading');
                isSubmitting = false;
            }
        } catch (err) {
            alert('Failed to save reading. Please try again.');
            isSubmitting = false;
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
        animation: slideIn 0.3s ease-out;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
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
        opacity: 0.6;
    }

    .voice-icon {
        margin-right: 0.5rem;
    }
</style>

<div class="page">
    <h1 style="text-align: center; margin-bottom: 2rem;">Record Blood Pressure</h1>

    {#if successMessage}
        <div class="success-message">✅ {successMessage}</div>
    {/if}

    <button class="voice-input-btn" disabled>
        <span class="voice-icon">🎤</span>
        Voice Input (Coming Soon)
    </button>

    <ReadingForm bind:this={formComponent} bind:isSubmitting on:submit={handleFormSubmit} />
</div>
