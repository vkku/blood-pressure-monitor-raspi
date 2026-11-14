<script lang="ts">
    import { onMount } from 'svelte';
    import { currentUser, darkMode } from '../stores/appStore';
    import { readings } from '../stores/readingsStore';
    import { browser } from '$app/environment';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    interface DailyTrend {
        date: string;
        avg_systolic: number;
        avg_diastolic: number;
        avg_heart_rate: number;
        reading_count: number;
    }

    let trends: DailyTrend[] = [];
    let weeklySummary: any = null;
    let loading = true;

    onMount(async () => {
        if (!browser) return;

        const user = currentUser;
        if (!user) {
            dispatch('navigate', 'login');
            return;
        }

        try {
            // Fetch daily trends
            const trendsResponse = await fetch(`/api/users/${user.id}/readings/daily-trends`);
            if (trendsResponse.ok) {
                trends = await trendsResponse.json();
            }

            // Fetch weekly summary
            const summaryResponse = await fetch(`/api/users/${user.id}/readings/weekly-summary`);
            if (summaryResponse.ok) {
                weeklySummary = await summaryResponse.json();
            }

            // Fetch recent readings
            const readingsResponse = await fetch(`/api/users/${user.id}/readings?start_date=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}`);
            if (readingsResponse.ok) {
                readings.set(await readingsResponse.json());
            }
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            loading = false;
        }
    });
</script>

<style>
    .dashboard {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 1.5rem;
    }

    .card {
        background: var(--card-bg);
        border-radius: 8px;
        padding: 1.5rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .card h3 {
        margin-top: 0;
        color: var(--text-color);
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;
        text-align: center;
    }

    .stat {
        padding: 1rem;
        background: var(--card-bg);
        border-radius: 8px;
    }

    .stat-value {
        font-size: 1.5rem;
        font-weight: bold;
        color: var(--primary-color);
    }

    .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .chart-container {
        height: 200px;
    }

    .alerts-list {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .alert-item {
        padding: 0.75rem;
        border-bottom: 1px solid var(--border-color);
    }

    .alert-item:last-child {
        border-bottom: none;
    }

    .alert-item.warning {
        background: #fef3c7;
        color: #92400e;
    }

    .alert-item.danger {
        background: #fee2e2;
        color: #991b1b;
    }

    .loading {
        text-align: center;
        padding: 2rem;
    }
</style>

{#if loading}
    <div class="loading">Loading dashboard...</div>
{:else}
    <div class="dashboard">
        <div class="card">
            <h3>Weekly Summary</h3>
            {#if weeklySummary}
                <div class="stats-grid">
                    <div class="stat">
                        <div class="stat-value">{Math.round(weeklySummary.avg_systolic || 0)} <span style="font-size: 1rem">mmHg</span></div>
                        <div class="stat-label">Avg Systolic</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">{Math.round(weeklySummary.avg_diastolic || 0)} <span style="font-size: 1rem">mmHg</span></div>
                        <div class="stat-label">Avg Diastolic</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">{Math.round(weeklySummary.avg_heart_rate || 0)}</div>
                        <div class="stat-label">Avg Heart Rate</div>
                    </div>
                </div>
                <div class="stats-grid" style="margin-top: 1rem;">
                    <div class="stat">
                        <div class="stat-value">{weeklySummary.total_readings || 0}</div>
                        <div class="stat-label">Total Readings</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">{weeklySummary.max_systolic || 0}</div>
                        <div class="stat-label">Max Systolic</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">{weeklySummary.min_systolic || 0}</div>
                        <div class="stat-label">Min Systolic</div>
                    </div>
                </div>
            {:else}
                <p>No data available for the past week.</p>
            {/if}
        </div>

        <div class="card">
            <h3>Recent Readings</h3>
            {#if $readings.length > 0}
                <ul class="alerts-list">
                    {#each $readings.slice(0, 5) as reading (reading.id)}
                        <li class="alert-item">
                            <div>{reading.measurement_time.split('T')[0]}</div>
                            <div>
                                <span style="color: {reading.systolic >= 140 ? '#ef4444' : '#10b981'}">
                                    {reading.systolic}/{reading.diastolic}
                                </span>
                                <span style="margin-left: 1rem;">HR: {reading.heart_rate}</span>
                            </div>
                        </li>
                    {/each}
                </ul>
            {:else}
                <p>No recent readings.</p>
            {/if}
        </div>

        <div class="card">
            <h3>7-Day Trends</h3>
            {#if trends.length > 0}
                <div class="chart-container">
                    <!-- Chart will be rendered here -->
                    <p style="text-align: center; color: var(--text-secondary);">
                        Chart visualization coming soon
                    </p>
                </div>
            {:else}
                <p>No trend data available.</p>
            {/if}
        </div>
    </div>
{/if}
