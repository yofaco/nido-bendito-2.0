// products-loader.js - Sistema de carga dinámica de productos para el sitio público
class ProductsLoader {
    constructor() {
        this.products = [];
        this.categories = [];
        this.config = {};
        this.isLoading = false;
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
    }

    async loadData() {
        try {
            this.showLoadingState();
            
            // Cargar productos
            const productsResponse = await fetch('../data/products.json');
            const productsData = await productsResponse.json();
            this.products = productsData.products || [];

            // Cargar categorías
            const categoriesResponse = await fetch('../data/categories.json');
            const categoriesData = await categoriesResponse.json();
            this.categories = categoriesData.categories || [];

            // Cargar configuración
            const configResponse = await fetch('../data/config.json');
            this.config = await configResponse.json();

            this.hideLoadingState();
            this.dispatchDataLoadedEvent();

        } catch (error) {
            console.error('Error cargando datos:', error);
            this.showErrorState('Error cargando los productos. Por favor, intenta más tarde.');
        }
    }

    setupEventListeners() {
        // Escuchar eventos personalizados para actualizaciones
        document.addEventListener('productsDataLoaded', () => {
            this.updateProductCounters();
        });

        // Manejar errores de imágenes
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                e.target.src = '../assets/images/placeholder.jpg';
                e.target.alt = 'Imagen no disponible';
            }
        }, true);
    }

    dispatchDataLoadedEvent() {
        const event = new CustomEvent('productsDataLoaded', {
            detail: {
                products: this.products,
                categories: this.categories,
                config: this.config
            }
        });
        document.dispatchEvent(event);
    }

    getPublishedProducts() {
        return this.products.filter(product => product.published !== false);
    }

    getFeaturedProducts() {
        return this.getPublishedProducts().filter(product => product.featured);
    }

    getProductsByCategory(categoryId) {
        return this.getPublishedProducts().filter(product => product.category === categoryId);
    }

    getProductById(productId) {
        return this.getPublishedProducts().find(product => product.id === productId);
    }

    getCategoryById(categoryId) {
        return this.categories.find(category => category.id === categoryId);
    }

    getAllCategories() {
        return this.categories.filter(category => 
            this.getProductsByCategory(category.id).length > 0
        );
    }

    // Métodos para renderizar productos
    renderProductsGrid(products, containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const {
            view = 'grid',
            showCategory = true,
            showDescription = true,
            showActions = true,
            limit = null
        } = options;

        let productsToRender = products;
        if (limit && products.length > limit) {
            productsToRender = products.slice(0, limit);
        }

        if (productsToRender.length === 0) {
            this.renderEmptyState(container, 'No se encontraron productos');
            return;
        }

        const productsHTML = productsToRender.map(product => 
            this.createProductCard(product, { view, showCategory, showDescription, showActions })
        ).join('');

        container.innerHTML = productsHTML;
        this.setupProductInteractions(containerId);
    }

    renderCategoriesGrid(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const categories = this.getAllCategories();
        
        if (categories.length === 0) {
            this.renderEmptyState(container, 'No hay categorías disponibles');
            return;
        }

        const categoriesHTML = categories.map(category => 
            this.createCategoryCard(category)
        ).join('');

        container.innerHTML = categoriesHTML;
    }

    createProductCard(product, options = {}) {
        const {
            view = 'grid',
            showCategory = true,
            showDescription = true,
            showActions = true
        } = options;

        const category = this.getCategoryById(product.category);
        const mainImage = product.images && product.images.length > 0 ? product.images[0] : '../assets/images/placeholder.jpg';
        const isGridView = view === 'grid';

        return `
            <div class="product-card ${isGridView ? 'product-card--grid' : 'product-card--list'}" 
                 data-product-id="${product.id}">
                
                ${product.featured ? '<span class="product-card__badge">Destacado</span>' : ''}
                
                <div class="product-card__image">
                    <img src="${mainImage}" 
                         alt="${product.name}" 
                         class="product-card__img"
                         loading="lazy"
                         onerror="this.src='../assets/images/placeholder.jpg'">
                    
                    ${showActions ? `
                    <div class="product-card__overlay">
                        <button class="product-card__quick-view" data-product-id="${product.id}">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="product-card__wishlist" data-product-id="${product.id}">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                    ` : ''}
                </div>

                <div class="product-card__content">
                    ${showCategory && category ? `
                    <div class="product-card__category">${category.name}</div>
                    ` : ''}
                    
                    <h3 class="product-card__title">
                        <a href="../pages/producto/${product.id}.html" class="product-card__link">
                            ${product.name}
                        </a>
                    </h3>
                    
                    ${showDescription && product.description ? `
                    <p class="product-card__description">${this.truncateText(product.description, 100)}</p>
                    ` : ''}

                    <div class="product-card__price">
                        <span class="product-card__price-current">$${product.price.toFixed(2)}</span>
                        ${product.comparePrice ? `
                        <span class="product-card__price-compare">$${product.comparePrice.toFixed(2)}</span>
                        ` : ''}
                    </div>

                    ${product.specifications && Object.keys(product.specifications).length > 0 && !isGridView ? `
                    <div class="product-card__specs">
                        ${Object.entries(product.specifications).slice(0, 2).map(([key, value]) => `
                            <div class="product-spec">
                                <span class="product-spec__key">${key}:</span>
                                <span class="product-spec__value">${value}</span>
                            </div>
                        `).join('')}
                    </div>
                    ` : ''}

                    ${showActions ? `
                    <div class="product-card__actions">
                        <button class="button button--primary product-card__add-to-cart" 
                                data-product-id="${product.id}">
                            <i class="fas fa-shopping-cart"></i>
                            Agregar al Carrito
                        </button>
                        <a href="../pages/producto/${product.id}.html" 
                           class="button button--outline product-card__view-details">
                            Ver Detalles
                        </a>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    createCategoryCard(category) {
        const productsInCategory = this.getProductsByCategory(category.id);
        const image = category.image || '../assets/images/categories/placeholder.jpg';

        return `
            <div class="category-card" data-category-id="${category.id}">
                <div class="category-card__image">
                    <img src="${image}" 
                         alt="${category.name}" 
                         class="category-card__img"
                         loading="lazy"
                         onerror="this.src='../assets/images/placeholder.jpg'">
                    <div class="category-card__overlay">
                        <a href="tienda.html?category=${category.id}" class="category-card__link">
                            Explorar <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
                
                <div class="category-card__content">
                    <h3 class="category-card__title">${category.name}</h3>
                    <p class="category-card__description">${category.description}</p>
                    <div class="category-card__count">${productsInCategory.length} productos</div>
                </div>
            </div>
        `;
    }

    setupProductInteractions(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Quick view
        container.addEventListener('click', (e) => {
            const quickViewBtn = e.target.closest('.product-card__quick-view');
            if (quickViewBtn) {
                const productId = parseInt(quickViewBtn.dataset.productId);
                this.openQuickView(productId);
            }

            // Wishlist
            const wishlistBtn = e.target.closest('.product-card__wishlist');
            if (wishlistBtn) {
                const productId = parseInt(wishlistBtn.dataset.productId);
                this.toggleWishlist(productId, wishlistBtn);
            }

            // Add to cart
            const addToCartBtn = e.target.closest('.product-card__add-to-cart');
            if (addToCartBtn) {
                const productId = parseInt(addToCartBtn.dataset.productId);
                this.addToCart(productId);
            }
        });
    }

    openQuickView(productId) {
        const product = this.getProductById(productId);
        if (!product) return;

        // En una implementación real, aquí abrirías un modal con los detalles del producto
        console.log('Quick view para producto:', product.name);
        // this.showQuickViewModal(product);
    }

    toggleWishlist(productId, button) {
        const wishlist = this.getWishlist();
        const isInWishlist = wishlist.includes(productId);

        if (isInWishlist) {
            // Remover de wishlist
            const newWishlist = wishlist.filter(id => id !== productId);
            localStorage.setItem('nidoBenditoWishlist', JSON.stringify(newWishlist));
            button.innerHTML = '<i class="far fa-heart"></i>';
            this.showNotification('Producto removido de tu lista de deseos', 'info');
        } else {
            // Agregar a wishlist
            wishlist.push(productId);
            localStorage.setItem('nidoBenditoWishlist', JSON.stringify(wishlist));
            button.innerHTML = '<i class="fas fa-heart"></i>';
            this.showNotification('Producto agregado a tu lista de deseos', 'success');
        }
    }

    addToCart(productId) {
        const product = this.getProductById(productId);
        if (!product) return;

        const cart = this.getCart();
        const existingItem = cart.find(item => item.productId === productId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                productId: productId,
                quantity: 1,
                addedAt: new Date().toISOString()
            });
        }

        localStorage.setItem('nidoBenditoCart', JSON.stringify(cart));
        this.updateCartCounter();
        this.showNotification(`${product.name} agregado al carrito`, 'success');
    }

    getWishlist() {
        try {
            return JSON.parse(localStorage.getItem('nidoBenditoWishlist')) || [];
        } catch {
            return [];
        }
    }

    getCart() {
        try {
            return JSON.parse(localStorage.getItem('nidoBenditoCart')) || [];
        } catch {
            return [];
        }
    }

    updateCartCounter() {
        const cart = this.getCart();
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        
        // Actualizar contador en el header si existe
        const cartCounter = document.getElementById('cart-counter');
        if (cartCounter) {
            cartCounter.textContent = totalItems;
            cartCounter.style.display = totalItems > 0 ? 'flex' : 'none';
        }
    }

    updateProductCounters() {
        const publishedProducts = this.getPublishedProducts();
        
        // Actualizar contadores en la página de inicio
        const totalProductsElement = document.getElementById('total-products-count');
        if (totalProductsElement) {
            totalProductsElement.textContent = publishedProducts.length;
        }

        const totalProductsShopElement = document.getElementById('total-products-shop');
        if (totalProductsShopElement) {
            totalProductsShopElement.textContent = publishedProducts.length;
        }
    }

    // Filtrado y búsqueda
    filterProducts(filters = {}) {
        let filteredProducts = this.getPublishedProducts();

        // Filtro por categoría
        if (filters.category) {
            filteredProducts = filteredProducts.filter(product => 
                product.category === filters.category
            );
        }

        // Filtro por precio
        if (filters.minPrice !== undefined) {
            filteredProducts = filteredProducts.filter(product => 
                product.price >= filters.minPrice
            );
        }

        if (filters.maxPrice !== undefined) {
            filteredProducts = filteredProducts.filter(product => 
                product.price <= filters.maxPrice
            );
        }

        // Filtro por destacados
        if (filters.featured) {
            filteredProducts = filteredProducts.filter(product => product.featured);
        }

        // Filtro por stock
        if (filters.inStock) {
            filteredProducts = filteredProducts.filter(product => 
                product.stock === undefined || product.stock > 0
            );
        }

        // Búsqueda por texto
        if (filters.search) {
            const searchTerm = filters.search.toLowerCase();
            filteredProducts = filteredProducts.filter(product =>
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.sku?.toLowerCase().includes(searchTerm)
            );
        }

        return filteredProducts;
    }

    sortProducts(products, sortBy = 'name-asc') {
        const sortedProducts = [...products];

        switch (sortBy) {
            case 'name-asc':
                return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
            
            case 'name-desc':
                return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
            
            case 'price-asc':
                return sortedProducts.sort((a, b) => a.price - b.price);
            
            case 'price-desc':
                return sortedProducts.sort((a, b) => b.price - a.price);
            
            case 'featured':
                return sortedProducts.sort((a, b) => {
                    if (a.featured && !b.featured) return -1;
                    if (!a.featured && b.featured) return 1;
                    return 0;
                });
            
            case 'newest':
                return sortedProducts.sort((a, b) => {
                    const dateA = new Date(a.createdAt || '2024-01-01');
                    const dateB = new Date(b.createdAt || '2024-01-01');
                    return dateB - dateA;
                });
            
            default:
                return sortedProducts;
        }
    }

    // Utilidades
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    showLoadingState() {
        // Mostrar estados de carga en los contenedores
        document.querySelectorAll('[data-loading]').forEach(container => {
            container.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Cargando...</p>
                </div>
            `;
        });
    }

    hideLoadingState() {
        document.querySelectorAll('.loading-state').forEach(loading => {
            loading.remove();
        });
    }

    showErrorState(message) {
        document.querySelectorAll('[data-loading]').forEach(container => {
            container.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h3>Error</h3>
                    <p>${message}</p>
                    <button class="button button--primary" onclick="window.location.reload()">
                        Reintentar
                    </button>
                </div>
            `;
        });
    }

    renderEmptyState(container, message = 'No se encontraron elementos') {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-search"></i>
                <h3>${message}</h3>
                <p>Intenta ajustar los filtros o busca otros términos</p>
            </div>
        `;
    }

    showNotification(message, type = 'info') {
        // Crear notificación toast
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.innerHTML = `
            <div class="notification__content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification__close">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Agregar estilos si no existen
        if (!document.querySelector('#notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = this.getNotificationStyles();
            document.head.appendChild(styles);
        }

        document.body.appendChild(notification);

        // Animación de entrada
        setTimeout(() => notification.classList.add('notification--show'), 100);

        // Cerrar notificación
        const closeBtn = notification.querySelector('.notification__close');
        closeBtn.addEventListener('click', () => {
            notification.classList.remove('notification--show');
            setTimeout(() => notification.remove(), 300);
        });

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.classList.remove('notification--show');
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    getNotificationStyles() {
        return `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: white;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                border-left: 4px solid #4a6572;
                z-index: 10000;
                transform: translateX(400px);
                opacity: 0;
                transition: all 0.3s ease;
                max-width: 400px;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .notification--show {
                transform: translateX(0);
                opacity: 1;
            }
            
            .notification--success { border-left-color: #10b981; }
            .notification--error { border-left-color: #ef4444; }
            .notification--warning { border-left-color: #f59e0b; }
            .notification--info { border-left-color: #3b82f6; }
            
            .notification__content {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                flex: 1;
            }
            
            .notification__content i {
                font-size: 1.25rem;
            }
            
            .notification--success i { color: #10b981; }
            .notification--error i { color: #ef4444; }
            .notification--warning i { color: #f59e0b; }
            .notification--info i { color: #3b82f6; }
            
            .notification__close {
                background: none;
                border: none;
                color: #6b7280;
                cursor: pointer;
                padding: 0.25rem;
                border-radius: 4px;
                transition: background 0.2s ease;
            }
            
            .notification__close:hover {
                background: #f3f4f6;
            }
        `;
    }

    // Métodos estáticos para uso global
    static async getInstance() {
        if (!window.productsLoader) {
            window.productsLoader = new ProductsLoader();
            await window.productsLoader.loadData();
        }
        return window.productsLoader;
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    window.productsLoader = await ProductsLoader.getInstance();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductsLoader;
}