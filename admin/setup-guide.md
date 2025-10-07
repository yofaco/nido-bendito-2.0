# 🚀 Guía de Instalación - Sistema de Administración Nido Bendito

## 📋 Descripción General

Este sistema te permite gestionar todos los productos y categorías de Nido Bendito de forma visual y sencilla, con auto-subida a GitHub para despliegue automático en Netlify.

---

## 🎯 Requisitos Previos

### Software Necesario:
- ✅ **GitHub Desktop** - Para subir cambios al repositorio
- ✅ **Navegador Web Moderno** - Chrome, Firefox, Safari o Edge
- ✅ **Conexión a Internet** - Para despliegue automático

### Conocimientos Necesarios:
- ✅ **Básico** - Saber usar un navegador web
- ✅ **Básico** - Saber hacer clic y arrastrar archivos
- ⚠️ **No se requiere** conocimiento de programación

---

## 📥 PASO 1: Instalar GitHub Desktop

### 1.1 Descargar GitHub Desktop
Ve a: **[https://desktop.github.com/](https://desktop.github.com/)**

1. Haz clic en **"Download for Windows"** (o Mac)
2. Ejecuta el archivo descargado
3. Sigue el asistente de instalación

### 1.2 Configurar Cuenta
1. Abre **GitHub Desktop**
2. Inicia sesión con tu cuenta de GitHub
3. Si no tienes cuenta, créala gratis en [github.com](https://github.com)

### 1.3 Clonar tu Repositorio
1. En GitHub Desktop, haz clic en **"Clone a Repository"**
2. Selecciona tu repositorio de **"nido-bendito"**
3. Elige una carpeta local (ej: `C:\Users\TuNombre\Documents\nido-bendito`)
4. Haz clic en **"Clone"**

---

## 📁 PASO 2: Configurar la Estructura de Carpetas

### 2.1 Verificar Estructura Actual
Tu repositorio debe tener esta estructura:
nido-bendito/
├── 🎨 assets/
│ ├── css/
│ ├── js/
│ └── images/
├── 📄 pages/
├── 🛠️ admin/ ← Aquí va el sistema nuevo
├── 📊 data/
└── 📦 templates/

text

### 2.2 Copiar Archivos del Sistema
1. Descarga todos los archivos del sistema administrativo
2. Copia la carpeta `admin/` completa a tu repositorio
3. Asegúrate de que los archivos queden así:
nido-bendito/
├── 🛠️ admin/
│ ├── 📄 admin.html ← Interfaz principal
│ ├── 🎨 admin.css ← Estilos
│ ├── ⚙️ admin.js ← Lógica
│ ├── 🔄 auto-upload.js ← Auto-subida
│ └── 📖 setup-guide.md ← Esta guía

text

---

## 🔧 PASO 3: Configurar Archivos de Datos

### 3.1 Crear Carpeta de Datos
En tu repositorio, crea la carpeta:
nido-bendito/data/

text

### 3.2 Archivos de Datos Iniciales
Crea estos archivos en la carpeta `data/`:

#### `data/categories.json`
```json
{
  "categories": [
    {
      "id": "living-room",
      "name": "Living Room",
      "slug": "living-room",
      "description": "Productos para transformar tu sala en un espacio acogedor",
      "display_order": 1,
      "product_count": 0
    },
    {
      "id": "dining-kitchen", 
      "name": "Dining & Kitchen",
      "slug": "dining-kitchen",
      "description": "Elementos decorativos para tu comedor y cocina",
      "display_order": 2,
      "product_count": 0
    }
  ],
  "metadata": {
    "version": "1.0",
    "last_updated": "2025-01-15"
  }
}
data/products.json
json
{
  "products": [],
  "metadata": {
    "version": "1.0", 
    "last_updated": "2025-01-15",
    "total_products": 0,
    "total_categories": 0
  }
}