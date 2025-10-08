// admin.js - Script principal del panel de administración

class AdminApp {
    constructor() {
        this.currentSection = 'productos';
        this.products = [];
        this.categories = [];
        this.config = {};
        
        this.init();
    }

    async init() {
        await this.loadData();
        this.setupEventListeners();
        this.renderProducts();
        this.renderCategories();
        this.updateStats();
        this.showSection(this.currentSection);
    }

    async loadData() {
        try {
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

        } catch (error) {
            console.error('Error cargando datos:', error);
            this.showNotification('Error cargando datos', 'error');
        }
    }

    setupEventListeners() {
        // Navegación entre secciones
        document.querySelectorAll('.sidebar-menu a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                this.showSection(section);
                
                // Actualizar estado activo
                document.querySelectorAll('.sidebar-menu li').forEach(li => {
                    li.classList.remove('active');
                });
                link.parentElement.classList.add('active');
            });
        });

        // Botones de acción
        document.getElementById('save-all').addEventListener('click', () => this.saveAll());
        document.getElementById('export-data').addEventListener('click', () => this.exportData());
        
        // Botones de agregar
        document.getElementById('add-product').addEventListener('click', () => this.openProductModal());
        document.getElementById('add-first-product').addEventListener('click', () => this.openProductModal());
        document.getElementById('add-category').addEventListener('click', () => this.openCategoryModal());

        // Filtros y búsqueda
        document.getElementById('search-products').addEventListener('input', (e) => {
            this.filterProducts(e.target.value);
        });

        document.getElementById('filter-category').addEventListener('change', (e) => {
            this.filterProductsByCategory(e.target.value);
        });

        document.getElementById('filter-status').addEventListener('change', (e) => {
            this.filterProductsByStatus(e.target.value);
        });

        // Configuración
        this.setupConfigListeners();
    }

    showSection(sectionId) {
        // Ocultar todas las secciones
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // Mostrar sección seleccionada
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.currentSection = sectionId;
        }
    }

    renderProducts() {
        const grid = document.getElementById('products-grid');
        const emptyState = document.getElementById('empty-products');

        if (this.products.length === 0) {
            grid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        const productsHTML = this.products.map(product => this.createProductCard(product)).join('');
        grid.innerHTML = productsHTML;

        // Actualizar opciones de categorías en filtros
        this.updateCategoryFilters();
    }

    createProductCard(product) {
        const mainImage = product.images && product.images.length > 0 ? product.images[0] : '../assets/images/placeholder.jpg';
        const statusClass = product.published ? 'status-published' : 'status-draft';
        const statusText = product.published ? 'Publicado' : 'Borrador';
        const featuredBadge = product.featured ? '<span class="product-card-badge">Destacado</span>' : '';

        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-card-image">
                    <img src="${mainImage}" alt="${product.name}" onerror="this.src='../assets/images/placeholder.jpg'">
                    ${featuredBadge}
                </div>
                <div class="product-card-content">
                    <h3 class="product-card-title">${product.name}</h3>
                    <div class="product-card-category">${this.getCategoryName(product.category)}</div>
                    <div class="product-card-price">
                        <span class="price-current">$${product.price.toFixed(2)}</span>
                        ${product.comparePrice ? `<span class="price-compare">$${product.comparePrice.toFixed(2)}</span>` : ''}
                    </div>
                    <div class="product-card-meta">
                        <span class="product-status ${statusClass}">${statusText}</span>
                        <div class="product-card-actions">
                            <button class="btn btn-icon btn-warning edit-product" data-id="${product.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-icon btn-danger delete-product" data-id="${product.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCategories() {
        const grid = document.getElementById('categories-grid');
        
        const categoriesHTML = this.categories.map(category => this.createCategoryCard(category)).join('');
        grid.innerHTML = categoriesHTML;
    }

    createCategoryCard(category) {
        const image = category.image || '../assets/images/categories/placeholder.jpg';
        
        return `
            <div class="category-card" data-category-id="${category.id}">
                <div class="category-icon">
                    <i class="fas fa-tag"></i>
                </div>
                <h3>${category.name}</h3>
                <p class="category-description">${category.description}</p>
                <div class="category-count">${category.productCount} productos</div>
                <div class="category-actions mt-2">
                    <button class="btn btn-sm btn-outline edit-category" data-id="${category.id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    ${category.productCount === 0 ? `
                        <button class="btn btn-sm btn-danger delete-category" data-id="${category.id}">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getCategoryName(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        return category ? category.name : 'Sin categoría';
    }

    updateCategoryFilters() {
        const filterSelect = document.getElementById('filter-category');
        const productSelect = document.getElementById('product-category');
        
        const options = this.categories.map(category => 
            `<option value="${category.id}">${category.name}</option>`
        ).join('');
        
        const baseOptions = '<option value="">Todas las categorías</option>';
        filterSelect.innerHTML = baseOptions + options;
        productSelect.innerHTML = '<option value="">Selecciona una categoría</option>' + options;
    }

    filterProducts(searchTerm) {
        const filteredProducts = this.products.filter(product => 
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        this.renderFilteredProducts(filteredProducts);
    }

    filterProductsByCategory(categoryId) {
        if (!categoryId) {
            this.renderProducts();
            return;
        }
        
        const filteredProducts = this.products.filter(product => product.category === categoryId);
        this.renderFilteredProducts(filteredProducts);
    }

    filterProductsByStatus(status) {
        if (!status) {
            this.renderProducts();
            return;
        }
        
        const filteredProducts = this.products.filter(product => 
            status === 'published' ? product.published : !product.published
        );
        this.renderFilteredProducts(filteredProducts);
    }

    renderFilteredProducts(filteredProducts) {
        const grid = document.getElementById('products-grid');
        const emptyState = document.getElementById('empty-products');

        if (filteredProducts.length === 0) {
            grid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        const productsHTML = filteredProducts.map(product => this.createProductCard(product)).join('');
        grid.innerHTML = productsHTML;
    }

    updateStats() {
        document.getElementById('total-products').textContent = this.products.length;
        document.getElementById('total-categories').textContent = this.categories.length;
    }

    async saveAll() {
        try {
            await this.saveProducts();
            await this.saveCategories();
            await this.saveConfig();
            
            this.showNotification('Todos los datos guardados correctamente', 'success');
        } catch (error) {
            console.error('Error guardando datos:', error);
            this.showNotification('Error guardando datos', 'error');
        }
    }

    async saveProducts() {
        const productsData = { products: this.products };
        // En un entorno real, aquí harías una petición para guardar los datos
        console.log('Guardando productos:', productsData);
        
        // Simular guardado
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    async saveCategories() {
        const categoriesData = { categories: this.categories };
        console.log('Guardando categorías:', categoriesData);
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    async saveConfig() {
        console.log('Guardando configuración:', this.config);
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    exportData() {
        const data = {
            products: this.products,
            categories: this.categories,
            config: this.config,
            exportedAt: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `nido-bendito-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Datos exportados correctamente', 'success');
    }

    setupConfigListeners() {
        document.getElementById('site-title').addEventListener('change', (e) => {
            this.config.siteTitle = e.target.value;
        });

        document.getElementById('site-description').addEventListener('change', (e) => {
            this.config.siteDescription = e.target.value;
        });

        document.getElementById('auto-publish').addEventListener('change', (e) => {
            this.config.autoPublish = e.target.checked;
        });

        document.getElementById('products-per-page').addEventListener('change', (e) => {
            this.config.productsPerPage = parseInt(e.target.value);
        });
    }

    showNotification(message, type = 'info') {
        // Crear notificación
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;

        // Estilos para la notificación
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
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

    getNotificationColor(type) {
        const colors = {
            success: '#4caf50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196f3'
        };
        return colors[type] || '#2196f3';
    }

    openProductModal() {
        // Esta función será implementada en products-manager.js
        if (window.productManager) {
            window.productManager.openModal();
        }
    }

    openCategoryModal() {
        // Esta función será implementada en categories-manager.js
        if (window.categoryManager) {
            window.categoryManager.openModal();
        }
    }
}

// Inicializar la aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.adminApp = new AdminApp();
});

// Agregar estilos de animación para notificaciones
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);