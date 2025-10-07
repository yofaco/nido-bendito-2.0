/**
 * Script Principal - Nido Bendito
 * @version 2.0
 * @description Funcionalidades vitales para la actualización del catálogo
 */

// ===== CONFIGURACIÓN GLOBAL =====
const APP_CONFIG = {
    dataUrls: {
        products: './data/products.json',
        categories: './data/categories.json',
        config: './data/config.json'
    },
    cache: {
        enabled: true,
        duration: 300000 // 5 minutos
    }
};

// ===== SISTEMA DE CACHÉ =====
class DataCache {
    constructor() {
        this.cache = new Map();
        this.timestamps = new Map();
    }

    set(key, data) {
        this.cache.set(key, data);
        this.timestamps.set(key, Date.now());
    }

    get(key) {
        const data = this.cache.get(key);
        const timestamp = this.timestamps.get(key);
        
        if (!data || !timestamp) return null;
        
        // Verificar si la caché ha expirado
        if (Date.now() - timestamp > APP_CONFIG.cache.duration) {
            this.cache.delete(key);
            this.timestamps.delete(key);
            return null;
        }
        
        return data;
    }

    clear() {
        this.cache.clear();
        this.timestamps.clear();
    }

    // Invalidar caché específica cuando hay cambios
    invalidate(keys) {
        keys.forEach(key => {
            this.cache.delete(key);
            this.timestamps.delete(key);
        });
    }
}

// ===== GESTIÓN DE CATÁLOGO =====
class CatalogManager {
    constructor() {
        this.cache = new DataCache();
        this.currentData = {
            products: [],
            categories: [],
            config: {}
        };
        this.eventListeners = new Map();
    }

    /**
     * Inicializar el gestor de catálogo
     */
    async init() {
        try {
            await this.loadAllData();
            this.setupAutoRefresh();
            this.setupEventListeners();
            
            console.log('✅ Catalog Manager inicializado');
            this.dispatchEvent('catalogReady', this.currentData);
            
        } catch (error) {
            console.error('❌ Error inicializando Catalog Manager:', error);
            this.dispatchEvent('catalogError', error);
        }
    }

    /**
     * Cargar todos los datos del catálogo
     */
    async loadAllData() {
        try {
            const [products, categories, config] = await Promise.all([
                this.loadProducts(),
                this.loadCategories(),
                this.loadConfig()
            ]);

            this.currentData = { products, categories, config };
            this.dispatchEvent('dataUpdated', this.currentData);
            
        } catch (error) {
            throw new Error(`Error cargando datos: ${error.message}`);
        }
    }

    /**
     * Cargar productos con caché
     */
    async loadProducts() {
        const cacheKey = 'products';
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            console.log('📦 Productos cargados desde caché');
            return cached;
        }

        try {
            const response = await fetch(APP_CONFIG.dataUrls.products);
            if (!response.ok) throw new Error('Error cargando productos');
            
            const data = await response.json();
            const products = data.products || [];
            
            if (APP_CONFIG.cache.enabled) {
                this.cache.set(cacheKey, products);
            }
            
            console.log(`📦 ${products.length} productos cargados`);
            return products;
            
        } catch (error) {
            console.error('Error cargando productos:', error);
            this.dispatchEvent('loadError', { type: 'products', error });
            return [];
        }
    }

    /**
     * Cargar categorías con caché
     */
    async loadCategories() {
        const cacheKey = 'categories';
        const cached = this.cache.get(cacheKey);
        
        if (cached) {
            console.log('📂 Categorías cargadas desde caché');
            return cached;
        }

        try {
            const response = await fetch(APP_CONFIG.dataUrls.categories);
            if (!response.ok) throw new Error('Error cargando categorías');
            
            const data = await response.json();
            const categories = data.categories || [];
            
            if (APP_CONFIG.cache.enabled) {
                this.cache.set(cacheKey, categories);
            }
            
            console.log(`📂 ${categories.length} categorías cargadas`);
            return categories;
            
        } catch (error) {
            console.error('Error cargando categorías:', error);
            this.dispatchEvent('loadError', { type: 'categories', error });
            return [];
        }
    }

    /**
     * Cargar configuración
     */
    async loadConfig() {
        try {
            const response = await fetch(APP_CONFIG.dataUrls.config);
            if (!response.ok) return this.getDefaultConfig();
            
            const config = await response.json();
            console.log('⚙️ Configuración cargada');
            return config;
            
        } catch (error) {
            console.warn('Usando configuración por defecto');
            return this.getDefaultConfig();
        }
    }

    /**
     * Configuración por defecto
     */
    getDefaultConfig() {
        return {
            site_name: "Nido Bendito",
            currency: "Q",
            free_shipping_threshold: 500,
            contact: {
                email: "hola@nidobendito.com",
                phone: "+502 1234-5678"
            }
        };
    }

    /**
     * Configurar auto-refresh de datos
     */
    setupAutoRefresh() {
        // Refresh cada 10 minutos
        setInterval(() => {
            this.refreshData();
        }, 600000);

        // Refresh cuando la página gana visibilidad
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.refreshData();
            }
        });
    }

    /**
     * Refrescar datos del catálogo
     */
    async refreshData() {
        console.log('🔄 Refrescando datos del catálogo...');
        
        // Invalidar caché
        this.cache.invalidate(['products', 'categories']);
        
        try {
            await this.loadAllData();
            this.dispatchEvent('catalogRefreshed', this.currentData);
        } catch (error) {
            console.error('Error refrescando datos:', error);
        }
    }

    /**
     * Obtener producto por slug
     */
    getProductBySlug(slug) {
        return this.currentData.products.find(product => 
            product.slug === slug || product.id === slug
        );
    }

    /**
     * Obtener productos por categoría
     */
    getProductsByCategory(categoryId, limit = null) {
        let products = this.currentData.products.filter(product => 
            product.category === categoryId && product.status !== 'inactive'
        );

        if (limit) {
            products = products.slice(0, limit);
        }

        return products;
    }

    /**
     * Obtener productos destacados
     */
    getFeaturedProducts(limit = 8) {
        return this.currentData.products
            .filter(product => product.featured && product.status !== 'inactive')
            .slice(0, limit);
    }

    /**
     * Obtener nuevos productos
     */
    getNewProducts(limit = 6) {
        return this.currentData.products
            .filter(product => product.new && product.status !== 'inactive')
            .slice(0, limit);
    }

    /**
     * Obtener mejores vendidos
     */
    getBestSellers(limit = 6) {
        return this.currentData.products
            .filter(product => product.best_seller && product.status !== 'inactive')
            .slice(0, limit);
    }

    /**
     * Buscar productos
     */
    searchProducts(query, options = {}) {
        const { category = null, limit = null } = options;
        const searchTerm = query.toLowerCase().trim();

        let results = this.currentData.products.filter(product => {
            if (product.status === 'inactive') return false;
            if (category && product.category !== category) return false;

            return (
                product.name.toLowerCase().includes(searchTerm) ||
                product.description.toLowerCase().includes(searchTerm) ||
                product.short_description.toLowerCase().includes(searchTerm) ||
                (product.features && product.features.some(feature => 
                    feature.toLowerCase().includes(searchTerm)
                ))
            );
        });

        if (limit) {
            results = results.slice(0, limit);
        }

        return results;
    }

    /**
     * Obtener categoría por ID
     */
    getCategoryById(categoryId) {
        return this.currentData.categories.find(cat => cat.id === categoryId);
    }

    /**
     * Obtener todas las categorías activas
     */
    getActiveCategories() {
        return this.currentData.categories.filter(cat => 
            cat.status !== 'inactive'
        );
    }

    /**
     * Verificar si hay cambios en el catálogo
     */
    async checkForUpdates() {
        try {
            // Simular verificación de cambios
            // En producción, esto podría verificar un endpoint de actualizaciones
            const response = await fetch(APP_CONFIG.dataUrls.products + '?v=' + Date.now());
            if (!response.ok) return false;

            const data = await response.json();
            const currentCount = this.currentData.products.length;
            const newCount = data.products?.length || 0;

            return currentCount !== newCount;
            
        } catch (error) {
            console.error('Error verificando actualizaciones:', error);
            return false;
        }
    }

    // ===== SISTEMA DE EVENTOS =====

    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.eventListeners.has(event)) {
            const listeners = this.eventListeners.get(event);
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    dispatchEvent(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en listener de ${event}:`, error);
                }
            });
        }
    }

    setupEventListeners() {
        // Escuchar eventos de actualización del admin
        if (window.adminUpdateEvents) {
            window.adminUpdateEvents.on('productsUpdated', () => {
                this.cache.invalidate(['products']);
                this.refreshData();
            });

            window.adminUpdateEvents.on('categoriesUpdated', () => {
                this.cache.invalidate(['categories']);
                this.refreshData();
            });
        }
    }
}

// ===== SISTEMA DE CARRITO =====
class CartManager {
    constructor() {
        this.storageKey = 'nidoBenditoCart';
        this.items = this.loadCart();
        this.eventListeners = new Map();
    }

    /**
     * Cargar carrito desde localStorage
     */
    loadCart() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            return saved ? JSON.parse(saved) : [];
        } catch (error) {
            console.error('Error cargando carrito:', error);
            return [];
        }
    }

    /**
     * Guardar carrito en localStorage
     */
    saveCart() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.items));
            this.dispatchEvent('cartUpdated', this.getCartSummary());
        } catch (error) {
            console.error('Error guardando carrito:', error);
        }
    }

    /**
     * Agregar producto al carrito
     */
    addItem(product, quantity = 1) {
        const existingItem = this.items.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.images?.[0]?.url,
                slug: product.slug,
                quantity: quantity,
                maxStock: product.inventory?.stock || 0
            });
        }

        this.saveCart();
        this.dispatchEvent('itemAdded', { product, quantity });
        
        return true;
    }

    /**
     * Actualizar cantidad de producto
     */
    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        
        if (!item) return false;

        if (quantity <= 0) {
            return this.removeItem(productId);
        }

        // Verificar stock máximo
        if (item.maxStock > 0 && quantity > item.maxStock) {
            quantity = item.maxStock;
        }

        item.quantity = quantity;
        this.saveCart();
        
        return true;
    }

    /**
     * Remover producto del carrito
     */
    removeItem(productId) {
        const index = this.items.findIndex(item => item.id === productId);
        
        if (index > -1) {
            const removedItem = this.items.splice(index, 1)[0];
            this.saveCart();
            this.dispatchEvent('itemRemoved', removedItem);
            return true;
        }
        
        return false;
    }

    /**
     * Vaciar carrito
     */
    clearCart() {
        this.items = [];
        this.saveCart();
        this.dispatchEvent('cartCleared');
    }

    /**
     * Obtener resumen del carrito
     */
    getCartSummary() {
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        const subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        return {
            items: [...this.items],
            totalItems,
            subtotal,
            total: subtotal // Podría incluir envío, impuestos, etc.
        };
    }

    /**
     * Generar mensaje de WhatsApp para pedido
     */
    generateWhatsAppMessage() {
        const summary = this.getCartSummary();
        const itemsText = this.items.map(item => 
            `• ${item.name} - Q${item.price} x ${item.quantity}`
        ).join('\n');

        return `¡Hola! Me interesa hacer este pedido:\n\n${itemsText}\n\nTotal: Q${summary.subtotal}\n\n¿Podrían ayudarme con mi pedido?`;
    }

    // Sistema de eventos
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }

    dispatchEvent(event, data) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error en listener de ${event}:`, error);
                }
            });
        }
    }
}

// ===== SISTEMA DE NOTIFICACIONES =====
class NotificationSystem {
    constructor() {
        this.container = null;
        this.init();
    }

    init() {
        this.createContainer();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'notifications-container';
        this.container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
        `;
        document.body.appendChild(this.container);
    }

    show(message, type = 'info', duration = 5000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">${message}</div>
            <button class="notification-close">&times;</button>
        `;

        // Estilos básicos si no existen en CSS
        if (!document.querySelector('.notification-styles')) {
            this.injectStyles();
        }

        this.container.appendChild(notification);

        // Auto-remover después de duración
        const timeout = setTimeout(() => {
            this.remove(notification);
        }, duration);

        // Remover al hacer clic en cerrar
        notification.querySelector('.notification-close').addEventListener('click', () => {
            clearTimeout(timeout);
            this.remove(notification);
        });

        return notification;
    }

    remove(notification) {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }
    }

    injectStyles() {
        const styles = `
            .notification {
                background: white;
                border-left: 4px solid #2F80ED;
                padding: 16px;
                margin-bottom: 10px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                justify-content: between;
                animation: slideInRight 0.3s ease;
            }
            .notification-success { border-left-color: #27AE60; }
            .notification-error { border-left-color: #EB5757; }
            .notification-warning { border-left-color: #F2994A; }
            .notification-content { flex: 1; }
            .notification-close {
                background: none;
                border: none;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.className = 'notification-styles';
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
}

// ===== INICIALIZACIÓN GLOBAL =====

// Crear instancias globales
const catalogManager = new CatalogManager();
const cartManager = new CartManager();
const notificationSystem = new NotificationSystem();

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Inicializar gestor de catálogo
        await catalogManager.init();
        
        // Actualizar contador de carrito
        updateCartCounter();
        
        // Configurar event listeners globales
        setupGlobalEventListeners();
        
        console.log('🚀 Sistema Nido Bendito inicializado correctamente');
        
    } catch (error) {
        console.error('❌ Error inicializando sistema:', error);
    }
});

// ===== FUNCIONES GLOBALES =====

/**
 * Actualizar contador del carrito en la UI
 */
function updateCartCounter() {
    const cartCounters = document.querySelectorAll('.cart-count');
    const summary = cartManager.getCartSummary();
    
    cartCounters.forEach(counter => {
        counter.textContent = summary.totalItems;
        counter.style.display = summary.totalItems > 0 ? 'flex' : 'none';
    });
}

/**
 * Configurar event listeners globales
 */
function setupGlobalEventListeners() {
    // Actualizar carrito cuando cambia
    cartManager.on('cartUpdated', updateCartCounter);
    
    // Escuchar clicks en botones de WhatsApp
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-order-whatsapp')) {
            handleWhatsAppOrder(e);
        }
        
        if (e.target.closest('.btn-add-to-cart')) {
            handleAddToCart(e);
        }
    });
    
    // Manejar búsqueda en tiempo real
    const searchInput = document.getElementById('searchProducts');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleSearch, 300));
    }
}

/**
 * Manejar pedido por WhatsApp
 */
function handleWhatsAppOrder(event) {
    const button = event.target.closest('.btn-order-whatsapp');
    const productName = button.dataset.product;
    const productPrice = button.dataset.price;
    
    let message;
    
    if (cartManager.getCartSummary().totalItems > 0) {
        // Pedido desde carrito
        message = cartManager.generateWhatsAppMessage();
    } else {
        // Pedido de producto individual
        message = `¡Hola! Estoy interesado en el producto: *${productName}* - ${productPrice}. ¿Podrían darme más información?`;
    }
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/50212345678?text=${encodedMessage}`;
    
    window.open(whatsappURL, '_blank');
}

/**
 * Manejar agregar al carrito
 */
function handleAddToCart(event) {
    event.preventDefault();
    
    const button = event.target.closest('.btn-add-to-cart');
    const productId = button.dataset.productId;
    
    // Encontrar producto en el catálogo
    const product = catalogManager.currentData.products.find(p => p.id === productId);
    
    if (product) {
        const added = cartManager.addItem(product, 1);
        
        if (added) {
            notificationSystem.show(
                `"${product.name}" agregado al carrito`,
                'success'
            );
        }
    }
}

/**
 * Manejar búsqueda en tiempo real
 */
function handleSearch(event) {
    const query = event.target.value.trim();
    
    if (query.length < 2) return;
    
    const results = catalogManager.searchProducts(query, { limit: 10 });
    
    // Disparar evento personalizado para que otros componentes reaccionen
    const searchEvent = new CustomEvent('searchResults', {
        detail: { query, results }
    });
    document.dispatchEvent(searchEvent);
}

/**
 * Función debounce para búsqueda
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ===== EXPORTACIÓN PARA USO GLOBAL =====
window.catalogManager = catalogManager;
window.cartManager = cartManager;
window.notificationSystem = notificationSystem;
window.updateCartCounter = updateCartCounter;

// Funciones de utilidad globales
window.formatPrice = (price) => `Q${parseFloat(price).toFixed(2)}`;
window.generateSlug = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

console.log('🛍️ Script principal de Nido Bendito cargado');