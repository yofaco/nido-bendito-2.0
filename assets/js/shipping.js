// shipping.js - Funcionalidades para la página de envíos
class ShippingPage {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFAQ();
        this.setupTrackingForm();
    }

    setupEventListeners() {
        // Smooth scroll for internal links
        document.addEventListener('click', (e) => {
            const link = e.target.closest('a[href^="#"]');
            if (link) {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    setupFAQ() {
        const faqItems = document.querySelectorAll('.faq-item');
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            
            question.addEventListener('click', () => {
                // Close all other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Toggle current item
                item.classList.toggle('active');
            });
        });
    }

    setupTrackingForm() {
        const trackingForm = document.getElementById('tracking-form');
        if (trackingForm) {
            trackingForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleTrackingSubmit(trackingForm);
            });
        }
    }

    async handleTrackingSubmit(form) {
        const trackingNumber = form.querySelector('#tracking-number').value.trim();
        const orderEmail = form.querySelector('#order-email').value.trim();
        const submitButton = form.querySelector('button[type="submit"]');

        if (!trackingNumber || !orderEmail) {
            this.showNotification('Por favor completa todos los campos', 'error');
            return;
        }

        if (!this.isValidEmail(orderEmail)) {
            this.showNotification('Por favor ingresa un email válido', 'error');
            return;
        }

        // Disable button during submission
        const originalText = submitButton.innerHTML;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Rastreando...';

        try {
            // Simular consulta de seguimiento
            const trackingInfo = await this.trackPackage(trackingNumber, orderEmail);
            this.showTrackingResult(trackingInfo);
        } catch (error) {
            console.error('Error tracking package:', error);
            this.showNotification('No se pudo encontrar información del pedido. Verifica los datos.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalText;
        }
    }

    async trackPackage(trackingNumber, email) {
        // Simular API call
        return new Promise((resolve) => {
            setTimeout(() => {
                // Datos de ejemplo para demostración
                const statuses = [
                    {
                        status: 'delivered',
                        message: 'Pedido Entregado',
                        description: 'Tu pedido fue entregado exitosamente.',
                        date: '20 Ene 2024, 14:30',
                        location: 'Ciudad de México'
                    },
                    {
                        status: 'in_transit',
                        message: 'En Tránsito',
                        description: 'Tu pedido está en camino a su destino.',
                        date: '19 Ene 2024, 09:15',
                        location: 'Centro de Distribución'
                    },
                    {
                        status: 'shipped',
                        message: 'Pedido Enviado',
                        description: 'Tu pedido ha sido enviado desde nuestro almacén.',
                        date: '18 Ene 2024, 16:45',
                        location: 'Almacén Nido Bendito'
                    },
                    {
                        status: 'processing',
                        message: 'Procesando Pedido',
                        description: 'Estamos preparando tu pedido con cuidado.',
                        date: '17 Ene 2024, 11:20',
                        location: 'CDMX Centro'
                    }
                ];

                const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
                resolve({
                    trackingNumber: trackingNumber,
                    status: randomStatus.status,
                    message: randomStatus.message,
                    description: randomStatus.description,
                    lastUpdate: randomStatus.date,
                    location: randomStatus.location,
                    estimatedDelivery: '22 Ene 2024',
                    steps: statuses
                });
            }, 1500);
        });
    }

    showTrackingResult(trackingInfo) {
        // Crear modal con resultados
        const modal = document.createElement('div');
        modal.className = 'tracking-modal';
        modal.innerHTML = `
            <div class="tracking-modal__content">
                <div class="tracking-modal__header">
                    <h3>Información de Seguimiento</h3>
                    <button class="tracking-modal__close">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="tracking-modal__body">
                    <div class="tracking-info">
                        <div class="tracking-number">
                            <strong>Número de Seguimiento:</strong> ${trackingInfo.trackingNumber}
                        </div>
                        <div class="tracking-status tracking-status--${trackingInfo.status}">
                            <i class="fas fa-${this.getStatusIcon(trackingInfo.status)}"></i>
                            ${trackingInfo.message}
                        </div>
                        <div class="tracking-details">
                            <p><strong>Última actualización:</strong> ${trackingInfo.lastUpdate}</p>
                            <p><strong>Ubicación:</strong> ${trackingInfo.location}</p>
                            <p><strong>Entrega estimada:</strong> ${trackingInfo.estimatedDelivery}</p>
                        </div>
                    </div>
                    
                    <div class="tracking-timeline">
                        <h4>Historial del Pedido</h4>
                        <div class="timeline">
                            ${trackingInfo.steps.map(step => `
                                <div class="timeline-step ${step.status === trackingInfo.status ? 'timeline-step--active' : ''}">
                                    <div class="timeline-step__dot"></div>
                                    <div class="timeline-step__content">
                                        <div class="timeline-step__title">${step.message}</div>
                                        <div class="timeline-step__date">${step.date}</div>
                                        <div class="timeline-step__location">${step.location}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="tracking-modal__footer">
                    <button class="button button--primary" onclick="this.closest('.tracking-modal').remove()">
                        Cerrar
                    </button>
                </div>
            </div>
        `;

        // Agregar estilos si no existen
        if (!document.querySelector('#tracking-modal-styles')) {
            const styles = document.createElement('style');
            styles.id = 'tracking-modal-styles';
            styles.textContent = this.getTrackingModalStyles();
            document.head.appendChild(styles);
        }

        document.body.appendChild(modal);

        // Cerrar modal
        const closeBtn = modal.querySelector('.tracking-modal__close');
        closeBtn.addEventListener('click', () => {
            modal.remove();
        });

        // Cerrar al hacer clic fuera
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    getStatusIcon(status) {
        const icons = {
            'processing': 'box-open',
            'shipped': 'shipping-fast',
            'in_transit': 'truck',
            'delivered': 'check-circle'
        };
        return icons[status] || 'box';
    }

    getTrackingModalStyles() {
        return `
            .tracking-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                padding: 1rem;
            }

            .tracking-modal__content {
                background: white;
                border-radius: 1rem;
                max-width: 600px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
            }

            .tracking-modal__header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1.5rem 2rem;
                border-bottom: 1px solid #e0e0e0;
            }

            .tracking-modal__header h3 {
                margin: 0;
                color: var(--title-color);
            }

            .tracking-modal__close {
                background: none;
                border: none;
                font-size: 1.25rem;
                color: var(--text-color-light);
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 0.25rem;
            }

            .tracking-modal__close:hover {
                background: var(--body-color);
            }

            .tracking-modal__body {
                padding: 2rem;
            }

            .tracking-info {
                margin-bottom: 2rem;
            }

            .tracking-number {
                margin-bottom: 1rem;
                color: var(--text-color);
            }

            .tracking-status {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem 1rem;
                border-radius: 2rem;
                font-weight: var(--font-medium);
                margin-bottom: 1rem;
            }

            .tracking-status--processing {
                background: #fff3cd;
                color: #856404;
            }

            .tracking-status--shipped {
                background: #d1ecf1;
                color: #0c5460;
            }

            .tracking-status--in_transit {
                background: #d1ecf1;
                color: #0c5460;
            }

            .tracking-status--delivered {
                background: #d4edda;
                color: #155724;
            }

            .tracking-details p {
                margin-bottom: 0.5rem;
                color: var(--text-color);
            }

            .tracking-timeline h4 {
                margin-bottom: 1rem;
                color: var(--title-color);
            }

            .timeline {
                position: relative;
                padding-left: 2rem;
            }

            .timeline::before {
                content: '';
                position: absolute;
                left: 0.75rem;
                top: 0;
                bottom: 0;
                width: 2px;
                background: var(--body-color);
            }

            .timeline-step {
                position: relative;
                margin-bottom: 2rem;
            }

            .timeline-step:last-child {
                margin-bottom: 0;
            }

            .timeline-step__dot {
                position: absolute;
                left: -2rem;
                top: 0.25rem;
                width: 1rem;
                height: 1rem;
                background: var(--body-color);
                border-radius: 50%;
                z-index: 2;
            }

            .timeline-step--active .timeline-step__dot {
                background: var(--primary-color);
                box-shadow: 0 0 0 3px rgba(74, 101, 114, 0.2);
            }

            .timeline-step__title {
                font-weight: var(--font-medium);
                color: var(--title-color);
                margin-bottom: 0.25rem;
            }

            .timeline-step__date {
                font-size: var(--small-font-size);
                color: var(--text-color-light);
                margin-bottom: 0.25rem;
            }

            .timeline-step__location {
                font-size: var(--small-font-size);
                color: var(--text-color);
            }

            .tracking-modal__footer {
                padding: 1.5rem 2rem;
                border-top: 1px solid #e0e0e0;
                text-align: right;
            }

            .dark-theme .tracking-modal__content {
                background: var(--container-color-dark);
            }

            .dark-theme .tracking-modal__header,
            .dark-theme .tracking-modal__footer {
                border-color: var(--border-color-dark);
            }

            .dark-theme .timeline::before {
                background: var(--border-color-dark);
            }
        `;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showNotification(message, type = 'info') {
        if (window.productsLoader && window.productsLoader.showNotification) {
            window.productsLoader.showNotification(message, type);
        } else {
            alert(message);
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.shippingPage = new ShippingPage();
});