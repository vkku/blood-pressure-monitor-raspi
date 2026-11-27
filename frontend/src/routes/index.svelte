<script lang="ts">
    import { onMount, createEventDispatcher } from 'svelte';
    import { currentUser } from '../stores/appStore';
    
    const dispatch = createEventDispatcher();

    onMount(() => {
        if (typeof window !== 'undefined') {
            if (localStorage.getItem('currentUser')) {
                dispatch('navigate', 'dashboard');
            }
        }
    });
</script>

<div class="landing-page">
    <section class="hero">
        <div class="hero-content">
            <div class="hero-badge">🏥 Health Monitoring</div>
            <h1>Track Your <span class="highlight">Blood Pressure</span> Like Never Before</h1>
            <p class="hero-description">
                Monitor, analyze, and improve your cardiovascular health with our easy-to-use 
                blood pressure tracking app. Perfect for personal use, family health, or clinical monitoring.
            </p>
            <div class="hero-buttons">
                <button class="btn btn-primary" on:click={() => dispatch('navigate', 'register')}>
                    <span class="btn-icon">🚀</span>
                    Get Started Free
                </button>
                <button class="btn btn-secondary" on:click={() => dispatch('navigate', 'login')}>
                    <span class="btn-icon">🔑</span>
                    Login
                </button>
            </div>
            <div class="hero-stats">
                <div class="hero-stat">
                    <span class="stat-number">📊</span>
                    <span class="stat-text">Beautiful Charts</span>
                </div>
                <div class="hero-stat">
                    <span class="stat-number">📱</span>
                    <span class="stat-text">Mobile First</span>
                </div>
                <div class="hero-stat">
                    <span class="stat-number">📺</span>
                    <span class="stat-text">TV Ready</span>
                </div>
            </div>
        </div>
        <div class="hero-visual">
            <div class="bp-preview">
                <div class="preview-header">
                    <span>Live Preview</span>
                    <span class="live-dot"></span>
                </div>
                <div class="preview-reading">
                    <div class="preview-value">
                        <span class="systolic">120</span>
                        <span class="separator">/</span>
                        <span class="diastolic">80</span>
                    </div>
                    <div class="preview-unit">mmHg</div>
                    <div class="preview-status normal">Normal</div>
                </div>
                <div class="preview-hr">
                    <span class="hr-icon">❤️</span>
                    <span class="hr-value">72</span>
                    <span class="hr-unit">bpm</span>
                </div>
            </div>
        </div>
    </section>

    <section class="features">
        <h2 class="section-title">Why Choose BP Monitor?</h2>
        <div class="features-grid">
            <div class="feature-card">
                <div class="feature-icon">📊</div>
                <h3>Smart Analytics</h3>
                <p>Visualize trends with beautiful, interactive charts. View weekly, monthly, and yearly patterns.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">🔔</div>
                <h3>Instant Alerts</h3>
                <p>Get notified when readings are outside normal ranges. Never miss important health signals.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">👥</div>
                <h3>Family Profiles</h3>
                <p>Track health data for your entire family. Easy switching between user profiles.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📱</div>
                <h3>Mobile Optimized</h3>
                <p>Designed mobile-first for easy reading entry anywhere. Works great on phones and tablets.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📺</div>
                <h3>Big Screen Ready</h3>
                <p>Perfect for Smart TVs and large displays. Great for clinic waiting rooms or home dashboards.</p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">📥</div>
                <h3>Export Data</h3>
                <p>Download your data as images or CSV. Share with your doctor or keep for your records.</p>
            </div>
        </div>
    </section>

    <section class="cta">
        <div class="cta-content">
            <h2>Ready to Take Control of Your Health?</h2>
            <p>Start tracking your blood pressure today. It's free, easy, and could save your life.</p>
            <button class="btn btn-primary btn-large" on:click={() => dispatch('navigate', 'register')}>
                Create Free Account
            </button>
        </div>
    </section>
</div>

<style>
    .landing-page {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xl);
    }

    /* Hero Section */
    .hero {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-xl);
        padding: var(--spacing-lg) 0;
    }

    .hero-content {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md);
    }

    .hero-badge {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-xs) var(--spacing-md);
        background: var(--primary-light);
        color: var(--primary-color);
        border-radius: var(--radius-xl);
        font-size: var(--font-sm);
        font-weight: 600;
        width: fit-content;
    }

    .hero h1 {
        font-size: clamp(1.75rem, 5vw, 3rem);
        font-weight: 800;
        line-height: 1.2;
        color: var(--text-color);
    }

    .hero h1 .highlight {
        background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }

    .hero-description {
        font-size: var(--font-lg);
        color: var(--text-secondary);
        line-height: 1.7;
        max-width: 600px;
    }

    .hero-buttons {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm);
        margin-top: var(--spacing-md);
    }

    .btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-md) var(--spacing-lg);
        font-size: var(--font-base);
        font-weight: 600;
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: all 0.3s ease;
        border: 2px solid transparent;
    }

    .btn-icon {
        font-size: 1.25rem;
    }

    .btn-primary {
        background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
        color: white;
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    }

    .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }

    .btn-secondary {
        background: var(--card-bg);
        color: var(--text-color);
        border-color: var(--border-color);
    }

    .btn-secondary:hover {
        border-color: var(--primary-color);
        color: var(--primary-color);
    }

    .btn-large {
        padding: var(--spacing-lg) var(--spacing-xl);
        font-size: var(--font-lg);
    }

    .hero-stats {
        display: flex;
        gap: var(--spacing-lg);
        margin-top: var(--spacing-lg);
        flex-wrap: wrap;
    }

    .hero-stat {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm);
    }

    .stat-number {
        font-size: 1.5rem;
    }

    .stat-text {
        font-size: var(--font-sm);
        color: var(--text-secondary);
        font-weight: 500;
    }

    /* Hero Visual */
    .hero-visual {
        display: flex;
        justify-content: center;
    }

    .bp-preview {
        background: var(--card-bg);
        border-radius: var(--radius-xl);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-lg);
        width: 100%;
        max-width: 320px;
        border: 1px solid var(--border-color);
    }

    .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md);
        font-size: var(--font-sm);
        color: var(--text-secondary);
    }

    .live-dot {
        width: 8px;
        height: 8px;
        background: var(--success-color);
        border-radius: 50%;
        animation: pulse 2s infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
    }

    .preview-reading {
        text-align: center;
        margin-bottom: var(--spacing-md);
    }

    .preview-value {
        font-size: 3rem;
        font-weight: 700;
    }

    .preview-value .systolic {
        color: var(--success-color);
    }

    .preview-value .separator {
        color: var(--text-muted);
        margin: 0 var(--spacing-xs);
    }

    .preview-value .diastolic {
        color: var(--success-color);
    }

    .preview-unit {
        font-size: var(--font-sm);
        color: var(--text-muted);
        margin-top: var(--spacing-xs);
    }

    .preview-status {
        display: inline-block;
        padding: var(--spacing-xs) var(--spacing-md);
        border-radius: var(--radius-xl);
        font-size: var(--font-sm);
        font-weight: 600;
        margin-top: var(--spacing-sm);
    }

    .preview-status.normal {
        background: var(--success-light);
        color: var(--success-color);
    }

    .preview-hr {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--border-color);
    }

    .hr-icon {
        animation: heartbeat 1s ease-in-out infinite;
    }

    @keyframes heartbeat {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.1); }
    }

    .hr-value {
        font-size: var(--font-xl);
        font-weight: 600;
    }

    .hr-unit {
        font-size: var(--font-sm);
        color: var(--text-muted);
    }

    /* Features Section */
    .features {
        padding: var(--spacing-xl) 0;
    }

    .section-title {
        text-align: center;
        font-size: var(--font-2xl);
        font-weight: 700;
        margin-bottom: var(--spacing-xl);
        color: var(--text-color);
    }

    .features-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--spacing-md);
    }

    .feature-card {
        background: var(--card-bg);
        border-radius: var(--radius-lg);
        padding: var(--spacing-lg);
        box-shadow: var(--shadow-md);
        transition: transform 0.2s, box-shadow 0.2s;
    }

    .feature-card:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
    }

    .feature-icon {
        font-size: 2.5rem;
        margin-bottom: var(--spacing-sm);
    }

    .feature-card h3 {
        font-size: var(--font-lg);
        font-weight: 600;
        margin-bottom: var(--spacing-sm);
        color: var(--text-color);
    }

    .feature-card p {
        color: var(--text-secondary);
        line-height: 1.6;
    }

    /* CTA Section */
    .cta {
        background: linear-gradient(135deg, var(--primary-color), #8b5cf6);
        border-radius: var(--radius-xl);
        padding: var(--spacing-xl);
        text-align: center;
        margin: var(--spacing-lg) 0;
    }

    .cta-content h2 {
        color: white;
        font-size: var(--font-2xl);
        font-weight: 700;
        margin-bottom: var(--spacing-sm);
    }

    .cta-content p {
        color: rgba(255, 255, 255, 0.9);
        margin-bottom: var(--spacing-lg);
        font-size: var(--font-lg);
    }

    .cta .btn-primary {
        background: white;
        color: var(--primary-color);
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    }

    .cta .btn-primary:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
    }

    /* Responsive */
    @media (min-width: 480px) {
        .hero-buttons {
            flex-direction: row;
        }

        .features-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }

    @media (min-width: 768px) {
        .hero {
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
        }

        .hero-content {
            flex: 1;
            max-width: 55%;
        }

        .hero-visual {
            flex: 1;
            justify-content: flex-end;
        }

        .features-grid {
            grid-template-columns: repeat(3, 1fr);
        }
    }

    @media (min-width: 1200px) {
        .hero h1 {
            font-size: 3.5rem;
        }

        .bp-preview {
            max-width: 380px;
        }
    }

    /* TV screens */
    @media (min-width: 1920px) {
        .hero {
            padding: var(--spacing-xl) 0;
        }

        .hero h1 {
            font-size: 4rem;
        }

        .hero-description {
            font-size: var(--font-xl);
        }

        .feature-card {
            padding: var(--spacing-xl);
        }

        .feature-icon {
            font-size: 3.5rem;
        }

        .cta {
            padding: var(--spacing-xl) calc(var(--spacing-xl) * 2);
        }
    }
</style>
