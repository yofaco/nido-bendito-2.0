# Guía de Instalación - Panel de Administración Nido Bendito

## 📋 Requisitos Previos

- Navegador web moderno (Chrome, Firefox, Safari, Edge)
- Acceso a los archivos del sitio web
- Editor de texto (opcional, para ediciones manuales)

## 🚀 Instalación Rápida

### Paso 1: Estructura de Carpetas
Asegúrate de tener esta estructura de carpetas:
nido-bendito/
├── 📁 admin/
│ └── admin.html
├── 📁 assets/
│ ├── 📁 css/
│ │ └── admin.css
│ └── 📁 js/
│ ├── admin.js
│ ├── products-manager.js
│ ├── categories-manager.js
│ └── image-uploader.js
└── 📁 data/
├── products.json
├── categories.json
└── config.json

text

### Paso 2: Configuración Inicial
1. Abre `admin/admin.html` en tu navegador
2. El sistema cargará automáticamente los datos existentes
3. Revisa la configuración en `Configuración del Sitio`

## 🛠️ Funcionalidades Principales

### Gestión de Productos
- **Agregar Producto**: Click en "Nuevo Producto"
- **Editar Producto**: Click en el ícono de edición (lápiz)
- **Eliminar Producto**: Click en el ícono de eliminar (basura)
- **Filtrar Productos**: Usa la barra de búsqueda y filtros

### Gestión de Categorías
- **Crear Categoría**: Click en "Nueva Categoría"
- **Editar Categoría**: Click en "Editar" en la tarjeta de categoría
- **Eliminar Categoría**: Solo disponible si no tiene productos

### Subida de Imágenes
- **Arrastrar y Soltar**: Arrastra imágenes al área designada
- **Selección Manual**: Click en "Seleccionar Imágenes"
- **Optimización Automática**: Las imágenes se optimizan automáticamente
- **Múltiples Imágenes**: Puedes subir varias imágenes por producto

## 📊 Estructura de Datos

### Productos (products.json)
```json
{
  "id": 1,
  "name": "Nombre del Producto",
  "category": "categoria-slug",
  "price": 99.99,
  "description": "Descripción detallada...",
  "images": ["ruta/imagen1.jpg", "ruta/imagen2.jpg"],
  "specifications": {
    "Material": "Madera",
    "Dimensiones": "20x30cm"
  },
  "featured": true,
  "published": true
}
Categorías (categories.json)
json
{
  "id": "living-room",
  "name": "Living Room",
  "slug": "living-room",
  "description": "Productos para sala de estar",
  "image": "ruta/imagen-categoria.jpg",
  "productCount": 5
}
🔧 Configuración Avanzada
Personalización de Colores
Edita las variables CSS en admin.css:

css
:root {
    --primary-color: #4a6572;
    --secondary-color: #f9aa33;
    /* ... más variables */
}
Límites de Archivos
Modifica en config.json:

json
"images": {
    "maxFileSize": 5242880,
    "maxWidth": 1200,
    "maxHeight": 1200
}
🚨 Solución de Problemas
Los productos no se cargan
Verifica que data/products.json exista y tenga formato JSON válido

Revisa la consola del navegador (F12) para errores

Las imágenes no se muestran
Asegúrate de que las rutas de las imágenes sean correctas

Verifica que los archivos de imagen existan

No se pueden guardar cambios
Verifica los permisos de escritura en las carpetas

Revisa que no haya errores de validación en los formularios

Problemas de rendimiento
Reduce el tamaño de las imágenes antes de subirlas

Limita el número de productos por página en la configuración

💡 Consejos de Uso
Para Actualizaciones Diarias
Usa la función de "Guardar Todo" frecuentemente

Exporta respaldos regularmente

Mantén las imágenes optimizadas

Organización de Productos
Usa categorías consistentes

Completa todas las especificaciones

Sube múltiples imágenes por producto

Marca productos destacados estratégicamente

Optimización de Imágenes
Usa formato WebP cuando sea posible

Mantén las imágenes por debajo de 1MB

Usa nombres descriptivos para los archivos

🔄 Actualizaciones
Actualizar el Sistema
Descarga la nueva versión

Haz respaldo de tus datos actuales

Reemplaza los archivos (excepto data/)

Verifica que todo funcione correctamente

Migración de Datos
Exporta tus datos actuales

Importa en el nuevo sistema

Verifica que todos los productos y categorías se carguen

📞 Soporte
Si encuentras problemas:

Revisa esta guía

Verifica la consola del navegador (F12)

Contacta al desarrollador con los detalles del error