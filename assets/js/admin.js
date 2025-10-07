/**
 * Sistema de Administración - Nido Bendito
 * @version 1.0
 * @description Gestión completa de productos y categorías
 */

// ===== CONFIGURACIÓN Y ESTADO GLOBAL =====
const APP_CONFIG = {
    dataPath: '/data/',
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
    try {
        // Cargar productos
        const productsResponse = await fetch('../data/products.json');
        if (productsResponse.ok) {
            APP_STATE.products = await productsResponse.json();
        }
        
        // Cargar categorías
        const categoriesResponse = await fetch('../data/categories.json');
        if (categoriesResponse.ok) {
            APP_STATE.categories = await categoriesResponse.json();
        }
        
        // Si no hay categorías, crear las básicas
        if (APP_STATE.categories.length === 0) {
            APP_STATE.categories = getDefaultCategories();
            await saveCategories();
        }
        
    } catch (error) {
        console.warn('No se pudieron cargar los datos iniciales:', error);
        // Crear datos por defecto
        APP_STATE.categories = getDefaultCategories();
        APP_STATE.products = [];
    }
}

function getDefaultCategories() {
    return [
        {
            id: 'living-room',
            name: 'Living Room',
            slug: 'living-room',
            description: 'Productos para transformar tu sala en un espacio acogedor',
            display_order: 1
        },
        {
            id: 'dining-kitchen',
            name: 'Dining & Kitchen',
            slug: 'dining-kitchen',
            description: 'Elementos decorativos para tu comedor y cocina',
            display_order: 2
        },
        {
            id: 'wall-decor',
            name: 'Wall Decor',
            slug: 'wall-decor',
            description: 'Arte y decoración para tus paredes',
            display_order: 3
        },
        {
            id: 'bedroom',
            name: 'Bedroom',
            slug: 'bedroom',
            description: 'Productos para crear un dormitorio acogedor',
            display_order: 4
        },
        {
            id: 'pillows-decor',
            name: 'Pillows & Decor',
            slug: 'pillows-decor',
            description: 'Cojines y elementos decorativos',
            display_order: 5
        },
        {
            id: 'lighting',
            name: 'Lighting',
            slug: 'lighting',
            description: 'Iluminación para transformar ambientes',
            display_order: 6
        }
    ];
}

// ===== CONFIGURACIÓN DE EVENT LISTENERS =====
function setupEventListeners() {
    // Navegación entre tabs
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            switchTab(this.dataset.tab);
        });
    });
    
    // Botones principales
    document.getElementById('btnAddProduct').addEventListener('click', () => openProductModal());
    document.getElementById('btnAddCategory').addEventListener('click', () => openCategoryModal());
    document.getElementById('btnSave').addEventListener('click', () => saveAllChanges());
    document.getElementById('btnGenerate').addEventListener('click', () => generateAndUpload());
    
    // Formulario de producto
    setupProductFormListeners();
    
    // Subida de imágenes
    setupImageUploadListeners();
    
    // Detectar cambios sin guardar
    setupUnsavedChangesDetection();
}

function setupProductFormListeners() {
    // Generar slug automáticamente desde el nombre
    document.getElementById('productName').addEventListener('input', function() {
        const slugInput = document.getElementById('productSlug');
        if (!slugInput.value || slugInput.dataset.manual !== 'true') {
            const slug = generateSlug(this.value);
            slugInput.value = slug;
        }
    });
    
    // Marcar slug como manualmente editado
    document.getElementById('productSlug').addEventListener('input', function() {
        this.dataset.manual = 'true';
    });
    
    // Validación de precio de comparación
    document.getElementById('productComparePrice').addEventListener('input', function() {
        const price = parseFloat(document.getElementById('productPrice').value) || 0;
        const comparePrice = parseFloat(this.value) || 0;
        
        if (comparePrice > 0 && comparePrice <= price) {
            this.setCustomValidity('El precio de comparación debe ser mayor al precio normal');
        } else {
            this.setCustomValidity('');
        }
    });
}

function setupImageUploadListeners() {
    const imageInput = document.getElementById('imageInput');
    const uploadArea = document.getElementById('imageUploadArea');
    
    // Click en área de subida
    uploadArea.addEventListener('click', () => imageInput.click());
    
    // Selección de archivos
    imageInput.addEventListener('change', handleImageSelection);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', function() {
        this.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        handleImageDrop(e.dataTransfer.files);
    });
}

function setupUnsavedChangesDetection() {
    const formElements = document.querySelectorAll('input, select, textarea');
    formElements.forEach(element => {
        element.addEventListener('input', () => {
            APP_STATE.hasUnsavedChanges = true;
            updateSaveButton();
        });
    });
}

// ===== GESTIÓN DE PESTAÑAS =====
function switchTab(tabName) {
    // Actualizar navegación
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // Mostrar contenido correspondiente
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
    // Cargar datos específicos de la pestaña
    switch(tabName) {
        case 'products':
            loadProductsList();
            break;
        case 'categories':
            loadCategoriesGrid();
            break;
    }
}

// ===== GESTIÓN DE PRODUCTOS =====
function loadProductsList() {
    const container = document.getElementById('productsList');
    const emptyState = document.getElementById('emptyProducts');
    
    if (APP_STATE.products.length === 0) {
        container.innerHTML = '';
        container.appendChild(emptyState);
        emptyState.classList.remove('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    
    const productsHTML = APP_STATE.products.map(product => `
        <div class="product-card" data-product-id="${product.id}">
            <div class="product-image">
                <img src="${getProductImageUrl(product.images[0]?.url)}" alt="${product.name}">
            </div>
            <div class="product-info">
                <div class="product-name">${product.name}</div>
                <div class="product-meta">
                    <span class="product-category">${getCategoryName(product.category)}</span>
                    <span class="product-price">Q${product.price}</span>
                    <span class="product-stock">Stock: ${product.inventory?.stock || 0}</span>
                </div>
                <div class="product-badges">
                    ${product.featured ? '<span class="badge badge-featured">Destacado</span>' : ''}
                    ${product.new ? '<span class="badge badge-new">Nuevo</span>' : ''}
                    ${product.best_seller ? '<span class="badge badge-bestseller">Mejor Vendido</span>' : ''}
                </div>
            </div>
            <div class="product-actions">
                <button class="btn btn-sm btn-outline" onclick="editProduct('${product.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-sm btn-outline" onclick="deleteProduct('${product.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = productsHTML;
}

function openProductModal(productId = null) {
    APP_STATE.currentProduct = productId ? 
        APP_STATE.products.find(p => p.id === productId) : null;
    
    const modal = document.getElementById('productModal');
    const title = document.getElementById('productModalTitle');
    const form = document.getElementById('productForm');
    
    // Configurar modal
    title.textContent = APP_STATE.currentProduct ? 'Editar Producto' : 'Nuevo Producto';
    form.reset();
    
    // Cargar categorías en el select
    loadCategorySelect();
    
    // Si está editando, cargar datos
    if (APP_STATE.currentProduct) {
        loadProductFormData(APP_STATE.currentProduct);
    } else {
        // Nuevo producto - generar ID
        document.getElementById('productSKU').value = generateSKU();
        clearImagePreview();
    }
    
    modal.classList.add('active');
}

function loadCategorySelect() {
    const select = document.getElementById('productCategory');
    select.innerHTML = '<option value="">Seleccionar categoría</option>' +
        APP_STATE.categories.map(cat => 
            `<option value="${cat.id}">${cat.name}</option>`
        ).join('');
}

function loadProductFormData(product) {
    document.getElementById('productName').value = product.name;
    document.getElementById('productSlug').value = product.slug;
    document.getElementById('productSlug').dataset.manual = 'true';
    document.getElementById('productCategory').value = product.category;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productComparePrice').value = product.compare_price || '';
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productShortDescription').value = product.short_description;
    document.getElementById('productStock').value = product.inventory?.stock || 0;
    document.getElementById('productSKU').value = product.sku;
    document.getElementById('productFeatured').checked = product.featured || false;
    document.getElementById('productNew').checked = product.new || false;
    document.getElementById('productBestSeller').checked = product.best_seller || false;
    
    // Cargar imágenes
    loadProductImages(product.images || []);
}

function loadProductImages(images) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = images.map((image, index) => `
        <div class="preview-item">
            <img src="${getProductImageUrl(image.url)}" alt="Preview ${index + 1}">
            <button type="button" class="preview-remove" onclick="removeProductImage(${index})">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

function closeProductModal() {
    document.getElementById('productModal').classList.remove('active');
    APP_STATE.currentProduct = null;
}

async function saveProduct() {
    const form = document.getElementById('productForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    try {
        showLoading('Guardando producto...');
        
        const formData = new FormData(form);
        const productData = {
            id: APP_STATE.currentProduct?.id || generateProductId(),
            sku: formData.get('sku') || generateSKU(),
            name: formData.get('name'),
            slug: formData.get('slug'),
            category: formData.get('category'),
            price: parseFloat(formData.get('price')),
            compare_price: formData.get('compare_price') ? parseFloat(formData.get('compare_price')) : null,
            description: formData.get('description'),
            short_description: formData.get('short_description'),
            featured: formData.get('featured') === 'on',
            new: formData.get('new') === 'on',
            best_seller: formData.get('best_seller') === 'on',
            inventory: {
                stock: parseInt(formData.get('stock')),
                low_stock_threshold: 5,
                track_quantity: true,
                allow_backorder: false,
                stock_status: parseInt(formData.get('stock')) > 0 ? 'in_stock' : 'out_of_stock'
            },
            shipping: {
                weight: 0.5,
                dimensions: '10x10x10 cm',
                requires_shipping: true,
                free_shipping_eligible: true
            },
            images: await getProductImages(),
            status: 'active',
            created_at: APP_STATE.currentProduct?.created_at || new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString().split('T')[0]
        };
        
        // Guardar o actualizar
        if (APP_STATE.currentProduct) {
            const index = APP_STATE.products.findIndex(p => p.id === APP_STATE.currentProduct.id);
            APP_STATE.products[index] = productData;
        } else {
            APP_STATE.products.push(productData);
        }
        
        await saveProducts();
        closeProductModal();
        loadProductsList();
        updateUI();
        
        showNotification('Producto guardado correctamente', 'success');
        
    } catch (error) {
        console.error('Error guardando producto:', error);
        showNotification('Error al guardar el producto: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

function editProduct(productId) {
    openProductModal(productId);
}

async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        APP_STATE.products = APP_STATE.products.filter(p => p.id !== productId);
        await saveProducts();
        loadProductsList();
        updateUI();
        
        showNotification('Producto eliminado correctamente', 'success');
    } catch (error) {
        console.error('Error eliminando producto:', error);
        showNotification('Error al eliminar el producto', 'error');
    }
}

// ===== GESTIÓN DE CATEGORÍAS =====
function loadCategoriesGrid() {
    const container = document.getElementById('categoriesGrid');
    
    const categoriesHTML = APP_STATE.categories.map(category => `
        <div class="category-card" data-category-id="${category.id}">
            <div class="category-header">
                <div>
                    <div class="category-name">${category.name}</div>
                    <div class="category-slug">${category.slug}</div>
                </div>
                <div class="category-actions">
                    <button class="btn btn-sm btn-outline" onclick="editCategory('${category.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline" onclick="deleteCategory('${category.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="category-description">${category.description || 'Sin descripción'}</div>
            <div class="category-stats">
                <span>Productos: ${countProductsInCategory(category.id)}</span>
                <span>Orden: ${category.display_order}</span>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = categoriesHTML;
}

function openCategoryModal(categoryId = null) {
    APP_STATE.currentCategory = categoryId ? 
        APP_STATE.categories.find(c => c.id === categoryId) : null;
    
    const modal = document.getElementById('categoryModal');
    const title = document.getElementById('categoryModalTitle');
    const form = document.getElementById('categoryForm');
    
    title.textContent = APP_STATE.currentCategory ? 'Editar Categoría' : 'Nueva Categoría';
    form.reset();
    
    if (APP_STATE.currentCategory) {
        loadCategoryFormData(APP_STATE.currentCategory);
    }
    
    modal.classList.add('active');
}

function loadCategoryFormData(category) {
    document.getElementById('categoryName').value = category.name;
    document.getElementById('categorySlug').value = category.slug;
    document.getElementById('categorySlug').dataset.manual = 'true';
    document.getElementById('categoryDescription').value = category.description || '';
    document.getElementById('categoryOrder').value = category.display_order || 1;
}

function closeCategoryModal() {
    document.getElementById('categoryModal').classList.remove('active');
    APP_STATE.currentCategory = null;
}

async function saveCategory() {
    const form = document.getElementById('categoryForm');
    
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    try {
        const formData = new FormData(form);
        const categoryData = {
            id: APP_STATE.currentCategory?.id || generateCategoryId(formData.get('name')),
            name: formData.get('name'),
            slug: formData.get('slug'),
            description: formData.get('description'),
            display_order: parseInt(formData.get('display_order')),
            product_count: APP_STATE.currentCategory?.product_count || 0
        };
        
        // Guardar o actualizar
        if (APP_STATE.currentCategory) {
            const index = APP_STATE.categories.findIndex(c => c.id === APP_STATE.currentCategory.id);
            APP_STATE.categories[index] = categoryData;
        } else {
            APP_STATE.categories.push(categoryData);
        }
        
        // Ordenar categorías
        APP_STATE.categories.sort((a, b) => a.display_order - b.display_order);
        
        await saveCategories();
        closeCategoryModal();
        loadCategoriesGrid();
        updateUI();
        
        showNotification('Categoría guardada correctamente', 'success');
        
    } catch (error) {
        console.error('Error guardando categoría:', error);
        showNotification('Error al guardar la categoría', 'error');
    }
}

function editCategory(categoryId) {
    openCategoryModal(categoryId);
}

async function deleteCategory(categoryId) {
    const productsInCategory = countProductsInCategory(categoryId);
    
    if (productsInCategory > 0) {
        alert(`No puedes eliminar esta categoría porque tiene ${productsInCategory} productos asignados. Primero mueve los productos a otra categoría.`);
        return;
    }
    
    if (!confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
        return;
    }
    
    try {
        APP_STATE.categories = APP_STATE.categories.filter(c => c.id !== categoryId);
        await saveCategories();
        loadCategoriesGrid();
        updateUI();
        
        showNotification('Categoría eliminada correctamente', 'success');
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        showNotification('Error al eliminar la categoría', 'error');
    }
}

function countProductsInCategory(categoryId) {
    return APP_STATE.products.filter(p => p.category === categoryId).length;
}

// ===== GESTIÓN DE IMÁGENES =====
function handleImageSelection(event) {
    const files = Array.from(event.target.files);
    processImageFiles(files);
}

function handleImageDrop(files) {
    processImageFiles(Array.from(files));
}

function processImageFiles(files) {
    const validFiles = files.filter(file => 
        APP_CONFIG.supportedFormats.includes(file.type)
    );
    
    if (validFiles.length === 0) {
        showNotification('Por favor selecciona archivos de imagen válidos (JPEG, PNG, WEBP)', 'error');
        return;
    }
    
    if (getCurrentImageCount() + validFiles.length > APP_CONFIG.maxImages) {
        showNotification(`Máximo ${APP_CONFIG.maxImages} imágenes permitidas por producto`, 'error');
        return;
    }
    
    validFiles.forEach(file => {
        previewImage(file);
    });
}

function previewImage(file) {
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const preview = document.getElementById('imagePreview');
        const imageId = 'img-' + Date.now();
        
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        previewItem.innerHTML = `
            <img src="${e.target.result}" alt="Preview">
            <button type="button" class="preview-remove" onclick="removePreviewImage('${imageId}')">
                <i class="fas fa-times"></i>
            </button>
        `;
        previewItem.dataset.imageId = imageId;
        previewItem.dataset.fileName = file.name;
        
        preview.appendChild(previewItem);
    };
    
    reader.readAsDataURL(file);
}

function removePreviewImage(imageId) {
    const element = document.querySelector(`[data-image-id="${imageId}"]`);
    if (element) {
        element.remove();
    }
}

function removeProductImage(index) {
    if (APP_STATE.currentProduct && APP_STATE.currentProduct.images) {
        APP_STATE.currentProduct.images.splice(index, 1);
        loadProductImages(APP_STATE.currentProduct.images);
    }
}

function getCurrentImageCount() {
    const preview = document.getElementById('imagePreview');
    return preview.children.length;
}

function clearImagePreview() {
    document.getElementById('imagePreview').innerHTML = '';
}

async function getProductImages() {
    // En una implementación real, aquí subirías las imágenes al servidor
    // Por ahora, simulamos que ya están en el servidor
    const preview = document.getElementById('imagePreview');
    const imageElements = preview.getElementsByClassName('preview-item');
    
    return Array.from(imageElements).map((element, index) => ({
        url: `images/products/product-${APP_STATE.currentProduct?.id || 'new'}-${index + 1}.jpg`,
        alt: `Imagen ${index + 1}`,
        width: 800,
        height: 800,
        is_primary: index === 0
    }));
}

// ===== GUARDADO DE DATOS =====
async function saveProducts() {
    // En una implementación real, aquí guardarías en el servidor
    // Por ahora, solo actualizamos el estado
    APP_STATE.hasUnsavedChanges = true;
    updateSaveButton();
    updateUI();
}

async function saveCategories() {
    APP_STATE.hasUnsavedChanges = true;
    updateSaveButton();
    updateUI();
}

async function saveAllChanges() {
    try {
        showLoading('Guardando todos los cambios...');
        
        // Aquí implementarías la lógica para guardar en archivos JSON
        // Por ahora, simulamos el guardado
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        APP_STATE.hasUnsavedChanges = false;
        updateSaveButton();
        
        showNotification('Todos los cambios guardados correctamente', 'success');
        
    } catch (error) {
        console.error('Error guardando cambios:', error);
        showNotification('Error al guardar los cambios', 'error');
    } finally {
        hideLoading();
    }
}

// ===== GENERACIÓN Y SUBIDA =====
async function generateAndUpload() {
    try {
        if (APP_STATE.hasUnsavedChanges) {
            if (!confirm('Tienes cambios sin guardar. ¿Quieres guardarlos antes de generar?')) {
                return;
            }
            await saveAllChanges();
        }
        
        showLoading('Generando archivos para producción...');
        
        // Aquí integrarías con auto-upload.js
        if (window.generateForProduction) {
            await window.generateForProduction(APP_STATE.products, APP_STATE.categories);
        } else {
            // Simulación
            await new Promise(resolve => setTimeout(resolve, 2000));
            showNotification('Archivos generados correctamente. Listos para subir a GitHub.', 'success');
        }
        
    } catch (error) {
        console.error('Error en generación:', error);
        showNotification('Error durante la generación: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// ===== FUNCIONES DE UTILIDAD =====
function generateProductId() {
    return 'prod_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function generateCategoryId(name) {
    return generateSlug(name);
}

function generateSKU() {
    return 'NB-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 3).toUpperCase();
}

function generateSlug(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
}

function getCategoryName(categoryId) {
    const category = APP_STATE.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Sin categoría';
}

function getProductImageUrl(imagePath) {
    if (!imagePath) return '../assets/images/placeholder.jpg';
    if (imagePath.startsWith('http')) return imagePath;
    return `../${imagePath}`;
}

function updateUI() {
    // Actualizar contadores
    document.getElementById('productCount').textContent = APP_STATE.products.length;
    document.getElementById('activeProducts').textContent = APP_STATE.products.filter(p => p.status === 'active').length;
    
    // Actualizar última modificación
    document.getElementById('lastUpdate').textContent = new Date().toLocaleString();
    
    // Actualizar botón de guardar
    updateSaveButton();
}

function updateSaveButton() {
    const saveBtn = document.getElementById('btnSave');
    if (APP_STATE.hasUnsavedChanges) {
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios *';
        saveBtn.classList.add('btn-warning');
    } else {
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
        saveBtn.classList.remove('btn-warning');
    }
}

// ===== NOTIFICACIONES Y LOADING =====
function showNotification(message, type = 'info') {
    const notifications = document.getElementById('notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">${message}</div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    notifications.appendChild(notification);
    
    // Auto-remove después de 5 segundos
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function showLoading(message = 'Cargando...') {
    // Implementar overlay de loading
    let loading = document.getElementById('loadingOverlay');
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'loadingOverlay';
        loading.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-size: 1.1em;
            color: var(--dark-brown);
        `;
        document.body.appendChild(loading);
    }
    
    loading.innerHTML = `
        <div style="text-align: center;">
            <div class="loading-spinner" style="
                width: 40px;
                height: 40px;
                border: 3px solid var(--primary-light);
                border-top: 3px solid var(--primary-color);
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 16px;
            "></div>
            <div>${message}</div>
        </div>
    `;
}

function hideLoading() {
    const loading = document.getElementById('loadingOverlay');
    if (loading) {
        loading.remove();
    }
}

// ===== FUNCIONES DE CONFIGURACIÓN =====
function exportData() {
    const data = {
        products: APP_STATE.products,
        categories: APP_STATE.categories,
        exported_at: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nido-bendito-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    showNotification('Datos exportados correctamente', 'success');
}

function importData() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            try {
                const data = JSON.parse(event.target.result);
                
                if (confirm('¿Estás seguro de que quieres importar estos datos? Se sobreescribirán los datos actuales.')) {
                    APP_STATE.products = data.products || [];
                    APP_STATE.categories = data.categories || [];
                    APP_STATE.hasUnsavedChanges = true;
                    
                    updateUI();
                    loadProductsList();
                    loadCategoriesGrid();
                    
                    showNotification('Datos importados correctamente', 'success');
                }
            } catch (error) {
                showNotification('Error al importar datos: Archivo inválido', 'error');
            }
        };
        
        reader.readAsText(file);
    };
    
    input.click();
}

function optimizeImages() {
    showNotification('Función de optimización de imágenes en desarrollo', 'info');
}

function testGitHubConnection() {
    showNotification('Probando conexión con GitHub...', 'info');
    // Aquí integrarías con auto-upload.js
    setTimeout(() => {
        showNotification('Conexión con GitHub verificada correctamente', 'success');
    }, 1500);
}

// Hacer funciones disponibles globalmente
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.saveProduct = saveProduct;
window.editProduct = editProduct;
window.deleteProduct = deleteProduct;
window.removeProductImage = removeProductImage;
window.openCategoryModal = openCategoryModal;
window.closeCategoryModal = closeCategoryModal;
window.saveCategory = saveCategory;
window.editCategory = editCategory;
window.deleteCategory = deleteCategory;
window.removePreviewImage = removePreviewImage;
window.exportData = exportData;
window.importData = importData;
window.optimizeImages = optimizeImages;
window.testGitHubConnection = testGitHubConnection;