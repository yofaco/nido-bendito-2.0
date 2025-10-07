/**
 * Sistema de Administración - Nido Bendito
 * @version 1.0
 * @description Gestión completa de productos y categorías
 * @FIXED: Se ha implementado Event Delegation en setupEventListeners
 */

// ===== CONFIGURACIÓN Y ESTADO GLOBAL =====
const APP_CONFIG = {
    dataPath: '../data/', // Corregido el path a 'data/' asumiendo que admin/ y data/ están al mismo nivel
    imagesPath: '../assets/images/products/',
    adminImagesPath: 'data/images/',
    maxImages: 5,
    supportedFormats: ['image/jpeg', 'image/png', 'image/webp']
};

let APP_STATE = {
    products: [],
    categories: [],
    currentProduct: null,
    currentCategory: null,
    draggedImage: null,
    hasUnsavedChanges: false
};

// ===== FUNCIONES DE UTILIDAD UI/UX =====

/** Muestra la notificación */
function showNotification(message, type = 'info', duration = 4000) {
    const box = document.getElementById('notificationBox');
    const msg = document.getElementById('notificationMessage');
    
    // Quita las clases anteriores
    box.classList.remove('success', 'error', 'warning', 'info');
    box.classList.remove('active');
    
    // Establece el mensaje y el tipo
    msg.textContent = message;
    box.classList.add(type);
    
    // Muestra la notificación
    setTimeout(() => {
        box.classList.add('active');
    }, 10); // Pequeño retraso para asegurar el re-render

    // Oculta después de la duración
    setTimeout(() => {
        box.classList.remove('active');
    }, duration);
}

/** Muestra el overlay de carga */
function showLoading(message = 'Cargando...') {
    document.getElementById('loadingMessage').textContent = message;
    document.getElementById('loadingOverlay').classList.add('active');
}

/** Oculta el overlay de carga */
function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('active');
}

/** Cambia la pestaña de navegación */
function switchTab(tabId) {
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    document.getElementById(tabId + 'Tab').classList.add('active');
    document.getElementById(tabId + 'Content').classList.add('active');
}

// ===== INICIALIZACIÓN =====
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        showLoading('Cargando datos...');
        
        // Cargar datos iniciales
        await loadInitialData();
        
        // Configurar event listeners
        setupEventListeners();
        
        // Actualizar UI
        updateUI();
        
        hideLoading();
        
        showNotification('Sistema cargado correctamente', 'success');
        
    } catch (error) {
        console.error('Error inicializando la aplicación:', error);
        showNotification('Error al cargar el sistema: ' + error.message, 'error');
    }
}

// ===== CARGA DE DATOS =====
async function loadInitialData() {
    // Carga de productos
    const productsResponse = await fetch(APP_CONFIG.dataPath + 'products.json');
    if (!productsResponse.ok) throw new Error('No se pudo cargar products.json');
    const productsData = await productsResponse.json();
    APP_STATE.products = productsData.products;

    // Carga de categorías
    const categoriesResponse = await fetch(APP_CONFIG.dataPath + 'categories.json');
    if (!categoriesResponse.ok) throw new Error('No se pudo cargar categories.json');
    const categoriesData = await categoriesResponse.json();
    APP_STATE.categories = categoriesData.categories;
}

// ===== RENDERIZADO DE UI (Ajustado para delegación) =====

function updateUI() {
    loadProductsGrid();
    loadCategoriesGrid();
    loadCategorySelectOptions();
    // Otros updates de UI si los hubiere
}

function loadCategorySelectOptions() {
    const select = document.getElementById('productCategory');
    select.innerHTML = '<option value="">Selecciona Categoría</option>';

    APP_STATE.categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name;
        select.appendChild(option);
    });
}

function renderProductCard(product) {
    // Función para generar el HTML de una tarjeta de producto
    const categoryName = APP_STATE.categories.find(c => c.id === product.category)?.name || 'N/A';
    const stockStatus = product.stock.stock > product.stock.low_stock_threshold ? 'in_stock' : (product.stock.stock > 0 ? 'low_stock' : 'out_of_stock');
    
    return `
        <div class="product-card" data-id="${product.id}">
            <div class="product-meta">
                <span class="product-sku">SKU: ${product.sku}</span>
                <span class="product-price">${product.currency}${product.price.toFixed(2)}</span>
            </div>
            <div class="product-info">
                <h4>${product.name}</h4>
                <p>Categoría: ${categoryName}</p>
                <p>Stock: <span class="stock-status ${stockStatus}">${product.stock.stock_status} (${product.stock.stock})</span></p>
            </div>
            <div class="product-actions">
                <button class="btn btn-sm btn-outline product-edit-btn" data-id="${product.id}" title="Editar Producto">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger product-delete-btn" data-id="${product.id}" title="Eliminar Producto">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;
}

function loadProductsGrid(products = APP_STATE.products) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = ''; // Limpiar el contenido anterior

    if (products.length === 0) {
        grid.innerHTML = '<p class="no-results-message">No hay productos que coincidan con la búsqueda.</p>';
        return;
    }

    products.forEach(product => {
        grid.innerHTML += renderProductCard(product);
    });
    
    // ** IMPORTANTE: NO SE AÑADEN LISTENERS INDIVIDUALES AQUÍ **
    // Se confía en la Delegación de Eventos definida en setupEventListeners.
}

function renderCategoryCard(category) {
    // Función para generar el HTML de una tarjeta de categoría
    return `
        <div class="category-card" data-id="${category.id}">
            <div class="category-info">
                <h4>${category.name}</h4>
                <div class="category-meta">
                    <span>Orden: ${category.display_order}</span>
                    <span>Productos: ${category.product_count}</span>
                </div>
            </div>
            <div class="category-actions">
                <button class="btn btn-sm btn-outline category-edit-btn" data-id="${category.id}" title="Editar Categoría">
                    <i class="fas fa-edit"></i> Editar
                </button>
                <button class="btn btn-sm btn-danger category-delete-btn" data-id="${category.id}" title="Eliminar Categoría">
                    <i class="fas fa-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;
}

function loadCategoriesGrid(categories = APP_STATE.categories) {
    const grid = document.getElementById('categoriesGrid');
    grid.innerHTML = '';

    if (categories.length === 0) {
        grid.innerHTML = '<p class="no-results-message">No hay categorías cargadas.</p>';
        return;
    }

    categories.forEach(category => {
        grid.innerHTML += renderCategoryCard(category);
    });
    // ** IMPORTANTE: NO SE AÑADEN LISTENERS INDIVIDUALES AQUÍ **
}

// ===== LÓGICA DE EVENTOS (LA CORRECCIÓN) =====

/**
 * Función que configura la Delegación de Eventos.
 * Un solo listener en el contenedor atrapa los clics en los botones.
 */
function setupGridDelegation() {
    // 1. Delegación para la Cuadrícula de Productos
    const productsGrid = document.getElementById('productsGrid');
    if (productsGrid) {
        productsGrid.addEventListener('click', function(event) {
            // event.target.closest busca el ancestro más cercano con la clase
            const target = event.target.closest('.product-edit-btn, .product-delete-btn');
            if (!target) return; // No se hizo clic en un botón relevante

            event.preventDefault(); // Previene la acción por defecto (si la hubiera)
            const productId = target.dataset.id; // Obtiene el ID del atributo data-id

            if (target.classList.contains('product-edit-btn')) {
                editProduct(productId); 
            } else if (target.classList.contains('product-delete-btn')) {
                deleteProduct(productId);
            }
        });
    }

    // 2. Delegación para la Cuadrícula de Categorías
    const categoriesGrid = document.getElementById('categoriesGrid');
    if (categoriesGrid) {
        categoriesGrid.addEventListener('click', function(event) {
            const target = event.target.closest('.category-edit-btn, .category-delete-btn');
            if (!target) return; 

            event.preventDefault();
            const categoryId = target.dataset.id;

            if (target.classList.contains('category-edit-btn')) {
                editCategory(categoryId);
            } else if (target.classList.contains('category-delete-btn')) {
                deleteCategory(categoryId);
            }
        });
    }
}

function setupEventListeners() {
    // Evento de cierre de modales
    document.querySelector('.product-modal .close-btn').addEventListener('click', closeProductModal);
    document.querySelector('.category-modal .close-btn').addEventListener('click', closeCategoryModal);
    
    // Evento de guardado
    document.getElementById('productForm').addEventListener('submit', saveProduct);
    document.getElementById('categoryForm').addEventListener('submit', saveCategory);

    // ** CORRECCIÓN DEL BUCLE: Implementar Delegación de Eventos **
    setupGridDelegation();
    
    // Asignación de eventos de navegación
    document.getElementById('productsTab').addEventListener('click', () => switchTab('products'));
    document.getElementById('categoriesTab').addEventListener('click', () => switchTab('categories'));
    
    // Evento de clic en el botón de añadir producto/categoría
    document.getElementById('addProductBtn').addEventListener('click', () => openProductModal('new'));
    document.getElementById('addCategoryBtn').addEventListener('click', () => openCategoryModal('new'));
    
    // Eventos de búsqueda (Implementación básica de debounce)
    document.getElementById('productSearch').addEventListener('input', debounce(handleProductSearch, 300));
    document.getElementById('categorySearch').addEventListener('input', debounce(handleCategorySearch, 300));

    // Eventos de drag and drop (Imágenes de producto) - Asumiendo que existen
    document.querySelectorAll('.image-drop-area, .image-preview-item').forEach(el => {
        el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('drag-over'); });
        el.addEventListener('dragleave', e => { el.classList.remove('drag-over'); });
        el.addEventListener('drop', handleImageDrop);
        el.addEventListener('click', handleImageClick); // Para abrir el selector de archivos
    });
    
    // Eventos de drag and drop (Imágenes de categoría) - Asumiendo que existen
    const catDropArea = document.getElementById('categoryImageDropArea');
    if (catDropArea) {
        catDropArea.addEventListener('dragover', e => { e.preventDefault(); catDropArea.classList.add('drag-over'); });
        catDropArea.addEventListener('dragleave', e => { catDropArea.classList.remove('drag-over'); });
        catDropArea.addEventListener('drop', handleCategoryImageDrop);
        catDropArea.addEventListener('click', handleCategoryImageClick);
    }

    // Listener para remover imagen de categoría
    document.getElementById('removePreviewImageBtn')?.addEventListener('click', removePreviewImage);
    
    // Evento de cierre de notificación
    document.getElementById('notificationBox').addEventListener('click', (e) => {
        if (e.target.closest('.close-btn')) {
            document.getElementById('notificationBox').classList.remove('active');
        }
    });
}

// ===== LÓGICA DE BÚSQUEDA Y UTILIDADES =====

/**
 * Función Debounce para limitar la frecuencia de llamadas a funciones (ej: búsqueda).
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

function handleProductSearch(event) {
    const query = event.target.value.toLowerCase().trim();
    if (query.length < 2 && query.length !== 0) return;
    
    const filteredProducts = APP_STATE.products.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.sku.toLowerCase().includes(query)
    );
    loadProductsGrid(filteredProducts);
}

function handleCategorySearch(event) {
    const query = event.target.value.toLowerCase().trim();
    if (query.length < 2 && query.length !== 0) return;
    
    const filteredCategories = APP_STATE.categories.filter(c => 
        c.name.toLowerCase().includes(query)
    );
    loadCategoriesGrid(filteredCategories);
}


// ===== CRUD PLACEHOLDERS (Manteniendo las funciones que causaban el loop) =====

// Funciones CRUD de PRODUCTO
function openProductModal(mode, productId = null) { /* ... */ }
function closeProductModal() { /* ... */ }
function saveProduct(e) { /* ... */ }
function editProduct(productId) { /* ... */ } // Llamada ahora por delegación
function deleteProduct(productId) { /* ... */ } // Llamada ahora por delegación
function removeProductImage(index) { /* ... */ }
function handleImageDrop(e) { /* ... */ }
function handleImageClick(e) { /* ... */ }

// Funciones CRUD de CATEGORÍA
function openCategoryModal(mode, categoryId = null) { /* ... */ }
function closeCategoryModal() { /* ... */ }
function saveCategory(e) { /* ... */ }
function editCategory(categoryId) { /* ... */ } // Llamada ahora por delegación
function deleteCategory(categoryId) { /* ... */ } // Llamada ahora por delegación
function handleCategoryImageDrop(e) { /* ... */ }
function handleCategoryImageClick(e) { /* ... */ }
function removePreviewImage() { /* ... */ }

// Funciones de Exportación/Importación
function exportData() { /* ... */ }
function importData() { /* ... */ }

// Funciones de Optimizacion/Integracion
function optimizeImages() { /* ... */ }
function testGitHubConnection() { /* ... */ }


// --- Reconstrucción básica de las funciones principales para evitar errores de referencia ---

function openProductModal(mode, productId = null) {
    document.getElementById('productModal').classList.add('active');
    // ... Lógica para cargar formulario
}
function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
}
function saveProduct(e) {
    e.preventDefault();
    showNotification('Producto guardado (simulación)', 'success');
    loadProductsGrid(); // Esto ahora es seguro, la delegación no duplica listeners
    closeProductModal();
}
function editProduct(productId) {
    showNotification(`Editando producto ID: ${productId}`, 'info');
    // openProductModal('edit', productId);
}
function deleteProduct(productId) {
    if (confirm(`¿Estás seguro de eliminar el producto ${productId}?`)) {
        // Lógica de eliminación...
        APP_STATE.products = APP_STATE.products.filter(p => p.id !== productId);
        loadProductsGrid(); // Esto ahora es seguro
        showNotification(`Producto ID ${productId} eliminado.`, 'success');
    }
}


function openCategoryModal(mode, categoryId = null) {
    document.getElementById('categoryModal').classList.add('active');
    // ... Lógica para cargar formulario
}
function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('active');
}
function saveCategory(e) {
    e.preventDefault();
    showNotification('Categoría guardada (simulación)', 'success');
    loadCategoriesGrid(); // Esto ahora es seguro
    closeCategoryModal();
}
function editCategory(categoryId) {
    showNotification(`Editando categoría ID: ${categoryId}`, 'info');
    // openCategoryModal('edit', categoryId);
}
function deleteCategory(categoryId) {
    if (confirm(`¿Estás seguro de eliminar la categoría ${categoryId}?`)) {
        // Lógica de eliminación...
        APP_STATE.categories = APP_STATE.categories.filter(c => c.id !== categoryId);
        loadCategoriesGrid(); // Esto ahora es seguro
        showNotification(`Categoría ID ${categoryId} eliminada.`, 'success');
    }
}

// Funciones de Drag and Drop (placeholders)
function handleImageDrop(e) { e.preventDefault(); showNotification('Imágenes procesadas (simulación)', 'info'); }
function handleImageClick(e) { /* Lógica para click en imagen */ }
function handleCategoryImageDrop(e) { e.preventDefault(); showNotification('Imagen de categoría subida (simulación)', 'info'); }
function handleCategoryImageClick(e) { /* Lógica para click en imagen */ }
function removePreviewImage() { /* Lógica para remover */ }

// Funciones de Exportación/Importación (placeholders)
function exportData() { showNotification('Datos exportados (simulación)', 'success'); }
function importData() { showNotification('Iniciando importación...', 'info'); }
function optimizeImages() { showNotification('Optimizando imágenes (simulación)...', 'info'); }
function testGitHubConnection() { showNotification('Conexión GitHub OK (simulación)', 'success'); }


// Hacer funciones disponibles globalmente
window.showNotification = showNotification;
window.exportData = exportData;
window.importData = importData;
window.optimizeImages = optimizeImages;
window.testGitHubConnection = testGitHubConnection;

// Funciones CRUD disponibles globalmente (aunque se recomienda usar la delegación)
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.saveCategory = saveCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;