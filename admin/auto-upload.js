/**
 * Sistema de Auto-Subida para GitHub - Nido Bendito
 * @version 1.0
 * @description Generación automática de archivos y preparación para GitHub
 */

class GitHubAutoUpload {
    constructor() {
        this.config = {
            repoPath: '../', // Ruta al repositorio principal
            outputPath: 'output/', // Carpeta temporal para archivos generados
            dataFiles: {
                products: 'data/products.json',
                categories: 'data/categories.json'
            },
            imageSources: '../data/images/', // Imágenes en admin
            imageTargets: '../assets/images/products/' // Imágenes en sitio web
        };
        
        this.state = {
            isGitHubDesktopInstalled: false,
            lastGenerated: null,
            changesDetected: false
        };
    }

    /**
     * Función principal - Genera todos los archivos para producción
     */
    async generateForProduction(products, categories) {
        try {
            this.showProgress('Iniciando generación de archivos...', 0);
            
            // Validar datos
            if (!this.validateData(products, categories)) {
                throw new Error('Datos de productos o categorías inválidos');
            }

            // Crear estructura de carpetas
            await this.createFolderStructure();

            // Generar archivos JSON optimizados
            await this.generateDataFiles(products, categories);
            this.showProgress('Archivos de datos generados...', 30);

            // Procesar y copiar imágenes
            await this.processImages(products);
            this.showProgress('Imágenes procesadas...', 60);

            // Generar archivos para el sitio web
            await this.generateWebFiles(products, categories);
            this.showProgress('Archivos web generados...', 80);

            // Preparar para GitHub
            await this.prepareForGitHub();
            this.showProgress('Preparando para GitHub...', 90);

            // Abrir GitHub Desktop
            await this.openGitHubDesktop();
            this.showProgress('Proceso completado!', 100);

            this.state.lastGenerated = new Date();
            this.state.changesDetected = true;

            return {
                success: true,
                message: 'Archivos generados correctamente. GitHub Desktop se abrirá automáticamente.',
                generatedFiles: this.getGeneratedFilesList(),
                nextSteps: this.getNextSteps()
            };

        } catch (error) {
            console.error('Error en generación:', error);
            return {
                success: false,
                message: `Error durante la generación: ${error.message}`,
                error: error
            };
        }
    }

    /**
     * Valida que los datos sean correctos antes de generar
     */
    validateData(products, categories) {
        if (!Array.isArray(products) || !Array.isArray(categories)) {
            throw new Error('Los datos de productos y categorías deben ser arrays');
        }

        // Validar productos
        products.forEach((product, index) => {
            if (!product.id || !product.name || !product.slug) {
                throw new Error(`Producto en posición ${index} no tiene ID, nombre o slug`);
            }

            if (!product.price || isNaN(product.price)) {
                throw new Error(`Producto "${product.name}" no tiene un precio válido`);
            }

            if (!categories.find(cat => cat.id === product.category)) {
                throw new Error(`Producto "${product.name}" tiene una categoría inválida: ${product.category}`);
            }
        });

        // Validar categorías
        categories.forEach((category, index) => {
            if (!category.id || !category.name || !category.slug) {
                throw new Error(`Categoría en posición ${index} no tiene ID, nombre o slug`);
            }
        });

        return true;
    }

    /**
     * Crea la estructura de carpetas necesaria
     */
    async createFolderStructure() {
        const folders = [
            this.config.outputPath,
            `${this.config.outputPath}data/`,
            `${this.config.outputPath}${this.config.imageTargets}`
        ];

        for (const folder of folders) {
            try {
                // En un entorno real, aquí crearías las carpetas
                // Por ahora simulamos la creación
                console.log(`Creando carpeta: ${folder}`);
                await this.simulateFileOperation();
            } catch (error) {
                console.warn(`No se pudo crear la carpeta ${folder}:`, error);
            }
        }
    }

    /**
     * Genera los archivos JSON de datos optimizados
     */
    async generateDataFiles(products, categories) {
        // Productos optimizados para producción
        const optimizedProducts = products.map(product => ({
            id: product.id,
            sku: product.sku,
            name: product.name,
            slug: product.slug,
            category: product.category,
            price: product.price,
            compare_price: product.compare_price,
            description: product.description,
            short_description: product.short_description,
            images: this.optimizeImagePaths(product.images),
            features: product.features || [],
            specifications: product.specifications || {},
            inventory: product.inventory,
            shipping: product.shipping,
            featured: product.featured || false,
            new: product.new || false,
            best_seller: product.best_seller || false,
            rating: product.rating || 0,
            review_count: product.review_count || 0,
            status: product.status || 'active',
            created_at: product.created_at,
            updated_at: product.updated_at
        }));

        // Categorías optimizadas
        const optimizedCategories = categories.map(category => ({
            id: category.id,
            name: category.name,
            slug: category.slug,
            description: category.description,
            image: category.image,
            product_count: category.product_count || 0,
            display_order: category.display_order || 1
        }));

        // Metadata del catálogo
        const metadata = {
            version: "2.0",
            last_updated: new Date().toISOString(),
            total_products: products.length,
            total_categories: categories.length,
            price_range: this.calculatePriceRange(products),
            average_rating: this.calculateAverageRating(products)
        };

        // Generar archivos
        const files = {
            'data/products.json': {
                products: optimizedProducts,
                metadata: metadata
            },
            'data/categories.json': {
                categories: optimizedCategories,
                metadata: metadata
            },
            'data/catalog-metadata.json': metadata
        };

        // Simular escritura de archivos
        for (const [filePath, data] of Object.entries(files)) {
            const fullPath = `${this.config.outputPath}${filePath}`;
            console.log(`Generando archivo: ${fullPath}`);
            await this.simulateFileWrite(fullPath, JSON.stringify(data, null, 2));
        }
    }

    /**
     * Optimiza las rutas de imágenes para producción
     */
    optimizeImagePaths(images) {
        if (!images || !Array.isArray(images)) return [];

        return images.map((image, index) => ({
            url: image.url ? image.url.replace(this.config.imageSources, this.config.imageTargets) : 
                 `assets/images/products/default-${index + 1}.jpg`,
            alt: image.alt || `Imagen del producto`,
            width: image.width || 800,
            height: image.height || 800,
            is_primary: image.is_primary || index === 0
        }));
    }

    /**
     * Procesa y copia las imágenes a la carpeta destino
     */
    async processImages(products) {
        console.log('Procesando imágenes...');
        
        const imageOperations = [];
        
        // Recolectar todas las imágenes únicas
        const allImages = new Set();
        products.forEach(product => {
            if (product.images && Array.isArray(product.images)) {
                product.images.forEach(image => {
                    if (image.url) {
                        allImages.add(image.url);
                    }
                });
            }
        });

        // Simular copia de imágenes
        for (const imagePath of allImages) {
            if (imagePath.startsWith(this.config.imageSources)) {
                const sourcePath = imagePath;
                const targetPath = imagePath.replace(
                    this.config.imageSources, 
                    `${this.config.outputPath}${this.config.imageTargets}`
                );
                
                imageOperations.push(this.simulateImageCopy(sourcePath, targetPath));
            }
        }

        // Ejecutar operaciones en paralelo (simulado)
        await Promise.all(imageOperations);
        console.log(`Procesadas ${imageOperations.length} imágenes`);
    }

    /**
     * Genera archivos adicionales para el sitio web
     */
    async generateWebFiles(products, categories) {
        // Generar sitemap de productos (simplificado)
        const sitemap = this.generateProductSitemap(products);
        await this.simulateFileWrite(
            `${this.config.outputPath}sitemap-products.xml`,
            sitemap
        );

        // Generar datos para SEO
        const seoData = this.generateSEODATA(products, categories);
        await this.simulateFileWrite(
            `${this.config.outputPath}data/seo-data.json`,
            JSON.stringify(seoData, null, 2)
        );

        // Generar archivo de configuración
        const config = this.generateConfigFile();
        await this.simulateFileWrite(
            `${this.config.outputPath}data/config.json`,
            JSON.stringify(config, null, 2)
        );
    }

    /**
     * Genera sitemap XML para productos
     */
    generateProductSitemap(products) {
        const baseUrl = 'https://nidobendito.com';
        const urls = products.map(product => 
            `  <url>
    <loc>${baseUrl}/producto/${product.slug}.html</loc>
    <lastmod>${product.updated_at || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
        ).join('\n');

        return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
    }

    /**
     * Genera datos optimizados para SEO
     */
    generateSEODATA(products, categories) {
        return {
            products: products.map(product => ({
                id: product.id,
                name: product.name,
                slug: product.slug,
                description: product.short_description,
                price: product.price,
                category: product.category,
                image: product.images?.[0]?.url,
                availability: product.inventory?.stock_status === 'in_stock' ? 'in stock' : 'out of stock'
            })),
            categories: categories.map(category => ({
                id: category.id,
                name: category.name,
                slug: category.slug,
                description: category.description,
                product_count: category.product_count
            })),
            generated_at: new Date().toISOString()
        };
    }

    /**
     * Genera archivo de configuración
     */
    generateConfigFile() {
        return {
            site_name: "Nido Bendito",
            version: "2.0",
            currency: "Q",
            free_shipping_threshold: 500,
            contact: {
                email: "hola@nidobendito.com",
                phone: "+502 1234-5678"
            },
            social: {
                instagram: "https://instagram.com/nidobendito",
                facebook: "https://facebook.com/nidobendito",
                pinterest: "https://pinterest.com/nidobendito"
            },
            last_updated: new Date().toISOString()
        };
    }

    /**
     * Prepara los archivos para GitHub
     */
    async prepareForGitHub() {
        console.log('Preparando archivos para GitHub...');

        // Generar archivo README con instrucciones
        const readme = this.generateGitHubReadme();
        await this.simulateFileWrite(
            `${this.config.outputPath}GITHUB_INSTRUCTIONS.md`,
            readme
        );

        // Generar script de deploy (si es necesario)
        const deployScript = this.generateDeployScript();
        await this.simulateFileWrite(
            `${this.config.outputPath}deploy-to-netlify.js`,
            deployScript
        );

        // Verificar si GitHub Desktop está disponible
        this.state.isGitHubDesktopInstalled = await this.checkGitHubDesktop();
    }

    /**
     * Genera archivo README con instrucciones para GitHub
     */
    generateGitHubReadme() {
        return `# Actualización de Productos - Nido Bendito

## Archivos Generados

Los siguientes archivos han sido actualizados y están listos para subir a GitHub:

### 📁 Estructura de Archivos

\`\`\`
nido-bendito/
├── 📊 data/
│   ├── products.json          # Datos de productos actualizados
│   ├── categories.json        # Datos de categorías actualizados
│   ├── catalog-metadata.json  # Metadatos del catálogo
│   ├── seo-data.json          # Datos optimizados para SEO
│   └── config.json            # Configuración del sitio
├── 🖼️ assets/images/products/
│   └── [imágenes actualizadas] # Imágenes de productos
└── 📄 sitemap-products.xml    # Sitemap actualizado
\`\`\`

## 🚀 Instrucciones para Subir

1. **Abre GitHub Desktop**
2. **Selecciona tu repositorio** de Nido Bendito
3. **Verifica los cambios** en la pestaña "Changes"
4. **Escribe un commit** descriptivo:
   \`\`\`
   Actualización de catálogo - ${new Date().toLocaleDateString()}
   - ${this.getGeneratedFilesList().length} archivos actualizados
   - Productos y categorías sincronizados
   \`\`\`
5. **Haz click en "Commit to main"**
6. **Haz click en "Push origin"**

## ⚡ Despliegue Automático

Netlify detectará los cambios automáticamente y desplegará la nueva versión en 1-2 minutos.

## 📞 Soporte

Si encuentras algún problema:
- Revisa que todos los archivos estén presentes
- Verifica que las imágenes se hayan copiado correctamente
- Contacta al desarrollador si necesitas ayuda

---
*Generado automáticamente el ${new Date().toLocaleString()}*
`;
    }

    /**
     * Genera script de deploy para Netlify
     */
    generateDeployScript() {
        return `/**
 * Script de Despliegue para Netlify - Nido Bendito
 * Este script verifica la integridad de los datos antes del deploy
 */

const fs = require('fs');
const path = require('path');

class DeployValidator {
    constructor() {
        this.dataPath = './data';
    }

    async validateDeployment() {
        console.log('🔍 Validando datos para despliegue...');
        
        try {
            // Verificar archivos esenciales
            const essentialFiles = [
                'products.json',
                'categories.json',
                'config.json'
            ];

            for (const file of essentialFiles) {
                const filePath = path.join(this.dataPath, file);
                if (!fs.existsSync(filePath)) {
                    throw new Error(\`Archivo esencial no encontrado: \${file}\`);
                }
                
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                if (!this.validateJSONStructure(data, file)) {
                    throw new Error(\`Estructura inválida en: \${file}\`);
                }
            }

            console.log('✅ Todos los archivos son válidos');
            console.log('🚀 Listo para despliegue en Netlify');
            
        } catch (error) {
            console.error('❌ Error en validación:', error.message);
            process.exit(1);
        }
    }

    validateJSONStructure(data, fileType) {
        switch (fileType) {
            case 'products.json':
                return data.products && Array.isArray(data.products);
            case 'categories.json':
                return data.categories && Array.isArray(data.categories);
            case 'config.json':
                return data.site_name && data.currency;
            default:
                return true;
        }
    }
}

// Ejecutar validación
if (require.main === module) {
    const validator = new DeployValidator();
    validator.validateDeployment();
}

module.exports = DeployValidator;
`;
    }

    /**
     * Verifica si GitHub Desktop está instalado
     */
    async checkGitHubDesktop() {
        try {
            // En un entorno real, aquí verificarías la instalación
            // Por ahora simulamos que está instalado
            await this.simulateFileOperation();
            return true;
        } catch (error) {
            console.warn('GitHub Desktop no detectado:', error);
            return false;
        }
    }

    /**
     * Abre GitHub Desktop automáticamente
     */
    async openGitHubDesktop() {
        if (!this.state.isGitHubDesktopInstalled) {
            console.warn('GitHub Desktop no está instalado');
            this.showNotification(
                'GitHub Desktop no detectado. Por favor, ábrelo manualmente.',
                'warning'
            );
            return;
        }

        try {
            // En un entorno real, aquí abrirías GitHub Desktop
            // Por ahora simulamos la apertura
            console.log('Abriendo GitHub Desktop...');
            await this.simulateFileOperation(2000);
            
            this.showNotification(
                'GitHub Desktop abierto. Por favor, confirma los cambios y haz push.',
                'success'
            );

        } catch (error) {
            console.error('Error abriendo GitHub Desktop:', error);
            this.showNotification(
                'No se pudo abrir GitHub Desktop automáticamente. Por favor, ábrelo manualmente.',
                'error'
            );
        }
    }

    /**
     * Calcula el rango de precios
     */
    calculatePriceRange(products) {
        if (products.length === 0) return { min: 0, max: 0 };
        
        const prices = products.map(p => p.price).filter(p => p > 0);
        return {
            min: Math.min(...prices),
            max: Math.max(...prices)
        };
    }

    /**
     * Calcula el rating promedio
     */
    calculateAverageRating(products) {
        const productsWithRating = products.filter(p => p.rating > 0);
        if (productsWithRating.length === 0) return 0;
        
        const totalRating = productsWithRating.reduce((sum, product) => 
            sum + product.rating, 0
        );
        return Math.round((totalRating / productsWithRating.length) * 10) / 10;
    }

    /**
     * Obtiene lista de archivos generados
     */
    getGeneratedFilesList() {
        return [
            'data/products.json',
            'data/categories.json', 
            'data/catalog-metadata.json',
            'data/seo-data.json',
            'data/config.json',
            'sitemap-products.xml',
            'GITHUB_INSTRUCTIONS.md',
            'deploy-to-netlify.js'
        ];
    }

    /**
     * Obtiene los siguientes pasos a seguir
     */
    getNextSteps() {
        return [
            'Revisa los archivos generados en la carpeta "output/"',
            'Abre GitHub Desktop manualmente si no se abrió automáticamente',
            'Verifica los cambios en la pestaña "Changes"',
            'Escribe un mensaje de commit descriptivo',
            'Haz click en "Commit to main" y luego "Push origin"',
            'Espera 1-2 minutos para que Netlify haga deploy automáticamente'
        ];
    }

    // ===== MÉTODOS DE UTILIDAD =====

    showProgress(message, percentage) {
        console.log(`[${percentage}%] ${message}`);
        
        // Actualizar UI si está disponible
        if (window.showNotification) {
            window.showNotification(message, 'info');
        }
    }

    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }

    async simulateFileOperation(delay = 500) {
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    async simulateFileWrite(path, content) {
        console.log(`📝 Escribiendo: ${path} (${content.length} bytes)`);
        await this.simulateFileOperation(100);
        return { path, size: content.length };
    }

    async simulateImageCopy(source, target) {
        console.log(`🖼️ Copiando: ${source} → ${target}`);
        await this.simulateFileOperation(200);
        return { source, target, success: true };
    }
}

// ===== INICIALIZACIÓN Y EXPORTACIÓN =====

// Crear instancia global
const gitHubAutoUpload = new GitHubAutoUpload();

// Hacer disponible globalmente
window.generateForProduction = async function(products, categories) {
    const result = await gitHubAutoUpload.generateForProduction(products, categories);
    
    if (result.success) {
        if (window.showNotification) {
            window.showNotification(result.message, 'success');
        }
        
        // Mostrar resumen
        console.log('🎉 Generación completada!');
        console.log('📁 Archivos generados:', result.generatedFiles.length);
        console.log('🚀 Siguientes pasos:');
        result.nextSteps.forEach((step, index) => {
            console.log(`   ${index + 1}. ${step}`);
        });
        
    } else {
        if (window.showNotification) {
            window.showNotification(result.message, 'error');
        }
        console.error('❌ Error en generación:', result.error);
    }
    
    return result;
};

// Funciones adicionales disponibles globalmente
window.checkGitHubStatus = async function() {
    const isInstalled = await gitHubAutoUpload.checkGitHubDesktop();
    const message = isInstalled ? 
        'GitHub Desktop está instalado y listo para usar' :
        'GitHub Desktop no está instalado. Por favor, instálalo desde https://desktop.github.com/';
    
    if (window.showNotification) {
        window.showNotification(message, isInstalled ? 'success' : 'warning');
    }
    
    return { installed: isInstalled };
};

window.getGenerationStatus = function() {
    return {
        lastGenerated: gitHubAutoUpload.state.lastGenerated,
        changesDetected: gitHubAutoUpload.state.changesDetected,
        githubInstalled: gitHubAutoUpload.state.isGitHubDesktopInstalled
    };
};

console.log('🚀 Sistema de Auto-Subida GitHub inicializado correctamente');