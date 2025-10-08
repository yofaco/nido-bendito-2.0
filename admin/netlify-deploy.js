// netlify-deploy.js - Configuración para deploy automático en Netlify
class NetlifyDeploy {
    constructor() {
        this.netlifyToken = null;
        this.siteId = null;
        this.autoDeploy = true;
        
        this.init();
    }

    init() {
        this.loadNetlifyConfig();
        this.setupDeployButton();
    }

    loadNetlifyConfig() {
        const savedConfig = localStorage.getItem('netlify-deploy-config');
        if (savedConfig) {
            const config = JSON.parse(savedConfig);
            this.netlifyToken = config.netlifyToken;
            this.siteId = config.siteId;
            this.autoDeploy = config.autoDeploy !== false;
        }
    }

    setupDeployButton() {
        // Agregar botón de deploy manual al header
        const deployButton = document.createElement('button');
        deployButton.className = 'btn btn-warning';
        deployButton.innerHTML = '<i class="fas fa-rocket"></i> Deploy a Netlify';
        deployButton.addEventListener('click', () => this.triggerDeploy());
        
        const adminActions = document.querySelector('.admin-actions');
        if (adminActions) {
            adminActions.appendChild(deployButton);
        }

        // Escuchar eventos de upload para trigger auto-deploy
        document.addEventListener('githubUploadComplete', (event) => {
            if (this.autoDeploy && this.netlifyToken && this.siteId) {
                this.triggerDeploy();
            }
        });
    }

    async triggerDeploy() {
        if (!this.netlifyToken || !this.siteId) {
            this.showNetlifySetupModal();
            return;
        }

        try {
            this.showDeployProgress('Iniciando deploy en Netlify...');

            const response = await fetch(`https://api.netlify.com/api/v1/sites/${this.siteId}/builds`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.netlifyToken}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                this.showNotification('Deploy iniciado correctamente en Netlify', 'success');
                
                // Monitorear el estado del deploy
                this.monitorDeploy();
            } else {
                throw new Error('Error iniciando deploy');
            }

        } catch (error) {
            console.error('Error en deploy:', error);
            this.showNotification(`Error en deploy: ${error.message}`, 'error');
        } finally {
            this.hideDeployProgress();
        }
    }

    async monitorDeploy() {
        let attempts = 0;
        const maxAttempts = 30; // 5 minutos máximo

        const checkStatus = async () => {
            try {
                const response = await fetch(`https://api.netlify.com/api/v1/sites/${this.siteId}`, {
                    headers: {
                        'Authorization': `Bearer ${this.netlifyToken}`
                    }
                });

                if (response.ok) {
                    const siteData = await response.json();
                    
                    if (siteData.published_deploy && siteData.published_deploy.state === 'ready') {
                        this.showNotification('Deploy completado correctamente', 'success');
                        return true;
                    }
                }

                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(checkStatus, 10000); // Revisar cada 10 segundos
                } else {
                    this.showNotification('Timeout en deploy - revisa manualmente en Netlify', 'warning');
                }

            } catch (error) {
                console.error('Error monitoreando deploy:', error);
                attempts++;
                if (attempts < maxAttempts) {
                    setTimeout(checkStatus, 10000);
                }
            }
        };

        setTimeout(checkStatus, 5000); // Empezar a monitorear después de 5 segundos
    }

    showNetlifySetupModal() {
        const modalHTML = `
            <div id="netlify-deploy-modal" class="modal active">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Configuración Netlify Deploy</h3>
                        <button class="close-btn" onclick="netlifyDeploy.closeDeployModal()">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>Para deploy automático necesitas configurar Netlify:</p>
                        
                        <div class="form-group">
                            <label for="netlify-token">Token de Netlify</label>
                            <input type="password" id="netlify-token" class="form-control" placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx">
                            <small>
                                <a href="https://app.netlify.com/user/applications" target="_blank">
                                    Obtén tu token aquí
                                </a>
                            </small>
                        </div>
                        
                        <div class="form-group">
                            <label for="netlify-site-id">Site ID de Netlify</label>
                            <input type="text" id="netlify-site-id" class="form-control" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx">
                            <small>Encuentra el Site ID en: Site settings → General → Site details</small>
                        </div>
                        
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="auto-deploy" checked>
                                Deploy automático después de subir cambios
                            </label>
                        </div>
                        
                        <div class="form-actions">
                            <button class="btn btn-secondary" onclick="netlifyDeploy.closeDeployModal()">Cancelar</button>
                            <button class="btn btn-primary" onclick="netlifyDeploy.saveNetlifyConfig()">Guardar</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    saveNetlifyConfig() {
        const token = document.getElementById('netlify-token').value;
        const siteId = document.getElementById('netlify-site-id').value;
        const autoDeploy = document.getElementById('auto-deploy').checked;

        if (!token || !siteId) {
            this.showNotification('Todos los campos son requeridos', 'error');
            return;
        }

        const config = {
            netlifyToken: token,
            siteId: siteId,
            autoDeploy: autoDeploy
        };

        localStorage.setItem('netlify-deploy-config', JSON.stringify(config));
        
        this.netlifyToken = token;
        this.siteId = siteId;
        this.autoDeploy = autoDeploy;

        this.closeDeployModal();
        this.showNotification('Configuración de Netlify guardada', 'success');
    }

    closeDeployModal() {
        const modal = document.getElementById('netlify-deploy-modal');
        if (modal) {
            modal.remove();
        }
    }

    showDeployProgress(message) {
        let progress = document.getElementById('deploy-progress');
        
        if (!progress) {
            progress = document.createElement('div');
            progress.id = 'deploy-progress';
            progress.className = 'upload-progress';
            progress.innerHTML = `
                <div class="progress-content">
                    <div class="spinner"></div>
                    <span class="progress-message">${message}</span>
                </div>
            `;
            document.body.appendChild(progress);
        }
        
        progress.style.display = 'flex';
    }

    hideDeployProgress() {
        const progress = document.getElementById('deploy-progress');
        if (progress) {
            progress.style.display = 'none';
        }
    }

    showNotification(message, type = 'info') {
        if (window.adminApp && window.adminApp.showNotification) {
            window.adminApp.showNotification(message, type);
        } else {
            alert(`${type.toUpperCase()}: ${message}`);
        }
    }
}

// Inicializar deploy de Netlify
document.addEventListener('DOMContentLoaded', () => {
    window.netlifyDeploy = new NetlifyDeploy();
});