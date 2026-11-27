<script lang="ts">
    import { onMount } from 'svelte';
    import { currentUser } from '../stores/appStore';
    import { readings, type BloodPressureReading } from '../stores/readingsStore';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    let readingsList: BloodPressureReading[] = [];
    let loading = true;
    let viewMode: 'cards' | 'table' = 'cards';

    function getBPStatus(systolic: number, diastolic: number): { status: string; color: string; bg: string } {
        // AHA Blood Pressure Categories
        if (systolic >= 180 || diastolic >= 120) {
            return { status: 'Crisis', color: '#991b1b', bg: '#fee2e2' };
        }
        if (systolic >= 140 || diastolic >= 90) {
            return { status: 'High Stage 2', color: '#dc2626', bg: '#fecaca' };
        }
        if (systolic >= 130 || diastolic >= 80) {
            return { status: 'High Stage 1', color: '#ea580c', bg: '#ffedd5' };
        }
        if (systolic >= 120 && diastolic < 80) {
            return { status: 'Elevated', color: '#d97706', bg: '#fef3c7' };
        }
        if (systolic >= 90 && diastolic >= 60) {
            return { status: 'Normal', color: '#059669', bg: '#d1fae5' };
        }
        return { status: 'Low', color: '#7c3aed', bg: '#ede9fe' };
    }

    onMount(async () => {
        if (typeof window === 'undefined') return;

        // Set view mode based on screen width
        viewMode = window.innerWidth >= 768 ? 'table' : 'cards';

        const user = $currentUser;
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
        const user = $currentUser;
        if (!user) return;
        
        if (confirm('Are you sure you want to delete this reading?')) {
            fetch(`/api/users/${user.id}/readings/${id}`, { method: 'DELETE' })
                .then(response => {
                    if (response.ok) {
                        readingsList = readingsList.filter(r => r.id !== id);
                        readings.set(readingsList);
                    } else {
                        alert('Failed to delete reading');
                    }
                })
                .catch(err => {
                    console.error('Delete failed:', err);
                    alert('Failed to delete reading');
                });
        }
    }

    function exportCSV() {
        const user = $currentUser;
        if (!user) return;
        window.location.href = `/api/users/${user.id}/readings/export`;
    }

    function formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
</script>

<div class="readings-page">
    <header class="page-header">
        <div class="header-content">
            <h1>📋 Readings</h1>
            <p>{readingsList.length} total readings</p>
        </div>
        <div class="header-actions">
            <div class="view-toggle desktop-only">
                <button 
                    class="toggle-btn" 
                    class:active={viewMode === 'cards'}
                    on:click={() => viewMode = 'cards'}
                    aria-label="Card view"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="3" y="3" width="7" height="7" rx="1"/>
                        <rect x="14" y="3" width="7" height="7" rx="1"/>
                        <rect x="3" y="14" width="7" height="7" rx="1"/>
                        <rect x="14" y="14" width="7" height="7" rx="1"/>
                    </svg>
                </button>
                <button 
                    class="toggle-btn" 
                    class:active={viewMode === 'table'}
                    on:click={() => viewMode = 'table'}
                    aria-label="Table view"
                >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <rect x="3" y="4" width="18" height="2" rx="1"/>
                        <rect x="3" y="11" width="18" height="2" rx="1"/>
                        <rect x="3" y="18" width="18" height="2" rx="1"/>
                    </svg>
                </button>
            </div>
            <button class="export-btn" on:click={exportCSV}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7,10 12,15 17,10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span class="desktop-only">Export CSV</span>
            </button>
        </div>
    </header>

    {#if loading}
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Loading readings...</p>
        </div>
    {:else if readingsList.length === 0}
        <div class="empty-state">
            <div class="empty-icon">📊</div>
            <h2>No readings yet</h2>
            <p>Start tracking your blood pressure to see your history here.</p>
            <button class="primary-btn" on:click={() => dispatch('navigate', 'add-reading')}>
                Add Your First Reading
            </button>
        </div>
    {:else}
        <!-- Card View (Mobile Default) -->
        {#if viewMode === 'cards'}
            <div class="readings-cards">
                {#each readingsList as reading (reading.id)}
                    {@const status = getBPStatus(reading.systolic, reading.diastolic)}
                    <div class="reading-card">
                        <div class="card-header">
                            <span class="card-date">{formatDate(reading.measurement_time)}</span>
                            <span class="card-status" style="color: {status.color}; background: {status.bg}">{status.status}</span>
                        </div>
                        <div class="card-body">
                            <div class="bp-display">
                                <span class="systolic" style="color: {reading.systolic >= 140 ? '#ef4444' : '#10b981'}">{reading.systolic}</span>
                                <span class="separator">/</span>
                                <span class="diastolic" style="color: {reading.diastolic >= 90 ? '#ef4444' : '#10b981'}">{reading.diastolic}</span>
                                <span class="unit">mmHg</span>
                            </div>
                            <div class="hr-display">
                                <span class="hr-icon">❤️</span>
                                <span class="hr-value">{reading.heart_rate}</span>
                                <span class="hr-unit">bpm</span>
                            </div>
                        </div>
                        {#if reading.body_position || reading.arm_used || reading.notes}
                            <div class="card-details">
                                {#if reading.body_position}
                                    <span class="detail-tag">🧍 {reading.body_position}</span>
                                {/if}
                                {#if reading.arm_used}
                                    <span class="detail-tag">💪 {reading.arm_used}</span>
                                {/if}
                            </div>
                            {#if reading.notes}
                                <p class="card-notes">{reading.notes}</p>
                            {/if}
                        {/if}
                        <div class="card-actions">
                            <button class="delete-btn" on:click={() => deleteReading(reading.id)}>
                                🗑️ Delete
                            </button>
                        </div>
                    </div>
                {/each}
            </div>
        {:else}
            <!-- Table View (Desktop) -->
            <div class="readings-table-wrapper">
                <table class="readings-table">
                    <thead>
                        <tr>
                            <th>Date/Time</th>
                            <th>BP (mmHg)</th>
                            <th>HR</th>
                            <th>Status</th>
                            <th>Position</th>
                            <th>Notes</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {#each readingsList as reading (reading.id)}
                            {@const status = getBPStatus(reading.systolic, reading.diastolic)}
                            <tr>
                                <td class="date-cell">{formatDate(reading.measurement_time)}</td>
                                <td class="bp-cell">
                                    <span style="color: {reading.systolic >= 140 ? '#ef4444' : '#10b981'}; font-weight: 600;">
                                        {reading.systolic}/{reading.diastolic}
                                    </span>
                                </td>
                                <td>{reading.heart_rate}</td>
                                <td>
                                    <span class="status-badge" style="color: {status.color}; background: {status.bg}">{status.status}</span>
                                </td>
                                <td>{reading.body_position || '-'}</td>
                                <td class="notes-cell">{reading.notes || '-'}</td>
                                <td>
                                    <button class="table-delete-btn" on:click={() => deleteReading(reading.id)}>🗑️</button>
                                </td>
                            </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
    {/if}
</div>

<style>
    .readings-page {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
    }

    /* Header */
    .page-header {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
    }

    .header-content h1 {
        font-size: var(--font-2xl);
        font-weight: 700;
        margin-bottom: var(--spacing-xs);
    }

    .header-content p {
        color: var(--text-secondary);
        font-size: var(--font-sm);
    }

    .header-actions {
        display: flex;
        gap: var(--spacing-sm);
        align-items: center;
    }

    .view-toggle {
        display: flex;
        background: var(--card-bg);
        border-radius: var(--radius-sm);
        padding: 2px;
        border: 1px solid var(--border-color);
    }

    .toggle-btn {
        padding: var(--spacing-sm);
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: all 0.2s;
    }

    .toggle-btn.active {
        background: var(--primary-color);
        color: white;
    }

    .export-btn {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-sm) var(--spacing-md);
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-md);
        color: var(--text-color);
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
    }

    .export-btn:hover {
        border-color: var(--primary-color);
        color: var(--primary-color);
    }

    /* Loading & Empty States */
    .loading-state, .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: var(--spacing-xl);
        text-align: center;
        min-height: 300px;
    }

    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid var(--border-color);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: var(--spacing-md);
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .empty-icon {
        font-size: 4rem;
        margin-bottom: var(--spacing-md);
    }

    .empty-state h2 {
        margin-bottom: var(--spacing-sm);
    }

    .empty-state p {
        color: var(--text-secondary);
        margin-bottom: var(--spacing-lg);
    }

    .primary-btn {
        padding: var(--spacing-md) var(--spacing-lg);
        background: var(--primary-color);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        font-size: var(--font-base);
        font-weight: 600;
        cursor: pointer;
    }

    /* Card View */
    .readings-cards {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--spacing-md);
    }

    .reading-card {
        background: var(--card-bg);
        border-radius: var(--radius-lg);
        padding: var(--spacing-md);
        box-shadow: var(--shadow-sm);
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .reading-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
    }

    .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm);
    }

    .card-date {
        font-size: var(--font-sm);
        color: var(--text-secondary);
    }

    .card-status {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-xl);
        font-size: var(--font-xs);
        font-weight: 600;
    }

    .card-body {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm);
    }

    .bp-display {
        display: flex;
        align-items: baseline;
    }

    .bp-display .systolic, .bp-display .diastolic {
        font-size: var(--font-2xl);
        font-weight: 700;
    }

    .bp-display .separator {
        font-size: var(--font-xl);
        color: var(--text-muted);
        margin: 0 2px;
    }

    .bp-display .unit {
        font-size: var(--font-xs);
        color: var(--text-muted);
        margin-left: var(--spacing-xs);
    }

    .hr-display {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
    }

    .hr-value {
        font-size: var(--font-lg);
        font-weight: 600;
    }

    .hr-unit {
        font-size: var(--font-xs);
        color: var(--text-muted);
    }

    .card-details {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs);
        margin-bottom: var(--spacing-sm);
    }

    .detail-tag {
        font-size: var(--font-xs);
        padding: var(--spacing-xs) var(--spacing-sm);
        background: var(--bg-color);
        border-radius: var(--radius-sm);
        color: var(--text-secondary);
    }

    .card-notes {
        font-size: var(--font-sm);
        color: var(--text-secondary);
        margin-bottom: var(--spacing-sm);
        padding: var(--spacing-sm);
        background: var(--bg-color);
        border-radius: var(--radius-sm);
    }

    .card-actions {
        display: flex;
        justify-content: flex-end;
        padding-top: var(--spacing-sm);
        border-top: 1px solid var(--border-color);
    }

    .delete-btn {
        padding: var(--spacing-sm) var(--spacing-md);
        background: none;
        border: 1px solid var(--danger-color);
        color: var(--danger-color);
        border-radius: var(--radius-sm);
        font-size: var(--font-sm);
        cursor: pointer;
        transition: all 0.2s;
    }

    .delete-btn:hover {
        background: var(--danger-light);
    }

    /* Table View */
    .readings-table-wrapper {
        overflow-x: auto;
        background: var(--card-bg);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
    }

    .readings-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--font-sm);
    }

    .readings-table th,
    .readings-table td {
        padding: var(--spacing-md);
        text-align: left;
        border-bottom: 1px solid var(--border-color);
    }

    .readings-table th {
        background: var(--bg-color);
        font-weight: 600;
        color: var(--text-secondary);
        white-space: nowrap;
    }

    .readings-table tr:last-child td {
        border-bottom: none;
    }

    .readings-table tr:hover {
        background: var(--bg-color);
    }

    .status-badge {
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-xl);
        font-size: var(--font-xs);
        font-weight: 600;
        white-space: nowrap;
    }

    .notes-cell {
        max-width: 200px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .table-delete-btn {
        padding: var(--spacing-sm);
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1rem;
        opacity: 0.6;
        transition: opacity 0.2s;
    }

    .table-delete-btn:hover {
        opacity: 1;
    }

    /* Responsive */
    .desktop-only {
        display: none;
    }

    @media (min-width: 480px) {
        .readings-cards {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (min-width: 768px) {
        .page-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
        }

        .desktop-only {
            display: flex;
        }
    }

    @media (min-width: 1200px) {
        .readings-cards {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    /* TV screens */
    @media (min-width: 1920px) {
        .readings-cards {
            grid-template-columns: repeat(4, 1fr);
        }

        .reading-card {
            padding: var(--spacing-lg);
        }

        .readings-table th,
        .readings-table td {
            padding: var(--spacing-lg);
        }
    }
</style>
