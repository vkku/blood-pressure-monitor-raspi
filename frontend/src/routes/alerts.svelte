<script lang="ts">
    import { onMount } from 'svelte';
    import { currentUser } from '../stores/appStore';
    import { alerts } from '../stores/alertsStore';
    import { browser } from '$app/environment';
    import { createEventDispatcher } from 'svelte';

    const dispatch = createEventDispatcher();

    interface Alert {
        id: number;
        alert_type: string;
        message: string;
        severity: string;
        is_read: boolean;
        created_at: string;
    }

    let alertsList: Alert[] = [];
    let loading = true;

    onMount(async () => {
        if (!browser) return;

        const user = currentUser;
        if (!user) {
            dispatch('navigate', 'login');
            return;
        }

        try {
            const response = await fetch(`/api/users/${user.id}/alerts`);
            if (response.ok) {
                alertsList = await response.json();
                alerts.set(alertsList);
            }
        } catch (err) {
            console.error('Failed to fetch alerts:', err);
        } finally {
            loading = false;
        }
    });

    function markAsRead(alertId: number) {
        fetch(`/api/users/${currentUser.id}/alerts/${alertId}/read`, { method: 'PUT' })
            .then(() => {
                alertsList = alertsList.map(a => 
                    a.id === alertId ? { ...a, is_read: true } : a
                );
                alerts.set(alertsList);
            });
    }

    function getAlertIcon(severity: string, type: string) {
        if (type === 'high_bp') return '🩸';
        if (type === 'low_bp') return '📉';
        if (type === 'high_heart_rate') return '❤️‍🔥';
        if (type === 'low_heart_rate') return '❤️‍🩹';
        return '⚠️';
    }

    function getAlertColor(severity: string) {
        if (severity === 'warning') return '#fef3c7';
        if (severity === 'danger') return '#fee2e2';
        return '#f3f4f6';
    }

    function getAlertTextColor(severity: string) {
        if (severity === 'warning') return '#92400e';
        if (severity === 'danger') return '#991b1b';
        return '#374151';
    }
</script>

<style>
    .alerts-page {
        max-width: 700px;
        margin: 0 auto;
    }

    .alert-card {
        background: var(--card-bg);
        border-radius: 8px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .alert-card.unread {
        border-left: 4px solid var(--primary-color);
    }

    .alert-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
    }

    .alert-icon {
        font-size: 1.5rem;
    }

    .alert-time {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }

    .alert-message {
        color: var(--text-color);
        line-height: 1.5;
    }

    .mark-read-btn {
        color: var(--primary-color);
        cursor: pointer;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
    }

    .mark-read-btn:hover {
        background: var(--primary-color);
        color: white;
    }

    .empty-state {
        text-align: center;
        padding: 2rem;
        color: var(--text-secondary);
    }

    .stats {
        display: flex;
        gap: 1rem;
        margin-bottom: 1.5rem;
    }

    .stat {
        padding: 0.75rem 1.5rem;
        background: var(--card-bg);
        border-radius: 8px;
        text-align: center;
    }

    .stat-value {
        font-size: 1.5rem;
        font-weight: bold;
    }

    .stat-label {
        font-size: 0.875rem;
        color: var(--text-secondary);
    }
</style>

<div class="alerts-page">
    <h2>Alerts & Notifications</h2>

    <div class="stats">
        <div class="stat">
            <div class="stat-value">{alertsList.filter(a => !a.is_read).length}</div>
            <div class="stat-label">Unread</div>
        </div>
        <div class="stat">
            <div class="stat-value">{alertsList.filter(a => a.severity === 'warning').length}</div>
            <div class="stat-label">Warnings</div>
        </div>
        <div class="stat">
            <div class="stat-value">{alertsList.length}</div>
            <div class="stat-label">Total</div>
        </div>
    </div>

    {#if loading}
        <p>Loading alerts...</p>
    {:else if alertsList.length === 0}
        <div class="empty-state">
            <p>No alerts. All systems normal! 🎉</p>
        </div>
    {:else}
        {#each alertsList as alert (alert.id)}
            <div 
                class="alert-card {alert.is_read ? '' : 'unread'}"
                style="background: {getAlertColor(alert.severity)}; border-left-color: {getAlertColor(alert.severity)}"
            >
                <div class="alert-header">
                    <div>
                        <span class="alert-icon">{getAlertIcon(alert.severity, alert.alert_type)}</span>
                        <span style="margin-left: 0.5rem; font-weight: 500; color: {getAlertTextColor(alert.severity)};">
                            {alert.alert_type.replace('_', ' ').toUpperCase()}
                        </span>
                    </div>
                    <div class="alert-time">{alert.created_at.split('T')[0]}</div>
                </div>
                <p class="alert-message">{alert.message}</p>
                {#if !alert.is_read}
                    <p style="text-align: right; margin-top: 0.5rem;">
                        <span class="mark-read-btn" on:click={() => markAsRead(alert.id)}>✓ Mark as read</span>
                    </p>
                {/if}
            </div>
        {/each}
    {/if}
</div>
