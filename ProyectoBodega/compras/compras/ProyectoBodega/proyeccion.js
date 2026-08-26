let grafica;

function calcularProyeccion() {
    requireSession();

    const stockActual = document.getElementById("stockActual");
    const salidaPromedio = document.getElementById("salidaPromedio");
    const diasAgotamiento = document.getElementById("diasAgotamiento");
    const valorInventario = document.getElementById("valorInventario");
    const mensajeProyeccion = document.getElementById("mensajeProyeccion");

    const productos = DB.get("productos", []);
    const movimientos = DB.get("movimientos", []);

    const stock = productos.reduce(
        (t, p) => t + Number(p.stock || 0),
        0
    );

    const salidas = movimientos.filter(
        m => m.tipo === "SALIDA"
    );

    const hoy = new Date();

    const fechas = salidas
        .map(m => new Date(m.fecha).getTime())
        .filter(Number.isFinite);

    const diasAnalizados = fechas.length
        ? Math.max(
            1,
            Math.ceil(
                (hoy.getTime() - Math.min(...fechas)) / 86400000
            )
        )
        : 30;

    const unidadesSalida = salidas.reduce(
        (t, m) => t + Number(m.cantidad || 0),
        0
    );

    const promedio = unidadesSalida / diasAnalizados;
    const dias = promedio > 0 ? stock / promedio : 0;

    stockActual.textContent = Math.round(stock);
    salidaPromedio.textContent = promedio.toFixed(2);

    diasAgotamiento.textContent =
        promedio > 0
            ? Math.ceil(dias)
            : "—";

    valorInventario.textContent = money(
        productos.reduce(
            (t, p) =>
                t + Number(p.stock || 0) * Number(p.precio || 0),
            0
        )
    );

    renderGrafica(
        stock,
        promedio,
        Math.max(30, Math.ceil(dias) || 30)
    );

    if (promedio <= 0) {
        mensajeProyeccion.textContent =
            "Aún no existen suficientes salidas registradas para realizar una proyección basada en el comportamiento del inventario.";
    } else {
        mensajeProyeccion.textContent =
            `Actualmente existen ${Math.round(stock)} unidades. ` +
            `La salida promedio estimada es de ${promedio.toFixed(2)} unidades por día, ` +
            `por lo que se proyecta que el inventario podría agotarse en aproximadamente ${Math.ceil(dias)} días ` +
            `si el ritmo de salida se mantiene constante.`;
    }
}

function renderGrafica(stock, promedio, diasMostrar) {
    const etiquetas = [];
    const datos = [];

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

    if (grafica) {
        grafica.destroy();
    }

    grafica = new Chart(
        document.getElementById("graficaInventario"),
        {
            type: "line",
            data: {
                labels: etiquetas,
                datasets: [
                    {
                        label: "Stock proyectado",
                        data: datos,
                        tension: 0.25,
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

document.addEventListener("DOMContentLoaded", () => {
    calcularProyeccion();
});