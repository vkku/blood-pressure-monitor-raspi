<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import Chart from 'chart.js/auto';

    export let data: { labels: string[]; datasets: any[] };
    export let type: 'line' | 'bar' | 'doughnut' = 'line';
    export let title = '';
    export let height = 300;
    export let showLegend = true;
    export let enableDownload = true;
    // Raw data for comprehensive CSV export (optional)
    export let rawData: any[] = [];
    // Metadata for tooltips (dates with times, reading counts, etc.)
    export let metadata: { dates: string[]; readingCounts?: number[] } = { dates: [] };
    // User ID for fetching full readings data (optional - enables complete CSV export)
    export let userId: number | null = null;
    // Period for filtering exported data
    export let period: 'week' | 'month' | 'year' = 'week';

    let canvas: HTMLCanvasElement;
    let chart: Chart | null = null;
    let containerRef: HTMLDivElement;
    let isExporting = false;

    const gradientColors = {
        systolic: { start: 'rgba(239, 68, 68, 0.8)', end: 'rgba(239, 68, 68, 0.1)' },
        diastolic: { start: 'rgba(59, 130, 246, 0.8)', end: 'rgba(59, 130, 246, 0.1)' },
        heartRate: { start: 'rgba(16, 185, 129, 0.8)', end: 'rgba(16, 185, 129, 0.1)' }
    };

    function createGradient(ctx: CanvasRenderingContext2D, colorKey: string) {
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        const colors = gradientColors[colorKey as keyof typeof gradientColors] || gradientColors.systolic;
        gradient.addColorStop(0, colors.start);
        gradient.addColorStop(1, colors.end);
        return gradient;
    }

    function formatDateTime(dateStr: string): string {
        try {
            const date = new Date(dateStr);
            return date.toLocaleString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return dateStr;
        }
    }

    function initChart() {
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        if (chart) {
            chart.destroy();
        }

        const processedDatasets = data.datasets.map((ds, index) => {
            const colorKeys = ['systolic', 'diastolic', 'heartRate'];
            const colorKey = colorKeys[index] || 'systolic';
            
            return {
                ...ds,
                fill: type === 'line',
                backgroundColor: type === 'line' ? createGradient(ctx, colorKey) : ds.backgroundColor,
                borderWidth: type === 'line' ? 3 : 1,
                pointRadius: type === 'line' ? 4 : undefined,
                pointHoverRadius: type === 'line' ? 8 : undefined,
                pointBackgroundColor: ds.borderColor,
                pointHoverBackgroundColor: ds.borderColor,
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 3,
                tension: 0.4,
            };
        });

        chart = new Chart(ctx, {
            type,
            data: {
                labels: data.labels,
                datasets: processedDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        display: showLegend,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 12,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(15, 23, 42, 0.95)',
                        titleFont: { size: 14, weight: 'bold' },
                        bodyFont: { size: 13 },
                        footerFont: { size: 11, style: 'italic' },
                        padding: 16,
                        cornerRadius: 12,
                        displayColors: true,
                        boxPadding: 6,
                        callbacks: {
                            title: function(context) {
                                const index = context[0]?.dataIndex;
                                // Show full date from metadata if available
                                if (metadata.dates && metadata.dates[index]) {
                                    return formatDateTime(metadata.dates[index]);
                                }
                                return context[0]?.label || '';
                            },
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    if (label.includes('Heart')) {
                                        label += context.parsed.y + ' bpm';
                                    } else {
                                        label += context.parsed.y + ' mmHg';
                                    }
                                }
                                return label;
                            },
                            footer: function(context) {
                                const index = context[0]?.dataIndex;
                                if (metadata.readingCounts && metadata.readingCounts[index]) {
                                    const count = metadata.readingCounts[index];
                                    return count > 1 ? `📊 Average of ${count} readings` : '📊 Single reading';
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: type === 'line' || type === 'bar' ? {
                    x: {
                        grid: {
                            display: false,
                        },
                        ticks: {
                            font: { size: 11 },
                            maxRotation: 45,
                            minRotation: 0
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)',
                        },
                        ticks: {
                            font: { size: 11 },
                            padding: 8
                        },
                        beginAtZero: false,
                        suggestedMin: 50,
                        suggestedMax: 180
                    }
                } : undefined,
                animation: {
                    duration: 1000,
                    easing: 'easeOutQuart'
                }
            }
        });
    }

    function downloadChart(format: 'png' | 'jpg') {
        if (!canvas) return;
        
        // Create a temporary canvas with white background
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) return;
        
        // Set dimensions to match the chart canvas
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        
        // Fill with white background
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Draw the chart on top of the white background
        tempCtx.drawImage(canvas, 0, 0);
        
        // Export the combined image
        const link = document.createElement('a');
        link.download = `${title || 'chart'}-${new Date().toISOString().split('T')[0]}.${format}`;
        link.href = tempCanvas.toDataURL(`image/${format}`, 1.0);
        link.click();
    }

    async function downloadData() {
        if (isExporting) return;
        isExporting = true;

        try {
            // If userId is provided, fetch complete readings with all fields
            if (userId) {
                const response = await fetch(`/api/users/${userId}/readings`);
                if (response.ok) {
                    let allReadings = await response.json();
                    
                    // Filter by period
                    const now = new Date();
                    if (period === 'week') {
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        allReadings = allReadings.filter((r: any) => new Date(r.measurement_time) >= weekAgo);
                    } else if (period === 'month') {
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        allReadings = allReadings.filter((r: any) => new Date(r.measurement_time) >= monthAgo);
                    }
                    // year = all data
                    
                    if (allReadings.length > 0) {
                        exportFullReadings(allReadings);
                        return;
                    }
                }
            }
            
            // Fallback to basic export if no userId or fetch failed
            exportBasicData();
        } catch (err) {
            console.error('Failed to fetch readings for export:', err);
            exportBasicData();
        } finally {
            isExporting = false;
        }
    }

    function exportFullReadings(readings: any[]) {
        const columns = [
            'Date',
            'Time',
            'DateTime',
            'Systolic (mmHg)',
            'Diastolic (mmHg)',
            'Heart Rate (bpm)',
            'Body Position',
            'Arm Used',
            'Activity Level',
            'Medication',
            'Notes'
        ];
        
        const rows = readings.map(r => {
            const date = new Date(r.measurement_time);
            // Use YYYY-MM-DD format for better Excel compatibility
            const dateStr = date.getFullYear() + '-' + 
                String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                String(date.getDate()).padStart(2, '0');
            // Use HH:MM:SS 24-hour format
            const timeStr = String(date.getHours()).padStart(2, '0') + ':' + 
                String(date.getMinutes()).padStart(2, '0') + ':' + 
                String(date.getSeconds()).padStart(2, '0');
            // Combined datetime for easy sorting
            const dateTimeStr = dateStr + ' ' + timeStr;
            
            return [
                dateStr,
                timeStr,
                dateTimeStr,
                r.systolic || '',
                r.diastolic || '',
                r.heart_rate || '',
                r.body_position || '',
                r.arm_used || '',
                r.activity_level || '',
                r.medication ? 'Yes' : 'No',
                `"${(r.notes || '').replace(/"/g, '""')}"`
            ].join(',');
        });
        
        const csvContent = [columns.join(','), ...rows].join('\n');
        downloadCSV(csvContent);
    }

    function exportBasicData() {
        // Fallback: export chart data with timestamps from metadata
        const columns = ['Date', 'Time', ...data.datasets.map(ds => ds.label), 'Reading Count'];
        
        const rows = data.labels.map((label, i) => {
            let dateStr = label;
            let timeStr = '';
            
            // Use metadata for full date/time if available
            if (metadata.dates && metadata.dates[i]) {
                const date = new Date(metadata.dates[i]);
                dateStr = date.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
                timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            }
            
            const readingCount = metadata.readingCounts?.[i] || 1;
            return [dateStr, timeStr, ...data.datasets.map(ds => ds.data[i]), readingCount].join(',');
        });
        
        const csvContent = [columns.join(','), ...rows].join('\n');
        downloadCSV(csvContent);
    }

    function downloadCSV(csvContent: string) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${title || 'blood-pressure-data'}-${period}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    }

    onMount(() => {
        initChart();
    });

    onDestroy(() => {
        if (chart) {
            chart.destroy();
        }
    });

    $: if (canvas && data) {
        initChart();
    }
</script>

<div class="chart-wrapper" bind:this={containerRef}>
    {#if title}
        <div class="chart-header">
            <h3 class="chart-title">{title}</h3>
            {#if enableDownload}
                <div class="download-menu">
                    <button class="download-btn" aria-label="Download options">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                            <polyline points="7,10 12,15 17,10"/>
                            <line x1="12" y1="15" x2="12" y2="3"/>
                        </svg>
                    </button>
                    <div class="download-dropdown">
                        <button on:click={() => downloadChart('png')}>📷 PNG Image</button>
                        <button on:click={() => downloadChart('jpg')}>🖼️ JPG Image</button>
                        <button on:click={downloadData}>📊 CSV Data</button>
                    </div>
                </div>
            {/if}
        </div>
    {/if}
    <div class="chart-container" style="height: {height}px;">
        <canvas bind:this={canvas}></canvas>
    </div>
</div>

<style>
    .chart-wrapper {
        background: var(--card-bg);
        border-radius: var(--radius-lg);
        padding: var(--spacing-md);
        box-shadow: var(--shadow-md);
        margin-bottom: var(--spacing-md);
    }

    .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
        padding-bottom: var(--spacing-sm);
        border-bottom: 1px solid var(--border-color);
    }

    .chart-title {
        font-size: var(--font-lg);
        font-weight: 600;
        color: var(--text-color);
        margin: 0;
    }

    .chart-container {
        position: relative;
        width: 100%;
    }

    .download-menu {
        position: relative;
    }

    .download-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        border: none;
        background: var(--primary-light);
        color: var(--primary-color);
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .download-btn:hover {
        background: var(--primary-color);
        color: white;
    }

    .download-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: var(--spacing-xs);
        background: var(--card-bg);
        border-radius: var(--radius-sm);
        box-shadow: var(--shadow-lg);
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.2s ease;
        z-index: 100;
        min-width: 150px;
        border: 1px solid var(--border-color);
    }

    .download-menu:hover .download-dropdown,
    .download-menu:focus-within .download-dropdown {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
    }

    .download-dropdown button {
        display: block;
        width: 100%;
        padding: var(--spacing-sm) var(--spacing-md);
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        font-size: var(--font-sm);
        color: var(--text-color);
        transition: background 0.2s;
    }

    .download-dropdown button:hover {
        background: var(--primary-light);
    }

    .download-dropdown button:first-child {
        border-radius: var(--radius-sm) var(--radius-sm) 0 0;
    }

    .download-dropdown button:last-child {
        border-radius: 0 0 var(--radius-sm) var(--radius-sm);
    }

    @media (max-width: 480px) {
        .chart-wrapper {
            padding: var(--spacing-sm);
            border-radius: var(--radius-md);
        }

        .chart-title {
            font-size: var(--font-base);
        }
    }
</style>
