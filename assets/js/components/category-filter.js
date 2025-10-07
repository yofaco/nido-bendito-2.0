/**
 * Category Filter Component - Nido Bendito
 * @version 2.0
 * @description Componente modular para filtrado por categorías
 */

class CategoryFilter extends HTMLElement {
    constructor() {
        super();
        this.categories = [];
        this.currentCategory = 'all';
        this.attachShadow({ mode: 'open' });
        this.onCategoryChange = null;
    }

    /**
     * Configurar los atributos observados
     */
    static get observedAttributes() {
        return ['categories-data', 'current-category', 'layout', 'show-counts'];
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
            if (name === 'categories-data' && newValue) {
                this.categories = JSON.parse(newValue);
            }
            if (name === 'current-category') {
                this.currentCategory = newValue;
            }
            this.render();
        }
    }

    /**
     * Renderizar el componente
     */
    render() {
        this.shadowRoot.innerHTML = `
            <style>${this.getStyles()}</style>
            ${this.getFilterTemplate()}
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
                --white: #FFFFFF;
                --shadow-sm: 0 2px 4px rgba(0,0,0,0.1);
                --border-radius: 8px;
            }

            .category-filter {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .filter-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 12px;
            }

            .filter-title {
                font-size: 1.1em;
                font-weight: 600;
                color: var(--dark-brown);
                margin: 0;
            }

            .clear-filter {
                background: none;
                border: none;
                color: var(--medium-brown);
                font-size: 0.9em;
                cursor: pointer;
                text-decoration: underline;
            }

            .clear-filter:hover {
                color: var(--dark-brown);
            }

            .filter-list {
                display: flex;
                flex-direction: column;
                gap: 4px;
                list-style: none;
                margin: 0;
                padding: 0;
            }

            .filter-item {
                margin: 0;
            }

            .filter-link {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 12px 16px;
                background: var(--white);
                border: 1px solid var(--light-gray);
                border-radius: var(--border-radius);
                color: var(--medium-brown);
                text-decoration: none;
                transition: all 0.3s ease;
                cursor: pointer;
            }

            .filter-link:hover {
                border-color: var(--primary-color);
                background: var(--light-beige);
            }

            .filter-link.active {
                background: var(--primary-color);
                border-color: var(--primary-color);
                color: var(--white);
            }

            .filter-name {
                font-weight: 500;
            }

            .filter-count {
                background: rgba(255, 255, 255, 0.2);
                color: inherit;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.8em;
                font-weight: 600;
                min-width: 24px;
                text-align: center;
            }

            .filter-link.active .filter-count {
                background: rgba(255, 255, 255, 0.3);
            }

            /* Layout variations */
            :host([layout="horizontal"]) .category-filter {
                flex-direction: row;
                flex-wrap: wrap;
                gap: 8px;
            }

            :host([layout="horizontal"]) .filter-list {
                flex-direction: row;
                flex-wrap: wrap;
            }

            :host([layout="horizontal"]) .filter-item {
                flex: 0 0 auto;
            }

            :host([layout="horizontal"]) .filter-link {
                white-space: nowrap;
            }

            :host([layout="pill"]) .filter-link {
                border-radius: 20px;
                padding: 8px 16px;
            }

            :host([layout="minimal"]) .filter-header {
                display: none;
            }

            :host([layout="minimal"]) .filter-link {
                border: none;
                background: transparent;
                padding: 8px 0;
                border-radius: 0;
                border-bottom: 1px solid var(--light-gray);
            }

            :host([layout="minimal"]) .filter-link:hover {
                background: transparent;
                border-bottom-color: var(--primary-color);
            }

            :host([layout="minimal"]) .filter-link.active {
                background: transparent;
                border-bottom-color: var(--primary-color);
                color: var(--primary-color);
            }

            /* Scrollable horizontal layout */
            :host([layout="scrollable"]) .filter-list {
                flex-direction: row;
                overflow-x: auto;
                padding-bottom: 8px;
                scrollbar-width: none;
            }

            :host([layout="scrollable"]) .filter-list::-webkit-scrollbar {
                display: none;
            }

            :host([layout="scrollable"]) .filter-item {
                flex: 0 0 auto;
            }

            /* Hide counts if needed */
            :host([show-counts="false"]) .filter-count {
                display: none;
            }

            /* Responsive */
            @media (max-width: 768px) {
                :host([layout="horizontal"]) .category-filter {
                    flex-direction: column;
                }

                :host([layout="horizontal"]) .filter-list {
                    flex-direction: column;
                }
            }

            /* Loading state */
            .loading-skeleton {
                display: flex;
                flex-direction: column;
                gap: 8px;
            }

            .skeleton-item {
                height: 44px;
                background: var(--light-gray);
                border-radius: var(--border-radius);
                animation: pulse 1.5s ease-in-out infinite;
            }

            @keyframes pulse {
                0% { opacity: 1; }
                50% { opacity: 0.5; }
                100% { opacity: 1; }
            }
        `;
    }

    /**
     * Obtener template del filtro
     */
    getFilterTemplate() {
        if (this.categories.length === 0) {
            return this.getLoadingTemplate();
        }

        const showCounts = this.getAttribute('show-counts') !== 'false';
        const allProductsCount = this.categories.reduce((total, cat) => total + (cat.product_count || 0), 0);

        return `
            <div class="category-filter">
                <div class="filter-header">
                    <h3 class="filter-title">Categorías</h3>
                    ${this.currentCategory !== 'all' ? `
                        <button class="clear-filter" onclick="this.getRootNode().host.clearFilter()">
                            Limpiar
                        </button>
                    ` : ''}
                </div>
                
                <ul class="filter-list">
                    <li class="filter-item">
                        <a href="#" 
                           class="filter-link ${this.currentCategory === 'all' ? 'active' : ''}"
                           data-category="all"
                           onclick="this.getRootNode().host.handleCategoryClick('all')">
                            <span class="filter-name">Todos los productos</span>
                            ${showCounts ? `<span class="filter-count">${allProductsCount}</span>` : ''}
                        </a>
                    </li>
                    
                    ${this.categories.map(category => `
                        <li class="filter-item">
                            <a href="#"
                               class="filter-link ${this.currentCategory === category.id ? 'active' : ''}"
                               data-category="${category.id}"
                               onclick="this.getRootNode().host.handleCategoryClick('${category.id}')">
                                <span class="filter-name">${category.name}</span>
                                ${showCounts && category.product_count ? `
                                    <span class="filter-count">${category.product_count}</span>
                                ` : ''}
                            </a>
                        </li>
                    `).join('')}
                </ul>
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
                <div class="skeleton-item"></div>
                <div class="skeleton-item" style="width: 80%;"></div>
                <div class="skeleton-item" style="width: 70%;"></div>
                <div class="skeleton-item" style="width: 85%;"></div>
            </div>
        `;
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Event delegation para los enlaces de categoría
        this.shadowRoot.addEventListener('click', (e) => {
            const link = e.target.closest('[data-category]');
            if (link) {
                e.preventDefault();
                this.handleCategoryClick(link.dataset.category);
            }
        });

        // Keyboard navigation
        this.shadowRoot.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                const link = e.target.closest('[data-category]');
                if (link) {
                    e.preventDefault();
                    this.handleCategoryClick(link.dataset.category);
                }
            }
        });
    }

    /**
     * Manejar clic en categoría
     */
    handleCategoryClick(categoryId) {
        this.currentCategory = categoryId;
        this.render();
        
        // Disparar evento personalizado
        this.dispatchEvent(new CustomEvent('category-change', {
            detail: { categoryId },
            bubbles: true
        }));
        
        // Llamar callback si está definido
        if (this.onCategoryChange && typeof this.onCategoryChange === 'function') {
            this.onCategoryChange(categoryId);
        }
    }

    /**
     * Limpiar filtro
     */
    clearFilter() {
        this.handleCategoryClick('all');
    }

    /**
     * Métodos públicos para manipulación externa
     */

    // Actualizar categorías
    updateCategories(newCategories) {
        this.categories = newCategories;
        this.render();
    }

    // Establecer categoría actual
    setCurrentCategory(categoryId) {
        this.currentCategory = categoryId;
        this.render();
    }

    // Obtener categoría actual
    getCurrentCategory() {
        return this.currentCategory;
    }

    // Obtener todas las categorías
    getCategories() {
        return this.categories;
    }

    // Filtrar categorías por conteo de productos
    filterByProductCount(minCount = 1) {
        return this.categories.filter(cat => (cat.product_count || 0) >= minCount);
    }

    // Ordenar categorías
    sortCategories(by = 'name', order = 'asc') {
        const sorted = [...this.categories];
        
        switch (by) {
            case 'name':
                sorted.sort((a, b) => 
                    order === 'asc' ? 
                    a.name.localeCompare(b.name) : 
                    b.name.localeCompare(a.name)
                );
                break;
                
            case 'product_count':
                sorted.sort((a, b) => 
                    order === 'asc' ? 
                    (a.product_count || 0) - (b.product_count || 0) : 
                    (b.product_count || 0) - (a.product_count || 0)
                );
                break;
                
            case 'display_order':
                sorted.sort((a, b) => 
                    order === 'asc' ? 
                    (a.display_order || 0) - (b.display_order || 0) : 
                    (b.display_order || 0) - (a.display_order || 0)
                );
                break;
        }
        
        return sorted;
    }

    // Buscar categorías
    searchCategories(query) {
        const searchTerm = query.toLowerCase();
        return this.categories.filter(cat =>
            cat.name.toLowerCase().includes(searchTerm) ||
            cat.description?.toLowerCase().includes(searchTerm)
        );
    }

    // Obtener estadísticas
    getStats() {
        const totalProducts = this.categories.reduce((sum, cat) => sum + (cat.product_count || 0), 0);
        const activeCategories = this.categories.filter(cat => (cat.product_count || 0) > 0).length;
        const mostPopular = this.categories.reduce((max, cat) => 
            (cat.product_count || 0) > (max.product_count || 0) ? cat : max, 
            { product_count: 0 }
        );

        return {
            totalProducts,
            totalCategories: this.categories.length,
            activeCategories,
            mostPopularCategory: mostPopular.product_count > 0 ? mostPopular : null
        };
    }
}

// Registrar el custom element
customElements.define('category-filter', CategoryFilter);

// Exportar la clase para uso modular
window.CategoryFilter = CategoryFilter;

console.log('🏷️ Category Filter Component registrado correctamente');

/**
 * Función de utilidad para integrar con ProductsLoader
 */
function integrateCategoryFilterWithProducts() {
    const categoryFilter = document.querySelector('category-filter');
    const productsLoader = window.productsLoader;

    if (categoryFilter && productsLoader) {
        // Configurar callback cuando cambie la categoría
        categoryFilter.onCategoryChange = (categoryId) => {
            productsLoader.handleCategoryFilter(categoryId);
        };

        // Sincronizar categorías cuando se carguen los datos
        productsLoader.init().then(() => {
            const categories = productsLoader.state.categories;
            categoryFilter.updateCategories(categories);
        });
    }
}

// Integración automática cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', integrateCategoryFilterWithProducts);