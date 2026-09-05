// Objeto encargado de manejar el almacenamiento de datos en localStorage
const DB = {

    // Obtiene información guardada en localStorage
    get(clave, valorPredeterminado = []) {
        try {
            const valor = localStorage.getItem(clave);

            // Si no existe la clave, devuelve el valor predeterminado
            return valor === null ? valorPredeterminado : JSON.parse(valor);
        } catch {
            // Si ocurre un error al leer o convertir los datos
            return valorPredeterminado;
        }
    },

    // Guarda información en localStorage
    set(clave, valor) {
        localStorage.setItem(clave, JSON.stringify(valor));
    }
};

// Genera un identificador único para registros
const uid = () => {
    try {
        // Utiliza la función moderna del navegador
        return crypto.randomUUID();
    } catch {
        // Método alternativo si randomUUID no está disponible
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
};

// Convierte números a formato de moneda ecuatoriana (USD)
const money = numero => Number(numero || 0).toLocaleString("es-EC", {
    style: "currency",
    currency: "USD"
});

// Evita inyección de código HTML convirtiendo caracteres especiales
const esc = texto => String(texto ?? "").replace(/[&<>"']/g, caracter => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
}[caracter]));

// Verifica que exista una sesión iniciada
function requireSession() {

    // Si no hay usuario activo, redirige al login
    if (!sessionStorage.getItem("usuarioActivo"))
        location.href = "index.html";
}

// Cierra la sesión del usuario
function logout() {

    // Elimina el usuario activo
    sessionStorage.removeItem("usuarioActivo");

    // Regresa a la página de inicio de sesión
    location.href = "index.html";
}

// Muestra u oculta una ventana modal
function modal(id, mostrar) {

    const elemento = document.getElementById(id);

    // Cambia el atributo hidden según el valor recibido
    if (elemento) elemento.hidden = !mostrar;
}

// Valida que una cédula tenga exactamente 10 dígitos numéricos
function validCedula(valor) {
    return /^\d{10}$/.test(valor);
}

// Registra movimientos realizados en el inventario
function registrarMovimiento(tipo, producto, cantidad, detalle = "") {

    // Obtiene los movimientos existentes
    const movimientos = DB.get("movimientos", []);
    const ahora = new Date();

    // Agrega el nuevo movimiento al inicio de la lista
    movimientos.unshift({
        id: uid(),
        fecha: ahora.toLocaleDateString("es-EC"),
        hora: ahora.toLocaleTimeString("es-EC", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        }),
        tipo,
        producto,
        cantidad: Number(cantidad),
        detalle,

        // Guarda el usuario que realizó la acción
        usuario: sessionStorage.getItem("usuarioActivo") || "Invitado"
    });

    // Guarda la lista actualizada
    DB.set("movimientos", movimientos);
}

// Obtiene todos los productos almacenados
function getProductos() {
    return DB.get("productos", []);
}

// Guarda la lista de productos
function saveProductos(productos) {
    DB.set("productos", productos);
}

// Convierte datos antiguos del sistema al nuevo formato
function migrateLegacyData() {

    // Solo ejecuta la migración si aún no existe la nueva tabla
    if (!localStorage.getItem("productos")) {

        const legacy = DB.get("baterias", null);

        // Comprueba que existan datos antiguos
        if (Array.isArray(legacy) && legacy.length) {

            // Convierte cada batería al nuevo formato de producto
            const productos = legacy.map(item => ({
                id: item.id || uid(),

                codigo:
                    item.codigo ||
                    "PROD-" + Math.floor(Math.random() * 900 + 100),

                nombre:
                    [item.marca, item.modelo]
                        .filter(Boolean)
                        .join(" ") || "Producto",

                categoria: item.tipo || "General",

                descripcion:
                    [item.voltaje, item.capacidad]
                        .filter(Boolean)
                        .join(" / "),

                proveedor: "Sin proveedor",

                ubicacion: "Sin asignar",

                stock: Number(item.stock || 0),

                minimo: Number(item.minimo || 5),

                maximo: Number(
                    item.maximo ||
                    Math.max(Number(item.stock || 0), 10)
                ),

                precio: Number(item.precio || 0)
            }));

            // Guarda los productos migrados
            saveProductos(productos);
        }
    }
}

// Inicializa el formulario de inicio de sesión
function initLogin() {

    const formulario = document.getElementById("loginForm");

    // Si no existe el formulario, termina la función
    if (!formulario) return;

    // Evento al enviar el formulario
    formulario.addEventListener("submit", evento => {

        // Evita el envío tradicional del formulario
        evento.preventDefault();

        // Guarda el usuario en la sesión
        sessionStorage.setItem("usuarioActivo", "Usuario");

        // Redirige al menú principal
        location.href = "menu.html";
    });
}

// Se ejecuta cuando la página termina de cargar
document.addEventListener("DOMContentLoaded", () => {

    // Migra datos antiguos si existen
    migrateLegacyData();

    // Si estamos en la página de login, inicia el sistema de acceso
    if (document.getElementById("loginForm"))
        initLogin();

     // Si estamos en el menú principal, verifica que exista una sesión
    if (location.pathname.includes("menu.html"))
        requireSession();
    
});
function reiniciarSistema() {

    if (
        !confirm(
            "Se eliminarán todos los datos del sistema. ¿Desea continuar?"
        )
    ) {
        return;
    }

    localStorage.clear();

    alert("Sistema reiniciado correctamente.");

    location.reload();
}