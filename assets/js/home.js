// home.js - Funcionalidades específicas para la página de inicio
class HomePage {
    constructor(productsLoader) {
        this.productsLoader = productsLoader;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderHomeContent();
    }

    setupEventListeners() {
        // Newsletter form
        const newsletterForm = document.getElementById('newsletter-form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', (e) => this.handleNewsletterSubmit(e));
        }

        // Smooth scroll para links internos
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
    }

    renderHomeContent() {
        // Esperar a que los datos estén cargados
        document.addEventListener('productsDataLoaded', () => {
            this.renderFeaturedCategories();
            this.renderFeaturedProducts();
            this.initializeHeroAnimations();
        });
    }

    renderFeaturedCategories() {
        const categoriesGrid = document.getElementById('categories-grid');
        if (!categoriesGrid) return;

        this.productsLoader.renderCategoriesGrid('categories-grid');
    }

    renderFeaturedProducts() {
        const featuredGrid = document.getElementById('featured-products');
        if (!featuredGrid) return;

        const featuredProducts = this.productsLoader.getFeaturedProducts();
        
        if (featuredProducts.length === 0) {
            // Si no hay productos destacados, mostrar los últimos 6 productos
            const allProducts = this.productsLoader.getPublishedProducts();
            const recentProducts = allProducts.slice(0, 6);
            this.productsLoader.renderProductsGrid(recentProducts, 'featured-products', {
                limit: 6,
                showDescription: true,
                showActions: true
            });
        } else {
            this.productsLoader.renderProductsGrid(featuredProducts, 'featured-products', {
                limit: 6,
                showDescription: true,
                showActions: true
            });
        }
    }

    initializeHeroAnimations() {
        // Animación para las imágenes del hero
        const heroImages = document.querySelectorAll('.hero__image');
        heroImages.forEach((image, index) => {
            image.style.animationDelay = `${index * 0.2}s`;
            image.classList.add('animate-in');
        });

        // Contador animado para productos
        this.animateProductCounter();
    }

    animateProductCounter() {
        const counterElement = document.getElementById('total-products-count');
        if (!counterElement) return;

        const targetCount = this.productsLoader.getPublishedProducts().length;
        this.animateValue(counterElement, 0, targetCount, 1000);
    }

    animateValue(element, start, end, duration) {
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const value = Math.floor(progress * (end - start) + start);
            element.textContent = value;
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }

    async handleNewsletterSubmit(e) {
        e.preventDefault();
        const form = e.target;
        const emailInput = form.querySelector('input[type="email"]');
        const submitButton = form.querySelector('button[type="submit"]');
        
        const email = emailInput.value.trim();
        
        if (!this.isValidEmail(email)) {
            this.productsLoader.showNotification('Por favor ingresa un email válido', 'error');
            return;
        }

        // Deshabilitar botón durante el envío
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Suscribiendo...';

        try {
            // Simular envío a API (en producción, reemplazar con llamada real)
            await this.subscribeToNewsletter(email);
            
            this.productsLoader.showNotification('¡Te has suscrito exitosamente!', 'success');
            form.reset();
            
        } catch (error) {
            console.error('Error suscribiendo al newsletter:', error);
            this.productsLoader.showNotification('Error al suscribirse. Intenta nuevamente.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = 'Suscribirme <i class="fas fa-paper-plane button__icon"></i>';
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    async subscribeToNewsletter(email) {
        // Simular llamada a API
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                // Guardar en localStorage para demostración
                const subscribers = JSON.parse(localStorage.getItem('newsletterSubscribers') || '[]');
                if (!subscribers.includes(email)) {
                    subscribers.push(email);
                    localStorage.setItem('newsletterSubscribers', JSON.stringify(subscribers));
                }
                resolve({ success: true });
            }, 1000);
        });
    }

    // Métodos para analytics (opcional)
    trackUserInteraction(action, label) {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                'event_category': 'Home Page',
                'event_label': label
            });
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    if (window.productsLoader) {
        window.homePage = new HomePage(window.productsLoader);
    } else {
        // Esperar a que productsLoader esté disponible
        document.addEventListener('productsDataLoaded', () => {
            window.homePage = new HomePage(window.productsLoader);
        });
    }
});