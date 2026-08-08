let sales = [];

function initSales() {
    requireSession();

    sales = DB.get("ventas", []);

    saleSearch.addEventListener("input", renderSales);
    saleForm.addEventListener("submit", saveSale);
    cantidadVenta.addEventListener("input", previewTotal);
    precioVenta.addEventListener("input", previewTotal);

    renderSales();
}

function previewTotal() {
    const cantidad = Number(cantidadVenta.value);
    const precio = Number(precioVenta.value);

    totalPreview.textContent = money(cantidad * precio);
}

function openSale(id = "") {
    saleForm.reset();
    saleId.value = "";

    fecha.value = new Date()
        .toISOString()
        .slice(0, 10);

    saleTitle.textContent = "Nueva venta";

    if (id) {
        const venta = sales.find(item => item.id === id);

        saleId.value = venta.id;
        fecha.value = venta.fecha;
        cedulaCliente.value = venta.cedula;
        tipoVehiculo.value = venta.tipo;
        marcaVenta.value = venta.marca;
        cantidadVenta.value = venta.cantidad;
        precioVenta.value = venta.precio;

        saleTitle.textContent = "Editar venta";
    }

    previewTotal();
    modal("saleModal", true);
}

function closeSale() {
    modal("saleModal", false);
}

function saveSale(evento) {
    evento.preventDefault();

    if (!validCedula(cedulaCliente.value)) {
        alert("La cédula debe contener 10 números.");
        return;
    }

    const datosVenta = {
        fecha: fecha.value,
        cedula: cedulaCliente.value,
        tipo: tipoVehiculo.value,
        marca: marcaVenta.value.trim().toUpperCase(),
        cantidad: Number(cantidadVenta.value),
        precio: Number(precioVenta.value)
    };

    const id = saleId.value;

    if (id) {
        const ventaExistente = sales.find(
            venta => venta.id === id
        );

        Object.assign(ventaExistente, datosVenta);
    } else {
        sales.push({
            id: uid(),
            ...datosVenta
        });
    }

    DB.set("ventas", sales);

    closeSale();
    renderSales();
}

function deleteSale(id) {
    const confirmar = confirm(
        "¿Eliminar esta venta?"
    );

    if (!confirmar) {
        return;
    }

    sales = sales.filter(
        venta => venta.id !== id
    );

    DB.set("ventas", sales);
    renderSales();
}

function renderSales() {
    const busqueda = saleSearch.value
        .trim()
        .toLowerCase();

    const ventasFiltradas = sales.filter(venta => {
        const texto =
            `${venta.fecha} ${venta.cedula} ${venta.marca}`
                .toLowerCase();

        return texto.includes(busqueda);
    });

    saleBody.innerHTML = ventasFiltradas
        .map(venta => {
            const total = venta.cantidad * venta.precio;

            return `
                <tr>
                    <td>
                        ${esc(venta.fecha)}
                    </td>

                    <td class="mono">
                        ${esc(venta.cedula)}
                    </td>

                    <td>
                        ${esc(venta.tipo)}
                    </td>

                    <td>
                        ${esc(venta.marca)}
                    </td>

                    <td>
                        ${venta.cantidad}
                    </td>

                    <td>
                        ${money(venta.precio)}
                    </td>

                    <td>
                        ${money(total)}
                    </td>

                    <td>
                        <div class="row-actions">
                            <button
                                class="icon-btn"
                                onclick="openSale('${venta.id}')"
                                title="Editar venta"
                            >
                                ✎
                            </button>

                            <button
                                class="icon-btn"
                                onclick="deleteSale('${venta.id}')"
                                title="Eliminar venta"
                            >
                                🗑
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join("");

    saleEmpty.style.display =
        ventasFiltradas.length ? "none" : "block";

    const unidadesVendidas = sales.reduce(
        (total, venta) => total + venta.cantidad,
        0
    );

    const ingresos = sales.reduce(
        (total, venta) =>
            total + venta.cantidad * venta.precio,
        0
    );

    const promedio = sales.length
        ? ingresos / sales.length
        : 0;

    salesN.textContent = sales.length;
    salesUnits.textContent = unidadesVendidas;
    salesIncome.textContent = money(ingresos);
    salesAvg.textContent = money(promedio);

    saleCount.textContent =
        `${ventasFiltradas.length} de ${sales.length} ventas`;
}
document.addEventListener("DOMContentLoaded", initSales);