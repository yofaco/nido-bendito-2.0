// shop.js - Funcionalidades específicas para la página de tienda
class ShopPage {
    constructor(productsLoader) {
        this.productsLoader = productsLoader;
        this.currentFilters = {
            category: '',
            minPrice: null,
            maxPrice: null,
            featured: false,
            inStock: true,
            search: ''
        };
        this.currentSort = 'name-asc';
        this.currentView = 'grid';
        this.currentPage = 1;
        this.productsPerPage = 12;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeFromURL();
        this.renderShopContent();
    }

    setupEventListeners() {
        // Filtros de categoría
        document.addEventListener('click', (e) => {
            const categoryFilter = e.target.closest('[data-category-filter]');
            if (categoryFilter) {
                const categoryId = categoryFilter.dataset.categoryFilter;
                this.setCategoryFilter(categoryId);
            }
        });

        // Filtro de precio
        const applyPriceFilter = document.getElementById('apply-price-filter');
        if (applyPriceFilter) {
            applyPriceFilter.addEventListener('click', () => this.applyPriceFilter());
        }

        // Filtro de destacados
        const featuredFilter = document.getElementById('featured-filter');
        if (featuredFilter) {
            featuredFilter.addEventListener('change', (e) => {
                this.currentFilters.featured = e.target.checked;
                this.applyFilters();
            });
        }

        // Filtro de stock
        const inStockFilter = document.getElementById('in-stock-filter');
        if (inStockFilter) {
            inStockFilter.addEventListener('change', (e) => {
                this.currentFilters.inStock = e.target.checked;
                this.applyFilters();
            });
        }

        // Ordenamiento
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.applyFilters();
            });
        }

        // Vista (grid/list)
        const viewOptions = document.querySelectorAll('.view-option');
        viewOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.setView(view);
            });
        });

        // Búsqueda
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value;
                this.applyFilters();
            });
        }

        // Limpiar filtros
        const clearFilters = document.getElementById('clear-filters');
        if (clearFilters) {
            clearFilters.addEventListener('click', () => this.clearFilters());
        }

        // Reset search
        const resetSearch = document.getElementById('reset-search');
        if (resetSearch) {
            resetSearch.addEventListener('click', () => this.clearFilters());
        }

        // Cargar más productos
        const loadMore = document.getElementById('load-more');
        if (loadMore) {
            loadMore.addEventListener('click', () => this.loadMoreProducts());
        }

        // Toggle filters en móvil
        const filtersToggle = document.getElementById('filters-toggle');
        if (filtersToggle) {
            filtersToggle.addEventListener('click', () => this.toggleMobileFilters());
        }
    }

    initializeFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Categoría desde URL
        const category = urlParams.get('category');
        if (category) {
            this.currentFilters.category = category;
        }

        // Búsqueda desde URL
        const search = urlParams.get('search');
        if (search) {
            this.currentFilters.search = search;
            const searchInput = document.querySelector('input[type="search"]');
            if (searchInput) {
                searchInput.value = search;
            }
        }
    }

    renderShopContent() {
        document.addEventListener('productsDataLoaded', () => {
            this.renderCategoryFilters();
            this.applyFilters();
            this.updateShopStats();
        });
    }

    renderCategoryFilters() {
        const categoriesFilter = document.getElementById('categories-filter');
        if (!categoriesFilter) return;

        const categories = this.productsLoader.getAllCategories();
        const categoriesHTML = categories.map(category => `
            <label class="filter-checkbox">
                <input type="radio" name="category" value="${category.id}" 
                       ${this.currentFilters.category === category.id ? 'checked' : ''}
                       onchange="shopPage.setCategoryFilter('${category.id}')">
                <span class="checkmark"></span>
                ${category.name} 
                <span class="filter-count">(${this.productsLoader.getProductsByCategory(category.id).length})</span>
            </label>
        `).join('');

        // Agregar opción "Todas las categorías"
        const allCategoriesHTML = `
            <label class="filter-checkbox">
                <input type="radio" name="category" value="" 
                       ${!this.currentFilters.category ? 'checked' : ''}
                       onchange="shopPage.setCategoryFilter('')">
                <span class="checkmark"></span>
                Todas las categorías
                <span class="filter-count">(${this.productsLoader.getPublishedProducts().length})</span>
            </label>
            ${categoriesHTML}
        `;

        categoriesFilter.innerHTML = allCategoriesHTML;
    }

    setCategoryFilter(categoryId) {
        this.currentFilters.category = categoryId;
        this.applyFilters();
        this.updateURL();
    }

    applyPriceFilter() {
        const minPrice = document.getElementById('min-price');
        const maxPrice = document.getElementById('max-price');
        
        this.currentFilters.minPrice = minPrice.value ? parseFloat(minPrice.value) : null;
        this.currentFilters.maxPrice = maxPrice.value ? parseFloat(maxPrice.value) : null;
        
        this.applyFilters();
    }

    setView(view) {
        this.currentView = view;
        
        // Actualizar botones de vista
        document.querySelectorAll('.view-option').forEach(option => {
            option.classList.toggle('active', option.dataset.view === view);
        });
        
        // Actualizar grid de productos
        const productsGrid = document.getElementById('products-grid');
        if (productsGrid) {
            productsGrid.dataset.view = view;
            productsGrid.className = `products-grid grid ${view === 'list' ? 'products-grid--list' : 'products-grid--grid'}`;
        }
        
        this.applyFilters();
    }

    applyFilters() {
        this.currentPage = 1;
        
        const filteredProducts = this.productsLoader.filterProducts(this.currentFilters);
        const sortedProducts = this.productsLoader.sortProducts(filteredProducts, this.currentSort);
        
        this.renderProducts(sortedProducts);
        this.updateResultsCount(sortedProducts.length);
        this.updateLoadMoreButton(sortedProducts.length);
        
        // Ocultar/mostrar estado vacío
        this.toggleEmptyState(sortedProducts.length === 0);
    }

    renderProducts(products) {
        const productsGrid = document.getElementById('products-grid');
        if (!productsGrid) return;

        const startIndex = (this.currentPage - 1) * this.productsPerPage;
        const endIndex = startIndex + this.productsPerPage;
        const productsToShow = products.slice(0, endIndex);

        this.productsLoader.renderProductsGrid(productsToShow, 'products-grid', {
            view: this.currentView,
            showCategory: true,
            showDescription: this.currentView === 'list',
            showActions: true
        });

        // Ocultar loading state
        const loadingState = document.getElementById('loading-state');
        if (loadingState) {
            loadingState.style.display = 'none';
        }
    }

    loadMoreProducts() {
        this.currentPage++;
        this.applyFilters();
    }

    clearFilters() {
        this.currentFilters = {
            category: '',
            minPrice: null,
            maxPrice: null,
            featured: false,
            inStock: true,
            search: ''
        };
        
        // Resetear UI
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) searchInput.value = '';
        
        const minPrice = document.getElementById('min-price');
        const maxPrice = document.getElementById('max-price');
        if (minPrice) minPrice.value = '';
        if (maxPrice) maxPrice.value = '';
        
        const featuredFilter = document.getElementById('featured-filter');
        if (featuredFilter) featuredFilter.checked = false;
        
        const inStockFilter = document.getElementById('in-stock-filter');
        if (inStockFilter) inStockFilter.checked = true;
        
        const categoryRadios = document.querySelectorAll('input[name="category"]');
        categoryRadios.forEach(radio => {
            if (radio.value === '') radio.checked = true;
        });
        
        this.applyFilters();
        this.updateURL();
    }

    toggleEmptyState(isEmpty) {
        const emptyState = document.getElementById('empty-state');
        const productsGrid = document.getElementById('products-grid');
        const loadMoreContainer = document.getElementById('load-more-container');
        
        if (isEmpty) {
            if (emptyState) emptyState.style.display = 'block';
            if (productsGrid) productsGrid.style.display = 'none';
            if (loadMoreContainer) loadMoreContainer.style.display = 'none';
        } else {
            if (emptyState) emptyState.style.display = 'none';
            if (productsGrid) productsGrid.style.display = 'grid';
            if (loadMoreContainer) loadMoreContainer.style.display = 'block';
        }
    }

    updateResultsCount(totalProducts) {
        const resultsCount = document.getElementById('results-count');
        if (resultsCount) {
            const showingCount = Math.min(this.currentPage * this.productsPerPage, totalProducts);
            resultsCount.textContent = `${showingCount} de ${totalProducts}`;
        }
    }

    updateLoadMoreButton(totalProducts) {
        const loadMoreContainer = document.getElementById('load-more-container');
        const loadMoreButton = document.getElementById('load-more');
        
        if (!loadMoreContainer || !loadMoreButton) return;
        
        const showingCount = this.currentPage * this.productsPerPage;
        
        if (showingCount >= totalProducts) {
            loadMoreContainer.style.display = 'none';
        } else {
            loadMoreContainer.style.display = 'block';
            loadMoreButton.textContent = `Cargar Más (${totalProducts - showingCount} restantes)`;
        }
    }

    updateShopStats() {
        const totalProducts = this.productsLoader.getPublishedProducts().length;
        
        const totalProductsElement = document.getElementById('total-products-shop');
        if (totalProductsElement) {
            totalProductsElement.textContent = totalProducts;
        }
    }

    updateURL() {
        const urlParams = new URLSearchParams();
        
        if (this.currentFilters.category) {
            urlParams.set('category', this.currentFilters.category);
        }
        
        if (this.currentFilters.search) {
            urlParams.set('search', this.currentFilters.search);
        }
        
        const newURL = urlParams.toString() ? `?${urlParams.toString()}` : 'tienda.html';
        window.history.replaceState({}, '', newURL);
    }

    toggleMobileFilters() {
        const sidebar = document.querySelector('.shop__sidebar');
        if (sidebar) {
            sidebar.classList.toggle('shop__sidebar--open');
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', async () => {
    if (window.productsLoader) {
        window.shopPage = new ShopPage(window.productsLoader);
    } else {
        document.addEventListener('productsDataLoaded', () => {
            window.shopPage = new ShopPage(window.productsLoader);
        });
    }
});