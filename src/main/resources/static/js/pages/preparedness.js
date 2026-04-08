// preparedness.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Preparedness Guide initialized');

    // Progress tracking
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    const stepCheckboxes = document.querySelectorAll('.step-checkbox');
    const allCheckboxes = document.querySelectorAll('input[type="checkbox"]');
    const userKeyEl = document.getElementById('rqPreparednessUserKey');
    const userKey = userKeyEl && userKeyEl.textContent ? userKeyEl.textContent.trim().toLowerCase() : 'anonymous';
    const storageKey = `earthquakePreparedness::${userKey}`;

    // Load saved progress from localStorage (if available)
    loadProgress();

    // Update progress whenever any checkbox changes
    allCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateProgress();
            saveProgress();
        });
    });

    function updateProgress() {
        const totalCheckboxes = allCheckboxes.length;
        const checkedCheckboxes = document.querySelectorAll('input[type="checkbox"]:checked').length;
        const percentage = Math.round((checkedCheckboxes / totalCheckboxes) * 100);

        progressBar.style.width = percentage + '%';
        progressBar.textContent = percentage + '%';

        if (percentage === 0) {
            progressText.textContent = 'Start your preparedness journey by completing the checklist below';
        } else if (percentage < 25) {
            progressText.textContent = 'Great start! Keep going to improve your preparedness';
        } else if (percentage < 50) {
            progressText.textContent = 'You\'re making good progress! Continue building your readiness';
        } else if (percentage < 75) {
            progressText.textContent = 'Excellent work! You\'re more than halfway there';
        } else if (percentage < 100) {
            progressText.textContent = 'Almost there! Just a few more items to complete';
        } else {
            progressText.textContent = '🎉 Congratulations! You\'re fully prepared for an earthquake';
            showCompletionCelebration();
        }
    }

    function saveProgress() {
        try {
            const checkboxStates = {};
            allCheckboxes.forEach((checkbox, index) => {
                checkboxStates[checkbox.id || `checkbox-${index}`] = checkbox.checked;
            });
            localStorage.setItem(storageKey, JSON.stringify(checkboxStates));
        } catch (e) {
            console.log('Could not save progress:', e);
        }
    }

    function loadProgress() {
        try {
            const saved = localStorage.getItem(storageKey);
            if (saved) {
                const checkboxStates = JSON.parse(saved);
                allCheckboxes.forEach((checkbox, index) => {
                    const id = checkbox.id || `checkbox-${index}`;
                    if (checkboxStates[id] !== undefined) {
                        checkbox.checked = checkboxStates[id];
                    }
                });
                updateProgress();
            }
        } catch (e) {
            console.log('Could not load progress:', e);
        }
    }

    function showCompletionCelebration() {
        // Create celebration overlay
        const celebration = document.createElement('div');
        celebration.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        `;

        celebration.innerHTML = `
            <div style="
                background: white;
                padding: 50px;
                border-radius: 24px;
                text-align: center;
                max-width: 500px;
                animation: slideUp 0.5s ease;
            ">
                <div style="font-size: 5rem; margin-bottom: 20px;">🎉</div>
                <h2 style="color: #059669; font-size: 2rem; margin-bottom: 15px; font-weight: 800;">
                    You're Prepared!
                </h2>
                <p style="color: #4b5563; font-size: 1.1rem; line-height: 1.7; margin-bottom: 25px;">
                    Congratulations! You've completed all preparedness steps. Your family is now ready to face an earthquake with confidence.
                </p>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: linear-gradient(135deg, #059669, #047857);
                    color: white;
                    border: none;
                    padding: 15px 40px;
                    border-radius: 25px;
                    font-weight: 700;
                    font-size: 1.1rem;
                    cursor: pointer;
                    box-shadow: 0 6px 20px rgba(5, 150, 105, 0.3);
                ">
                    Continue
                </button>
            </div>
        `;

        document.body.appendChild(celebration);

        // Add animations
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            @keyframes slideUp {
                from { transform: translateY(50px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    // Drill timer functionality
    window.startDrill = function(drillType) {
        let duration, message;

        switch(drillType) {
            case 'drop-cover':
                duration = 3;
                message = 'DROP, COVER, and HOLD ON!';
                break;
            case 'evacuation':
                duration = 300;
                message = 'Evacuate to your meeting point!';
                break;
            case 'communication':
                duration = 60;
                message = 'Contact your emergency contact now!';
                break;
            default:
                duration = 60;
                message = 'Complete the drill!';
        }

        showDrillTimer(duration, message, drillType);
    };

    function showDrillTimer(seconds, message, drillType) {
        const timerOverlay = document.createElement('div');
        timerOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            color: white;
        `;

        const timerDisplay = document.createElement('div');
        timerDisplay.style.cssText = `
            font-size: 8rem;
            font-weight: 900;
            margin-bottom: 30px;
            font-family: monospace;
        `;

        const messageDisplay = document.createElement('div');
        messageDisplay.style.cssText = `
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 50px;
            text-align: center;
            max-width: 800px;
            padding: 0 20px;
        `;
        messageDisplay.textContent = message;

        const stopButton = document.createElement('button');
        stopButton.textContent = 'Stop Drill';
        stopButton.style.cssText = `
            background: #dc2626;
            color: white;
            border: none;
            padding: 20px 50px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 1.3rem;
            cursor: pointer;
            box-shadow: 0 6px 25px rgba(220, 38, 38, 0.5);
            transition: all 0.3s;
        `;
        stopButton.onmouseover = function() {
            this.style.transform = 'scale(1.05)';
        };
        stopButton.onmouseout = function() {
            this.style.transform = 'scale(1)';
        };

        timerOverlay.appendChild(timerDisplay);
        timerOverlay.appendChild(messageDisplay);
        timerOverlay.appendChild(stopButton);
        document.body.appendChild(timerOverlay);

        let remaining = seconds;
        const interval = setInterval(() => {
            remaining--;
            const mins = Math.floor(remaining / 60);
            const secs = remaining % 60;
            timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

            if (remaining <= 0) {
                clearInterval(interval);
                timerDisplay.textContent = 'COMPLETE!';
                timerDisplay.style.color = '#10b981';
                messageDisplay.textContent = 'Drill completed successfully!';
                stopButton.textContent = 'Close';
            }
        }, 1000);

        stopButton.onclick = function() {
            clearInterval(interval);
            timerOverlay.remove();
        };

        // Initial display
        const mins = Math.floor(remaining / 60);
        const secs = remaining % 60;
        timerDisplay.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    // Smooth scroll reveal for steps
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    const prepSteps = document.querySelectorAll('.prep-step');
    prepSteps.forEach(step => {
        step.style.opacity = '0';
        step.style.transform = 'translateY(50px)';
        step.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(step);
    });

    // Print functionality
    const printBtn = document.createElement('button');
    printBtn.innerHTML = '<i class="fa-solid fa-print"></i>';
    printBtn.title = 'Print Preparedness Guide';
    printBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #059669, #047857);
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 1.5rem;
        cursor: pointer;
        box-shadow: 0 6px 25px rgba(5, 150, 105, 0.4);
        z-index: 1000;
        transition: all 0.3s;
    `;

    printBtn.addEventListener('mouseover', function() {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 8px 30px rgba(5, 150, 105, 0.5)';
    });

    printBtn.addEventListener('mouseout', function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 6px 25px rgba(5, 150, 105, 0.4)';
    });

    printBtn.addEventListener('click', function() {
        window.print();
    });

    document.body.appendChild(printBtn);

    // Reset progress button (hidden, for development/testing)
    const resetBtn = document.createElement('button');
    resetBtn.innerHTML = '<i class="fa-solid fa-rotate-left"></i>';
    resetBtn.title = 'Reset All Progress';
    resetBtn.style.cssText = `
        position: fixed;
        bottom: 100px;
        right: 30px;
        width: 50px;
        height: 50px;
        background: #6b7280;
        color: white;
        border: none;
        border-radius: 50%;
        font-size: 1.2rem;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        transition: all 0.3s;
        opacity: 0.6;
    `;

    resetBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to reset all your progress? This cannot be undone.')) {
            localStorage.removeItem(storageKey);
            allCheckboxes.forEach(checkbox => checkbox.checked = false);
            updateProgress();
            alert('Progress has been reset.');
        }
    });

    resetBtn.addEventListener('mouseover', function() {
        this.style.opacity = '1';
    });

    resetBtn.addEventListener('mouseout', function() {
        this.style.opacity = '0.6';
    });

    document.body.appendChild(resetBtn);

    // Initialize progress on load
    updateProgress();

    console.log('Preparedness Guide: All features initialized');
});