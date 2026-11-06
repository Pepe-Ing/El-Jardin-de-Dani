# Página web de florería (HTML + CSS + JavaScript + Python)

## Requisitos
- Windows 10/11
- Python 3.10 o superior
- Visual Studio Code (recomendado)

## 1. Ejecutar en tu computadora
1. Descomprime el ZIP.
2. Abre la carpeta `floreria_fullstack` en Visual Studio Code.
3. Abre Terminal > New Terminal.
4. Ejecuta:
   ```powershell
   py -m venv .venv
   .venv\Scripts\Activate.ps1
   python -m pip install -r requirements.txt
   ```
   Si PowerShell bloquea la activación, ejecuta `.\.venv\Scripts\python.exe -m pip install -r requirements.txt` y luego `.\.venv\Scripts\python.exe app.py`.
5. En `app.py` se inicializa automáticamente la base de datos SQLite cuando arranca.
6. Para configurar tus datos antes de iniciar, define variables en PowerShell:
   ```powershell
   $env:STORE_NAME="Mi Floreria"
   $env:WHATSAPP_NUMBER="51987654321"
   $env:DELIVERY_AREA="Trujillo y alrededores"
   $env:ADMIN_PASSWORD="UnaClaveSegura123!"
   $env:SECRET_KEY="una-clave-larga-y-aleatoria"
   python app.py
   ```
   O usa `run_windows.bat` y modifica los valores de ejemplo dentro del archivo.
7. Abre `http://127.0.0.1:5000`.

## 2. Administrar productos
- Abre `http://127.0.0.1:5000/admin`.
- Inicia sesión con el valor de `ADMIN_PASSWORD`.
- Agrega, edita o elimina arreglos y sus precios.
- Los cambios se guardan en `floreria.db` y aparecen en el catálogo público.

## 3. Qué hace cada tecnología
- **HTML** (`templates/`): estructura de la tienda y del panel.
- **CSS** (`static/css/`): colores, tamaños y diseño adaptable.
- **JavaScript** (`static/js/`): búsqueda, filtros, catálogo dinámico y botones WhatsApp.
- **Python + Flask** (`app.py`): servidor y API para los productos.
- **SQLite** (`floreria.db`): guarda productos en una base de datos local.

## 4. Cómo modificar el código
- Textos de portada y secciones: `templates/index.html`.
- Colores, tipografías, tamaños y distribución: `static/css/styles.css`.
- Funciones del catálogo y enlaces de WhatsApp: `static/js/app.js`.
- Panel para agregar/editar/eliminar: `templates/admin.html` y `static/js/admin.js`.
- Reglas del servidor, API y base de datos: `app.py`.
- Productos iniciales de demostración: lista `demo` dentro de `init_db()` en `app.py`. Si ya existe la base de datos, esa lista no vuelve a insertarse; edita productos desde `/admin` o borra `floreria.db` (esto elimina los datos guardados) para reiniciar la demo.

## 5. Importante antes de publicar
Este proyecto está preparado para desarrollo local. Para producción:
- No uses `debug=True`.
- Configura `SECRET_KEY` y `ADMIN_PASSWORD` fuertes como variables secretas del hosting; nunca publiques contraseñas en GitHub.
- Usa HTTPS y `COOKIE_SECURE=1`.
- Configura almacenamiento persistente y copias de seguridad para `floreria.db`.
- Despliega Flask en un hosting compatible con Python (por ejemplo Render o Railway); Netlify por sí solo aloja el frontend estático y no ejecuta este servidor Flask.
- Revisa la política de privacidad y el tratamiento de datos si luego agregas formularios de clientes.
