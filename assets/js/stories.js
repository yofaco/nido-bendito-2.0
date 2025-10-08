// stories.js - Funcionalidades específicas para la página "Historias"
class StoriesPage {
    constructor() {
        this.currentPage = 1;
        this.storiesPerPage = 6;
        this.currentFilter = 'all';
        this.allStories = [];
        
        this.init();
    }

    init() {
        this.loadStories();
        this.setupEventListeners();
        this.setupFiltering();
        this.setupSocialSharing();
    }

    loadStories() {
        // Simular carga de historias desde JSON o API
        this.allStories = [
            {
                id: 1,
                title: "Transformación Total: De Apartamento a Hogar",
                excerpt: "Cómo Laura convirtió su apartamento pequeño en un espacio funcional y hermoso con nuestros productos...",
                image: "../assets/images/historias/story-1.jpg",
                date: "20 Enero, 2024",
                category: "casos-exito",
                badge: "Caso de Éxito",
                likes: 15,
                comments: 3
            },
            {
                id: 2,
                title: "Guía: Combinación de Colores para tu Hogar",
                excerpt: "Aprende a combinar colores como un profesional para crear ambientes armónicos y acogedores...",
                image: "../assets/images/historias/story-2.jpg",
                date: "18 Enero, 2024",
                category: "tips",
                badge: "Tips & Ideas",
                likes: 22,
                comments: 7
            },
            {
                id: 3,
                title: "Nueva Colección: Primavera 2024",
                excerpt: "Descubre nuestra nueva colección inspirada en la renovación y frescura de la primavera...",
                image: "../assets/images/historias/story-3.jpg",
                date: "15 Enero, 2024",
                category: "novedades",
                badge: "Novedades",
                likes: 18,
                comments: 4
            },
            {
                id: 4,
                title: "Espacios Minimalistas: Menos es Más",
                excerpt: "Cómo lograr un estilo minimalista sin sacrificar calidez y personalidad en tu hogar...",
                image: "../assets/images/historias/story-4.jpg",
                date: "12 Enero, 2024",
                category: "inspiracion",
                badge: "Inspiración",
                likes: 25,
                comments: 9
            },
            {
                id: 5,
                title: "Historia de un Estudio Transformado",
                excerpt: "De espacio de trabajo a santuario creativo: la transformación del estudio de un artista...",
                image: "../assets/images/historias/story-5.jpg",
                date: "10 Enero, 2024",
                category: "casos-exito",
                badge: "Caso de Éxito",
                likes: 12,
                comments: 2
            },
            {
                id: 6,
                title: "5 Plantas que Purifican el Aire de tu Hogar",
                excerpt: "Descubre las mejores plantas para mejorar la calidad del aire y añadir vida a tus espacios...",
                image: "../assets/images/historias/story-6.jpg",
                date: "8 Enero, 2024",
                category: "tips",
                badge: "Tips & Ideas",
                likes: 30,
                comments: 11
            }
        ];

        this.renderStories();
    }

    setupEventListeners() {
        // Load more stories
        const loadMoreBtn = document.getElementById('load-more-stories');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.loadMoreStories();
            });
        }

        // Newsletter form
        const newsletterForm = document.getElementById('stories-newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleNewsletterSubmit(newsletterForm);
            });
        }

        // Social media links
        this.setupSocialLinks();
    }

    setupFiltering() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Update active state
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Apply filter
                this.currentFilter = button.dataset.filter;
                this.currentPage = 1;
                this.renderStories();
            });
        });
    }

    setupSocialSharing() {
        // Add social sharing buttons to stories
        document.addEventListener('click', (e) => {
            if (e.target.closest('.story-share')) {
                e.preventDefault();
                const storyId = e.target.closest('.story-share').dataset.storyId;
                this.shareStory(storyId);
            }
        });
    }

    setupSocialLinks() {
        // Track social media clicks for analytics
        const socialLinks = document.querySelectorAll('a[href*="instagram"], a[href*="facebook"], a[href*="whatsapp"]');
        socialLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const platform = this.getSocialPlatform(link.href);
                this.trackSocialClick(platform, 'stories_page');
            });
        });
    }

    getSocialPlatform(url) {
        if (url.includes('instagram')) return 'instagram';
        if (url.includes('facebook')) return 'facebook';
        if (url.includes('whatsapp')) return 'whatsapp';
        if (url.includes('mailto')) return 'email';
        return 'other';
    }

    trackSocialClick(platform, location) {
        // En producción, integrar con Google Analytics o similar
        console.log(`Social click: ${platform} from ${location}`);
        
        // Ejemplo de integración con gtag
        if (typeof gtag !== 'undefined') {
            gtag('event', 'social_click', {
                'event_category': 'Social',
                'event_label': `${platform}_${location}`,
                'platform': platform,
                'location': location
            });
        }
    }

    renderStories() {
        const grid = document.getElementById('stories-grid');
        if (!grid) return;

        // Filter stories
        const filteredStories = this.currentFilter === 'all' 
            ? this.allStories 
            : this.allStories.filter(story => story.category === this.currentFilter);

        // Calculate stories to show
        const storiesToShow = filteredStories.slice(0, this.currentPage * this.storiesPerPage);

        if (storiesToShow.length === 0) {
            grid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1;">
                    <i class="fas fa-newspaper"></i>
                    <h3>No hay historias disponibles</h3>
                    <p>Próximamente publicaremos más contenido inspirador</p>
                </div>
            `;
            return;
        }

        const storiesHTML = storiesToShow.map(story => this.createStoryCard(story)).join('');
        grid.innerHTML = storiesHTML;

        // Show/hide load more button
        this.updateLoadMoreButton(filteredStories.length);
    }

    createStoryCard(story) {
        return `
            <article class="story-card" data-category="${story.category}">
                <div class="story-card__image">
                    <img src="${story.image}" alt="${story.title}" class="story-card__img">
                    <div class="story-card__badge">${story.badge}</div>
                </div>
                <div class="story-card__content">
                    <div class="story-card__meta">
                        <span class="story-card__date">${story.date}</span>
                        <span class="story-card__category">${this.getCategoryName(story.category)}</span>
                    </div>
                    <h3 class="story-card__title">
                        <a href="historia-${story.id}.html">${story.title}</a>
                    </h3>
                    <p class="story-card__excerpt">${story.excerpt}</p>
                    <div class="story-card__footer">
                        <a href="historia-${story.id}.html" class="story-card__link">
                            Leer Más <i class="fas fa-arrow-right"></i>
                        </a>
                        <div class="story-card__stats">
                            <span class="story-stat">
                                <i class="fas fa-heart"></i> ${story.likes}
                            </span>
                            <span class="story-stat">
                                <i class="fas fa-comment"></i> ${story.comments}
                            </span>
                        </div>
                    </div>
                </div>
            </article>
        `;
    }

    getCategoryName(category) {
        const categories = {
            'casos-exito': 'Casos de Éxito',
            'tips': 'Tips & Ideas',
            'novedades': 'Novedades',
            'inspiracion': 'Inspiración'
        };
        return categories[category] || category;
    }

    loadMoreStories() {
        this.currentPage++;
        this.renderStories();
        
        // Scroll to newly loaded stories
        setTimeout(() => {
            const grid = document.getElementById('stories-grid');
            const newStories = grid.querySelectorAll('.story-card');
            if (newStories.length > 0) {
                const lastStory = newStories[newStories.length - 1];
                lastStory.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }, 100);
    }

    updateLoadMoreButton(totalStories) {
        const loadMoreBtn = document.getElementById('load-more-stories');
        if (!loadMoreBtn) return;

        const showingCount = this.currentPage * this.storiesPerPage;
        
        if (showingCount >= totalStories) {
            loadMoreBtn.style.display = 'none';
        } else {
            loadMoreBtn.style.display = 'inline-flex';
            const remaining = totalStories - showingCount;
            loadMoreBtn.innerHTML = `
                <i class="fas fa-plus"></i>
                Cargar Más Historias (${remaining} restantes)
            `;
        }
    }

    async handleNewsletterSubmit(form) {
        const emailInput = form.querySelector('input[type="email"]');
        const submitButton = form.querySelector('button[type="submit"]');
        
        const email = emailInput.value.trim();
        
        if (!this.isValidEmail(email)) {
            this.showNotification('Por favor ingresa un email válido', 'error');
            return;
        }

        // Disable button during submission
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Suscribiendo...';

        try {
            await this.subscribeToNewsletter(email);
            this.showNotification('¡Gracias por suscribirte a nuestro newsletter!', 'success');
            form.reset();
        } catch (error) {
            console.error('Error suscribiendo al newsletter:', error);
            this.showNotification('Error al suscribirse. Intenta nuevamente.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async subscribeToNewsletter(email) {
        return new Promise((resolve) => {
            setTimeout(() => {
                // Save to localStorage for demo
                const subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
                if (!subscribers.includes(email)) {
                    subscribers.push(email);
                    localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
                }
                resolve({ success: true });
            }, 1000);
        });
    }

    shareStory(storyId) {
        const story = this.allStories.find(s => s.id == storyId);
        if (!story) return;

        const url = encodeURIComponent(`${window.location.origin}/historia-${storyId}.html`);
        const title = encodeURIComponent(story.title);
        const text = encodeURIComponent(`Lee esta inspiradora historia de Nido Bendito: ${story.title}`);

        // Puedes implementar un modal de compartir aquí
        if (navigator.share) {
            navigator.share({
                title: story.title,
                text: story.excerpt,
                url: `${window.location.origin}/historia-${storyId}.html`
            });
        } else {
            // Fallback: copiar enlace al portapapeles
            navigator.clipboard.writeText(`${window.location.origin}/historia-${storyId}.html`);
            this.showNotification('Enlace copiado al portapapeles', 'success');
        }
    }

    showNotification(message, type = 'info') {
        if (window.productsLoader && window.productsLoader.showNotification) {
            window.productsLoader.showNotification(message, type);
        } else {
            // Fallback
            alert(message);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.storiesPage = new StoriesPage();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StoriesPage;
}