// emergencyContacts.js

document.addEventListener('DOMContentLoaded', function() {
    console.log('Emergency Contacts page loaded');

    // Add click tracking for emergency numbers
    const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
    phoneLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const number = this.getAttribute('href').replace('tel:', '');
            console.log('Emergency number clicked:', number);
            
            // Show confirmation for 911 calls
            if (number === '911') {
                const confirmed = confirm('You are about to call 911. Are you experiencing a life-threatening emergency?');
                if (!confirmed) {
                    e.preventDefault();
                }
            }
        });
    });

    // Add smooth scroll animation for sections
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all cards
    const cards = document.querySelectorAll('.service-card, .utility-card, .regional-card, .info-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(card);
    });

    // Add print functionality
    function createPrintButton() {
        const printBtn = document.createElement('button');
        printBtn.innerHTML = '<i class="fa-solid fa-print"></i> Print Contact List';
        printBtn.className = 'print-btn';
        printBtn.style.cssText = `
            position: fixed;
            bottom: 30px;
            right: 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            padding: 15px 25px;
            border-radius: 50px;
            font-weight: 700;
            font-size: 1rem;
            cursor: pointer;
            box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s;
        `;
        
        printBtn.addEventListener('mouseover', function() {
            this.style.transform = 'scale(1.05)';
            this.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
        });
        
        printBtn.addEventListener('mouseout', function() {
            this.style.transform = 'scale(1)';
            this.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.2)';
        });
        
        printBtn.addEventListener('click', function() {
            window.print();
        });
        
        document.body.appendChild(printBtn);
    }

    createPrintButton();

    // Add copy to clipboard functionality for phone numbers
    phoneLinks.forEach(link => {
        const parentRow = link.closest('.contact-row, .utility-contact, .region-item');
        if (parentRow && link.getAttribute('href') !== 'tel:911') {
            const copyBtn = document.createElement('button');
            copyBtn.innerHTML = '<i class="fa-solid fa-copy"></i>';
            copyBtn.className = 'copy-btn';
            copyBtn.style.cssText = `
                background: transparent;
                border: none;
                color: #6b7280;
                cursor: pointer;
                padding: 5px;
                margin-left: 10px;
                font-size: 0.9rem;
                transition: color 0.3s;
            `;
            
            copyBtn.addEventListener('mouseover', function() {
                this.style.color = '#dc2626';
            });
            
            copyBtn.addEventListener('mouseout', function() {
                this.style.color = '#6b7280';
            });
            
            copyBtn.addEventListener('click', function(e) {
                e.preventDefault();
                const number = link.textContent.trim();
                navigator.clipboard.writeText(number).then(() => {
                    const originalHTML = copyBtn.innerHTML;
                    copyBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                    copyBtn.style.color = '#059669';
                    
                    setTimeout(() => {
                        copyBtn.innerHTML = originalHTML;
                        copyBtn.style.color = '#6b7280';
                    }, 2000);
                });
            });
            
            link.parentNode.appendChild(copyBtn);
        }
    });

    // Highlight current user's region
    function highlightUserRegion() {
        // This would ideally use geolocation or IP-based location
        // For now, we'll just add a subtle highlight effect
        const regionalCards = document.querySelectorAll('.regional-card');
        regionalCards.forEach(card => {
            card.addEventListener('click', function() {
                regionalCards.forEach(c => c.style.borderColor = '#e5e7eb');
                this.style.borderColor = '#dc2626';
            });
        });
    }

    highlightUserRegion();

    // Add accessibility: keyboard navigation for cards
    const allCards = document.querySelectorAll('.service-card, .utility-card, .regional-card');
    allCards.forEach(card => {
        card.setAttribute('tabindex', '0');
        card.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                const link = this.querySelector('a[href^="tel:"]');
                if (link) link.click();
            }
        });
    });

    // Emergency alert banner animation
    const alertIcon = document.querySelector('.alert-icon');
    if (alertIcon) {
        setInterval(() => {
            alertIcon.style.transform = 'scale(1.1)';
            setTimeout(() => {
                alertIcon.style.transform = 'scale(1)';
            }, 200);
        }, 3000);
    }

    console.log('Emergency Contacts: All features initialized');
});