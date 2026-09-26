# Cartas de Mercaderistas · Suckot

Herramienta web del área de Trade para generar cada mes las cartas de presentación de los mercaderistas a las tiendas (Tottus, Saga Falabella, Oechsle, Plaza Vea, Metro y Wong), listas para imprimir o enviar en PDF.

**Uso:** abre la página de GitHub Pages de este repositorio e ingresa con tu correo y contraseña. Para probar sin cuenta: agrega `?demo` al final de la dirección.

## Cómo funciona

1. **Mercaderistas, Tiendas y Ruta**: se registran una vez. Cada mercaderista tiene un supervisor.
2. **Generar cartas**: eliges el mes y aparecen tus mercaderistas con sus tiendas agrupadas por cadena. Las de su ruta (y apoyos del mes) salen marcadas; puedes desmarcar o marcar cualquier otra tienda solo para esta vez.
3. **Previsualizar, Imprimir o Guardar PDF**: un PDF por tienda (en carpetas por mercaderista), por mercaderista, por cadena o todo junto.
4. **Apoyos**: tiendas fuera de ruta por unas fechas; se marcan solas en el mes que corresponda.
5. **Configuración** (administrador): datos fijos de las cartas, firma, usuarios/supervisores e importar/exportar Excel.

## Dar acceso a un supervisor

1. En la app: *Configuración → Usuarios → Agregar usuario* (correo, nombre, celular y rol).
2. En Supabase: *Authentication → Users → Add user → Create new user* con el mismo correo y una contraseña, marcando **Auto Confirm User**. Cada uno puede cambiar su contraseña desde el menú de su nombre.

## Archivos

| Archivo | Qué contiene |
|---|---|
| `index.html`, `estilos.css`, `app.js` | La aplicación |
| `plantillas.js` | **Los formatos de carta de cada cadena** (textos y orden de documentos) |
| `config.js` | Conexión a Supabase (la clave publicable es pública por diseño) |
| `logo.js` | Logo de Suckot |
| `supabase-esquema.sql` | Tablas y reglas de seguridad de la base |
| `.github/workflows/mantener-activo.yml` | Evita que Supabase (plan gratis) se pause por inactividad |

Este repositorio **no contiene datos personales**: DNI, contactos y firma viven en la base de Supabase, protegidos por inicio de sesión y reglas RLS (solo los correos registrados en *Usuarios* pueden leer o escribir).
