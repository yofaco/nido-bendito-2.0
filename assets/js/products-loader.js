/**
 * Products Loader - Nido Bendito
 * @version 2.0
 * @description Cargador dinámico de productos para el sitio web
 */

class ProductsLoader {
    constructor() {
        this.config = {
            dataUrls: {
                products: '../data/products.json',
                categories: '../data/categories.json'
            },
            selectors: {
                productGrid: '.product-grid',
                productsContainer: '.products-container',
                categoryFilters: '.category-filters',
                sortSelect: '#sortProducts',
                productsCount: '.products-count',
                noProducts: '.no-products-message'
            },
            templates: {
                productCard: 'product-card-template',
                categoryFilter: 'category-filter-template'
            }
        };
        
        this.state = {
            products: [],
            categories: [],
            filteredProducts: [],
            currentCategory: 'all',
            currentSort: 'default',
            isLoading: false
        };
    }

    /**
     * Inicializar el cargador de productos
     */
    async init() {
        try {
            this.showLoadingState(true);
            
            // Cargar datos
            await this.loadData();
            
            // Configurar event listeners
            this.setupEventListeners();
            
            // Renderizar vista inicial
            this.renderProducts();
            this.renderCategoryFilters();
            this.updateProductsCount();
            
            this.showLoadingState(false);
            
            console.log('✅ Products Loader inicializado correctamente');
            
        } catch (error) {
            console.error('❌ Error inicializando Products Loader:', error);
            this.showErrorState('Error al cargar los productos');
        }
    }

    /**
     * Cargar datos de productos y categorías
     */
    async loadData() {
        try {
            const [productsResponse, categoriesResponse] = await Promise.all([
                fetch(this.config.dataUrls.products),
                fetch(this.config.dataUrls.categories)
            ]);

            if (!productsResponse.ok || !categoriesResponse.ok) {
                throw new Error('Error cargando datos');
            }

            const productsData = await productsResponse.json();
            const categoriesData = await categoriesResponse.json();

            this.state.products = productsData.products || [];
            this.state.categories = categoriesData.categories || [];
            this.state.filteredProducts = [...this.state.products];

        } catch (error) {
            console.error('Error cargando datos:', error);
            throw error;
        }
    }

    /**
     * Configurar event listeners para filtros y ordenamiento
     */
    setupEventListeners() {
        // Filtros de categoría
        const categoryFilters = document.querySelector(this.config.selectors.categoryFilters);
        if (categoryFilters) {
            categoryFilters.addEventListener('click', (e) => {
                if (e.target.matches('[data-category]')) {
                    e.preventDefault();
                    this.handleCategoryFilter(e.target.dataset.category);
                }
            });
        }

        // Ordenamiento
        const sortSelect = document.querySelector(this.config.selectors.sortSelect);
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.handleSortChange(e.target.value);
            });
        }

        // Búsqueda (si existe)
        const searchInput = document.querySelector('#searchProducts');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
    }

    /**
     * Manejar filtrado por categoría
     */
    handleCategoryFilter(categoryId) {
        this.state.currentCategory = categoryId;
        
        // Actualizar UI de filtros
        this.updateActiveFilter(categoryId);
        
        // Aplicar filtros
        this.applyFilters();
        
        // Renderizar productos
        this.renderProducts();
        this.updateProductsCount();
    }

    /**
     * Manejar cambio de ordenamiento
     */
    handleSortChange(sortBy) {
        this.state.currentSort = sortBy;
        this.applyFilters();
        this.renderProducts();
    }

    /**
     * Manejar búsqueda de productos
     */
    handleSearch(searchTerm) {
        this.state.searchTerm = searchTerm.toLowerCase();
        this.applyFilters();
        this.renderProducts();
        this.updateProductsCount();
    }

    /**
     * Aplicar todos los filtros y ordenamiento
     */
    applyFilters() {
        let filtered = [...this.state.products];

        // Filtro por categoría
        if (this.state.currentCategory !== 'all') {
            filtered = filtered.filter(product => 
                product.category === this.state.currentCategory
            );
        }

        // Filtro por búsqueda
        if (this.state.searchTerm) {
            filtered = filtered.filter(product =>
                product.name.toLowerCase().includes(this.state.searchTerm) ||
                product.description.toLowerCase().includes(this.state.searchTerm) ||
                product.short_description.toLowerCase().includes(this.state.searchTerm)
            );
        }

        // Ordenamiento
        filtered = this.sortProducts(filtered, this.state.currentSort);

        this.state.filteredProducts = filtered;
    }

    /**
     * Ordenar productos según criterio seleccionado
     */
    sortProducts(products, sortBy) {
        const sorted = [...products];
        
        switch (sortBy) {
            case 'price-asc':
                return sorted.sort((a, b) => a.price - b.price);
                
            case 'price-desc':
                return sorted.sort((a, b) => b.price - a.price);
                
            case 'name-asc':
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
                
            case 'name-desc':
                return sorted.sort((a, b) => b.name.localeCompare(a.name));
                
            case 'newest':
                return sorted.sort((a, b) => 
                    new Date(b.created_at) - new Date(a.created_at)
                );
                
            case 'rating-desc':
                return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                
            default:
                return sorted;
        }
    }

    /**
     * Renderizar productos en el grid
     */
    renderProducts() {
        const container = document.querySelector(this.config.selectors.productGrid) ||
                         document.querySelector(this.config.selectors.productsContainer);
        
        if (!container) {
            console.warn('Contenedor de productos no encontrado');
            return;
        }

        // Mostrar/ocultar mensaje de no productos
        this.toggleNoProductsMessage(this.state.filteredProducts.length === 0);

        // Limpiar contenedor
        container.innerHTML = '';

        // Renderizar productos
        this.state.filteredProducts.forEach(product => {
            const productCard = this.createProductCard(product);
            container.appendChild(productCard);
        });
    }

    /**
     * Crear tarjeta de producto
     */
    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-item';
        card.setAttribute('data-category', product.category);
        card.setAttribute('data-price', product.price);
        card.setAttribute('data-rating', product.rating || 0);
        card.setAttribute('data-new', product.new || false);

        const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
        const imageUrl = primaryImage?.url || '../assets/images/placeholder-product.jpg';
        const imageAlt = primaryImage?.alt || product.name;

        card.innerHTML = `
            <div class="product-card">
                <a href="../pages/producto/detalle.html?product=${product.slug}" class="product-link">
                    <div class="product-image">
                        <img src="${imageUrl}" alt="${imageAlt}" loading="lazy">
                        ${this.renderProductBadges(product)}
                    </div>
                </a>
                
                <div class="product-info">
                    <span class="product-category">${this.getCategoryName(product.category)}</span>
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-short-description">${product.short_description}</p>
                    
                    <div class="product-pricing">
                        <span class="product-price">Q${product.price.toFixed(2)}</span>
                        ${product.compare_price ? 
                            `<span class="product-compare-price">Q${product.compare_price.toFixed(2)}</span>` : 
                            ''
                        }
                    </div>
                    
                    <div class="product-meta">
                        ${this.renderStockStatus(product)}
                        ${this.renderRating(product)}
                    </div>
                </div>
                
                <div class="product-actions">
                    <button class="btn-order-whatsapp" 
                            data-product="${product.name}" 
                            data-price="Q${product.price}">
                        <i class="fab fa-whatsapp"></i> Pedir por WhatsApp
                    </button>
                    <a href="../pages/producto/detalle.html?product=${product.slug}" 
                       class="btn-view-details">
                        Ver detalles
                    </a>
                </div>
            </div>
        `;

        // Configurar botón de WhatsApp
        this.setupWhatsAppButton(card, product);

        return card;
    }

    /**
     * Renderizar badges del producto (nuevo, destacado, etc.)
     */
    renderProductBadges(product) {
        const badges = [];
        
        if (product.new) {
            badges.push('<span class="product-badge new">Nuevo</span>');
        }
        
        if (product.featured) {
            badges.push('<span class="product-badge featured">Destacado</span>');
        }
        
        if (product.best_seller) {
            badges.push('<span class="product-badge best-seller">Más Vendido</span>');
        }
        
        return badges.join('');
    }

    /**
     * Renderizar estado de stock
     */
    renderStockStatus(product) {
        const stock = product.inventory?.stock || 0;
        const status = product.inventory?.stock_status || 'in_stock';
        
        if (status === 'out_of_stock') {
            return '<span class="stock-status out-of-stock">Agotado</span>';
        }
        
        if (stock < 5) {
            return `<span class="stock-status low-stock">Últimas ${stock} unidades</span>`;
        }
        
        return '<span class="stock-status in-stock">En stock</span>';
    }

    /**
     * Renderizar rating del producto
     */
    renderRating(product) {
        const rating = product.rating || 0;
        const reviewCount = product.review_count || 0;
        
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
        
        // Estrellas llenas
        for (let i = 0; i < fullStars; i++) {
            stars += '<i class="fas fa-star"></i>';
        }
        
        // Media estrella
        if (hasHalfStar) {
            stars += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Estrellas vacías
        for (let i = 0; i < emptyStars; i++) {
            stars += '<i class="far fa-star"></i>';
        }
        
        return stars;
    }

    /**
     * Renderizar filtros de categoría
     */
    renderCategoryFilters() {
        const container = document.querySelector(this.config.selectors.categoryFilters);
        if (!container) return;

        const categories = [
            { id: 'all', name: 'Todos los Productos', product_count: this.state.products.length },
            ...this.state.categories.filter(cat => cat.product_count > 0)
        ];

        container.innerHTML = categories.map(category => `
            <li>
                <a href="#" 
                   data-category="${category.id}" 
                   class="${category.id === this.state.currentCategory ? 'active' : ''}">
                    ${category.name}
                    ${category.id !== 'all' ? `<span class="category-count">${category.product_count}</span>` : ''}
                </a>
            </li>
        `).join('');
    }

    /**
     * Actualizar filtro activo en la UI
     */
    updateActiveFilter(categoryId) {
        const filters = document.querySelectorAll(`${this.config.selectors.categoryFilters} a`);
        filters.forEach(filter => {
            filter.classList.toggle('active', filter.dataset.category === categoryId);
        });
    }

    /**
     * Actualizar contador de productos
     */
    updateProductsCount() {
        const countElement = document.querySelector(this.config.selectors.productsCount);
        if (countElement) {
            countElement.textContent = this.state.filteredProducts.length;
        }
    }

    /**
     * Mostrar/ocultar mensaje de no productos
     */
    toggleNoProductsMessage(show) {
        const noProductsElement = document.querySelector(this.config.selectors.noProducts);
        if (noProductsElement) {
            noProductsElement.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Configurar botón de WhatsApp
     */
    setupWhatsAppButton(card, product) {
        const whatsappBtn = card.querySelector('.btn-order-whatsapp');
        if (whatsappBtn) {
            whatsappBtn.addEventListener('click', () => {
                this.openWhatsApp(product);
            });
        }
    }

    /**
     * Abrir WhatsApp para pedido
     */
    openWhatsApp(product) {
        const message = `¡Hola! Estoy interesado en el producto: *${product.name}* - Q${product.price}. ¿Podrían darme más información?`;
        const encodedMessage = encodeURIComponent(message);
        const whatsappURL = `https://wa.me/50212345678?text=${encodedMessage}`;
        
        window.open(whatsappURL, '_blank');
    }

    /**
     * Obtener nombre de categoría
     */
    getCategoryName(categoryId) {
        const category = this.state.categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Sin categoría';
    }

    /**
     * Mostrar estado de carga
     */
    showLoadingState(show) {
        this.state.isLoading = show;
        
        const container = document.querySelector(this.config.selectors.productGrid) ||
                         document.querySelector(this.config.selectors.productsContainer);
        
        if (container) {
            if (show) {
                container.innerHTML = `
                    <div class="loading-products">
                        <div class="loading-spinner"></div>
                        <p>Cargando productos...</p>
                    </div>
                `;
            }
        }
    }

    /**
     * Mostrar estado de error
     */
    showErrorState(message) {
        const container = document.querySelector(this.config.selectors.productGrid) ||
                         document.querySelector(this.config.selectors.productsContainer);
        
        if (container) {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error al cargar productos</h3>
                    <p>${message}</p>
                    <button class="btn-retry" onclick="window.productsLoader.init()">
                        Reintentar
                    </button>
                </div>
            `;
        }
    }

    /**
     * Obtener productos por categoría
     */
    getProductsByCategory(categoryId) {
        if (categoryId === 'all') return this.state.products;
        return this.state.products.filter(product => product.category === categoryId);
    }

    /**
     * Obtener productos destacados
     */
    getFeaturedProducts(limit = 6) {
        return this.state.products
            .filter(product => product.featured)
            .slice(0, limit);
    }

    /**
     * Obtener nuevos productos
     */
    getNewProducts(limit = 6) {
        return this.state.products
            .filter(product => product.new)
            .slice(0, limit);
    }

    /**
     * Buscar productos
     */
    searchProducts(query) {
        const searchTerm = query.toLowerCase();
        return this.state.products.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.description.toLowerCase().includes(searchTerm) ||
            product.short_description.toLowerCase().includes(searchTerm)
        );
    }
}

// ===== INICIALIZACIÓN GLOBAL =====

// Crear instancia global
const productsLoader = new ProductsLoader();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    productsLoader.init();
});

// Hacer disponible globalmente
window.productsLoader = productsLoader;

console.log('🛍️ Products Loader cargado correctamente');