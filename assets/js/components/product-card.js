/**
 * Product Card Component - Nido Bendito
 * @version 2.0
 * @description Componente modular para tarjetas de producto
 */

class ProductCard extends HTMLElement {
    constructor() {
        super();
        this.product = null;
        this.attachShadow({ mode: 'open' });
    }

    /**
     * Configurar los atributos observados
     */
    static get observedAttributes() {
        return ['product-data', 'layout', 'show-description', 'show-actions'];
    }

    /**
     * Cuando el componente se conecta al DOM
     */
    connectedCallback() {
        this.render();
        this.setupEventListeners();
    }

    /**
     * Cuando cambian los atributos
     */
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            if (name === 'product-data' && newValue) {
                this.product = JSON.parse(newValue);
            }
            this.render();
        }
    }

    /**
     * Renderizar el componente
     */
    render() {
        if (!this.product) {
            this.shadowRoot.innerHTML = this.getLoadingTemplate();
            return;
        }

        this.shadowRoot.innerHTML = `
            <style>${this.getStyles()}</style>
            ${this.getProductCardTemplate()}
        `;
    }

    /**
     * Obtener estilos del componente
     */
    getStyles() {
        return `
            :host {
                display: block;
                --primary-color: #E0A06B;
                --primary-dark: #c98a5a;
                --dark-brown: #332B25;
                --medium-brown: #8B817A;
                --light-beige: #FCFBF7;
                --light-gray: #E8E8E8;
                --success-color: #27AE60;
                --warning-color: #F2994A;
                --error-color: #EB5757;
                --white: #FFFFFF;
                --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
                --shadow-md: 0 4px 8px rgba(0,0,0,0.12);
                --shadow-lg: 0 8px 24px rgba(0,0,0,0.15);
                --border-radius: 8px;
            }

            .product-card {
                background: var(--white);
                border-radius: var(--border-radius);
                overflow: hidden;
                box-shadow: var(--shadow-sm);
                transition: all 0.3s ease;
                height: 100%;
                display: flex;
                flex-direction: column;
            }

            .product-card:hover {
                transform: translateY(-4px);
                box-shadow: var(--shadow-lg);
            }

            .product-image {
                position: relative;
                overflow: hidden;
                aspect-ratio: 1;
            }

            .product-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.3s ease;
            }

            .product-card:hover .product-image img {
                transform: scale(1.05);
            }

            .product-badges {
                position: absolute;
                top: 12px;
                right: 12px;
                display: flex;
                flex-direction: column;
                gap: 4px;
            }

            .product-badge {
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.7em;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .product-badge.new {
                background: var(--primary-color);
                color: var(--white);
            }

            .product-badge.featured {
                background: var(--success-color);
                color: var(--white);
            }

            .product-badge.best-seller {
                background: var(--warning-color);
                color: var(--white);
            }

            .product-info {
                padding: 16px;
                flex: 1;
                display: flex;
                flex-direction: column;
            }

            .product-category {
                font-size: 0.8em;
                color: var(--medium-brown);
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 8px;
            }

            .product-name {
                font-size: 1.1em;
                font-weight: 600;
                color: var(--dark-brown);
                margin-bottom: 8px;
                line-height: 1.3;
            }

            .product-short-description {
                font-size: 0.9em;
                color: var(--medium-brown);
                line-height: 1.4;
                margin-bottom: 12px;
                flex: 1;
            }

            .product-pricing {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
            }

            .product-price {
                font-size: 1.2em;
                font-weight: 700;
                color: var(--dark-brown);
            }

            .product-compare-price {
                font-size: 0.9em;
                color: var(--medium-brown);
                text-decoration: line-through;
            }

            .product-meta {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
            }

            .stock-status {
                padding: 2px 6px;
                border-radius: 8px;
                font-size: 0.7em;
                font-weight: 600;
                text-transform: uppercase;
            }

            .stock-status.in-stock {
                background: rgba(39, 174, 96, 0.1);
                color: var(--success-color);
            }

            .stock-status.low-stock {
                background: rgba(242, 153, 74, 0.1);
                color: var(--warning-color);
            }

            .stock-status.out-of-stock {
                background: rgba(235, 87, 87, 0.1);
                color: var(--error-color);
            }

            .product-rating {
                display: flex;
                align-items: center;
                gap: 4px;
                font-size: 0.8em;
            }

            .product-rating i {
                color: var(--primary-color);
                font-size: 0.9em;
            }

            .rating-count {
                color: var(--medium-brown);
            }

            .product-actions {
                padding: 0 16px 16px;
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .btn-order-whatsapp {
                background: #25D366;
                color: var(--white);
                border: none;
                padding: 10px 16px;
                border-radius: var(--border-radius);
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .btn-order-whatsapp:hover {
                background: #1DA851;
                transform: translateY(-1px);
            }

            .btn-view-details {
                background: transparent;
                color: var(--dark-brown);
                border: 1px solid var(--light-gray);
                padding: 8px 16px;
                border-radius: var(--border-radius);
                text-decoration: none;
                text-align: center;
                font-weight: 500;
                transition: all 0.3s ease;
            }

            .btn-view-details:hover {
                background: var(--light-beige);
                border-color: var(--medium-brown);
            }

            /* Layout variations */
            :host([layout="horizontal"]) .product-card {
                flex-direction: row;
            }

            :host([layout="horizontal"]) .product-image {
                width: 120px;
                flex-shrink: 0;
            }

            :host([layout="horizontal"]) .product-info {
                flex: 1;
            }

            :host([layout="minimal"]) .product-card {
                box-shadow: none;
                border: 1px solid var(--light-gray);
            }

            :host([layout="minimal"]) .product-short-description,
            :host([layout="minimal"]) .product-meta {
                display: none;
            }

            /* Responsive */
            @media (max-width: 768px) {
                :host([layout="horizontal"]) .product-card {
                    flex-direction: column;
                }

                :host([layout="horizontal"]) .product-image {
                    width: 100%;
                }
            }

            /* Loading state */
            .loading-skeleton {
                background: var(--white);
                border-radius: var(--border-radius);
                overflow: hidden;
                box-shadow: var(--shadow-sm);
            }

            .skeleton-image {
                width: 100%;
                aspect-ratio: 1;
                background: var(--light-gray);
                animation: pulse 1.5s ease-in-out infinite;
            }

            .skeleton-content {
                padding: 16px;
            }

            .skeleton-line {
                height: 12px;
                background: var(--light-gray);
                border-radius: 4px;
                margin-bottom: 8px;
                animation: pulse 1.5s ease-in-out infinite;
            }

            .skeleton-line.short {
                width: 60%;
            }

            .skeleton-line.medium {
                width: 80%;
            }

            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        `;
    }

    /**
     * Obtener template de la tarjeta de producto
     */
    getProductCardTemplate() {
        const primaryImage = this.product.images?.find(img => img.is_primary) || this.product.images?.[0];
        const imageUrl = primaryImage?.url || '../assets/images/placeholder-product.jpg';
        const imageAlt = primaryImage?.alt || this.product.name;

        const showDescription = this.getAttribute('show-description') !== 'false';
        const showActions = this.getAttribute('show-actions') !== 'false';

        return `
            <div class="product-card">
                <a href="../pages/producto/detalle.html?product=${this.product.slug}" class="product-link">
                    <div class="product-image">
                        <img src="${imageUrl}" alt="${imageAlt}" loading="lazy">
                        ${this.getProductBadges()}
                    </div>
                </a>
                
                <div class="product-info">
                    <span class="product-category">${this.getCategoryName()}</span>
                    <h3 class="product-name">${this.product.name}</h3>
                    
                    ${showDescription ? `
                        <p class="product-short-description">${this.product.short_description}</p>
                    ` : ''}
                    
                    <div class="product-pricing">
                        <span class="product-price">Q${this.product.price.toFixed(2)}</span>
                        ${this.product.compare_price ? `
                            <span class="product-compare-price">Q${this.product.compare_price.toFixed(2)}</span>
                        ` : ''}
                    </div>
                    
                    <div class="product-meta">
                        ${this.getStockStatus()}
                        ${this.getRating()}
                    </div>
                </div>
                
                ${showActions ? `
                    <div class="product-actions">
                        <button class="btn-order-whatsapp">
                            <i class="fab fa-whatsapp"></i> Pedir por WhatsApp
                        </button>
                        <a href="../pages/producto/detalle.html?product=${this.product.slug}" class="btn-view-details">
                            Ver detalles
                        </a>
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Obtener template de carga
     */
    getLoadingTemplate() {
        return `
            <style>${this.getStyles()}</style>
            <div class="loading-skeleton">
                <div class="skeleton-image"></div>
                <div class="skeleton-content">
                    <div class="skeleton-line short"></div>
                    <div class="skeleton-line medium"></div>
                    <div class="skeleton-line" style="width: 40%;"></div>
                    <div class="skeleton-line" style="width: 60%; margin-top: 12px;"></div>
                </div>
            </div>
        `;
    }

    /**
     * Obtener badges del producto
     */
    getProductBadges() {
        const badges = [];
        
        if (this.product.new) {
            badges.push('<span class="product-badge new">Nuevo</span>');
        }
        
        if (this.product.featured) {
            badges.push('<span class="product-badge featured">Destacado</span>');
        }
        
        if (this.product.best_seller) {
            badges.push('<span class="product-badge best-seller">Más Vendido</span>');
        }
        
        return badges.length > 0 ? `<div class="product-badges">${badges.join('')}</div>` : '';
    }

    /**
     * Obtener estado de stock
     */
    getStockStatus() {
        const stock = this.product.inventory?.stock || 0;
        const status = this.product.inventory?.stock_status || 'in_stock';
        
        if (status === 'out_of_stock') {
            return '<span class="stock-status out-of-stock">Agotado</span>';
        }
        
        if (stock < 5) {
            return `<span class="stock-status low-stock">Últimas ${stock} unidades</span>`;
        }
        
        return '<span class="stock-status in-stock">En stock</span>';
    }

    /**
     * Obtener rating del producto
     */
    getRating() {
        const rating = this.product.rating || 0;
        const reviewCount = this.product.review_count || 0;
        
        if (rating === 0) return '';
        
        const stars = this.generateStarRating(rating);
        
        return `
            <div class="product-rating">
                ${stars}
                <span class="rating-count">(${reviewCount})</span>
            </div>
        `;
    }

    /**
     * Generar estrellas de rating
     */
    generateStarRating(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
        
        let stars = '';
        
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    /**
     * Obtener nombre de categoría
     */
    getCategoryName() {
        // Esta función se integrará con el CategoriesLoader
        const categoryMap = {
            'living-room': 'Living Room',
            'dining-kitchen': 'Dining & Kitchen',
            'wall-decor': 'Wall Decor',
            'bedroom': 'Bedroom',
            'pillows-decor': 'Pillows & Decor',
            'lighting': 'Lighting'
        };
        
        return categoryMap[this.product.category] || 'Sin categoría';
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Usar event delegation para el botón de WhatsApp
        this.shadowRoot.addEventListener('click', (e) => {
            if (e.target.closest('.btn-order-whatsapp')) {
                this.handleWhatsAppOrder();
            }
        });
    }

    /**
     * Manejar pedido por WhatsApp
     */
    handleWhatsAppOrder() {
        const message = `¡Hola! Estoy interesado en el producto: *${this.product.name}* - Q${this.product.price}. ¿Podrían darme más información?`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/50212345678?text=${encodedMessage}`;
        
        window.open(whatsappURL, '_blank');
    }

    /**
     * Métodos públicos para manipulación externa
     */

    // Actualizar producto
    updateProduct(newProductData) {
        this.product = { ...this.product, ...newProductData };
        this.render();
    }

    // Obtener datos del producto
    getProduct() {
        return this.product;
    }

    // Mostrar/ocultar acciones
    toggleActions(show) {
        this.setAttribute('show-actions', show);
    }

    // Cambiar layout
    setLayout(layout) {
        this.setAttribute('layout', layout);
    }
}

// Registrar el custom element
customElements.define('product-card', ProductCard);

// Exportar la clase para uso modular
window.ProductCard = ProductCard;

console.log('🛍️ Product Card Component registrado correctamente');