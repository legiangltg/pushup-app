// Push-Up Pro - Core Application Logic

// Default routines matching user requirements
const DEFAULT_ROUTINES = [
    {
        id: 'day-1',
        name: 'Ngày 1: Khởi động & Sức bền',
        description: 'Tập trung tư thế chuẩn và nhịp thở đều đặn',
        restTime: 30, // seconds
        sets: [
            { id: 1, target: 30 },
            { id: 2, target: 20 }
        ]
    },
    {
        id: 'day-2',
        name: 'Ngày 2: Tăng cường cường độ',
        description: 'Đẩy giới hạn với 3 hiệp liên tiếp',
        restTime: 35,
        sets: [
            { id: 1, target: 30 },
            { id: 2, target: 25 },
            { id: 3, target: 3 }
        ]
    },
    {
        id: 'day-3',
        name: 'Ngày 3: Bứt phá giới hạn',
        description: 'Thử thách cơ ngực và bắp tay sau',
        restTime: 40,
        sets: [
            { id: 1, target: 35 },
            { id: 2, target: 25 },
            { id: 3, target: 15 }
        ]
    }
];

class PushUpApp {
    constructor() {
        this.routines = this.loadRoutines();
        this.history = this.loadHistory();
        this.dailyGoal = Number(localStorage.getItem('pushup_daily_goal') || 200);
        
        // Active workout state
        this.activeRoutine = null;
        this.currentSetIndex = 0;
        this.currentReps = 0;
        this.targetReps = 0;
        this.isFreeMode = false;
        this.sessionStartTime = null;
        this.sessionTotalReps = 0;

        // Flags to prevent duplicate executions & duplicate history
        this.isSetCompleting = false;
        this.isWorkoutFinished = false;

        // Debounce & Rest
        this.lastTouchTime = 0;
        this.touchCooldown = 380; // ms to prevent double-tap with chin
        this.restTimer = null;
        this.restSecondsRemaining = 0;

        // WakeLock to keep screen on while exercising
        this.wakeLock = null;

        // PWA install prompt
        this.deferredPrompt = null;

        this.initElements();
        this.initEventListeners();
        this.renderRoutines();
        this.renderStats();
        this.checkWakeLock();
    }

    loadRoutines() {
        try {
            const saved = localStorage.getItem('pushup_routines_v1');
            if (saved) return JSON.parse(saved);
        } catch (e) {}
        return JSON.parse(JSON.stringify(DEFAULT_ROUTINES));
    }

    saveRoutines() {
        localStorage.setItem('pushup_routines_v1', JSON.stringify(this.routines));
    }

    loadHistory() {
        try {
            const saved = localStorage.getItem('pushup_history_v1');
            if (saved) {
                const list = JSON.parse(saved);
                // Deduplicate consecutive records that have same name and timestamp within 8 seconds
                const cleanList = [];
                list.forEach(item => {
                    const isDup = cleanList.some(existing => 
                        existing.name === item.name &&
                        existing.totalReps === item.totalReps &&
                        Math.abs((existing.timestamp || existing.id) - (item.timestamp || item.id)) < 8000
                    );
                    if (!isDup) cleanList.push(item);
                });
                return cleanList;
            }
        } catch (e) {}
        return [];
    }

    saveHistory() {
        localStorage.setItem('pushup_history_v1', JSON.stringify(this.history));
    }

    initElements() {
        // Views
        this.views = {
            home: document.getElementById('view-home'),
            history: document.getElementById('view-history'),
            workout: document.getElementById('view-workout'),
            rest: document.getElementById('view-rest'),
            summary: document.getElementById('view-summary'),
            routineEditor: document.getElementById('view-routine-editor')
        };


        // Touch zone
        this.touchArea = document.getElementById('touch-zone');
        this.repCountDisplay = document.getElementById('rep-count');
        this.setInfoBadge = document.getElementById('set-info-badge');
        this.targetDisplay = document.getElementById('target-display');
        this.workoutProgressRing = document.getElementById('workout-progress-ring');

        // Rest Elements
        this.restCountDisplay = document.getElementById('rest-count');
        this.nextSetNotice = document.getElementById('next-set-notice');
        this.restProgressRing = document.getElementById('rest-progress-ring');

        // Routine list container
        this.routineListContainer = document.getElementById('routine-list');

        // PWA banner
        this.pwaInstallBanner = document.getElementById('pwa-install-banner');
        this.btnInstallPwa = document.getElementById('btn-install-pwa');

        // Daily Goal Elements
        this.elDailyGoalCurrent = document.getElementById('daily-goal-current');
        this.elDailyGoalTotal = document.getElementById('daily-goal-total');
        this.elDailyGoalPercent = document.getElementById('daily-goal-percent');
        this.elDailyGoalBarFill = document.getElementById('daily-goal-bar-fill');
        this.elDailyGoalBadge = document.getElementById('daily-goal-badge');
        this.elDailyGoalTargetText = document.getElementById('daily-goal-target-text');

        // Modals
        this.modalEditHistory = document.getElementById('modal-edit-history');
        this.modalEditGoal = document.getElementById('modal-edit-goal');

        // Ensure modals are completely hidden initially
        if (this.modalEditHistory) {
            this.modalEditHistory.classList.add('hidden');
            this.modalEditHistory.style.display = 'none';
        }
        if (this.modalEditGoal) {
            this.modalEditGoal.classList.add('hidden');
            this.modalEditGoal.style.display = 'none';
        }
    }


    initEventListeners() {
        // Navigation & tabs
        document.getElementById('btn-free-mode').addEventListener('click', () => this.startFreeMode());
        document.getElementById('btn-new-routine').addEventListener('click', () => this.openRoutineEditor());
        document.getElementById('btn-cancel-routine-edit').addEventListener('click', () => this.switchView('home'));
        document.getElementById('btn-save-routine').addEventListener('click', () => this.saveCurrentRoutineEdit());
        document.getElementById('btn-add-set-in-edit').addEventListener('click', () => this.addSetRowInEditor());

        // Dedicated History View Navigation
        const btnOpenHistory = document.getElementById('btn-open-history');
        if (btnOpenHistory) btnOpenHistory.addEventListener('click', () => this.openHistoryView());

        const cardStatWorkouts = document.getElementById('card-stat-workouts');
        if (cardStatWorkouts) cardStatWorkouts.addEventListener('click', () => this.openHistoryView());

        const btnBackFromHistory = document.getElementById('btn-back-from-history');
        if (btnBackFromHistory) btnBackFromHistory.addEventListener('click', () => {
            this.switchView('home');
            this.renderStats();
        });

        const btnViewHistoryFromSummary = document.getElementById('btn-view-history-from-summary');
        if (btnViewHistoryFromSummary) btnViewHistoryFromSummary.addEventListener('click', () => this.openHistoryView());

        const btnClearAllHistory = document.getElementById('btn-clear-all-history');
        if (btnClearAllHistory) {
            btnClearAllHistory.addEventListener('click', () => {
                if (this.history.length === 0) return;
                if (confirm('Bạn có chắc muốn XOÁ TOÀN BỘ lịch sử tập luyện? Hành động này không thể hoàn tác!')) {
                    this.history = [];
                    this.saveHistory();
                    this.renderStats();
                }
            });
        }


        // Daily Goal Edit
        const btnEditDailyGoal = document.getElementById('btn-edit-daily-goal');
        if (btnEditDailyGoal) {
            btnEditDailyGoal.addEventListener('click', () => this.openEditGoalModal());
        }
        document.getElementById('btn-close-edit-goal').addEventListener('click', () => this.closeEditGoalModal());
        document.getElementById('btn-cancel-edit-goal').addEventListener('click', () => this.closeEditGoalModal());
        document.getElementById('btn-save-edit-goal').addEventListener('click', () => this.saveDailyGoal());

        // History Edit Modal
        document.getElementById('btn-close-edit-history').addEventListener('click', () => this.closeEditHistoryModal());
        document.getElementById('btn-cancel-edit-history').addEventListener('click', () => this.closeEditHistoryModal());
        document.getElementById('btn-save-edit-history').addEventListener('click', () => this.saveEditedHistoryItem());

        // Close modal when clicking outside on dark overlay
        if (this.modalEditGoal) {
            this.modalEditGoal.addEventListener('click', (e) => {
                if (e.target === this.modalEditGoal) this.closeEditGoalModal();
            });
        }
        if (this.modalEditHistory) {
            this.modalEditHistory.addEventListener('click', (e) => {
                if (e.target === this.modalEditHistory) this.closeEditHistoryModal();
            });
        }
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeEditGoalModal();
                this.closeEditHistoryModal();
            }
        });


        // Workout session controls
        document.getElementById('btn-exit-workout').addEventListener('click', () => this.exitWorkout());
        document.getElementById('btn-finish-set-early').addEventListener('click', () => this.completeCurrentSet());
        document.getElementById('btn-manual-rep-add').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleRepIncrement();
        });
        document.getElementById('btn-manual-rep-minus').addEventListener('click', (e) => {
            e.stopPropagation();
            this.handleRepDecrement();
        });

        // Touch pad for chin/touch
        this.touchArea.addEventListener('pointerdown', (e) => this.handleTouch(e));

        // Rest controls
        document.getElementById('btn-skip-rest').addEventListener('click', () => this.skipRest());
        document.getElementById('btn-add-15s-rest').addEventListener('click', () => this.addRestTime(15));

        // Summary controls
        document.getElementById('btn-done-summary').addEventListener('click', () => {
            this.switchView('home');
            this.renderStats();
        });

        // Sound settings toggles
        const soundToggle = document.getElementById('toggle-sound');
        const speechToggle = document.getElementById('toggle-speech');
        const vibrateToggle = document.getElementById('toggle-vibrate');

        if (soundToggle) {
            soundToggle.addEventListener('change', (e) => {
                window.soundEngine.soundEnabled = e.target.checked;
                if (e.target.checked) window.soundEngine.playTick();
            });
        }
        if (speechToggle) {
            speechToggle.addEventListener('change', (e) => {
                window.soundEngine.speechEnabled = e.target.checked;
                if (e.target.checked) window.soundEngine.speak("Bật đếm giọng nói");
            });
        }
        if (vibrateToggle) {
            vibrateToggle.addEventListener('change', (e) => {
                window.soundEngine.vibrateEnabled = e.target.checked;
                if (e.target.checked && 'vibrate' in navigator) navigator.vibrate(50);
            });
        }

        // PWA Install prompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            if (this.pwaInstallBanner) this.pwaInstallBanner.classList.remove('hidden');
        });

        if (this.btnInstallPwa) {
            this.btnInstallPwa.addEventListener('click', async () => {
                if (this.deferredPrompt) {
                    this.deferredPrompt.prompt();
                    const { outcome } = await this.deferredPrompt.userChoice;
                    if (outcome === 'accepted') {
                        this.pwaInstallBanner.classList.add('hidden');
                    }
                    this.deferredPrompt = null;
                }
            });
        }
    }

    async checkWakeLock() {
        if ('wakeLock' in navigator) {
            try {
                this.wakeLock = await navigator.wakeLock.request('screen');
                document.addEventListener('visibilitychange', async () => {
                    if (this.wakeLock !== null && document.visibilityState === 'visible') {
                        this.wakeLock = await navigator.wakeLock.request('screen');
                    }
                });
            } catch (err) {}
        }
    }

    switchView(viewName) {
        Object.keys(this.views).forEach(name => {
            if (this.views[name]) {
                if (name === viewName) {
                    this.views[name].classList.remove('hidden');
                    this.views[name].classList.add('active');
                } else {
                    this.views[name].classList.add('hidden');
                    this.views[name].classList.remove('active');
                }
            }
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Render the list of days and routines
    renderRoutines() {
        if (!this.routineListContainer) return;
        this.routineListContainer.innerHTML = '';

        this.routines.forEach((routine) => {
            const totalReps = routine.sets.reduce((sum, s) => sum + Number(s.target), 0);
            const card = document.createElement('div');
            card.className = 'routine-card';

            const setsBadgeHtml = routine.sets.map((s, sIdx) => 
                `<span class="set-chip">Hiệp ${sIdx + 1}: <strong>${s.target}</strong></span>`
            ).join('');

            card.innerHTML = `
                <div class="routine-header">
                    <div>
                        <div class="routine-title-row">
                            <h3 class="routine-name">${this.escapeHtml(routine.name)}</h3>
                            <span class="routine-total-badge">${totalReps} cái</span>
                        </div>
                        <p class="routine-desc">${this.escapeHtml(routine.description || `Nghỉ ${routine.restTime}s giữa các hiệp`)}</p>
                    </div>
                </div>
                <div class="sets-grid">
                    ${setsBadgeHtml}
                </div>
                <div class="routine-actions">
                    <button class="btn-primary btn-start-routine" data-id="${routine.id}">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                        Tập Ngay
                    </button>
                    <button class="btn-ghost btn-edit-routine" data-id="${routine.id}" title="Chỉnh sửa giáo án">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        Sửa
                    </button>
                    <button class="btn-ghost btn-delete-routine text-danger" data-id="${routine.id}" title="Xoá giáo án">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                </div>
            `;

            // Action events
            card.querySelector('.btn-start-routine').addEventListener('click', () => this.startRoutine(routine.id));
            card.querySelector('.btn-edit-routine').addEventListener('click', () => this.openRoutineEditor(routine.id));
            card.querySelector('.btn-delete-routine').addEventListener('click', () => this.deleteRoutine(routine.id));

            this.routineListContainer.appendChild(card);
        });
    }

    // Start workout session from selected routine
    startRoutine(routineId) {
        const routine = this.routines.find(r => r.id === routineId);
        if (!routine) return;

        window.soundEngine.init();
        this.activeRoutine = routine;
        this.isFreeMode = false;
        this.currentSetIndex = 0;
        this.currentReps = 0;
        this.sessionTotalReps = 0;
        this.sessionStartTime = Date.now();
        this.isSetCompleting = false;
        this.isWorkoutFinished = false;

        this.setupCurrentSet();
        this.switchView('workout');
    }

    startFreeMode() {
        window.soundEngine.init();
        this.activeRoutine = null;
        this.isFreeMode = true;
        this.currentSetIndex = 0;
        this.currentReps = 0;
        this.targetReps = 0;
        this.sessionTotalReps = 0;
        this.sessionStartTime = Date.now();
        this.isSetCompleting = false;
        this.isWorkoutFinished = false;

        this.setInfoBadge.textContent = 'Chế Độ Tự Do';
        this.targetDisplay.textContent = 'Mục tiêu: Tự do';
        this.repCountDisplay.textContent = '0';
        this.updateProgressRing(0, 100);

        this.switchView('workout');
    }

    setupCurrentSet() {
        if (!this.activeRoutine) return;
        this.isSetCompleting = false;
        const currentSet = this.activeRoutine.sets[this.currentSetIndex];
        this.targetReps = Number(currentSet.target);
        this.currentReps = 0;

        this.setInfoBadge.textContent = `${this.activeRoutine.name} • Hiệp ${this.currentSetIndex + 1}/${this.activeRoutine.sets.length}`;
        this.targetDisplay.textContent = `Mục tiêu: ${this.targetReps} cái`;
        this.repCountDisplay.textContent = '0';
        this.updateProgressRing(0, this.targetReps);
    }

    // Handle touch (chin or nose tap)
    handleTouch(e) {
        const now = Date.now();
        if (now - this.lastTouchTime < this.touchCooldown) {
            return; // Debounce
        }
        this.lastTouchTime = now;

        // Create touch ripple visual effect
        this.createRipple(e.clientX, e.clientY);

        // Rep increment
        this.handleRepIncrement();
    }

    handleRepIncrement() {
        if (this.isWorkoutFinished) return;

        this.currentReps++;
        this.sessionTotalReps++;
        this.repCountDisplay.textContent = this.currentReps;

        // Play rep sound & vibration
        window.soundEngine.playRepSound(this.currentReps);

        // Animation on rep number
        this.repCountDisplay.classList.remove('pulse');
        void this.repCountDisplay.offsetWidth; // trigger reflow
        this.repCountDisplay.classList.add('pulse');

        if (!this.isFreeMode && this.targetReps > 0) {
            this.updateProgressRing(this.currentReps, this.targetReps);

            // Check if set is completed (with lock to avoid double completion)
            if (this.currentReps >= this.targetReps && !this.isSetCompleting) {
                this.isSetCompleting = true;
                setTimeout(() => {
                    this.completeCurrentSet();
                }, 250);
            }
        }
    }

    handleRepDecrement() {
        if (this.currentReps > 0) {
            this.currentReps--;
            this.sessionTotalReps = Math.max(0, this.sessionTotalReps - 1);
            this.repCountDisplay.textContent = this.currentReps;
            if (!this.isFreeMode && this.targetReps > 0) {
                this.updateProgressRing(this.currentReps, this.targetReps);
            }
        }
    }

    completeCurrentSet() {
        if (this.isWorkoutFinished) return;

        window.soundEngine.playSetComplete();

        if (this.isFreeMode) {
            this.finishEntireWorkout();
            return;
        }

        // Check if there are more sets in the current routine
        if (this.currentSetIndex < this.activeRoutine.sets.length - 1) {
            // Go to Rest Screen
            this.startRestCountdown();
        } else {
            // Entire day workout is finished!
            this.finishEntireWorkout();
        }
    }

    startRestCountdown() {
        const restDuration = this.activeRoutine.restTime || 30;
        this.restSecondsRemaining = restDuration;
        const nextSet = this.activeRoutine.sets[this.currentSetIndex + 1];

        this.nextSetNotice.innerHTML = `Sắp tới: <strong>Hiệp ${this.currentSetIndex + 2}</strong> (${nextSet.target} cái)`;
        this.restCountDisplay.textContent = this.restSecondsRemaining;
        this.updateRestProgress(this.restSecondsRemaining, restDuration);

        this.switchView('rest');

        if (this.restTimer) clearInterval(this.restTimer);

        this.restTimer = setInterval(() => {
            this.restSecondsRemaining--;
            this.restCountDisplay.textContent = this.restSecondsRemaining;
            this.updateRestProgress(this.restSecondsRemaining, restDuration);

            // Beep ticks on last 3 seconds
            if (this.restSecondsRemaining === 3 || this.restSecondsRemaining === 2 || this.restSecondsRemaining === 1) {
                window.soundEngine.playTick(false);
            }

            if (this.restSecondsRemaining <= 0) {
                clearInterval(this.restTimer);
                window.soundEngine.playTick(true);
                this.currentSetIndex++;
                this.setupCurrentSet();
                this.switchView('workout');
            }
        }, 1000);
    }

    skipRest() {
        if (this.restTimer) clearInterval(this.restTimer);
        this.currentSetIndex++;
        this.setupCurrentSet();
        this.switchView('workout');
    }

    addRestTime(seconds) {
        this.restSecondsRemaining += seconds;
        this.restCountDisplay.textContent = this.restSecondsRemaining;
    }

    finishEntireWorkout() {
        // Strict guard against duplicate history entry
        if (this.isWorkoutFinished) return;
        this.isWorkoutFinished = true;

        if (this.restTimer) clearInterval(this.restTimer);

        window.soundEngine.playWorkoutVictory();

        // Calculate stats
        const durationSec = Math.max(1, Math.round((Date.now() - this.sessionStartTime) / 1000));
        const minutes = Math.floor(durationSec / 60);
        const seconds = durationSec % 60;
        const timeFormatted = `${minutes > 0 ? minutes + 'm ' : ''}${seconds}s`;
        const estCalories = Math.round(this.sessionTotalReps * 0.38);

        // Update Summary View
        document.getElementById('summary-reps').textContent = this.sessionTotalReps;
        document.getElementById('summary-time').textContent = timeFormatted;
        document.getElementById('summary-calories').textContent = estCalories + ' kcal';
        document.getElementById('summary-title').textContent = this.isFreeMode ? 'Tập Tự Do Hoàn Tất!' : `${this.activeRoutine.name} Hoàn Thành!`;

        // Save into history (strictly deduplicate)
        const now = Date.now();
        const workoutName = this.isFreeMode ? 'Tập tự do' : this.activeRoutine.name;
        
        const isDuplicate = this.history.some(h => 
            Math.abs(now - (h.timestamp || h.id)) < 8000 &&
            h.name === workoutName &&
            h.totalReps === this.sessionTotalReps
        );

        if (!isDuplicate && this.sessionTotalReps > 0) {
            const record = {
                id: now,
                timestamp: now,
                date: new Date().toLocaleDateString('vi-VN', { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
                name: workoutName,
                totalReps: this.sessionTotalReps,
                durationSeconds: durationSec,
                calories: estCalories
            };
            this.history.unshift(record);
            this.saveHistory();
        }

        this.switchView('summary');
        this.triggerConfetti();
    }

    exitWorkout() {
        if (confirm('Bạn có muốn dừng buổi tập này?')) {
            if (this.restTimer) clearInterval(this.restTimer);
            this.isWorkoutFinished = true;
            this.switchView('home');
            this.renderStats();
        }
    }

    updateProgressRing(current, total) {
        if (!this.workoutProgressRing) return;
        const circumference = 2 * Math.PI * 130; // r = 130
        const percentage = Math.min(1, current / total);
        const offset = circumference - (percentage * circumference);
        this.workoutProgressRing.style.strokeDasharray = `${circumference} ${circumference}`;
        this.workoutProgressRing.style.strokeDashoffset = offset;
    }

    updateRestProgress(remaining, total) {
        if (!this.restProgressRing) return;
        const circumference = 2 * Math.PI * 110;
        const percentage = Math.max(0, remaining / total);
        const offset = circumference - (percentage * circumference);
        this.restProgressRing.style.strokeDasharray = `${circumference} ${circumference}`;
        this.restProgressRing.style.strokeDashoffset = offset;
    }

    createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.className = 'touch-ripple';
        const rect = this.touchArea.getBoundingClientRect();
        const posX = x - rect.left;
        const posY = y - rect.top;
        ripple.style.left = `${posX}px`;
        ripple.style.top = `${posY}px`;
        this.touchArea.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    }

    triggerConfetti() {
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 }
            });
            setTimeout(() => {
                confetti({
                    particleCount: 50,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 }
                });
                confetti({
                    particleCount: 50,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 }
                });
            }, 300);
        }
    }

    // Routine Editor (Add/Edit Routine)
    openRoutineEditor(routineId = null) {
        const editorTitle = document.getElementById('editor-title');
        const inputName = document.getElementById('edit-routine-name');
        const inputDesc = document.getElementById('edit-routine-desc');
        const inputRest = document.getElementById('edit-routine-rest');
        const setsContainer = document.getElementById('edit-sets-container');

        setsContainer.innerHTML = '';

        if (routineId) {
            const routine = this.routines.find(r => r.id === routineId);
            if (!routine) return;
            this.editingRoutineId = routineId;
            editorTitle.textContent = 'Chỉnh Sửa Giáo Án';
            inputName.value = routine.name;
            inputDesc.value = routine.description || '';
            inputRest.value = routine.restTime || 30;

            routine.sets.forEach((set, idx) => {
                this.addSetRowInEditor(set.target, idx + 1);
            });
        } else {
            this.editingRoutineId = null;
            editorTitle.textContent = 'Tạo Giáo Án Ngày Mới';
            inputName.value = `Ngày ${this.routines.length + 1}: Thử thách mới`;
            inputDesc.value = '';
            inputRest.value = 30;
            // Default 2 sets
            this.addSetRowInEditor(30, 1);
            this.addSetRowInEditor(20, 2);
        }

        this.switchView('routineEditor');
    }

    addSetRowInEditor(targetReps = 20, setNumber = null) {
        const setsContainer = document.getElementById('edit-sets-container');
        const rowCount = setsContainer.children.length + 1;
        const displaySetNum = setNumber || rowCount;

        const row = document.createElement('div');
        row.className = 'set-editor-row';
        row.innerHTML = `
            <span class="set-label">Hiệp ${displaySetNum}</span>
            <div class="set-input-group">
                <button type="button" class="btn-step btn-minus">-5</button>
                <input type="number" class="input-set-target" value="${targetReps}" min="1" max="500">
                <button type="button" class="btn-step btn-plus">+5</button>
            </div>
            <button type="button" class="btn-remove-set" title="Xoá hiệp này">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
        `;

        const input = row.querySelector('.input-set-target');
        row.querySelector('.btn-minus').addEventListener('click', () => {
            input.value = Math.max(1, Number(input.value) - 5);
        });
        row.querySelector('.btn-plus').addEventListener('click', () => {
            input.value = Number(input.value) + 5;
        });
        row.querySelector('.btn-remove-set').addEventListener('click', () => {
            if (setsContainer.children.length <= 1) {
                alert('Giáo án phải có ít nhất 1 hiệp!');
                return;
            }
            row.remove();
            this.reindexEditorSets();
        });

        setsContainer.appendChild(row);
    }

    reindexEditorSets() {
        const setsContainer = document.getElementById('edit-sets-container');
        Array.from(setsContainer.children).forEach((row, idx) => {
            row.querySelector('.set-label').textContent = `Hiệp ${idx + 1}`;
        });
    }

    saveCurrentRoutineEdit() {
        const inputName = document.getElementById('edit-routine-name').value.trim();
        const inputDesc = document.getElementById('edit-routine-desc').value.trim();
        const inputRest = Number(document.getElementById('edit-routine-rest').value) || 30;
        const setsContainer = document.getElementById('edit-sets-container');

        if (!inputName) {
            alert('Vui lòng nhập tên ngày/giáo án!');
            return;
        }

        const sets = [];
        Array.from(setsContainer.children).forEach((row, idx) => {
            const target = Number(row.querySelector('.input-set-target').value) || 10;
            sets.push({ id: idx + 1, target });
        });

        if (sets.length === 0) {
            alert('Vui lòng thêm ít nhất 1 hiệp!');
            return;
        }

        if (this.editingRoutineId) {
            // Update
            const index = this.routines.findIndex(r => r.id === this.editingRoutineId);
            if (index !== -1) {
                this.routines[index] = {
                    ...this.routines[index],
                    name: inputName,
                    description: inputDesc,
                    restTime: inputRest,
                    sets: sets
                };
            }
        } else {
            // Create new
            const newRoutine = {
                id: 'day-' + Date.now(),
                name: inputName,
                description: inputDesc,
                restTime: inputRest,
                sets: sets
            };
            this.routines.push(newRoutine);
        }

        this.saveRoutines();
        this.renderRoutines();
        this.switchView('home');
    }

    deleteRoutine(routineId) {
        if (confirm('Bạn có chắc muốn xoá giáo án này?')) {
            this.routines = this.routines.filter(r => r.id !== routineId);
            this.saveRoutines();
            this.renderRoutines();
        }
    }

    // ================= DAILY GOAL & STATS =================
    renderStats() {
        const totalRepsAllTime = this.history.reduce((sum, h) => sum + (Number(h.totalReps) || 0), 0);
        const totalWorkouts = this.history.length;
        const totalCalories = this.history.reduce((sum, h) => sum + (Number(h.calories) || 0), 0);

        // Update Overview Cards
        const elTotalReps = document.getElementById('stat-total-reps');
        const elTotalWorkouts = document.getElementById('stat-total-workouts');
        const elTotalCalories = document.getElementById('stat-total-calories');

        if (elTotalReps) elTotalReps.textContent = totalRepsAllTime.toLocaleString();
        if (elTotalWorkouts) elTotalWorkouts.textContent = totalWorkouts;
        if (elTotalCalories) elTotalCalories.textContent = totalCalories.toLocaleString();

        // Calculate Today's Reps for the 200 Push-ups Daily Goal
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayReps = this.history.reduce((sum, h) => {
            const itemTime = h.timestamp || h.id;
            if (itemTime && itemTime >= todayStart.getTime()) {
                return sum + (Number(h.totalReps) || 0);
            }
            return sum;
        }, 0);

        const percent = Math.min(100, Math.round((todayReps / this.dailyGoal) * 100));

        if (this.elDailyGoalCurrent) this.elDailyGoalCurrent.textContent = todayReps;
        if (this.elDailyGoalTotal) this.elDailyGoalTotal.textContent = this.dailyGoal;
        if (this.elDailyGoalTargetText) this.elDailyGoalTargetText.textContent = `${this.dailyGoal} cái`;
        if (this.elDailyGoalPercent) this.elDailyGoalPercent.textContent = `${percent}%`;
        if (this.elDailyGoalBarFill) this.elDailyGoalBarFill.style.width = `${percent}%`;

        if (this.elDailyGoalBadge) {
            if (todayReps >= this.dailyGoal) {
                this.elDailyGoalBadge.classList.remove('hidden');
            } else {
                this.elDailyGoalBadge.classList.add('hidden');
            }
        }

        // Update stats inside dedicated History View
        const elHistTotalCount = document.getElementById('history-total-count');
        const elHistSumReps = document.getElementById('history-sum-reps');
        const elHistSumCalories = document.getElementById('history-sum-calories');
        const elHistSumToday = document.getElementById('history-sum-today');

        if (elHistTotalCount) elHistTotalCount.textContent = `${totalWorkouts} buổi tập`;
        if (elHistSumReps) elHistSumReps.textContent = totalRepsAllTime.toLocaleString();
        if (elHistSumCalories) elHistSumCalories.textContent = totalCalories.toLocaleString();
        if (elHistSumToday) elHistSumToday.textContent = todayReps.toLocaleString();

        this.renderHistory();
    }

    openHistoryView() {
        this.switchView('history');
        this.renderStats();
    }


    openEditGoalModal() {
        const input = document.getElementById('input-daily-goal');
        if (input) input.value = this.dailyGoal;
        if (this.modalEditGoal) {
            this.modalEditGoal.classList.remove('hidden');
            this.modalEditGoal.style.display = 'flex';
        }
    }

    closeEditGoalModal() {
        if (this.modalEditGoal) {
            this.modalEditGoal.classList.add('hidden');
            this.modalEditGoal.style.display = 'none';
        }
    }


    saveDailyGoal() {
        const input = document.getElementById('input-daily-goal');
        const newGoal = Number(input.value);
        if (!newGoal || newGoal < 1) {
            alert('Mục tiêu phải lớn hơn 0!');
            return;
        }
        this.dailyGoal = newGoal;
        localStorage.setItem('pushup_daily_goal', this.dailyGoal);
        this.closeEditGoalModal();
        this.renderStats();
    }

    // ================= WORKOUT HISTORY: EDIT & DELETE =================
    renderHistory() {
        const historyContainer = document.getElementById('history-list');
        if (!historyContainer) return;

        if (this.history.length === 0) {
            historyContainer.innerHTML = `<div class="empty-history">Chưa có lịch sử tập luyện. Hãy bắt đầu hiệp đầu tiên ngay hôm nay! 💪</div>`;
            return;
        }

        historyContainer.innerHTML = '';
        this.history.slice(0, 30).forEach(item => {
            const el = document.createElement('div');
            el.className = 'history-item';
            el.innerHTML = `
                <div class="history-item-left">
                    <div class="history-item-name">${this.escapeHtml(item.name)}</div>
                    <div class="history-item-date">${item.date}</div>
                </div>
                <div class="history-item-right">
                    <div class="history-stats-col">
                        <span class="history-reps-badge">+${item.totalReps} cái</span>
                        <span class="history-cal">${item.calories || Math.round(item.totalReps * 0.38)} cal</span>
                    </div>
                    <div class="history-actions">
                        <button class="btn-history-action btn-history-edit" data-id="${item.id}" title="Sửa buổi tập">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                        </button>
                        <button class="btn-history-action btn-history-delete text-danger" data-id="${item.id}" title="Xoá buổi tập">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </div>
            `;

            // Action listeners
            el.querySelector('.btn-history-edit').addEventListener('click', () => this.openEditHistoryModal(item.id));
            el.querySelector('.btn-history-delete').addEventListener('click', () => this.deleteHistoryItem(item.id));

            historyContainer.appendChild(el);
        });
    }

    deleteHistoryItem(id) {
        const item = this.history.find(h => h.id === id);
        const name = item ? item.name : 'buổi tập này';
        if (confirm(`Bạn có chắc muốn xoá "${name}" khỏi lịch sử?`)) {
            this.history = this.history.filter(h => h.id !== id);
            this.saveHistory();
            // Updating stats automatically recalculates today's goal, total reps, calories & re-renders history
            this.renderStats();
        }
    }

    openEditHistoryModal(id) {
        const item = this.history.find(h => h.id === id);
        if (!item) return;

        document.getElementById('edit-history-id').value = item.id;
        document.getElementById('edit-history-name').value = item.name;
        document.getElementById('edit-history-reps').value = item.totalReps;
        document.getElementById('edit-history-date').value = item.date;

        if (this.modalEditHistory) {
            this.modalEditHistory.classList.remove('hidden');
            this.modalEditHistory.style.display = 'flex';
        }
    }

    closeEditHistoryModal() {
        if (this.modalEditHistory) {
            this.modalEditHistory.classList.add('hidden');
            this.modalEditHistory.style.display = 'none';
        }
    }


    saveEditedHistoryItem() {
        const id = Number(document.getElementById('edit-history-id').value);
        const name = document.getElementById('edit-history-name').value.trim();
        const reps = Number(document.getElementById('edit-history-reps').value);
        const date = document.getElementById('edit-history-date').value.trim();

        if (!name) {
            alert('Vui lòng nhập tên bài tập!');
            return;
        }
        if (!reps || reps < 1) {
            alert('Số cái chống đẩy phải lớn hơn 0!');
            return;
        }

        const index = this.history.findIndex(h => h.id === id);
        if (index !== -1) {
            this.history[index] = {
                ...this.history[index],
                name: name,
                totalReps: reps,
                calories: Math.round(reps * 0.38),
                date: date || this.history[index].date
            };
            this.saveHistory();
            this.closeEditHistoryModal();
            // Automatically updates stats overview, daily goal, and re-renders history list
            this.renderStats();
        }
    }

    escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
}

// Bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new PushUpApp();
});
