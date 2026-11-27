<script lang="ts">
    import { createEventDispatcher, onMount } from 'svelte';
    import { currentUser } from '../stores/appStore';
    import { createWorker } from 'tesseract.js';

    const dispatch = createEventDispatcher();

    let systolic = '';
    let diastolic = '';
    let heartRate = '';
    let notes = '';
    let medication = '';
    let bodyPosition = 'sitting';
    let armUsed = 'left';
    let activityLevel = 'resting';
    let showAdvanced = false;
    export let isSubmitting = false;

    // Input refs for focusing
    let systolicInput: HTMLInputElement;
    let diastolicInput: HTMLInputElement;
    let heartRateInput: HTMLInputElement;

    // Camera/OCR state
    let fileInput: HTMLInputElement;
    let isProcessingImage = false;
    let ocrProgress = 0;
    let ocrStatus = '';
    let capturedImage: string | null = null;
    let showImagePreview = false;

    // Trigger camera/file picker
    function openCamera() {
        fileInput?.click();
    }

    // Handle image selection
    async function handleImageCapture(e: Event) {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];
        if (!file) return;

        // Show preview
        capturedImage = URL.createObjectURL(file);
        showImagePreview = true;

        // Process with OCR
        await processImageWithOCR(file);
    }

    // Process image with Tesseract OCR
    async function processImageWithOCR(file: File) {
        isProcessingImage = true;
        ocrProgress = 0;
        ocrStatus = 'Initializing OCR...';

        try {
            const worker = await createWorker('eng', 1, {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        ocrProgress = Math.round(m.progress * 100);
                        ocrStatus = `Reading image... ${ocrProgress}%`;
                    }
                }
            });

            ocrStatus = 'Processing image...';
            
            // Create image for processing - handle orientation
            const processedImage = await preprocessImage(file);
            
            const { data: { text } } = await worker.recognize(processedImage);
            
            console.log('OCR Raw text:', text);
            
            // Extract BP values from OCR text
            extractBPValues(text);
            
            await worker.terminate();
            ocrStatus = 'Complete!';
            
            // Hide preview after success
            setTimeout(() => {
                showImagePreview = false;
                capturedImage = null;
            }, 1500);

        } catch (error) {
            console.error('OCR Error:', error);
            ocrStatus = 'Failed to read image. Try again.';
        } finally {
            isProcessingImage = false;
            // Reset file input for re-capture
            if (fileInput) fileInput.value = '';
        }
    }

    // Preprocess image - handle orientation and enhance for OCR
    async function preprocessImage(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    reject(new Error('Canvas context not available'));
                    return;
                }

                // Set canvas size
                let width = img.width;
                let height = img.height;
                
                // Scale down large images for faster processing
                const maxDim = 1200;
                if (width > maxDim || height > maxDim) {
                    const scale = maxDim / Math.max(width, height);
                    width *= scale;
                    height *= scale;
                }
                
                canvas.width = width;
                canvas.height = height;

                // Draw image
                ctx.drawImage(img, 0, 0, width, height);

                // Enhance contrast for LCD display reading
                const imageData = ctx.getImageData(0, 0, width, height);
                const data = imageData.data;
                
                // Convert to grayscale and increase contrast
                for (let i = 0; i < data.length; i += 4) {
                    // Grayscale
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    // Increase contrast
                    const contrast = 1.5;
                    const factor = (259 * (contrast * 128 + 255)) / (255 * (259 - contrast * 128));
                    const newGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
                    
                    data[i] = newGray;
                    data[i + 1] = newGray;
                    data[i + 2] = newGray;
                }
                
                ctx.putImageData(imageData, 0, 0);
                
                resolve(canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    // Extract BP values from OCR text
    function extractBPValues(text: string) {
        // Clean up text - remove extra spaces, normalize
        const cleanText = text.replace(/\s+/g, ' ').toUpperCase();
        console.log('Clean OCR text:', cleanText);

        // Common patterns for BP monitor displays
        // Pattern: Look for 3-digit number (systolic), 2-3 digit (diastolic), 2-3 digit (pulse)
        
        // Try to find SYS value
        let sysMatch = cleanText.match(/SYS[^\d]*(\d{2,3})/i);
        if (!sysMatch) {
            // Try finding standalone 3-digit numbers in typical systolic range
            sysMatch = cleanText.match(/\b(1[0-2]\d|1[3-9]\d|[89]\d)\b/);
        }
        
        // Try to find DIA value
        let diaMatch = cleanText.match(/DIA[^\d]*(\d{2,3})/i);
        if (!diaMatch) {
            // Look for 2-3 digit numbers in diastolic range after systolic
            const numbers = cleanText.match(/\b(\d{2,3})\b/g);
            if (numbers && numbers.length >= 2) {
                // Second number is likely diastolic
                const potentialDia = parseInt(numbers[1]);
                if (potentialDia >= 40 && potentialDia <= 150) {
                    diaMatch = [numbers[1], numbers[1]];
                }
            }
        }
        
        // Try to find PULSE value
        let pulseMatch = cleanText.match(/PULSE[^\d]*(\d{2,3})/i);
        if (!pulseMatch) {
            pulseMatch = cleanText.match(/PUL[^\d]*(\d{2,3})/i);
        }
        if (!pulseMatch) {
            // Look for third number in heart rate range
            const numbers = cleanText.match(/\b(\d{2,3})\b/g);
            if (numbers && numbers.length >= 3) {
                const potentialPulse = parseInt(numbers[2]);
                if (potentialPulse >= 40 && potentialPulse <= 200) {
                    pulseMatch = [numbers[2], numbers[2]];
                }
            }
        }

        // Also try pattern matching for LCD-style digits
        // LCD displays often show numbers stacked: SYS on top, DIA middle, PULSE bottom
        const allNumbers = cleanText.match(/\b(\d{2,3})\b/g);
        console.log('All numbers found:', allNumbers);

        if (allNumbers && allNumbers.length >= 3) {
            // Sort by value to identify: highest=systolic, middle=diastolic, lowest=pulse usually
            const nums = allNumbers.map(n => parseInt(n)).filter(n => n > 30 && n < 300);
            nums.sort((a, b) => b - a);
            
            if (nums.length >= 3) {
                // Likely pattern: systolic (highest), diastolic, pulse
                const potentialSys = nums.find(n => n >= 70 && n <= 250);
                const potentialDia = nums.find(n => n >= 40 && n <= 150 && n !== potentialSys);
                const potentialPulse = nums.find(n => n >= 40 && n <= 200 && n !== potentialSys && n !== potentialDia);
                
                if (!sysMatch && potentialSys) {
                    systolic = String(potentialSys);
                }
                if (!diaMatch && potentialDia) {
                    diastolic = String(potentialDia);
                }
                if (!pulseMatch && potentialPulse) {
                    heartRate = String(potentialPulse);
                }
            }
        }

        // Apply matched values
        if (sysMatch) {
            const val = parseInt(sysMatch[1]);
            if (val >= 70 && val <= 250) {
                systolic = String(val);
            }
        }
        if (diaMatch) {
            const val = parseInt(diaMatch[1]);
            if (val >= 40 && val <= 150) {
                diastolic = String(val);
            }
        }
        if (pulseMatch) {
            const val = parseInt(pulseMatch[1]);
            if (val >= 40 && val <= 200) {
                heartRate = String(val);
            }
        }

        console.log('Extracted values:', { systolic, diastolic, heartRate });
    }

    function closePreview() {
        showImagePreview = false;
        capturedImage = null;
        isProcessingImage = false;
    }

    // Auto-advance to next field on valid input
    function handleSystolicInput(e: Event) {
        const target = e.target as HTMLInputElement;
        const val = target.value;
        // Auto-advance to diastolic when 3 digits entered or value >= 100
        if (val.length >= 3 || (val.length === 2 && parseInt(val) >= 10)) {
            setTimeout(() => diastolicInput?.focus(), 50);
        }
    }

    function handleDiastolicInput(e: Event) {
        const target = e.target as HTMLInputElement;
        const val = target.value;
        // Auto-advance to heart rate when 2-3 digits entered
        if (val.length >= 2 && parseInt(val) >= 10) {
            setTimeout(() => heartRateInput?.focus(), 50);
        }
    }

    function handleKeyDown(e: KeyboardEvent, nextInput?: HTMLInputElement) {
        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            nextInput?.focus();
        }
    }

    function handleSubmit(e: Event) {
        e.preventDefault();

        if (isSubmitting) return; // Prevent double submission

        if (!systolic || !diastolic || !heartRate) {
            alert('Please fill in all required fields');
            return;
        }

        const user = $currentUser;
        if (!user) {
            alert('Please login first');
            return;
        }

        const reading = {
            user_id: user.id,
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

    export function resetForm() {
        systolic = '';
        diastolic = '';
        heartRate = '';
        notes = '';
        medication = '';
        bodyPosition = 'sitting';
        armUsed = 'left';
        activityLevel = 'resting';
    }

    function getBPStatus(sys: string, dia: string): { status: string; color: string; bg: string } {
        if (!sys || !dia) return { status: 'Enter values', color: 'var(--text-muted)', bg: 'var(--bg-color)' };
        const s = parseInt(sys);
        const d = parseInt(dia);
        // AHA Blood Pressure Categories
        if (s >= 180 || d >= 120) return { status: '⚠️ Crisis', color: '#991b1b', bg: '#fee2e2' };
        if (s >= 140 || d >= 90) return { status: 'High Stage 2', color: '#dc2626', bg: '#fecaca' };
        if (s >= 130 || d >= 80) return { status: 'High Stage 1', color: '#ea580c', bg: '#ffedd5' };
        if (s >= 120 && d < 80) return { status: 'Elevated', color: '#d97706', bg: '#fef3c7' };
        if (s >= 90 && d >= 60) return { status: '✓ Normal', color: '#059669', bg: '#d1fae5' };
        return { status: 'Low', color: '#7c3aed', bg: '#ede9fe' };
    }

    $: bpStatus = getBPStatus(systolic, diastolic);
</script>

<div class="reading-form">
    <!-- Hidden file input for camera -->
    <input 
        type="file" 
        accept="image/*" 
        capture="environment"
        bind:this={fileInput}
        on:change={handleImageCapture}
        style="display: none;"
    />

    <!-- Camera Capture Button -->
    <button type="button" class="camera-btn" on:click={openCamera} disabled={isProcessingImage}>
        {#if isProcessingImage}
            <span class="camera-icon spinning">⏳</span>
            <span>{ocrStatus}</span>
        {:else}
            <span class="camera-icon">📷</span>
            <span>Scan BP Monitor</span>
        {/if}
    </button>

    {#if isProcessingImage}
        <div class="ocr-progress">
            <div class="progress-bar">
                <div class="progress-fill" style="width: {ocrProgress}%"></div>
            </div>
            <span class="progress-text">{ocrStatus}</span>
        </div>
    {/if}

    <!-- Image Preview Modal -->
    {#if showImagePreview && capturedImage}
        <div class="image-preview-overlay" on:click={closePreview} on:keydown={(e) => e.key === 'Escape' && closePreview()} role="dialog" aria-modal="true">
            <div class="image-preview-content" on:click|stopPropagation role="document">
                <button class="close-preview-btn" on:click={closePreview}>✕</button>
                <img src={capturedImage} alt="Captured BP Monitor" class="preview-image" />
                {#if isProcessingImage}
                    <div class="preview-status">
                        <span class="spinner"></span>
                        {ocrStatus}
                    </div>
                {:else}
                    <div class="preview-status success">
                        ✓ Values extracted!
                    </div>
                {/if}
            </div>
        </div>
    {/if}

    <form on:submit={handleSubmit}>
        <!-- Main Input Card - BP values entered directly here -->
        <div class="bp-input-card" style="border-color: {bpStatus.color}">
            <div class="bp-input-row">
                <div class="bp-field">
                    <input
                        type="text"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        bind:this={systolicInput}
                        bind:value={systolic}
                        placeholder="---"
                        maxlength="3"
                        class="bp-inline-input systolic-input"
                        class:has-value={systolic}
                        class:high={systolic && parseInt(systolic) >= 140}
                        on:input={handleSystolicInput}
                        on:keydown={(e) => handleKeyDown(e, diastolicInput)}
                        disabled={isSubmitting}
                        aria-label="Systolic pressure"
                    />
                    <span class="field-label">SYS</span>
                </div>
                <span class="bp-separator">/</span>
                <div class="bp-field">
                    <input
                        type="text"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        bind:this={diastolicInput}
                        bind:value={diastolic}
                        placeholder="--"
                        maxlength="3"
                        class="bp-inline-input diastolic-input"
                        class:has-value={diastolic}
                        class:high={diastolic && parseInt(diastolic) >= 90}
                        on:input={handleDiastolicInput}
                        on:keydown={(e) => handleKeyDown(e, heartRateInput)}
                        disabled={isSubmitting}
                        aria-label="Diastolic pressure"
                    />
                    <span class="field-label">DIA</span>
                </div>
                <span class="bp-unit-label">mmHg</span>
            </div>
            
            <div class="bp-status-badge" style="color: {bpStatus.color}; background: {bpStatus.bg}">
                {bpStatus.status}
            </div>

            <div class="hr-input-row">
                <span class="hr-icon-anim">❤️</span>
                <div class="hr-field">
                    <input
                        type="text"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        bind:this={heartRateInput}
                        bind:value={heartRate}
                        placeholder="--"
                        maxlength="3"
                        class="hr-inline-input"
                        class:has-value={heartRate}
                        disabled={isSubmitting}
                        aria-label="Heart rate"
                    />
                    <span class="field-label">BPM</span>
                </div>
            </div>
        </div>

        <!-- Quick Options -->
        <div class="quick-options">
            <fieldset class="option-group">
                <legend>Position</legend>
                <div class="option-buttons">
                    <button type="button" class="option-btn" class:active={bodyPosition === 'sitting'} on:click={() => bodyPosition = 'sitting'}>
                        🪑 Sitting
                    </button>
                    <button type="button" class="option-btn" class:active={bodyPosition === 'standing'} on:click={() => bodyPosition = 'standing'}>
                        🧍 Standing
                    </button>
                    <button type="button" class="option-btn" class:active={bodyPosition === 'lying'} on:click={() => bodyPosition = 'lying'}>
                        🛏️ Lying
                    </button>
                </div>
            </fieldset>

            <fieldset class="option-group">
                <legend>Arm Used</legend>
                <div class="option-buttons">
                    <button type="button" class="option-btn" class:active={armUsed === 'left'} on:click={() => armUsed = 'left'}>
                        ← Left
                    </button>
                    <button type="button" class="option-btn" class:active={armUsed === 'right'} on:click={() => armUsed = 'right'}>
                        Right →
                    </button>
                </div>
            </fieldset>
        </div>

        <!-- Advanced Toggle -->
        <button type="button" class="advanced-toggle" on:click={() => showAdvanced = !showAdvanced}>
            {showAdvanced ? '▼' : '▶'} Additional Details
        </button>

        {#if showAdvanced}
            <div class="advanced-options">
                <div class="form-group">
                    <label for="activityLevel">Activity Level</label>
                    <select id="activityLevel" bind:value={activityLevel}>
                        <option value="resting">😌 Resting</option>
                        <option value="light">🚶 Light Activity</option>
                        <option value="moderate">🏃 Moderate Activity</option>
                        <option value="strenuous">💪 Strenuous Activity</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="medication">Medication</label>
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
                        rows="3"
                    ></textarea>
                </div>
            </div>
        {/if}

        <!-- Action Buttons -->
        <div class="action-buttons">
            <button type="button" class="reset-btn" on:click={resetForm}>
                🔄 Reset
            </button>
            <button type="submit" class="submit-btn" disabled={isSubmitting}>
                {#if isSubmitting}
                    <span class="spinner"></span> Saving...
                {:else}
                    ✓ Save Reading
                {/if}
            </button>
        </div>
    </form>
</div>

<style>
    .reading-form {
        max-width: 500px;
        margin: 0 auto;
    }

    /* Camera Button */
    .camera-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        width: 100%;
        padding: var(--spacing-md) var(--spacing-lg);
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        color: white;
        border: none;
        border-radius: var(--radius-lg);
        font-size: var(--font-base);
        font-weight: 600;
        cursor: pointer;
        margin-bottom: var(--spacing-md);
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
    }

    .camera-btn:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(59, 130, 246, 0.4);
    }

    .camera-btn:active:not(:disabled) {
        transform: translateY(0);
    }

    .camera-btn:disabled {
        opacity: 0.7;
        cursor: wait;
    }

    .camera-icon {
        font-size: 1.25rem;
    }

    .camera-icon.spinning {
        animation: spin 1s linear infinite;
    }

    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }

    /* OCR Progress */
    .ocr-progress {
        margin-bottom: var(--spacing-md);
        padding: var(--spacing-sm);
        background: var(--card-bg);
        border-radius: var(--radius-md);
    }

    .progress-bar {
        height: 6px;
        background: var(--border-color);
        border-radius: 3px;
        overflow: hidden;
        margin-bottom: var(--spacing-xs);
    }

    .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, #3b82f6, #10b981);
        border-radius: 3px;
        transition: width 0.3s;
    }

    .progress-text {
        font-size: var(--font-sm);
        color: var(--text-muted);
        text-align: center;
        display: block;
    }

    /* Image Preview Overlay */
    .image-preview-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: var(--spacing-md);
    }

    .image-preview-content {
        position: relative;
        max-width: 90vw;
        max-height: 80vh;
        background: var(--card-bg);
        border-radius: var(--radius-xl);
        overflow: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    }

    .close-preview-btn {
        position: absolute;
        top: var(--spacing-sm);
        right: var(--spacing-sm);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.5);
        color: white;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        z-index: 10;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .close-preview-btn:hover {
        background: rgba(0, 0, 0, 0.7);
    }

    .preview-image {
        max-width: 100%;
        max-height: 60vh;
        display: block;
    }

    .preview-status {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm);
        padding: var(--spacing-md);
        background: var(--bg-color);
        font-weight: 500;
    }

    .preview-status.success {
        color: #10b981;
        background: #d1fae5;
    }

    /* Main BP Input Card - Direct inline inputs */
    .bp-input-card {
        background: var(--card-bg);
        border-radius: var(--radius-xl);
        padding: var(--spacing-xl);
        margin-bottom: var(--spacing-lg);
        box-shadow: var(--shadow-lg);
        text-align: center;
        border: 3px dashed var(--border-color);
        transition: border-color 0.3s, border-style 0.3s;
    }

    .bp-input-card:focus-within {
        border-style: solid;
        box-shadow: var(--shadow-xl), 0 0 0 4px var(--primary-light);
    }

    .bp-input-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: var(--spacing-xs);
        margin-bottom: var(--spacing-sm);
    }

    .bp-field {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .bp-inline-input {
        width: 100px;
        font-size: clamp(2.5rem, 12vw, 4rem);
        font-weight: 700;
        text-align: center;
        background: transparent;
        border: none;
        border-bottom: 3px dashed var(--border-color);
        color: var(--text-color);
        padding: var(--spacing-xs) 0;
        transition: all 0.2s;
        caret-color: var(--primary-color);
    }

    .bp-inline-input:focus {
        outline: none;
        border-bottom: 3px solid var(--primary-color);
        background: var(--primary-light);
        border-radius: var(--radius-md) var(--radius-md) 0 0;
    }

    .bp-inline-input::placeholder {
        color: var(--text-muted);
        opacity: 0.5;
    }

    .bp-inline-input.has-value {
        border-bottom-style: solid;
    }

    .bp-inline-input.high {
        color: #ef4444;
    }

    .systolic-input {
        width: 110px;
    }

    .diastolic-input {
        width: 90px;
    }

    .bp-separator {
        font-size: clamp(2rem, 8vw, 3rem);
        color: var(--text-muted);
        font-weight: 300;
        margin: 0 var(--spacing-xs);
    }

    .bp-unit-label {
        font-size: var(--font-sm);
        color: var(--text-muted);
        align-self: flex-end;
        margin-bottom: var(--spacing-md);
        margin-left: var(--spacing-xs);
    }

    .field-label {
        font-size: var(--font-xs);
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: var(--spacing-xs);
    }

    .bp-status-badge {
        display: inline-block;
        padding: var(--spacing-sm) var(--spacing-lg);
        border-radius: var(--radius-xl);
        font-weight: 600;
        font-size: var(--font-base);
        margin: var(--spacing-md) 0;
    }

    .hr-input-row {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: var(--spacing-md);
        padding-top: var(--spacing-md);
        border-top: 1px solid var(--border-color);
        margin-top: var(--spacing-md);
    }

    .hr-icon-anim {
        font-size: 1.5rem;
        animation: heartbeat 1s ease-in-out infinite;
    }

    @keyframes heartbeat {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
    }

    .hr-field {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .hr-inline-input {
        width: 80px;
        font-size: var(--font-3xl);
        font-weight: 600;
        text-align: center;
        background: transparent;
        border: none;
        border-bottom: 2px dashed var(--border-color);
        color: var(--text-color);
        padding: var(--spacing-xs) 0;
        transition: all 0.2s;
        caret-color: var(--primary-color);
    }

    .hr-inline-input:focus {
        outline: none;
        border-bottom: 2px solid var(--primary-color);
        background: var(--primary-light);
        border-radius: var(--radius-md) var(--radius-md) 0 0;
    }

    .hr-inline-input::placeholder {
        color: var(--text-muted);
        opacity: 0.5;
    }

    .hr-inline-input.has-value {
        border-bottom-style: solid;
    }

    /* Quick Options */
    .quick-options {
        margin-bottom: var(--spacing-lg);
    }

    .option-group {
        margin-bottom: var(--spacing-md);
        border: none;
        padding: 0;
    }

    .option-group legend {
        font-size: var(--font-sm);
        font-weight: 600;
        color: var(--text-color);
        margin-bottom: var(--spacing-sm);
        padding: 0;
    }

    .option-buttons {
        display: flex;
        gap: var(--spacing-xs);
    }

    .option-btn {
        flex: 1;
        padding: var(--spacing-md);
        background: var(--card-bg);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: var(--font-sm);
        font-weight: 500;
        color: var(--text-color);
        cursor: pointer;
        transition: all 0.2s;
    }

    .option-btn:hover {
        border-color: var(--primary-color);
    }

    .option-btn.active {
        background: var(--primary-light);
        border-color: var(--primary-color);
        color: var(--primary-color);
    }

    /* Advanced Toggle */
    .advanced-toggle {
        display: block;
        width: 100%;
        padding: var(--spacing-md);
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: var(--font-sm);
        text-align: left;
        cursor: pointer;
        transition: color 0.2s;
    }

    .advanced-toggle:hover {
        color: var(--primary-color);
    }

    /* Advanced Options */
    .advanced-options {
        background: var(--card-bg);
        border-radius: var(--radius-lg);
        padding: var(--spacing-md);
        margin-bottom: var(--spacing-lg);
        animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
        from {
            opacity: 0;
            transform: translateY(-10px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .form-group {
        margin-bottom: var(--spacing-md);
    }

    .form-group label {
        display: block;
        font-size: var(--font-sm);
        font-weight: 500;
        color: var(--text-color);
        margin-bottom: var(--spacing-xs);
    }

    .form-group input,
    .form-group select,
    .form-group textarea {
        width: 100%;
        padding: var(--spacing-md);
        border: 2px solid var(--border-color);
        border-radius: var(--radius-md);
        font-size: var(--font-base);
        background: var(--card-bg);
        color: var(--text-color);
        transition: border-color 0.2s;
    }

    .form-group input:focus,
    .form-group select:focus,
    .form-group textarea:focus {
        outline: none;
        border-color: var(--primary-color);
    }

    .form-group textarea {
        resize: vertical;
        min-height: 80px;
    }

    /* Action Buttons */
    .action-buttons {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: var(--spacing-sm);
    }

    .reset-btn,
    .submit-btn {
        padding: var(--spacing-lg);
        border: none;
        border-radius: var(--radius-lg);
        font-size: var(--font-base);
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
    }

    .reset-btn {
        background: var(--card-bg);
        color: var(--text-secondary);
        border: 2px solid var(--border-color);
    }

    .reset-btn:hover {
        background: var(--bg-color);
    }

    .submit-btn {
        background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
        color: white;
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3);
    }

    .submit-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4);
    }

    .submit-btn:active {
        transform: translateY(0);
    }

    .submit-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
        transform: none;
    }

    /* Loading Spinner */
    .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-top-color: white;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-right: 8px;
        vertical-align: middle;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    /* Responsive */
    @media (max-width: 400px) {
        .main-inputs {
            grid-template-columns: 1fr;
        }

        .number-input {
            max-width: none;
        }

        .action-buttons {
            grid-template-columns: 1fr;
        }
    }

    @media (min-width: 768px) {
        .bp-preview {
            padding: var(--spacing-xl);
        }
    }

    /* TV screens */
    @media (min-width: 1920px) {
        .reading-form {
            max-width: 700px;
        }

        .bp-main .systolic,
        .bp-main .diastolic {
            font-size: 5rem;
        }

        .number-input input {
            font-size: var(--font-2xl);
            padding: var(--spacing-lg);
        }

        .increment-btn {
            padding: var(--spacing-lg);
            font-size: var(--font-2xl);
            min-width: 60px;
        }
    }
</style>
