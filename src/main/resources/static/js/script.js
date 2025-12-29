// RapidQuake JavaScript - Minimal JS for Thymeleaf-based project

// DOM Content Loaded - Only essential functionality
document.addEventListener('DOMContentLoaded', function() {
    
    // Rotating text animation for hero title (only on home page)
    const rotatingText = document.getElementById('rotating-text');
    
    if (rotatingText) {
        const phrases = [
            'Stay Alert',
            'Stay Prepared', 
            'Stay Safe',
            'Stay Informed'
        ];
        
        let currentIndex = 0;
        
        function rotateText() {
            rotatingText.classList.add('fade-out');
            
            setTimeout(() => {
                currentIndex = (currentIndex + 1) % phrases.length;
                rotatingText.textContent = phrases[currentIndex];
                rotatingText.classList.remove('fade-out');
            }, 250);
        }
        
        setTimeout(() => {
            setInterval(rotateText, 2500);
        }, 2000);
    }
});

// Header scroll effects - minimal
let navbar = document.querySelector('.navbar-custom');
if (navbar) {
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset;
        
        if (scrollTop > 50) {
            navbar.style.background = 'rgba(10, 10, 15, 0.95)';
        } else {
            navbar.style.background = 'rgba(10, 10, 15, 0.85)';
        }
    });
}

// Page loading animation - basic
window.addEventListener('load', function() {
    document.body.style.opacity = '1';
});