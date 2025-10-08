// products-manager.js - Gestión completa de productos
class ProductsManager {
    constructor(adminApp) {
        this.adminApp = adminApp;
        this.currentProductId = null;
        this.productImages = [];
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupImageUpload();
    }

    setupEventListeners() {
        // Modal de producto
        document.getElementById('close-product-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-product').addEventListener('click', () => this.closeModal());
        document.getElementById('product-form').addEventListener('submit', (e) => this.saveProduct(e));

        // Delegación de eventos para botones de productos
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-product')) {
                const productId = parseInt(e.target.closest('.edit-product').dataset.id);
                this.editProduct(productId);
            }
            
            if (e.target.closest('.delete-product')) {
                const productId = parseInt(e.target.closest('.delete-product').dataset.id);
                this.deleteProduct(productId);
            }
        });

        // Generación automática de SKU
        document.getElementById('product-name').addEventListener('blur', (e) => {
            this.generateSKU(e.target.value);
        });

        // Auto-slug para categorías
        document.getElementById('category-name').addEventListener('input', (e) => {
            this.generateSlug(e.target.value);
        });
    }

    setupImageUpload() {
        const uploadArea = document.getElementById('images-upload-area');
        const browseBtn = document.getElementById('browse-images');
        const fileInput = document.getElementById('image-upload');

        // Click en botón de navegación
        browseBtn.addEventListener('click', () => fileInput.click());

        // Cambio en input de archivo
        fileInput.addEventListener('change', (e) => {
            this.handleImageFiles(e.target.files);
        });

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleImageFiles(e.dataTransfer.files);
        });
    }

    handleImageFiles(files) {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        
        for (let file of files) {
            if (!validTypes.includes(file.type)) {
                this.adminApp.showNotification('Tipo de archivo no válido: ' + file.name, 'error');
                continue;
            }

            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                this.adminApp.showNotification('Imagen demasiado grande: ' + file.name, 'error');
                continue;
            }

            this.previewImage(file);
        }
    }

    previewImage(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const imageData = {
                id: Date.now() + Math.random(),
                file: file,
                url: e.target.result,
                name: file.name
            };
            
            this.productImages.push(imageData);
            this.renderImagePreviews();
        };
        
        reader.readAsDataURL(file);
    }

    renderImagePreviews() {
        const previewContainer = document.getElementById('images-preview');
        const placeholder = document.getElementById('upload-placeholder');
        
        if (this.productImages.length > 0) {
            placeholder.style.display = 'none';
        } else {
            placeholder.style.display = 'block';
        }

        const imagesHTML = this.productImages.map(image => `
            <div class="image-preview-item" data-image-id="${image.id}">
                <img src="${image.url}" alt="Vista previa">
                <button type="button" class="image-preview-remove" onclick="productManager.removeImage('${image.id}')">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `).join('');

        previewContainer.innerHTML = imagesHTML;
    }

    removeImage(imageId) {
        this.productImages = this.productImages.filter(img => img.id != imageId);
        this.renderImagePreviews();
    }

    openModal(product = null) {
        this.currentProductId = product ? product.id : null;
        this.productImages = [];
        
        const modal = document.getElementById('product-modal');
        const title = document.getElementById('product-modal-title');
        
        if (product) {
            title.textContent = 'Editar Producto';
            this.populateForm(product);
        } else {
            title.textContent = 'Agregar Producto';
            this.resetForm();
        }
        
        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('product-modal').classList.remove('active');
        this.resetForm();
    }

    resetForm() {
        document.getElementById('product-form').reset();
        this.productImages = [];
        this.renderImagePreviews();
        this.currentProductId = null;
        
        // Limpiar especificaciones
        document.getElementById('specifications-container').innerHTML = `
            <div class="specification-item">
                <input type="text" class="form-control spec-key" placeholder="Especificación (ej: Material)">
                <input type="text" class="form-control spec-value" placeholder="Valor (ej: Madera de pino)">
                <button type="button" class="btn btn-danger remove-spec"><i class="fas fa-times"></i></button>
            </div>
        `;
        
        this.setupSpecificationListeners();
    }

    populateForm(product) {
        document.getElementById('product-name').value = product.name || '';
        document.getElementById('product-category').value = product.category || '';
        document.getElementById('product-price').value = product.price || '';
        document.getElementById('product-compare-price').value = product.comparePrice || '';
        document.getElementById('product-sku').value = product.sku || '';
        document.getElementById('product-stock').value = product.stock || 0;
        document.getElementById('product-description').value = product.description || '';
        document.getElementById('product-featured').checked = product.featured || false;
        document.getElementById('product-published').checked = product.published !== false;

        // Cargar imágenes existentes
        if (product.images && product.images.length > 0) {
            this.productImages = product.images.map((img, index) => ({
                id: `existing-${index}`,
                url: img,
                name: `Imagen ${index + 1}`
            }));
            this.renderImagePreviews();
        }

        // Cargar especificaciones
        this.populateSpecifications(product.specifications);
    }

    populateSpecifications(specs) {
        const container = document.getElementById('specifications-container');
        container.innerHTML = '';

        if (specs && Object.keys(specs).length > 0) {
            for (const [key, value] of Object.entries(specs)) {
                container.innerHTML += `
                    <div class="specification-item">
                        <input type="text" class="form-control spec-key" value="${key}" placeholder="Especificación">
                        <input type="text" class="form-control spec-value" value="${value}" placeholder="Valor">
                        <button type="button" class="btn btn-danger remove-spec"><i class="fas fa-times"></i></button>
                    </div>
                `;
            }
        } else {
            container.innerHTML = `
                <div class="specification-item">
                    <input type="text" class="form-control spec-key" placeholder="Especificación (ej: Material)">
                    <input type="text" class="form-control spec-value" placeholder="Valor (ej: Madera de pino)">
                    <button type="button" class="btn btn-danger remove-spec"><i class="fas fa-times"></i></button>
                </div>
            `;
        }

        this.setupSpecificationListeners();
    }

    setupSpecificationListeners() {
        // Botón agregar especificación
        document.getElementById('add-specification').addEventListener('click', () => {
            const container = document.getElementById('specifications-container');
            container.innerHTML += `
                <div class="specification-item">
                    <input type="text" class="form-control spec-key" placeholder="Especificación">
                    <input type="text" class="form-control spec-value" placeholder="Valor">
                    <button type="button" class="btn btn-danger remove-spec"><i class="fas fa-times"></i></button>
                </div>
            `;
            this.setupSpecificationListeners();
        });

        // Botones eliminar especificación
        document.querySelectorAll('.remove-spec').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (document.querySelectorAll('.specification-item').length > 1) {
                    e.target.closest('.specification-item').remove();
                }
            });
        });
    }

    async saveProduct(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        const productData = this.getFormData();
        
        try {
            if (this.currentProductId) {
                await this.updateProduct(this.currentProductId, productData);
                this.adminApp.showNotification('Producto actualizado correctamente', 'success');
            } else {
                await this.createProduct(productData);
                this.adminApp.showNotification('Producto creado correctamente', 'success');
            }
            
            this.closeModal();
            this.adminApp.renderProducts();
            this.adminApp.updateStats();
            
        } catch (error) {
            console.error('Error guardando producto:', error);
            this.adminApp.showNotification('Error guardando producto', 'error');
        }
    }

    validateForm() {
        const requiredFields = [
            'product-name',
            'product-category', 
            'product-price',
            'product-description'
        ];

        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                this.adminApp.showNotification(`El campo ${field.labels[0].textContent} es requerido`, 'error');
                field.focus();
                return false;
            }
        }

        if (this.productImages.length === 0) {
            this.adminApp.showNotification('Debe agregar al menos una imagen', 'warning');
            return false;
        }

        return true;
    }

    getFormData() {
        const specifications = {};
        document.querySelectorAll('.specification-item').forEach(item => {
            const key = item.querySelector('.spec-key').value.trim();
            const value = item.querySelector('.spec-value').value.trim();
            if (key && value) {
                specifications[key] = value;
            }
        });

        return {
            name: document.getElementById('product-name').value.trim(),
            category: document.getElementById('product-category').value,
            price: parseFloat(document.getElementById('product-price').value),
            comparePrice: document.getElementById('product-compare-price').value ? 
                         parseFloat(document.getElementById('product-compare-price').value) : null,
            sku: document.getElementById('product-sku').value.trim(),
            stock: parseInt(document.getElementById('product-stock').value) || 0,
            description: document.getElementById('product-description').value.trim(),
            specifications: specifications,
            featured: document.getElementById('product-featured').checked,
            published: document.getElementById('product-published').checked,
            images: this.productImages.map(img => img.url),
            updatedAt: new Date().toISOString().split('T')[0]
        };
    }

    async createProduct(productData) {
        const newId = this.adminApp.products.length > 0 ? 
                     Math.max(...this.adminApp.products.map(p => p.id)) + 1 : 1;
        
        const newProduct = {
            id: newId,
            createdAt: new Date().toISOString().split('T')[0],
            ...productData
        };

        this.adminApp.products.push(newProduct);
        await this.adminApp.saveProducts();
    }

    async updateProduct(productId, productData) {
        const index = this.adminApp.products.findIndex(p => p.id === productId);
        if (index !== -1) {
            this.adminApp.products[index] = {
                ...this.adminApp.products[index],
                ...productData
            };
            await this.adminApp.saveProducts();
        }
    }

    editProduct(productId) {
        const product = this.adminApp.products.find(p => p.id === productId);
        if (product) {
            this.openModal(product);
        }
    }

    async deleteProduct(productId) {
        if (!confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
            return;
        }

        try {
            this.adminApp.products = this.adminApp.products.filter(p => p.id !== productId);
            await this.adminApp.saveProducts();
            
            this.adminApp.renderProducts();
            this.adminApp.updateStats();
            this.adminApp.showNotification('Producto eliminado correctamente', 'success');
            
        } catch (error) {
            console.error('Error eliminando producto:', error);
            this.adminApp.showNotification('Error eliminando producto', 'error');
        }
    }

    generateSKU(productName) {
        const skuField = document.getElementById('product-sku');
        
        if (!skuField.value) {
            const baseSKU = productName
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, '')
                .substring(0, 6);
            
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            skuField.value = `NB-${baseSKU}${random}`;
        }
    }

    generateSlug(categoryName) {
        const slugField = document.getElementById('category-slug');
        
        if (!slugField.value) {
            const slug = categoryName
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9 -]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
            
            slugField.value = slug;
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (window.adminApp) {
        window.productManager = new ProductsManager(window.adminApp);
    }
});