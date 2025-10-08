// about.js - Funcionalidades específicas para la página "Nosotros"
class AboutPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.animateStats();
        this.setupScrollAnimations();
    }

    setupEventListeners() {
        // Smooth scroll for internal links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });

        // Team member hover effects
        this.setupTeamInteractions();
    }

    animateStats() {
        const stats = [
            { element: 'years-experience', target: 1, suffix: '+' },
            { element: 'products-created', target: 50, suffix: '+' },
            { element: 'happy-customers', target: 100, suffix: '+' }
        ];

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    stats.forEach(stat => {
                        this.animateValue(
                            document.getElementById(stat.element),
                            0,
                            stat.target,
                            2000,
                            stat.suffix
                        );
                    });
                    observer.disconnect();
                }
            });
        }, { threshold: 0.5 });

        const statsSection = document.querySelector('.about-hero__stats');
        if (statsSection) {
            observer.observe(statsSection);
        }
    }

    animateValue(element, start, end, duration, suffix = '') {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value + suffix;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    setupTeamInteractions() {
        const teamMembers = document.querySelectorAll('.team-member');
        
        teamMembers.forEach(member => {
            member.addEventListener('mouseenter', () => {
                member.style.transform = 'translateY(-10px)';
            });
            
            member.addEventListener('mouseleave', () => {
                member.style.transform = 'translateY(0)';
            });
        });
    }

    setupScrollAnimations() {
        const animatedElements = document.querySelectorAll('.value-card, .milestone, .process-step');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(element => {
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(element);
        });
    }

    // Social media sharing
    setupSocialSharing() {
        const shareButtons = document.querySelectorAll('.share-button');
        shareButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.sharePage(button.dataset.platform);
            });
        });
    }

    sharePage(platform) {
        const url = encodeURIComponent(window.location.href);
        const title = encodeURIComponent(document.title);
        const text = encodeURIComponent('Conoce la historia de Nido Bendito - Decoración artesanal para tu hogar');

        let shareUrl = '';
        
        switch (platform) {
            case 'facebook':
                shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
                break;
            case 'twitter':
                shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
                break;
            case 'pinterest':
                shareUrl = `https://pinterest.com/pin/create/button/?url=${url}&description=${text}`;
                break;
            case 'linkedin':
                shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
                break;
        }

        if (shareUrl) {
            window.open(shareUrl, '_blank', 'width=600,height=400');
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.aboutPage = new AboutPage();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AboutPage;
}