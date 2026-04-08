// RapidQuake — global shell (navbar scroll, etc.). Page-specific scripts live under /js/pages/
document.addEventListener('DOMContentLoaded', function () {
    /* home hero rotation: /js/pages/index.js */
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