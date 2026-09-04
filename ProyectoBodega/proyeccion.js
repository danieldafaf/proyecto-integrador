let grafica; // Variable que almacenará la gráfica de proyección

// Calcula la proyección del inventario según las salidas registradas
function calcularProyeccion() {
    requireSession(); // Verifica que exista una sesión activa

    // Obtiene los elementos donde se mostrarán los resultados
    const stockActual = document.getElementById("stockActual");
    const salidaPromedio = document.getElementById("salidaPromedio");
    const diasAgotamiento = document.getElementById("diasAgotamiento");
    const valorInventario = document.getElementById("valorInventario");
    const mensajeProyeccion = document.getElementById("mensajeProyeccion");

    // Obtiene productos y movimientos almacenados
    const productos = DB.get("productos", []);
    const movimientos = DB.get("movimientos", []);

    // Calcula el stock total disponible
    const stock = productos.reduce(
        (t, p) => t + Number(p.stock || 0),
        0
    );

    // Obtiene únicamente los movimientos de salida
    const salidas = movimientos.filter(
        m => m.tipo === "SALIDA"
    );

 // Analiza únicamente los últimos 30 días
const hace30Dias = new Date();
hace30Dias.setDate(hace30Dias.getDate() - 30);

const salidasRecientes = salidas.filter(
    m => new Date(m.fecha) >= hace30Dias
);

// Total de unidades vendidas en los últimos 30 días
const unidadesSalida = salidasRecientes.reduce(
    (t, m) => t + Number(m.cantidad || 0),
    0
);

// Promedio diario
const promedio = unidadesSalida / 30;

    // Estima los días que durará el inventario
    const dias = promedio > 0 ? stock / promedio : 0;

    // Muestra los indicadores principales
    stockActual.textContent = Math.round(stock);
    salidaPromedio.textContent = promedio.toFixed(2);

    diasAgotamiento.textContent =
        promedio > 0
            ? Math.ceil(dias)
            : "—";

    // Calcula el valor monetario total del inventario
    valorInventario.textContent = money(
        productos.reduce(
            (t, p) =>
                t + Number(p.stock || 0) * Number(p.precio || 0),
            0
        )
    );

    // Genera la gráfica de proyección
    renderGrafica(
        stock,
        promedio,
        Math.max(30, Math.ceil(dias) || 30)
    );

    // Muestra el mensaje explicativo de la proyección
    if (promedio <= 0) {
        mensajeProyeccion.textContent =
            "Aún no existen suficientes salidas registradas para realizar una proyección basada en el comportamiento del inventario.";
    } else {
       mensajeProyeccion.textContent =
    `Actualmente existen ${Math.round(stock)} unidades. ` +
    `El promedio de venta es de ${promedio.toFixed(2)} unidades por día, ` +
    `por lo que el inventario podría agotarse en aproximadamente ${Math.ceil(dias)} días ` +
    `si el ritmo de salida se mantiene constante.`;
    }
}

// Genera la gráfica de proyección del inventario
function renderGrafica(stock, promedio, diasMostrar) {

    const etiquetas = []; // Etiquetas del eje X
    const datos = []; // Datos del eje Y

    // Calcula el stock proyectado para cada día
    for (let d = 0; d <= Math.min(diasMostrar, 90); d++) {
        etiquetas.push(`Día ${d}`);

        datos.push(
            Math.max(
                0,
                Number(
                    (stock - promedio * d).toFixed(2)
                )
            )
        );
    }

    // Si existe una gráfica anterior la elimina
    if (grafica) {
        grafica.destroy();
    }

    // Crea la gráfica utilizando Chart.js
    grafica = new Chart(
        document.getElementById("graficaInventario"),
        {
            type: "line", // Tipo de gráfica

            data: {
                labels: etiquetas,

                datasets: [
                    {
                        label: "Stock proyectado",
                        data: datos,
                        tension: 0.25, // Suaviza la línea
                        fill: false
                    }
                ]
            },

            options: {
                responsive: true,

                plugins: {
                    legend: {
                        display: true
                    }
                },

                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Unidades"
                        }
                    },

                    x: {
                        title: {
                            display: true,
                            text: "Tiempo"
                        }
                    }
                }
            }
        }
    );
}

// Ejecuta el cálculo cuando la página termina de cargar
document.addEventListener("DOMContentLoaded", () => {
    calcularProyeccion();
});