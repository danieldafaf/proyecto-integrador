const DB = {
    get(clave, valorPredeterminado = []) {
        try {
            return JSON.parse(localStorage.getItem(clave)) || valorPredeterminado;
        } catch {
            return valorPredeterminado;
        }
    },

    set(clave, valor) {
        localStorage.setItem(clave, JSON.stringify(valor));
    }
};

const uid = () => {
    return crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now().toString(36) + Math.random().toString(36).slice(2);
};

const money = numero => {
    return Number(numero || 0).toLocaleString("es-EC", {
        style: "currency",
        currency: "USD"
    });
};

const esc = texto => {
    return String(texto ?? "").replace(
        /[&<>"']/g,
        caracter =>
            ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",    
                '"': "&quot;",
                "'": "&#39;"
            })[caracter]
    );
};

function requireSession() {
    if (!sessionStorage.getItem("usuarioActivo")) {
        location.href = "index.html";
    }
}

function logout() {
    sessionStorage.removeItem("usuarioActivo");
    location.href = "index.html";
}

function modal(id, mostrar) {
    document.getElementById(id).hidden = !mostrar;
}

function validCedula(valor) {
    return /^\d{10}$/.test(valor);
}

function initLogin() {
    const formulario = document.getElementById("loginForm");

    if (formulario) {
        formulario.addEventListener("submit", function (evento) {
            evento.preventDefault();

            sessionStorage.setItem(
                "usuarioActivo",
                "Invitado"
            );

            location.href = "menu.html";
        });
    }
}

// Inicializador global para app.js
document.addEventListener("DOMContentLoaded", () => {
    // Si la página contiene el formulario de login, activa su evento
    if (document.getElementById("loginForm")) {
        initLogin();
    }

    // Si estás en el menú principal, valida la sesión
    if (location.pathname.includes("menu.html")) {
        requireSession();
    }
});