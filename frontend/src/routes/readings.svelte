<script lang="ts">
    import { onMount } from 'svelte';
    import { currentUser } from '../stores/appStore';
    import { readings } from '../stores/readingsStore';
    import { browser } from '$app/environment';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    interface Reading {
        id: number;
        systolic: number;
        diastolic: number;
        heart_rate: number;
        measurement_time: string;
        notes: string;
        medication: string;
        body_position: string;
        arm_used: string;
        activity_level: string;
    }

    let readingsList: Reading[] = [];
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
            const response = await fetch(`/api/users/${user.id}/readings`);
            if (response.ok) {
                readingsList = await response.json();
                readings.set(readingsList);
            }
        } catch (err) {
            console.error('Failed to fetch readings:', err);
        } finally {
            loading = false;
        }
    });

    function deleteReading(id: number) {
        if (confirm('Are you sure you want to delete this reading?')) {
            fetch(`/api/users/${currentUser.id}/readings/${id}`, { method: 'DELETE' })
                .then(() => {
                    readingsList = readingsList.filter(r => r.id !== id);
                    readings.set(readingsList);
                });
        }
    }

    function exportCSV() {
        window.location.href = `/api/users/${currentUser.id}/readings/export`;
    }
</script>

<style>
    .readings-page {
        max-width: 1000px;
        margin: 0 auto;
    }

    .controls {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
    }

    .controls button {
        padding: 0.75rem 1.5rem;
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .controls button:hover {
        opacity: 0.9;
    }

    .readings-table {
        width: 100%;
        border-collapse: collapse;
        background: var(--card-bg);
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .readings-table th,
    .readings-table td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid var(--border-color);
    }

    .readings-table th {
        background: var(--table-header-bg);
        font-weight: 600;
    }

    .readings-table tr:last-child td {
        border-bottom: none;
    }

    .readings-table tr:hover {
        background: var(--table-row-hover);
    }

    .status-high {
        color: #ef4444;
        font-weight: bold;
    }

    .status-normal {
        color: #10b981;
    }

    .delete-btn {
        color: #ef4444;
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
    }

    .delete-btn:hover {
        background: #fee2e2;
    }

    .empty-state {
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary);
    }
</style>

<div class="readings-page">
    <div class="controls">
        <h2>Blood Pressure Readings</h2>
        <button on:click={exportCSV}>Export CSV</button>
    </div>

    {#if loading}
        <p>Loading readings...</p>
    {:else if readingsList.length === 0}
        <div class="empty-state">
            <p>No readings yet. Add your first reading!</p>
        </div>
    {:else}
        <table class="readings-table">
            <thead>
                <tr>
                    <th>Date/Time</th>
                    <th>Systolic</th>
                    <th>Diastolic</th>
                    <th>Heart Rate</th>
                    <th>Position</th>
                    <th>Arm</th>
                    <th>Activity</th>
                    <th>Notes</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                {#each readingsList as reading (reading.id)}
                    <tr>
                        <td>{reading.measurement_time.split('T')[0]} {reading.measurement_time.split('T')[1]?.split(':')[0]}:{reading.measurement_time.split('T')[1]?.split(':')[1]}</td>
                        <td class="{reading.systolic >= 140 ? 'status-high' : 'status-normal'}">{reading.systolic}</td>
                        <td class="{reading.diastolic >= 90 ? 'status-high' : 'status-normal'}">{reading.diastolic}</td>
                        <td>{reading.heart_rate}</td>
                        <td>{reading.body_position || '-'}</td>
                        <td>{reading.arm_used || '-'}</td>
                        <td>{reading.activity_level || '-'}</td>
                        <td>{reading.notes || '-'}</td>
                        <td>
                            <span class="delete-btn" on:click={() => deleteReading(reading.id)}>🗑️</span>
                        </td>
                    </tr>
                {/each}
            </tbody>
        </table>
    {/if}
</div>
