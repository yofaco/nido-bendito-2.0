// categories-manager.js - Gestión de categorías
class CategoriesManager {
    constructor(adminApp) {
        this.adminApp = adminApp;
        this.currentCategoryId = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Modal de categoría
        document.getElementById('close-category-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-category').addEventListener('click', () => this.closeModal());
        document.getElementById('category-form').addEventListener('submit', (e) => this.saveCategory(e));

        // Delegación de eventos para botones de categorías
        document.addEventListener('click', (e) => {
            if (e.target.closest('.edit-category')) {
                const categoryId = e.target.closest('.edit-category').dataset.id;
                this.editCategory(categoryId);
            }
            
            if (e.target.closest('.delete-category')) {
                const categoryId = e.target.closest('.delete-category').dataset.id;
                this.deleteCategory(categoryId);
            }
        });

        // Auto-generar slug desde el nombre
        document.getElementById('category-name').addEventListener('input', (e) => {
            this.generateSlug(e.target.value);
        });
    }

    openModal(category = null) {
        this.currentCategoryId = category ? category.id : null;
        
        const modal = document.getElementById('category-modal');
        const title = document.getElementById('category-modal-title');
        
        if (category) {
            title.textContent = 'Editar Categoría';
            this.populateForm(category);
        } else {
            title.textContent = 'Agregar Categoría';
            this.resetForm();
        }
        
        modal.classList.add('active');
    }

    closeModal() {
        document.getElementById('category-modal').classList.remove('active');
        this.resetForm();
    }

    resetForm() {
        document.getElementById('category-form').reset();
        document.getElementById('category-image-preview').innerHTML = '';
        this.currentCategoryId = null;
    }

    populateForm(category) {
        document.getElementById('category-name').value = category.name || '';
        document.getElementById('category-slug').value = category.slug || '';
        document.getElementById('category-description').value = category.description || '';

        // Mostrar imagen actual si existe
        if (category.image) {
            document.getElementById('category-image-preview').innerHTML = `
                <div class="image-preview-item">
                    <img src="${category.image}" alt="${category.name}" style="height: 100px;">
                </div>
            `;
        }
    }

    async saveCategory(e) {
        e.preventDefault();
        
        if (!this.validateForm()) {
            return;
        }

        const categoryData = this.getFormData();
        
        try {
            if (this.currentCategoryId) {
                await this.updateCategory(this.currentCategoryId, categoryData);
                this.adminApp.showNotification('Categoría actualizada correctamente', 'success');
            } else {
                await this.createCategory(categoryData);
                this.adminApp.showNotification('Categoría creada correctamente', 'success');
            }
            
            this.closeModal();
            this.adminApp.renderCategories();
            this.adminApp.updateStats();
            this.adminApp.updateCategoryFilters();
            
        } catch (error) {
            console.error('Error guardando categoría:', error);
            this.adminApp.showNotification('Error guardando categoría', 'error');
        }
    }

    validateForm() {
        const requiredFields = ['category-name', 'category-slug'];
        
        for (const fieldId of requiredFields) {
            const field = document.getElementById(fieldId);
            if (!field.value.trim()) {
                this.adminApp.showNotification(`El campo ${field.labels[0].textContent} es requerido`, 'error');
                field.focus();
                return false;
            }
        }

        // Validar slug único
        const slug = document.getElementById('category-slug').value.trim();
        const existingCategory = this.adminApp.categories.find(cat => 
            cat.slug === slug && cat.id !== this.currentCategoryId
        );

        if (existingCategory) {
            this.adminApp.showNotification('El slug ya está en uso por otra categoría', 'error');
            document.getElementById('category-slug').focus();
            return false;
        }

        return true;
    }

    getFormData() {
        const imageFile = document.getElementById('category-image').files[0];
        let imageUrl = '';

        // Manejar imagen (en un entorno real, aquí subirías el archivo)
        if (imageFile) {
            imageUrl = URL.createObjectURL(imageFile);
        } else {
            // Mantener imagen existente si estamos editando
            const existingCategory = this.adminApp.categories.find(cat => cat.id === this.currentCategoryId);
            imageUrl = existingCategory ? existingCategory.image : '';
        }

        return {
            name: document.getElementById('category-name').value.trim(),
            slug: document.getElementById('category-slug').value.trim(),
            description: document.getElementById('category-description').value.trim(),
            image: imageUrl,
            productCount: 0, // Se actualizará después
            featured: false
        };
    }

    async createCategory(categoryData) {
        const newCategory = {
            id: categoryData.slug,
            ...categoryData
        };

        this.adminApp.categories.push(newCategory);
        await this.adminApp.saveCategories();
    }

    async updateCategory(categoryId, categoryData) {
        const index = this.adminApp.categories.findIndex(cat => cat.id === categoryId);
        if (index !== -1) {
            // Mantener el productCount existente
            const existingProductCount = this.adminApp.categories[index].productCount;
            
            this.adminApp.categories[index] = {
                ...this.adminApp.categories[index],
                ...categoryData,
                productCount: existingProductCount
            };
            
            await this.adminApp.saveCategories();
        }
    }

    editCategory(categoryId) {
        const category = this.adminApp.categories.find(cat => cat.id === categoryId);
        if (category) {
            this.openModal(category);
        }
    }

    async deleteCategory(categoryId) {
        const category = this.adminApp.categories.find(cat => cat.id === categoryId);
        
        if (!category) return;

        // Verificar si hay productos en esta categoría
        const productsInCategory = this.adminApp.products.filter(p => p.category === categoryId);
        
        if (productsInCategory.length > 0) {
            this.adminApp.showNotification(
                `No se puede eliminar la categoría. Tiene ${productsInCategory.length} productos asignados.`,
                'error'
            );
            return;
        }

        if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.name}"?`)) {
            return;
        }

        try {
            this.adminApp.categories = this.adminApp.categories.filter(cat => cat.id !== categoryId);
            await this.adminApp.saveCategories();
            
            this.adminApp.renderCategories();
            this.adminApp.updateStats();
            this.adminApp.updateCategoryFilters();
            this.adminApp.showNotification('Categoría eliminada correctamente', 'success');
            
        } catch (error) {
            console.error('Error eliminando categoría:', error);
            this.adminApp.showNotification('Error eliminando categoría', 'error');
        }
    }

    generateSlug(categoryName) {
        const slugField = document.getElementById('category-slug');
        
        if (!slugField.value) {
            const slug = categoryName
                .toLowerCase()
                .trim()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '') // Remover acentos
                .replace(/[^a-z0-9 -]/g, '') // Remover caracteres inválidos
                .replace(/\s+/g, '-') // Reemplazar espacios con guiones
                .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
                .replace(/^-+/, '') // Remover guiones del inicio
                .replace(/-+$/, ''); // Remover guiones del final
            
            slugField.value = slug;
        }
    }

    // Actualizar contador de productos por categoría
    updateProductCounts() {
        this.adminApp.categories.forEach(category => {
            const productCount = this.adminApp.products.filter(
                product => product.category === category.id && product.published
            ).length;
            
            category.productCount = productCount;
        });
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    if (window.adminApp) {
        window.categoryManager = new CategoriesManager(window.adminApp);
    }
});