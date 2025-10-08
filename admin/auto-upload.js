// auto-upload.js - Sistema automático de subida a GitHub para Netlify
class NetlifyAutoUpload {
    constructor() {
        this.githubToken = null;
        this.repoOwner = 'tu-usuario'; // Reemplazar con tu usuario de GitHub
        this.repoName = 'nido-bendito'; // Reemplazar con el nombre de tu repositorio
        this.branch = 'main'; // o 'master' según tu repositorio
        this.isConfigured = false;
        
        this.init();
    }

    init() {
        this.loadConfiguration();
        this.setupEventListeners();
        this.checkGitHubConnection();
    }

    loadConfiguration() {
        // Cargar configuración desde localStorage o mostrar setup
        const savedConfig = localStorage.getItem('netlify-auto-upload-config');
        
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            this.githubToken = config.githubToken;
            this.repoOwner = config.repoOwner || this.repoOwner;
            this.repoName = config.repoName || this.repoName;
            this.branch = config.branch || this.branch;
            this.isConfigured = true;
            
            this.updateUI();
        } else {
            this.showSetupModal();
        }
    }

    setupEventListeners() {
        // Botón de configuración en el header
        const configButton = document.createElement('button');
        configButton.className = 'btn btn-outline';
        configButton.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Configurar Auto-Upload';
        configButton.addEventListener('click', () => this.showSetupModal());
        
        // Agregar al header de acciones
        const adminActions = document.querySelector('.admin-actions');
        if (adminActions) {
            adminActions.appendChild(configButton);
        }

        // Escuchar eventos de guardado para auto-subir
        document.addEventListener('productsUpdated', () => {
            if (this.isConfigured && this.autoUploadEnabled()) {
                this.autoUpload('products.json');
            }
        });

        document.addEventListener('categoriesUpdated', () => {
            if (this.isConfigured && this.autoUploadEnabled()) {
                this.autoUpload('categories.json');
            }
        });

        document.addEventListener('configUpdated', () => {
            if (this.isConfigured && this.autoUploadEnabled()) {
                this.autoUpload('config.json');
            }
        });
    }

    showSetupModal() {
        const modalHTML = `
            <div id="netlify-setup-modal" class="modal active">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Configuración Auto-Upload Netlify</h3>
                        <button class="close-btn" onclick="netlifyUpload.closeSetupModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="setup-steps">
                            <div class="setup-step active">
                                <h4>Paso 1: Token de GitHub</h4>
                                <p>Necesitas un token de acceso personal de GitHub:</p>
                                <ol>
                                    <li>Ve a <a href="https://github.com/settings/tokens" target="_blank">GitHub Settings → Tokens</a></li>
                                    <li>Haz clic en "Generate new token"</li>
                                    <li>Selecciona el scope <strong>repo</strong></li>
                                    <li>Copia el token generado</li>
                                </ol>
                                <div class="form-group">
                                    <label for="github-token">Token de GitHub</label>
                                    <input type="password" id="github-token" class="form-control" placeholder="ghp_xxxxxxxxxxxxxxxxxxxx">
                                </div>
                            </div>
                            
                            <div class="setup-step">
                                <h4>Paso 2: Información del Repositorio</h4>
                                <div class="form-group">
                                    <label for="repo-owner">Propietario del Repositorio</label>
                                    <input type="text" id="repo-owner" class="form-control" value="${this.repoOwner}">
                                </div>
                                <div class="form-group">
                                    <label for="repo-name">Nombre del Repositorio</label>
                                    <input type="text" id="repo-name" class="form-control" value="${this.repoName}">
                                </div>
                                <div class="form-group">
                                    <label for="repo-branch">Rama</label>
                                    <input type="text" id="repo-branch" class="form-control" value="${this.branch}">
                                </div>
                            </div>
                            
                            <div class="setup-step">
                                <h4>Paso 3: Configuración de Auto-Upload</h4>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="auto-upload-enabled" checked>
                                        Habilitar auto-upload al guardar cambios
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label>
                                        <input type="checkbox" id="upload-images" checked>
                                        Subir imágenes optimizadas
                                    </label>
                                </div>
                                <div class="form-group">
                                    <label for="commit-message">Mensaje de commit por defecto</label>
                                    <input type="text" id="commit-message" class="form-control" value="Actualización de productos - {date}">
                                </div>
                            </div>
                        </div>
                        
                        <div class="setup-progress">
                            <button id="prev-step" class="btn btn-secondary" disabled>Anterior</button>
                            <button id="next-step" class="btn btn-primary">Siguiente</button>
                            <button id="save-config" class="btn btn-success" style="display: none;">Guardar Configuración</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        this.setupModalListeners();
    }

    setupModalListeners() {
        let currentStep = 0;
        const steps = document.querySelectorAll('.setup-step');
        const prevBtn = document.getElementById('prev-step');
        const nextBtn = document.getElementById('next-step');
        const saveBtn = document.getElementById('save-config');

        const updateSteps = () => {
            steps.forEach((step, index) => {
                step.classList.toggle('active', index === currentStep);
                step.classList.toggle('completed', index < currentStep);
            });

            prevBtn.disabled = currentStep === 0;
            nextBtn.style.display = currentStep < steps.length - 1 ? 'inline-flex' : 'none';
            saveBtn.style.display = currentStep === steps.length - 1 ? 'inline-flex' : 'none';
        };

        nextBtn.addEventListener('click', () => {
            if (this.validateStep(currentStep)) {
                currentStep++;
                updateSteps();
            }
        });

        prevBtn.addEventListener('click', () => {
            currentStep--;
            updateSteps();
        });

        saveBtn.addEventListener('click', () => {
            if (this.saveConfiguration()) {
                this.closeSetupModal();
                this.showNotification('Configuración guardada correctamente', 'success');
            }
        });

        updateSteps();
    }

    validateStep(step) {
        switch (step) {
            case 0:
                const token = document.getElementById('github-token').value;
                if (!token) {
                    this.showNotification('El token de GitHub es requerido', 'error');
                    return false;
                }
                return true;
                
            case 1:
                const owner = document.getElementById('repo-owner').value;
                const repo = document.getElementById('repo-name').value;
                if (!owner || !repo) {
                    this.showNotification('Todos los campos son requeridos', 'error');
                    return false;
                }
                return true;
                
            default:
                return true;
        }
    }

    saveConfiguration() {
        const config = {
            githubToken: document.getElementById('github-token').value,
            repoOwner: document.getElementById('repo-owner').value,
            repoName: document.getElementById('repo-name').value,
            branch: document.getElementById('repo-branch').value,
            autoUploadEnabled: document.getElementById('auto-upload-enabled').checked,
            uploadImages: document.getElementById('upload-images').checked,
            commitMessage: document.getElementById('commit-message').value
        };

        // Validar token probando la conexión
        return this.testGitHubConnection(config).then(isValid => {
            if (isValid) {
                localStorage.setItem('netlify-auto-upload-config', JSON.stringify(config));
                this.githubToken = config.githubToken;
                this.repoOwner = config.repoOwner;
                this.repoName = config.repoName;
                this.branch = config.branch;
                this.isConfigured = true;
                
                this.updateUI();
                return true;
            } else {
                this.showNotification('Error: Token de GitHub inválido o sin permisos', 'error');
                return false;
            }
        });
    }

    async testGitHubConnection(config) {
        try {
            const response = await fetch(`https://api.github.com/repos/${config.repoOwner}/${config.repoName}`, {
                headers: {
                    'Authorization': `token ${config.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            return response.ok;
        } catch (error) {
            console.error('Error testing GitHub connection:', error);
            return false;
        }
    }

    closeSetupModal() {
        const modal = document.getElementById('netlify-setup-modal');
        if (modal) {
            modal.remove();
        }
    }

    updateUI() {
        // Actualizar indicador de estado en la UI
        const statusIndicator = document.createElement('div');
        statusIndicator.className = 'upload-status';
        statusIndicator.innerHTML = `
            <span class="status-dot ${this.isConfigured ? 'connected' : 'disconnected'}"></span>
            <span>GitHub: ${this.isConfigured ? 'Conectado' : 'Desconectado'}</span>
        `;

        const existingStatus = document.querySelector('.upload-status');
        if (existingStatus) {
            existingStatus.replaceWith(statusIndicator);
        } else {
            document.querySelector('.admin-actions').appendChild(statusIndicator);
        }
    }

    autoUploadEnabled() {
        const config = JSON.parse(localStorage.getItem('netlify-auto-upload-config') || '{}');
        return config.autoUploadEnabled !== false;
    }

    async autoUpload(fileType, data = null) {
        if (!this.isConfigured) {
            console.log('Auto-upload no configurado');
            return;
        }

        try {
            this.showUploadProgress(`Subiendo ${fileType}...`);

            let content, path;
            
            switch (fileType) {
                case 'products.json':
                    content = JSON.stringify({ products: window.adminApp.products }, null, 2);
                    path = 'data/products.json';
                    break;
                    
                case 'categories.json':
                    content = JSON.stringify({ categories: window.adminApp.categories }, null, 2);
                    path = 'data/categories.json';
                    break;
                    
                case 'config.json':
                    content = JSON.stringify(window.adminApp.config, null, 2);
                    path = 'data/config.json';
                    break;
                    
                default:
                    throw new Error(`Tipo de archivo no soportado: ${fileType}`);
            }

            await this.uploadToGitHub(path, content);
            this.showNotification(`${fileType} subido correctamente a GitHub`, 'success');

        } catch (error) {
            console.error('Error en auto-upload:', error);
            this.showNotification(`Error subiendo ${fileType}: ${error.message}`, 'error');
        } finally {
            this.hideUploadProgress();
        }
    }

    async uploadToGitHub(path, content) {
        // Primero, obtener el SHA del archivo actual (si existe)
        const currentFile = await this.getFileSHA(path);
        
        const message = this.generateCommitMessage();
        const encodedContent = btoa(unescape(encodeURIComponent(content)));
        
        const payload = {
            message: message,
            content: encodedContent,
            branch: this.branch
        };

        // Si el archivo existe, agregar el SHA para actualizar
        if (currentFile) {
            payload.sha = currentFile.sha;
        }

        const response = await fetch(
            `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${path}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${this.githubToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }
        );

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error subiendo archivo');
        }

        return await response.json();
    }

    async getFileSHA(path) {
        try {
            const response = await fetch(
                `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/contents/${path}?ref=${this.branch}`,
                {
                    headers: {
                        'Authorization': `token ${this.githubToken}`,
                        'Accept': 'application/vnd.github.v3+json'
                    }
                }
            );

            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    generateCommitMessage() {
        const config = JSON.parse(localStorage.getItem('netlify-auto-upload-config') || '{}');
        let message = config.commitMessage || 'Actualización de productos - {date}';
        
        const now = new Date();
        const replacements = {
            '{date}': now.toLocaleDateString('es-MX'),
            '{time}': now.toLocaleTimeString('es-MX'),
            '{datetime}': now.toLocaleString('es-MX')
        };

        for (const [key, value] of Object.entries(replacements)) {
            message = message.replace(key, value);
        }

        return message;
    }

    async uploadImage(file, productId) {
        if (!this.isConfigured || !this.autoUploadEnabled()) {
            return URL.createObjectURL(file); // Fallback local
        }

        try {
            const config = JSON.parse(localStorage.getItem('netlify-auto-upload-config') || '{}');
            if (!config.uploadImages) {
                return URL.createObjectURL(file);
            }

            // Optimizar imagen antes de subir
            const optimizedImage = await window.imageUploader.processImage(file);
            
            const imagePath = `assets/images/products/${productId}/${optimizedImage.name}`;
            await this.uploadToGitHub(imagePath, await optimizedImage.optimizedFile.text());
            
            // Retornar URL relativa para el sitio
            return `../${imagePath}`;

        } catch (error) {
            console.error('Error subiendo imagen:', error);
            // Fallback a URL local
            return URL.createObjectURL(file);
        }
    }

    showUploadProgress(message) {
        // Crear o actualizar indicador de progreso
        let progress = document.getElementById('upload-progress');
        
        if (!progress) {
            progress = document.createElement('div');
            progress.id = 'upload-progress';
            progress.className = 'upload-progress';
            progress.innerHTML = `
                <div class="progress-content">
                    <div class="spinner"></div>
                    <span class="progress-message">${message}</span>
                </div>
            `;
            document.body.appendChild(progress);
        } else {
            progress.querySelector('.progress-message').textContent = message;
        }
        
        progress.style.display = 'flex';
    }

    hideUploadProgress() {
        const progress = document.getElementById('upload-progress');
        if (progress) {
            progress.style.display = 'none';
        }
    }

    async manualUpload() {
        if (!this.isConfigured) {
            this.showSetupModal();
            return;
        }

        try {
            this.showUploadProgress('Subiendo todos los archivos...');

            // Subir todos los archivos de datos
            await Promise.all([
                this.autoUpload('products.json'),
                this.autoUpload('categories.json'),
                this.autoUpload('config.json')
            ]);

            this.showNotification('Todos los archivos subidos correctamente a GitHub', 'success');

        } catch (error) {
            console.error('Error en upload manual:', error);
            this.showNotification(`Error en upload: ${error.message}`, 'error');
        } finally {
            this.hideUploadProgress();
        }
    }

    showNotification(message, type = 'info') {
        // Reutilizar la función de notificación del adminApp si existe
        if (window.adminApp && window.adminApp.showNotification) {
            window.adminApp.showNotification(message, type);
        } else {
            // Fallback simple
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }

    async checkGitHubConnection() {
        if (!this.isConfigured) return;

        try {
            const isValid = await this.testGitHubConnection({
                githubToken: this.githubToken,
                repoOwner: this.repoOwner,
                repoName: this.repoName
            });

            if (!isValid) {
                this.showNotification('Conexión con GitHub perdida. Verifica la configuración.', 'warning');
                this.isConfigured = false;
            }
        } catch (error) {
            console.error('Error verificando conexión GitHub:', error);
        }
    }
}

// Estilos para el auto-upload
const autoUploadStyles = `
    .upload-status {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: #f8f9fa;
        border-radius: 20px;
        font-size: 0.875rem;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
    }

    .status-dot.connected {
        background: #4caf50;
    }

    .status-dot.disconnected {
        background: #f44336;
    }

    .upload-progress {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: none;
        align-items: center;
        justify-content: center;
        z-index: 10000;
    }

    .progress-content {
        background: white;
        padding: 2rem;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 1rem;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
    }

    .spinner {
        width: 20px;
        height: 20px;
        border: 2px solid #f3f3f3;
        border-top: 2px solid #4a6572;
        border-radius: 50%;
        animation: spin 1s linear infinite;
    }

    .setup-steps {
        margin-bottom: 2rem;
    }

    .setup-step {
        display: none;
    }

    .setup-step.active {
        display: block;
    }

    .setup-step.completed {
        display: none;
    }

    .setup-progress {
        display: flex;
        gap: 1rem;
        justify-content: center;
        padding-top: 1rem;
        border-top: 1px solid #e0e0e0;
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

// Agregar estilos al documento
const styleSheet = document.createElement('style');
styleSheet.textContent = autoUploadStyles;
document.head.appendChild(styleSheet);

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.netlifyUpload = new NetlifyAutoUpload();
});

// Exportar para uso en otros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetlifyAutoUpload;
}