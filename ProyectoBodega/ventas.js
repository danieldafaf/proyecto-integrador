let sales = [];

function initSales() {
    requireSession();

    sales = DB.get("ventas", []);

    saleSearch.addEventListener("input", renderSales);
    saleForm.addEventListener("submit", saveSale);
    cantidadVenta.addEventListener("input", previewTotal);
    precioVenta.addEventListener("input", previewTotal);
    
    productoVenta.addEventListener("change", actualizarPrecioVenta);

    cargarProductosVenta();
    renderSales();
}

function cargarProductosVenta() {
    const productos = DB.get("productos", []);

    productoVenta.innerHTML =
        `<option value="">Seleccione un producto</option>` +
        productos
            .map(
                p =>
                    `<option value="${p.id}">
                        ${esc(p.nombre)} · Stock: ${p.stock}
                    </option>`
            )
            .join("");
}

function actualizarPrecioVenta() {
    const producto = DB.get("productos", []).find(
        p => p.id === productoVenta.value
    );

    if (producto) {
        precioVenta.value = Number(producto.precio).toFixed(2);
    } else {
        precioVenta.value = "";
    }

    previewTotal();
}

function previewTotal() {
    totalPreview.textContent = money(
        Number(cantidadVenta.value) *
        Number(precioVenta.value)
    );
}

function openSale(id = "") {
    saleForm.reset();
    saleId.value = "";

    fecha.value = new Date().toISOString().slice(0, 10);

    cargarProductosVenta();

    saleTitle.textContent = "Nueva salida / venta";

    if (id) {
        const venta = sales.find(v => v.id === id);

        if (!venta) return;

        saleId.value = venta.id;
        fecha.value = venta.fecha;
        cedulaCliente.value = venta.cedula || "";
        productoVenta.value = venta.productoId || "";
        cantidadVenta.value = venta.cantidad;
        precioVenta.value = venta.precio;

        saleTitle.textContent = "Editar salida";
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
        return alert("La cédula debe contener 10 números.");
    }
    
    const clientes = DB.get("clientes", []);

    const clienteExiste = clientes.find(
        c => c.cedula === cedulaCliente.value.trim()
    );

    if (!clienteExiste) {
        return alert("El cliente no está registrado.");
    }
    
    const productos = DB.get("productos", []);
    const producto = productos.find(
        p => p.id === productoVenta.value
    );

    const cantidad = Number(cantidadVenta.value);
    const precio = Number(precioVenta.value);

    if (!producto) {
        return alert("Seleccione un producto.");
    }

    if (cantidad <= 0) {
        return alert("La cantidad debe ser mayor que cero.");
    }

    const id = saleId.value;

    if (!id && cantidad > Number(producto.stock)) {
        return alert(
            `Stock insuficiente. Disponible: ${producto.stock}`
        );
    }

    const datos = {
        fecha: fecha.value,
        cedula: cedulaCliente.value.trim(),
        productoId: producto.id,
        producto: producto.nombre,
        cantidad,
        precio
    };

    if (id) {
        // Al editar una venta existente
        const existente = sales.find(v => v.id === id);
        Object.assign(existente, datos);
    } else {
        // Al registrar una nueva venta (SALIDA)
        producto.stock -= cantidad;

        DB.set("productos", productos);

        sales.push({
            id: uid(),
            ...datos
        });

        // Registrar el movimiento de SALIDA
        registrarMovimiento(
            "SALIDA",
            producto.nombre,
            cantidad,
            `Venta a cliente (${datos.cedula})`
        );
    }

    DB.set("ventas", sales);

    closeSale();
    cargarProductosVenta();
    renderSales();
}

function deleteSale(id) {
    const venta = sales.find(v => v.id === id);
    if (!venta) return;

    if (
        !confirm(
            "¿Desea eliminar esta venta? Se devolverá el stock al inventario y se registrará la devolución."
        )
    ) {
        return;
    }

    // CORRECCIÓN 2: Revertir stock en inventario y registrar movimiento de devolución
    const productos = DB.get("productos", []);
    const producto = productos.find(p => p.id === venta.productoId);

    if (producto) {
        producto.stock += Number(venta.cantidad);
        DB.set("productos", productos);

        // Al cancelar una venta, entra nuevamente stock al inventario
        registrarMovimiento(
            "ENTRADA",
            producto.nombre,
            venta.cantidad,
            "Devolución por cancelación de venta"
        );
    }

    sales = sales.filter(v => v.id !== id);
    DB.set("ventas", sales);

    cargarProductosVenta();
    renderSales();
}

function renderSales() {
    const busqueda = saleSearch.value
        .trim()
        .toLowerCase();

    const filtradas = sales.filter(v =>
        `${v.fecha} ${v.cedula} ${v.producto || v.marca}`
            .toLowerCase()
            .includes(busqueda)
    );

    saleBody.innerHTML = filtradas
        .map(
            v => `
            <tr>
                <td>${esc(v.fecha)}</td>
                <td class="mono">${esc(v.cedula)}</td>
                <td>${esc(v.producto || v.marca)}</td>
                <td>${v.cantidad}</td>
                <td>${money(v.precio)}</td>
                <td>${money(v.cantidad * v.precio)}</td>
                <td>
                    <div class="row-actions">
                        <button
                            class="icon-btn"
                            onclick="openSale('${v.id}')">
                            ✎
                        </button>

                        <button
                            class="icon-btn"
                            onclick="deleteSale('${v.id}')">
                            🗑
                        </button>
                    </div>
                </td>
            </tr>
        `
        )
        .join("");

    saleEmpty.style.display =
        filtradas.length ? "none" : "block";

    salesN.textContent = sales.length;

    salesUnits.textContent = sales.reduce(
        (t, v) => t + Number(v.cantidad || 0),
        0
    );

    const ingresos = sales.reduce(
        (t, v) =>
            t +
            Number(v.cantidad || 0) *
            Number(v.precio || 0),
        0
    );

    salesIncome.textContent = money(ingresos);

    salesAvg.textContent = money(
        sales.length
            ? ingresos / sales.length
            : 0
    );

    saleCount.textContent =
        `${filtradas.length} de ${sales.length} ventas`;
}

document.addEventListener(
    "DOMContentLoaded",
    initSales
);