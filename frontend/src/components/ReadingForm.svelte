<script lang="ts">
    import { createEventDispatcher } from 'svelte';
    import { currentUser } from '../stores/appStore';

    const dispatch = createEventDispatcher();

    let systolic = '';
    let diastolic = '';
    let heartRate = '';
    let notes = '';
    let medication = '';
    let bodyPosition = 'standing';
    let armUsed = 'left';
    let activityLevel = 'resting';

    function handleSubmit(e: Event) {
        e.preventDefault();

        if (!systolic || !diastolic || !heartRate) {
            alert('Please fill in all required fields');
            return;
        }

        const reading = {
            user_id: currentUser.id,
            systolic: parseInt(systolic),
            diastolic: parseInt(diastolic),
            heart_rate: parseInt(heartRate),
            notes,
            medication,
            body_position: bodyPosition,
            arm_used: armUsed,
            activity_level: activityLevel
        };

        dispatch('submit', reading);
    }

    function resetForm() {
        systolic = '';
        diastolic = '';
        heartRate = '';
        notes = '';
        medication = '';
        bodyPosition = 'standing';
        armUsed = 'left';
        activityLevel = 'resting';
    }

    function getSystolicClass(value: string) {
        if (!value) return '';
        const num = parseInt(value);
        if (num >= 140 || num < 90) return 'danger';
        if (num >= 120) return 'warning';
        return 'normal';
    }

    function getDiastolicClass(value: string) {
        if (!value) return '';
        const num = parseInt(value);
        if (num >= 90 || num < 60) return 'danger';
        if (num >= 80) return 'warning';
        return 'normal';
    }

    function getSystolicStatus(value: string) {
        const num = parseInt(value);
        if (num >= 140) return 'High';
        if (num >= 120) return 'Elevated';
        if (num < 90) return 'Low';
        return 'Normal';
    }

    function getDiastolicStatus(value: string) {
        const num = parseInt(value);
        if (num >= 90) return 'High';
        if (num >= 80) return 'Elevated';
        if (num < 60) return 'Low';
        return 'Normal';
    }
</script>

<style>
    .reading-form {
        max-width: 500px;
        margin: 0 auto;
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

    input, select, textarea {
        width: 100%;
        padding: 0.75rem;
        border: 1px solid var(--border-color);
        border-radius: 4px;
        font-size: 1rem;
    }

    textarea {
        min-height: 100px;
        resize: vertical;
    }

    .blood-pressure-group {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
    }

    .blood-pressure-group .form-group {
        margin-bottom: 0;
    }

    .button-group {
        display: flex;
        gap: 1rem;
        margin-top: 2rem;
    }

    button {
        flex: 1;
        padding: 0.75rem;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background 0.2s;
    }

    .submit-btn {
        background: var(--primary-color);
        color: white;
    }

    .submit-btn:hover {
        background: var(--primary-hover);
    }

    .reset-btn {
        background: #6b7280;
        color: white;
    }

    .reset-btn:hover {
        background: #4b5563;
    }

    .blood-pressure-readings {
        display: flex;
        justify-content: center;
        gap: 2rem;
        margin-bottom: 2rem;
        padding: 1rem;
        background: var(--card-bg);
        border-radius: 8px;
    }

    .bp-item {
        text-align: center;
    }

    .bp-value {
        font-size: 2rem;
        font-weight: bold;
        color: var(--primary-color);
    }

    .bp-label {
        color: var(--text-secondary);
    }

    .bp-range {
        font-size: 0.875rem;
    }

    .bp-range.normal {
        color: #10b981;
    }

    .bp-range.warning {
        color: #f59e0b;
    }

    .bp-range.danger {
        color: #ef4444;
    }
</style>

<div class="reading-form">
    <h2>📝 Record Blood Pressure</h2>

    <div class="blood-pressure-readings">
        <div class="bp-item">
            <div class="bp-value">{systolic || '--'}</div>
            <div class="bp-label">Systolic (mmHg)</div>
            <div class="bp-range {getSystolicClass(systolic)}">
                {#if systolic}
                    {getSystolicStatus(systolic)}
                {:else} Normal: 90-120 {/if}
            </div>
        </div>
        <div class="bp-item">
            <div class="bp-value">{diastolic || '--'}</div>
            <div class="bp-label">Diastolic (mmHg)</div>
            <div class="bp-range {getDiastolicClass(diastolic)}">
                {#if diastolic}
                    {getDiastolicStatus(diastolic)}
                {:else} Normal: 60-80 {/if}
            </div>
        </div>
    </div>

    <form on:submit={handleSubmit}>
        <div class="form-group">
            <label for="systolic">Systolic Pressure *</label>
            <input
                type="number"
                id="systolic"
                bind:value={systolic}
                placeholder="e.g., 120"
                min="50"
                max="250"
                required
            />
        </div>

        <div class="form-group">
            <label for="diastolic">Diastolic Pressure *</label>
            <input
                type="number"
                id="diastolic"
                bind:value={diastolic}
                placeholder="e.g., 80"
                min="30"
                max="150"
                required
            />
        </div>

        <div class="form-group">
            <label for="heartRate">Heart Rate (bpm) *</label>
            <input
                type="number"
                id="heartRate"
                bind:value={heartRate}
                placeholder="e.g., 72"
                min="30"
                max="220"
                required
            />
        </div>

        <div class="form-group">
            <label for="bodyPosition">Body Position</label>
            <select id="bodyPosition" bind:value={bodyPosition}>
                <option value="standing">Standing</option>
                <option value="sitting">Sitting</option>
                <option value="lying">Lying Down</option>
            </select>
        </div>

        <div class="form-group">
            <label for="armUsed">Arm Used</label>
            <select id="armUsed" bind:value={armUsed}>
                <option value="left">Left Arm</option>
                <option value="right">Right Arm</option>
            </select>
        </div>

        <div class="form-group">
            <label for="activityLevel">Activity Level</label>
            <select id="activityLevel" bind:value={activityLevel}>
                <option value="resting">Resting</option>
                <option value="light">Light Activity</option>
                <option value="moderate">Moderate Activity</option>
                <option value="strenuous">Strenuous Activity</option>
            </select>
        </div>

        <div class="form-group">
            <label for="medication">Medication Taken</label>
            <input
                type="text"
                id="medication"
                bind:value={medication}
                placeholder="e.g., Lisinopril 10mg"
            />
        </div>

        <div class="form-group">
            <label for="notes">Notes</label>
            <textarea
                id="notes"
                bind:value={notes}
                placeholder="Any additional notes..."
            ></textarea>
        </div>

        <div class="button-group">
            <button type="button" class="reset-btn" on:click={resetForm}>Reset</button>
            <button type="submit" class="submit-btn">Save Reading</button>
        </div>
    </form>
</div>
