// firstAid.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('First Aid Guide initialized');

    // Smooth scroll reveal animation
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

    // Observe all injury cards
    const injuryCards = document.querySelectorAll('.injury-card, .abc-card');
    injuryCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';
        card.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
        observer.observe(card);
    });

    // Emergency call button overlay
    function createEmergencyButton() {
        const emergencyBtn = document.createElement('a');
        emergencyBtn.href = 'tel:911';
        emergencyBtn.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <i class="fa-solid fa-phone" style="font-size: 1.8rem;"></i>
                <div style="text-align: left; line-height: 1.2;">
                    <div style="font-size: 0.8rem; opacity: 0.9;">Emergency</div>
                    <div style="font-size: 1.4rem; font-weight: 900;">911</div>
                </div>
            </div>
        `;
        emergencyBtn.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #dc2626, #991b1b);
            color: white;
            padding: 20px 30px;
            border-radius: 50px;
            text-decoration: none;
            box-shadow: 0 8px 30px rgba(220, 38, 38, 0.5);
            z-index: 10000;
            transition: all 0.3s;
            animation: emergencyPulse 2s infinite;
        `;

        emergencyBtn.addEventListener('mouseover', function() {
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 12px 40px rgba(220, 38, 38, 0.6)';
        });

        emergencyBtn.addEventListener('mouseout', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 8px 30px rgba(220, 38, 38, 0.5)';
        });

        document.body.appendChild(emergencyBtn);

        // Add pulse animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes emergencyPulse {
                0%, 100% {
                    box-shadow: 0 8px 30px rgba(220, 38, 38, 0.5);
                }
                50% {
                    box-shadow: 0 8px 30px rgba(220, 38, 38, 0.8), 0 0 50px rgba(220, 38, 38, 0.4);
                }
            }
        `;
        document.head.appendChild(style);
    }

    createEmergencyButton();

    // Print functionality
    const printBtn = document.createElement('button');
    printBtn.innerHTML = '<i class="fa-solid fa-print"></i>';
    printBtn.title = 'Print First Aid Guide';
    printBtn.style.cssText = `
        position: fixed;
        bottom: 110px;
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
    });

    printBtn.addEventListener('mouseout', function() {
        this.style.transform = 'scale(1)';
    });

    printBtn.addEventListener('click', function() {
        window.print();
    });

    document.body.appendChild(printBtn);

    // Interactive injury card expansion
    const injuryHeaders = document.querySelectorAll('.injury-header');
    injuryHeaders.forEach(header => {
        header.style.cursor = 'pointer';
        const card = header.closest('.injury-card');
        const body = card.querySelector('.injury-body');

        // Add expand indicator
        const expandIcon = document.createElement('div');
        expandIcon.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
        expandIcon.style.cssText = `
            position: absolute;
            bottom: 15px;
            left: 50%;
            transform: translateX(-50%);
            color: #6b7280;
            font-size: 1.2rem;
            transition: transform 0.3s;
        `;
        header.appendChild(expandIcon);

        // Initially collapse on mobile
        if (window.innerWidth < 768) {
            body.style.display = 'none';
            expandIcon.style.transform = 'translateX(-50%) rotate(0deg)';
        }

        header.addEventListener('click', function() {
            if (body.style.display === 'none') {
                body.style.display = 'block';
                expandIcon.style.transform = 'translateX(-50%) rotate(180deg)';
            } else if (window.innerWidth < 768) {
                body.style.display = 'none';
                expandIcon.style.transform = 'translateX(-50%) rotate(0deg)';
            }
        });
    });

    // Quick search functionality
    function createSearchBar() {
        const searchContainer = document.createElement('div');
        searchContainer.style.cssText = `
            position: sticky;
            top: 70px;
            background: white;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            z-index: 100;
            margin-bottom: 40px;
            border-radius: 16px;
        `;

        searchContainer.innerHTML = `
            <div style="max-width: 600px; margin: 0 auto; position: relative;">
                <input 
                    type="text" 
                    id="injurySearch" 
                    placeholder="Search for an injury... (e.g., bleeding, fracture, burn)"
                    style="
                        width: 100%;
                        padding: 15px 50px 15px 20px;
                        border: 2px solid #e5e7eb;
                        border-radius: 50px;
                        font-size: 1rem;
                        outline: none;
                        transition: border-color 0.3s;
                    "
                >
                <i class="fa-solid fa-magnifying-glass" style="
                    position: absolute;
                    right: 20px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #6b7280;
                    font-size: 1.2rem;
                "></i>
            </div>
        `;

        const injuriesSection = document.querySelector('.injuries-section');
        if (injuriesSection) {
            injuriesSection.insertBefore(searchContainer, injuriesSection.querySelector('.injury-cards'));
        }

        const searchInput = document.getElementById('injurySearch');
        searchInput.addEventListener('focus', function() {
            this.style.borderColor = '#059669';
        });

        searchInput.addEventListener('blur', function() {
            this.style.borderColor = '#e5e7eb';
        });

        searchInput.addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const cards = document.querySelectorAll('.injury-card');

            cards.forEach(card => {
                const title = card.querySelector('.injury-title h3').textContent.toLowerCase();
                const content = card.textContent.toLowerCase();

                if (title.includes(searchTerm) || content.includes(searchTerm)) {
                    card.style.display = 'block';
                    // Highlight search term
                    if (searchTerm.length > 2) {
                        card.style.borderColor = '#059669';
                        card.style.borderWidth = '3px';
                    } else {
                        card.style.borderColor = card.classList.contains('critical') ? '#dc2626' : 
                                                card.classList.contains('serious') ? '#ea580c' : '#e5e7eb';
                    }
                } else {
                    card.style.display = searchTerm ? 'none' : 'block';
                }
            });
        });
    }

    createSearchBar();

    // CPR timer overlay
    function showCPRTimer() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(0, 0, 0, 0.95);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            color: white;
        `;

        const compressionCount = document.createElement('div');
        compressionCount.style.cssText = `
            font-size: 8rem;
            font-weight: 900;
            margin-bottom: 20px;
            font-family: monospace;
        `;
        compressionCount.textContent = '0';

        const instruction = document.createElement('div');
        instruction.style.cssText = `
            font-size: 2rem;
            margin-bottom: 30px;
            text-align: center;
        `;
        instruction.textContent = 'Press Space or Tap Screen for Each Compression';

        const bpmDisplay = document.createElement('div');
        bpmDisplay.style.cssText = `
            font-size: 1.5rem;
            color: #10b981;
            margin-bottom: 40px;
        `;

        const stopBtn = document.createElement('button');
        stopBtn.textContent = 'Stop CPR Timer';
        stopBtn.style.cssText = `
            background: #dc2626;
            color: white;
            border: none;
            padding: 20px 50px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 1.3rem;
            cursor: pointer;
        `;

        overlay.appendChild(compressionCount);
        overlay.appendChild(instruction);
        overlay.appendChild(bpmDisplay);
        overlay.appendChild(stopBtn);
        document.body.appendChild(overlay);

        let count = 0;
        let lastPress = Date.now();
        let bpm = 0;

        function compress() {
            count++;
            compressionCount.textContent = count;
            
            const now = Date.now();
            const timeDiff = (now - lastPress) / 1000;
            bpm = Math.round(60 / timeDiff);
            lastPress = now;

            let color = '#10b981';
            let message = 'Good Pace';
            if (bpm < 100) {
                color = '#f59e0b';
                message = 'Too Slow - Speed Up';
            } else if (bpm > 120) {
                color = '#dc2626';
                message = 'Too Fast - Slow Down';
            }

            bpmDisplay.style.color = color;
            bpmDisplay.textContent = `${bpm} BPM - ${message}`;

            compressionCount.style.transform = 'scale(1.1)';
            setTimeout(() => {
                compressionCount.style.transform = 'scale(1)';
            }, 100);
        }

        document.addEventListener('keydown', function handler(e) {
            if (e.code === 'Space') {
                e.preventDefault();
                compress();
            }
        });

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay || e.target === compressionCount || e.target === instruction) {
                compress();
            }
        });

        stopBtn.addEventListener('click', function() {
            overlay.remove();
        });
    }

    // Add CPR timer button to CPR section
    const cprSection = document.querySelector('.cpr-card');
    if (cprSection) {
        const timerBtn = document.createElement('button');
        timerBtn.innerHTML = '<i class="fa-solid fa-stopwatch"></i> Start CPR Timer';
        timerBtn.style.cssText = `
            display: block;
            margin: 30px auto 0;
            background: linear-gradient(135deg, #059669, #047857);
            color: white;
            border: none;
            padding: 15px 40px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 1.1rem;
            cursor: pointer;
            box-shadow: 0 6px 20px rgba(5, 150, 105, 0.3);
            transition: all 0.3s;
        `;

        timerBtn.addEventListener('mouseover', function() {
            this.style.transform = 'scale(1.05)';
        });

        timerBtn.addEventListener('mouseout', function() {
            this.style.transform = 'scale(1)';
        });

        timerBtn.addEventListener('click', showCPRTimer);
        cprSection.appendChild(timerBtn);
    }

    // Add keyboard shortcuts info
    const shortcutsInfo = document.createElement('div');
    shortcutsInfo.innerHTML = `
        <div style="text-align: center; padding: 15px; background: #f0fdf4; border-radius: 10px; margin-top: 20px;">
            <strong>💡 Tip:</strong> Press Ctrl+F to quickly search for specific injuries
        </div>
    `;
    const container = document.querySelector('.firstaid-container');
    if (container) {
        container.appendChild(shortcutsInfo);
    }

    console.log('First Aid Guide: All features initialized');
});