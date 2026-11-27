<script lang="ts">
    import { onMount } from 'svelte';
    import { currentUser } from '../stores/appStore';
    import { readings } from '../stores/readingsStore';
    import { createEventDispatcher } from 'svelte';
    import Chart from '../components/Chart.svelte';

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
    let selectedPeriod: 'week' | 'month' | 'year' = 'week';
    let showBPInfo = false;

    $: chartResult = getChartData(trends, selectedPeriod);
    $: chartData = chartResult.data;
    $: chartMetadata = chartResult.metadata;
    $: chartRawData = chartResult.rawData;
    
    // Recalculate summary when period changes
    $: if (trends.length > 0 && selectedPeriod) {
        weeklySummary = calculateSummaryFromTrends();
    }

    function getChartData(trends: DailyTrend[], period: string) {
        if (!trends || !Array.isArray(trends) || trends.length === 0) {
            return { 
                data: { labels: [], datasets: [] }, 
                metadata: { dates: [], readingCounts: [] },
                rawData: []
            };
        }

        let filteredTrends = [...trends];
        const now = new Date();
        
        if (period === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredTrends = trends.filter(t => new Date(t.date) >= weekAgo);
        } else if (period === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filteredTrends = trends.filter(t => new Date(t.date) >= monthAgo);
        }
        // year shows all available data

        const labels = filteredTrends.map(t => {
            const date = new Date(t.date);
            if (period === 'week') {
                return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            } else if (period === 'month') {
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }
            return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        });

        // Extract metadata for enhanced tooltips
        const metadata = {
            dates: filteredTrends.map(t => t.date),
            readingCounts: filteredTrends.map(t => t.reading_count)
        };

        return {
            data: {
                labels,
                datasets: [
                    {
                        label: 'Systolic',
                        data: filteredTrends.map(t => Math.round(t.avg_systolic)),
                        borderColor: '#ef4444',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    },
                    {
                        label: 'Diastolic',
                        data: filteredTrends.map(t => Math.round(t.avg_diastolic)),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    },
                    {
                        label: 'Heart Rate',
                        data: filteredTrends.map(t => Math.round(t.avg_heart_rate)),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    }
                ]
            },
            metadata,
            rawData: filteredTrends
        };
    }

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

    async function fetchDashboardData(userId: number) {
        loading = true;
        trends = [];
        weeklySummary = null;
        
        try {
            // Fetch daily trends (get more data for year view)
            const trendsResponse = await fetch(`/api/users/${userId}/readings/daily-trends?days=365`);
            if (trendsResponse.ok) {
                const data = await trendsResponse.json();
                trends = Array.isArray(data) ? data : [];
                
                // Auto-select best period based on data availability
                autoSelectPeriod();
            }

            // Fetch weekly summary first, fall back to monthly if empty
            const summaryResponse = await fetch(`/api/users/${userId}/readings/weekly-summary`);
            if (summaryResponse.ok) {
                const summary = await summaryResponse.json();
                // If weekly has no readings, calculate from all readings
                if (!summary.total_readings || summary.total_readings === 0) {
                    weeklySummary = calculateSummaryFromTrends();
                } else {
                    weeklySummary = summary;
                }
            }

            // Fetch recent readings
            const readingsResponse = await fetch(`/api/users/${userId}/readings?limit=10`);
            if (readingsResponse.ok) {
                const readingsData = await readingsResponse.json();
                readings.set(Array.isArray(readingsData) ? readingsData : []);
            }
        } catch (err) {
            console.error('Failed to fetch dashboard data:', err);
        } finally {
            loading = false;
        }
    }

    function autoSelectPeriod() {
        if (!trends || trends.length === 0) return;
        
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        
        const weekData = trends.filter(t => new Date(t.date) >= weekAgo);
        const monthData = trends.filter(t => new Date(t.date) >= monthAgo);
        
        if (weekData.length > 0) {
            selectedPeriod = 'week';
        } else if (monthData.length > 0) {
            selectedPeriod = 'month';
        } else {
            selectedPeriod = 'year';
        }
    }

    function calculateSummaryFromTrends(): any {
        if (!trends || trends.length === 0) {
            return { total_readings: 0, avg_systolic: 0, avg_diastolic: 0, avg_heart_rate: 0 };
        }
        
        // Use data from selected period for summary
        const now = new Date();
        let filteredTrends = trends;
        
        if (selectedPeriod === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filteredTrends = trends.filter(t => new Date(t.date) >= weekAgo);
        } else if (selectedPeriod === 'month') {
            const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            filteredTrends = trends.filter(t => new Date(t.date) >= monthAgo);
        }
        
        if (filteredTrends.length === 0) filteredTrends = trends;
        
        const totalReadings = filteredTrends.reduce((sum, t) => sum + t.reading_count, 0);
        const avgSystolic = filteredTrends.reduce((sum, t) => sum + t.avg_systolic * t.reading_count, 0) / totalReadings;
        const avgDiastolic = filteredTrends.reduce((sum, t) => sum + t.avg_diastolic * t.reading_count, 0) / totalReadings;
        const avgHeartRate = filteredTrends.reduce((sum, t) => sum + t.avg_heart_rate * t.reading_count, 0) / totalReadings;
        
        const systolicValues = filteredTrends.map(t => t.avg_systolic);
        const minSystolic = Math.min(...systolicValues);
        const maxSystolic = Math.max(...systolicValues);
        
        return {
            total_readings: totalReadings,
            avg_systolic: avgSystolic,
            avg_diastolic: avgDiastolic,
            avg_heart_rate: avgHeartRate,
            min_systolic: minSystolic,
            max_systolic: maxSystolic
        };
    }

    onMount(async () => {
        if (typeof window === 'undefined') return;

        const user = $currentUser;
        if (!user) {
            dispatch('navigate', 'login');
            return;
        }

        await fetchDashboardData(user.id);
    });

    // Reactive: refetch when user changes
    $: if ($currentUser?.id) {
        fetchDashboardData($currentUser.id);
    }
</script>

<div class="dashboard">
    {#if loading}
        <div class="loading-screen">
            <div class="loading-spinner"></div>
            <p>Loading your health data...</p>
        </div>
    {:else}
        <!-- Welcome Header -->
        <header class="welcome-header">
            <div class="welcome-text">
                <h1>Welcome back{$currentUser?.name ? `, ${$currentUser.name.split(' ')[0]}` : ''} 👋</h1>
                <p>Here's your blood pressure overview</p>
            </div>
            <button class="quick-add-btn" on:click={() => dispatch('navigate', 'add-reading')}>
                <span>+</span> Add Reading
            </button>
        </header>

        <!-- Stats Cards -->
        <section class="stats-section">
            {#if weeklySummary}
                {@const bpStatus = getBPStatus(weeklySummary.avg_systolic || 0, weeklySummary.avg_diastolic || 0)}
                <button class="stat-card hero-card clickable-card" style="--accent-color: {bpStatus.color}; --accent-bg: {bpStatus.bg}" on:click={() => dispatch('navigate', 'readings')}>
                    <div class="stat-icon">🩺</div>
                    <div class="stat-content">
                        <div class="stat-value">
                            <span class="bp-reading">{Math.round(weeklySummary.avg_systolic || 0)}</span>
                            <span class="bp-separator">/</span>
                            <span class="bp-reading">{Math.round(weeklySummary.avg_diastolic || 0)}</span>
                        </div>
                        <div class="stat-label">Average BP (mmHg)</div>
                        <div class="stat-status-row">
                            <div class="stat-status" style="color: {bpStatus.color}; background: {bpStatus.bg}">{bpStatus.status}</div>
                            <button class="info-btn" on:click|stopPropagation={() => showBPInfo = true} aria-label="Blood pressure categories info">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="16" x2="12" y2="12"/>
                                    <line x1="12" y1="8" x2="12.01" y2="8"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </button>

                <button class="stat-card clickable-card" on:click={() => dispatch('navigate', 'readings')}>
                    <div class="stat-icon">❤️</div>
                    <div class="stat-content">
                        <div class="stat-value">{Math.round(weeklySummary.avg_heart_rate || 0)}</div>
                        <div class="stat-label">Avg Heart Rate</div>
                        <div class="stat-unit">bpm</div>
                    </div>
                </button>

                <button class="stat-card clickable-card" on:click={() => dispatch('navigate', 'readings')}>
                    <div class="stat-icon">📊</div>
                    <div class="stat-content">
                        <div class="stat-value">{weeklySummary.total_readings || 0}</div>
                        <div class="stat-label">Readings</div>
                        <div class="stat-unit">{selectedPeriod === 'week' ? 'this week' : selectedPeriod === 'month' ? 'this month' : 'this year'}</div>
                    </div>
                </button>

                <button class="stat-card clickable-card" on:click={() => dispatch('navigate', 'readings')}>
                    <div class="stat-icon">📈</div>
                    <div class="stat-content">
                        <div class="stat-value range-value">
                            {weeklySummary.min_systolic || 0} - {weeklySummary.max_systolic || 0}
                        </div>
                        <div class="stat-label">Systolic Range</div>
                        <div class="stat-unit">mmHg</div>
                    </div>
                </button>
            {:else}
                <div class="empty-stats">
                    <div class="empty-icon">📊</div>
                    <h3>No data yet</h3>
                    <p>Start tracking to see your stats</p>
                    <button class="primary-btn" on:click={() => dispatch('navigate', 'add-reading')}>
                        Add Your First Reading
                    </button>
                </div>
            {/if}
        </section>

        <!-- Chart Section -->
        <section class="chart-section">
            <div class="section-header">
                <h2>📈 Blood Pressure Trends</h2>
                <div class="period-selector">
                    <button 
                        class="period-btn" 
                        class:active={selectedPeriod === 'week'}
                        on:click={() => selectedPeriod = 'week'}
                    >Week</button>
                    <button 
                        class="period-btn" 
                        class:active={selectedPeriod === 'month'}
                        on:click={() => selectedPeriod = 'month'}
                    >Month</button>
                    <button 
                        class="period-btn" 
                        class:active={selectedPeriod === 'year'}
                        on:click={() => selectedPeriod = 'year'}
                    >Year</button>
                </div>
            </div>

            {#if trends.length > 0}
                <Chart 
                    data={chartData}
                    type="line"
                    title="Blood Pressure & Heart Rate"
                    height={window.innerWidth < 480 ? 250 : window.innerWidth < 768 ? 300 : 350}
                    enableDownload={true}
                    metadata={chartMetadata}
                    rawData={chartRawData}
                    userId={$currentUser?.id || null}
                    period={selectedPeriod}
                />
            {:else}
                <div class="empty-chart">
                    <div class="empty-icon">📉</div>
                    <h3>No trend data available</h3>
                    <p>Record at least 2 readings on different days to see trends</p>
                </div>
            {/if}
        </section>

        <!-- Recent Readings -->
        <section class="recent-section">
            <div class="section-header">
                <h2>📋 Recent Readings</h2>
                <button class="view-all-btn" on:click={() => dispatch('navigate', 'readings')}>
                    View All →
                </button>
            </div>

            {#if $readings.length > 0}
                <div class="readings-scroll">
                    {#each $readings.slice(0, 5) as reading (reading.id)}
                        {@const status = getBPStatus(reading.systolic, reading.diastolic)}
                        <div class="reading-card">
                            <div class="reading-date">
                                {new Date(reading.measurement_time).toLocaleDateString('en-US', { 
                                    weekday: 'short', 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                            <div class="reading-values">
                                <div class="bp-display">
                                    <span class="systolic" style="color: {reading.systolic >= 140 ? '#ef4444' : '#10b981'}">{reading.systolic}</span>
                                    <span class="separator">/</span>
                                    <span class="diastolic" style="color: {reading.diastolic >= 90 ? '#ef4444' : '#10b981'}">{reading.diastolic}</span>
                                    <span class="unit">mmHg</span>
                                </div>
                                <div class="hr-display">
                                    <span class="hr-icon">❤️</span>
                                    <span>{reading.heart_rate}</span>
                                    <span class="unit">bpm</span>
                                </div>
                            </div>
                            <div class="reading-status" style="color: {status.color}; background: {status.bg}">
                                {status.status}
                            </div>
                        </div>
                    {/each}
                </div>
            {:else}
                <div class="empty-readings">
                    <p>No recent readings</p>
                </div>
            {/if}
        </section>
    {/if}
</div>

<!-- BP Classification Info Modal -->
{#if showBPInfo}
    <div class="modal-overlay" on:click={() => showBPInfo = false} on:keydown={(e) => e.key === 'Escape' && (showBPInfo = false)} role="dialog" aria-modal="true">
        <div class="modal-content" on:click|stopPropagation role="document">
            <div class="modal-header">
                <h2>🩺 Blood Pressure Categories</h2>
                <button class="modal-close" on:click={() => showBPInfo = false} aria-label="Close">×</button>
            </div>
            <div class="modal-body">
                <table class="bp-table">
                    <thead>
                        <tr>
                            <th>Category</th>
                            <th>Systolic</th>
                            <th></th>
                            <th>Diastolic</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr class="bp-normal">
                            <td><span class="status-badge" style="background: #d1fae5; color: #059669">Normal</span></td>
                            <td>&lt; 120</td>
                            <td>and</td>
                            <td>&lt; 80</td>
                        </tr>
                        <tr class="bp-elevated">
                            <td><span class="status-badge" style="background: #fef3c7; color: #d97706">Elevated</span></td>
                            <td>120-129</td>
                            <td>and</td>
                            <td>&lt; 80</td>
                        </tr>
                        <tr class="bp-high1">
                            <td><span class="status-badge" style="background: #ffedd5; color: #ea580c">High Stage 1</span></td>
                            <td>130-139</td>
                            <td>or</td>
                            <td>80-89</td>
                        </tr>
                        <tr class="bp-high2">
                            <td><span class="status-badge" style="background: #fecaca; color: #dc2626">High Stage 2</span></td>
                            <td>≥ 140</td>
                            <td>or</td>
                            <td>≥ 90</td>
                        </tr>
                        <tr class="bp-crisis">
                            <td><span class="status-badge" style="background: #fee2e2; color: #991b1b">Crisis</span></td>
                            <td>≥ 180</td>
                            <td>or</td>
                            <td>≥ 120</td>
                        </tr>
                        <tr class="bp-low">
                            <td><span class="status-badge" style="background: #ede9fe; color: #7c3aed">Low</span></td>
                            <td>&lt; 90</td>
                            <td>or</td>
                            <td>&lt; 60</td>
                        </tr>
                    </tbody>
                </table>
                <p class="bp-source">
                    Source: <a href="https://www.heart.org/en/health-topics/high-blood-pressure/understanding-blood-pressure-readings" target="_blank" rel="noopener noreferrer">American Heart Association</a>
                </p>
                <p class="bp-note">
                    ⚠️ This app is for tracking purposes only. Consult a healthcare professional for medical advice.
                </p>
            </div>
        </div>
    </div>
{/if}

<style>
    .dashboard {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg);
    }

    /* Loading */
    .loading-screen {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        gap: var(--spacing-md);
    }

    .loading-spinner {
        width: 50px;
        height: 50px;
        border: 4px solid var(--border-color);
        border-top-color: var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* Welcome Header */
    .welcome-header {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
    }

    .welcome-text h1 {
        font-size: var(--font-2xl);
        font-weight: 700;
        color: var(--text-color);
        margin-bottom: var(--spacing-xs);
    }

    .welcome-text p {
        color: var(--text-secondary);
        font-size: var(--font-base);
    }

    .quick-add-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-md) var(--spacing-lg);
        background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
        color: white;
        border: none;
        border-radius: var(--radius-lg);
        font-size: var(--font-base);
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
        transition: all 0.3s ease;
    }

    .quick-add-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }

    .quick-add-btn span {
        font-size: 1.25rem;
        font-weight: 300;
    }

    /* Stats Section */
    .stats-section {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: var(--spacing-md);
    }

    .stat-card {
        background: var(--card-bg);
        border-radius: var(--radius-lg);
        padding: var(--spacing-md);
        box-shadow: var(--shadow-md);
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        gap: var(--spacing-sm);
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-lg);
    }

    .stat-card.clickable-card {
        cursor: pointer;
        border: none;
        text-align: center;
        width: 100%;
    }

    .stat-card.clickable-card:active {
        transform: scale(0.98);
    }

    .stat-card.hero-card {
        grid-column: span 2;
        flex-direction: row;
        justify-content: center;
        gap: var(--spacing-lg);
        padding: var(--spacing-lg);
        background: linear-gradient(135deg, var(--card-bg) 0%, var(--accent-bg, #f0f9ff) 100%);
        border: 2px solid var(--accent-bg, #e0f2fe);
    }

    .stat-icon {
        font-size: 2rem;
    }

    .stat-value {
        font-size: var(--font-2xl);
        font-weight: 700;
        color: var(--text-color);
    }

    .stat-value.range-value {
        font-size: var(--font-lg);
    }

    .bp-reading {
        font-size: var(--font-3xl);
    }

    .bp-separator {
        color: var(--text-muted);
        margin: 0 var(--spacing-xs);
    }

    .stat-label {
        font-size: var(--font-sm);
        color: var(--text-secondary);
        font-weight: 500;
    }

    .stat-unit {
        font-size: var(--font-xs);
        color: var(--text-muted);
    }

    .stat-status {
        display: inline-block;
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-xl);
        font-size: var(--font-sm);
        font-weight: 600;
        margin-top: var(--spacing-xs);
    }

    .empty-stats {
        grid-column: span 2;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--spacing-xl);
        background: var(--card-bg);
        border-radius: var(--radius-lg);
        text-align: center;
    }

    .empty-icon {
        font-size: 3rem;
        margin-bottom: var(--spacing-md);
    }

    .empty-stats h3 {
        margin-bottom: var(--spacing-sm);
    }

    .empty-stats p {
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

    /* Chart Section */
    .chart-section {
        background: var(--card-bg);
        border-radius: var(--radius-lg);
        padding: var(--spacing-md);
        box-shadow: var(--shadow-md);
    }

    .section-header {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        margin-bottom: var(--spacing-md);
    }

    .section-header h2 {
        font-size: var(--font-xl);
        font-weight: 600;
        color: var(--text-color);
    }

    .period-selector {
        display: flex;
        gap: var(--spacing-xs);
        background: var(--bg-color);
        padding: var(--spacing-xs);
        border-radius: var(--radius-md);
    }

    .period-btn {
        flex: 1;
        padding: var(--spacing-sm) var(--spacing-md);
        border: none;
        background: none;
        color: var(--text-secondary);
        font-size: var(--font-sm);
        font-weight: 500;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.2s;
    }

    .period-btn.active {
        background: var(--primary-color);
        color: white;
    }

    .empty-chart {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--spacing-xl);
        text-align: center;
        color: var(--text-secondary);
    }

    /* Recent Readings */
    .recent-section {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
    }

    .view-all-btn {
        background: none;
        border: none;
        color: var(--primary-color);
        font-size: var(--font-sm);
        font-weight: 600;
        cursor: pointer;
        padding: var(--spacing-sm);
    }

    .readings-scroll {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
    }

    .reading-card {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        padding: var(--spacing-md);
        background: var(--card-bg);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-sm);
        transition: transform 0.2s;
    }

    .reading-card:active {
        transform: scale(0.98);
    }

    .reading-date {
        font-size: var(--font-sm);
        color: var(--text-secondary);
    }

    .reading-values {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .bp-display {
        display: flex;
        align-items: baseline;
        gap: 2px;
    }

    .bp-display .systolic,
    .bp-display .diastolic {
        font-size: var(--font-xl);
        font-weight: 700;
    }

    .bp-display .separator {
        color: var(--text-muted);
        font-size: var(--font-lg);
    }

    .bp-display .unit,
    .hr-display .unit {
        font-size: var(--font-xs);
        color: var(--text-muted);
        margin-left: var(--spacing-xs);
    }

    .hr-display {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs);
        font-size: var(--font-base);
        color: var(--text-color);
    }

    .reading-status {
        align-self: flex-start;
        padding: var(--spacing-xs) var(--spacing-sm);
        border-radius: var(--radius-xl);
        font-size: var(--font-xs);
        font-weight: 600;
    }

    .empty-readings {
        padding: var(--spacing-lg);
        text-align: center;
        color: var(--text-secondary);
        background: var(--card-bg);
        border-radius: var(--radius-md);
    }

    /* Responsive */
    @media (min-width: 480px) {
        .welcome-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
        }

        .section-header {
            flex-direction: row;
            justify-content: space-between;
            align-items: center;
        }

        .period-selector {
            width: auto;
        }
    }

    @media (min-width: 768px) {
        .stats-section {
            grid-template-columns: repeat(4, 1fr);
        }

        .stat-card.hero-card {
            grid-column: span 2;
        }

        .readings-scroll {
            flex-direction: row;
            overflow-x: auto;
            padding-bottom: var(--spacing-sm);
            gap: var(--spacing-md);
        }

        .reading-card {
            min-width: 280px;
            flex-shrink: 0;
        }
    }

    @media (min-width: 1200px) {
        .stats-section {
            grid-template-columns: repeat(4, 1fr);
        }

        .stat-card.hero-card {
            grid-column: span 1;
        }
    }

    /* TV screens */
    @media (min-width: 1920px) {
        .welcome-text h1 {
            font-size: var(--font-3xl);
        }

        .stat-card {
            padding: var(--spacing-lg);
        }

        .bp-reading {
            font-size: 3rem;
        }

        .reading-card {
            padding: var(--spacing-lg);
        }
    }

    /* Info Button */
    .stat-status-row {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-xs);
    }

    .info-btn {
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        color: var(--text-muted);
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        padding: 0;
    }

    .info-btn:hover {
        background: var(--primary-light);
        color: var(--primary-color);
        transform: scale(1.1);
    }

    .info-btn:active {
        transform: scale(0.95);
    }

    .info-btn svg {
        width: 18px;
        height: 18px;
    }

    /* Modal Styles */
    .modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: var(--spacing-md);
        backdrop-filter: blur(4px);
    }

    .modal-content {
        background: var(--card-bg);
        border-radius: var(--radius-lg);
        max-width: 480px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: var(--shadow-lg);
        animation: modalSlideIn 0.2s ease-out;
    }

    @keyframes modalSlideIn {
        from {
            opacity: 0;
            transform: translateY(-20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md) var(--spacing-lg);
        border-bottom: 1px solid var(--border-color);
    }

    .modal-header h2 {
        font-size: var(--font-lg);
        margin: 0;
    }

    .modal-close {
        width: 32px;
        height: 32px;
        border: none;
        background: none;
        font-size: 24px;
        cursor: pointer;
        color: var(--text-secondary);
        border-radius: var(--radius-sm);
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .modal-close:hover {
        background: var(--bg-color);
    }

    .modal-body {
        padding: var(--spacing-lg);
    }

    .bp-table {
        width: 100%;
        border-collapse: collapse;
        font-size: var(--font-sm);
        margin-bottom: var(--spacing-lg);
    }

    .bp-table th,
    .bp-table td {
        padding: var(--spacing-sm) var(--spacing-xs);
        text-align: center;
    }

    .bp-table th {
        font-weight: 600;
        color: var(--text-secondary);
        border-bottom: 2px solid var(--border-color);
    }

    .bp-table td {
        border-bottom: 1px solid var(--border-color);
    }

    .bp-table td:first-child {
        text-align: left;
    }

    .status-badge {
        display: inline-block;
        padding: 4px 10px;
        border-radius: var(--radius-xl);
        font-size: var(--font-xs);
        font-weight: 600;
        white-space: nowrap;
    }

    .bp-source {
        font-size: var(--font-sm);
        color: var(--text-secondary);
        margin-bottom: var(--spacing-sm);
    }

    .bp-source a {
        color: var(--primary-color);
        text-decoration: none;
    }

    .bp-source a:hover {
        text-decoration: underline;
    }

    .bp-note {
        font-size: var(--font-xs);
        color: var(--text-muted);
        background: var(--bg-color);
        padding: var(--spacing-sm);
        border-radius: var(--radius-sm);
        margin: 0;
    }
</style>
