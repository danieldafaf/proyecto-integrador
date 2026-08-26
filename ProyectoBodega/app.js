const DB = {
    get(clave, valorPredeterminado = []) {
        try {
            const valor = localStorage.getItem(clave);
            return valor === null ? valorPredeterminado : JSON.parse(valor);
        } catch {
            return valorPredeterminado;
        }
    },
    set(clave, valor) {
        localStorage.setItem(clave, JSON.stringify(valor));
    }
};

const uid = () => {
    try {
        return crypto.randomUUID();
    } catch {
        return Date.now().toString(36) + Math.random().toString(36).slice(2);
    }
};

const money = numero => Number(numero || 0).toLocaleString("es-EC", {
    style: "currency", currency: "USD"
});

const esc = texto => String(texto ?? "").replace(/[&<>"']/g, caracter => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[caracter]));

function requireSession() {
    if (!sessionStorage.getItem("usuarioActivo")) location.href = "index.html";
}

function logout() {
    sessionStorage.removeItem("usuarioActivo");
    location.href = "index.html";
}

function modal(id, mostrar) {
    const elemento = document.getElementById(id);
    if (elemento) elemento.hidden = !mostrar;
}

function validCedula(valor) { return /^\d{10}$/.test(valor); }

function registrarMovimiento(tipo, producto, cantidad, detalle = "") {
    const movimientos = DB.get("movimientos", []);
    movimientos.unshift({
        id: uid(),
        fecha: new Date().toISOString(),
        tipo,
        producto,
        cantidad: Number(cantidad),
        detalle,
        usuario: sessionStorage.getItem("usuarioActivo") || "Invitado"
    });
    DB.set("movimientos", movimientos);
}

function getProductos() { return DB.get("productos", []); }
function saveProductos(productos) { DB.set("productos", productos); }

function migrateLegacyData() {
    if (!localStorage.getItem("productos")) {
        const legacy = DB.get("baterias", null);
        if (Array.isArray(legacy) && legacy.length) {
            const productos = legacy.map(item => ({
                id: item.id || uid(),
                codigo: item.codigo || "PROD-" + Math.floor(Math.random() * 900 + 100),
                nombre: [item.marca, item.modelo].filter(Boolean).join(" ") || "Producto",
                categoria: item.tipo || "General",
                descripcion: [item.voltaje, item.capacidad].filter(Boolean).join(" / "),
                proveedor: "Sin proveedor",
                ubicacion: "Sin asignar",
                stock: Number(item.stock || 0),
                minimo: Number(item.minimo || 5),
                maximo: Number(item.maximo || Math.max(Number(item.stock || 0), 10)),
                precio: Number(item.precio || 0)
            }));
            saveProductos(productos);
        }
    }
}

function initLogin() {
    const formulario = document.getElementById("loginForm");
    if (!formulario) return;
    formulario.addEventListener("submit", evento => {
        evento.preventDefault();
        sessionStorage.setItem("usuarioActivo", "Invitado");
        location.href = "menu.html";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    migrateLegacyData();
    if (document.getElementById("loginForm")) initLogin();
    if (location.pathname.includes("menu.html")) requireSession();
});
