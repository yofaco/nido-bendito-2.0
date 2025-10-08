// image-uploader.js - Sistema avanzado de subida y gestión de imágenes
class ImageUploader {
    constructor() {
        this.maxFileSize = 5 * 1024 * 1024; // 5MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        this.optimizeImages = true;
        this.maxWidth = 1200;
        this.maxHeight = 1200;
        
        this.init();
    }

    init() {
        this.setupGlobalListeners();
    }

    setupGlobalListeners() {
        // Prevenir arrastrar y soltar archivos en toda la página
        document.addEventListener('dragover', (e) => {
            if (e.dataTransfer.types.includes('Files')) {
                e.preventDefault();
            }
        });

        document.addEventListener('drop', (e) => {
            if (e.dataTransfer.types.includes('Files')) {
                e.preventDefault();
            }
        });
    }

    async processImage(file) {
        return new Promise((resolve, reject) => {
            // Validar tipo de archivo
            if (!this.allowedTypes.includes(file.type)) {
                reject(new Error(`Tipo de archivo no permitido: ${file.type}`));
                return;
            }

            // Validar tamaño
            if (file.size > this.maxFileSize) {
                reject(new Error(`Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)}MB`));
                return;
            }

            if (this.optimizeImages) {
                this.optimizeImage(file).then(resolve).catch(reject);
            } else {
                // Si no se optimiza, simplemente crear objeto URL
                const imageData = {
                    originalFile: file,
                    optimizedFile: file,
                    url: URL.createObjectURL(file),
                    name: file.name,
                    size: file.size,
                    type: file.type
                };
                resolve(imageData);
            }
        });
    }

    optimizeImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                try {
                    // Calcular nuevas dimensiones manteniendo aspect ratio
                    let { width, height } = this.calculateDimensions(img.width, img.height);

                    // Configurar canvas
                    canvas.width = width;
                    canvas.height = height;

                    // Dibujar imagen redimensionada
                    ctx.drawImage(img, 0, 0, width, height);

                    // Convertir a blob con calidad ajustada
                    canvas.toBlob((blob) => {
                        if (!blob) {
                            reject(new Error('Error al optimizar imagen'));
                            return;
                        }

                        const optimizedFile = new File([blob], file.name, {
                            type: 'image/jpeg',
                            lastModified: new Date().getTime()
                        });

                        const imageData = {
                            originalFile: file,
                            optimizedFile: optimizedFile,
                            url: URL.createObjectURL(blob),
                            name: file.name,
                            size: optimizedFile.size,
                            type: optimizedFile.type,
                            originalSize: file.size,
                            optimized: true
                        };

                        resolve(imageData);
                    }, 'image/jpeg', 0.8); // 80% calidad

                } catch (error) {
                    reject(error);
                }
            };

            img.onerror = () => reject(new Error('Error al cargar imagen'));
            img.src = URL.createObjectURL(file);
        });
    }

    calculateDimensions(originalWidth, originalHeight) {
        let width = originalWidth;
        let height = originalHeight;

        if (width > height) {
            if (width > this.maxWidth) {
                height = (height * this.maxWidth) / width;
                width = this.maxWidth;
            }
        } else {
            if (height > this.maxHeight) {
                width = (width * this.maxHeight) / height;
                height = this.maxHeight;
            }
        }

        return {
            width: Math.round(width),
            height: Math.round(height)
        };
    }

    async uploadToServer(imageData) {
        // En un entorno real, aquí subirías la imagen a tu servidor
        // Por ahora, simulamos una subida exitosa
        
        return new Promise((resolve) => {
            setTimeout(() => {
                // En producción, reemplazar esta URL con la real del servidor
                const serverUrl = this.generateServerUrl(imageData.name);
                
                resolve({
                    success: true,
                    url: serverUrl,
                    id: Date.now().toString(),
                    message: 'Imagen subida correctamente'
                });
            }, 1000);
        });
    }

    generateServerUrl(filename) {
        // Generar una URL simulada para la imagen
        const timestamp = Date.now();
        const cleanName = filename.toLowerCase().replace(/[^a-z0-9.-]/g, '-');
        return `../assets/images/products/${timestamp}-${cleanName}`;
    }

    createImagePreview(imageData, onRemove) {
        const previewItem = document.createElement('div');
        previewItem.className = 'image-preview-item';
        previewItem.setAttribute('data-image-id', imageData.id || Date.now());

        const sizeInfo = imageData.optimized ? 
            `Optimizada: ${(imageData.size / 1024).toFixed(1)}KB (${((imageData.originalSize - imageData.size) / imageData.originalSize * 100).toFixed(0)}% reducción)` :
            `Tamaño: ${(imageData.size / 1024).toFixed(1)}KB`;

        previewItem.innerHTML = `
            <img src="${imageData.url}" alt="${imageData.name}">
            <div class="image-preview-info">
                <span class="image-name">${imageData.name}</span>
                <span class="image-size">${sizeInfo}</span>
            </div>
            <button type="button" class="image-preview-remove">
                <i class="fas fa-times"></i>
            </button>
        `;

        const removeBtn = previewItem.querySelector('.image-preview-remove');
        removeBtn.addEventListener('click', () => {
            if (onRemove) {
                onRemove(imageData.id || imageData.url);
            }
            previewItem.remove();
        });

        return previewItem;
    }

    // Método para limpiar URLs de objetos cuando ya no se necesiten
    revokeObjectURL(url) {
        if (url && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
        }
    }

    // Validar múltiples archivos
    validateFiles(files) {
        const results = {
            valid: [],
            invalid: []
        };

        for (let file of files) {
            if (!this.allowedTypes.includes(file.type)) {
                results.invalid.push({
                    file: file,
                    error: `Tipo no permitido: ${file.type}`
                });
                continue;
            }

            if (file.size > this.maxFileSize) {
                results.invalid.push({
                    file: file,
                    error: `Archivo demasiado grande: ${(file.size / 1024 / 1024).toFixed(2)}MB`
                });
                continue;
            }

            results.valid.push(file);
        }

        return results;
    }

    // Generar miniaturas para galería
    generateThumbnail(url, size = 100) {
        return new Promise((resolve) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                // Calcular dimensiones para miniatura
                const ratio = img.width / img.height;
                let width = size;
                let height = size;

                if (ratio > 1) {
                    height = size / ratio;
                } else {
                    width = size * ratio;
                }

                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };

            img.src = url;
        });
    }

    // Método para descargar imagen (útil para backups)
    downloadImage(imageData, filename = null) {
        const link = document.createElement('a');
        link.href = imageData.url;
        link.download = filename || imageData.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// Inicializar uploader global
document.addEventListener('DOMContentLoaded', () => {
    window.imageUploader = new ImageUploader();
});

// Utilidades adicionales para manejo de imágenes
const ImageUtils = {
    // Convertir base64 a blob
    base64ToBlob(base64, contentType = '') {
        const byteCharacters = atob(base64.split(',')[1]);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);
            const byteNumbers = new Array(slice.length);
            
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            
            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type: contentType });
    },

    // Comprimir imagen
    compressImage(file, quality = 0.8, maxWidth = 800) {
        return new Promise((resolve) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            img.onload = () => {
                let width = img.width;
                let height = img.height;

                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }

                canvas.width = width;
                canvas.height = height;

                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(resolve, 'image/jpeg', quality);
            };

            img.src = URL.createObjectURL(file);
        });
    },

    // Obtener información de la imagen
    getImageInfo(file) {
        return new Promise((resolve) => {
            const img = new Image();
            
            img.onload = () => {
                resolve({
                    width: img.width,
                    height: img.height,
                    aspectRatio: img.width / img.height,
                    size: file.size,
                    type: file.type
                });
            };

            img.src = URL.createObjectURL(file);
        });
    }
};

// Hacer utilidades disponibles globalmente
window.ImageUtils = ImageUtils;