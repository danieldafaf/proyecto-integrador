let sales = [];

// Inicializa el módulo de ventas
function initSales() {
    requireSession(); // Verifica que exista una sesión activa

    // Carga las ventas almacenadas
    sales = DB.get("ventas", []);

    // Eventos de búsqueda, formulario y cálculo automático
    saleSearch.addEventListener("input", renderSales);
    saleForm.addEventListener("submit", saveSale);
    cantidadVenta.addEventListener("input", previewTotal);
    precioVenta.addEventListener("input", previewTotal);

    // Actualiza el precio al seleccionar un producto
    productoVenta.addEventListener("change", actualizarPrecioVenta);

    cargarProductosVenta();
    renderSales();
}

// Carga los productos disponibles en el selector
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

// Coloca automáticamente el precio del producto seleccionado
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

// Calcula y muestra el total de la venta
function previewTotal() {
    totalPreview.textContent = money(
        Number(cantidadVenta.value) *
        Number(precioVenta.value)
    );
}

// Abre el formulario para registrar o editar una venta
function openSale(id = "") {
    saleForm.reset();
    saleId.value = "";

    // Coloca la fecha actual por defecto
    fecha.value = new Date().toISOString().slice(0, 10);

    cargarProductosVenta();

    saleTitle.textContent = "Nueva salida / venta";

    // Si existe ID carga los datos para edición
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

// Cierra el formulario modal
function closeSale() {
    modal("saleModal", false);
}

// Guarda una venta nueva o modifica una existente
function saveSale(evento) {
    evento.preventDefault();

    // Valida la cédula
    if (!validCedula(cedulaCliente.value)) {
        return alert("La cédula debe contener 10 números.");
    }

    const clientes = DB.get("clientes", []);

    // Verifica que el cliente exista
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

    // Validaciones
    if (!producto) {
        return alert("Seleccione un producto.");
    }

    if (cantidad <= 0) {
        return alert("La cantidad debe ser mayor que cero.");
    }

    const id = saleId.value;

    // Verifica disponibilidad de stock
    if (!id && cantidad > Number(producto.stock)) {
        return alert(
            `Stock insuficiente. Disponible: ${producto.stock}`
        );
    }

    // Datos de la venta
    const datos = {
        fecha: fecha.value,
        cedula: cedulaCliente.value.trim(),
        productoId: producto.id,
        producto: producto.nombre,
        cantidad,
        precio
    };

    if (id) {
        // Edita una venta existente
        const existente = sales.find(v => v.id === id);
        Object.assign(existente, datos);
    } else {

        // Descuenta stock del producto vendido
        producto.stock -= cantidad;

        DB.set("productos", productos);

        // Registra la venta
        sales.push({
            id: uid(),
            ...datos
        });

        // Registra el movimiento de salida
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

// Elimina una venta y devuelve el stock al inventario
function deleteSale(id) {
    const venta = sales.find(v => v.id === id);

    if (!venta) return;

    // Solicita confirmación
    if (
        !confirm(
            "¿Desea eliminar esta venta? Se devolverá el stock al inventario y se registrará la devolución."
        )
    ) {
        return;
    }

    const productos = DB.get("productos", []);

    const producto = productos.find(
        p => p.id === venta.productoId
    );

    // Devuelve el stock al inventario
    if (producto) {
        producto.stock += Number(venta.cantidad);

        DB.set("productos", productos);

        // Registra el ingreso por devolución
        registrarMovimiento(
            "ENTRADA",
            producto.nombre,
            venta.cantidad,
            "Devolución por cancelación de venta"
        );
    }

    // Elimina la venta
    sales = sales.filter(v => v.id !== id);

    DB.set("ventas", sales);

    cargarProductosVenta();
    renderSales();
}

// Muestra las ventas en la tabla
function renderSales() {
    const busqueda = saleSearch.value
        .trim()
        .toLowerCase();

    // Filtra ventas según búsqueda
    const filtradas = sales.filter(v =>
        `${v.fecha} ${v.cedula} ${v.producto || v.marca}`
            .toLowerCase()
            .includes(busqueda)
    );

    // Genera las filas de la tabla
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

    // Muestra mensaje si no existen ventas
    saleEmpty.style.display =
        filtradas.length ? "none" : "block";

    // Estadísticas generales
    salesN.textContent = sales.length;

    salesUnits.textContent = sales.reduce(
        (t, v) => t + Number(v.cantidad || 0),
        0
    );

    // Calcula ingresos totales
    const ingresos = sales.reduce(
        (t, v) =>
            t +
            Number(v.cantidad || 0) *
            Number(v.precio || 0),
        0
    );

    salesIncome.textContent = money(ingresos);

    // Calcula promedio por venta
    salesAvg.textContent = money(
        sales.length
            ? ingresos / sales.length
            : 0
    );

    // Actualiza contador de registros
    saleCount.textContent =
        `${filtradas.length} de ${sales.length} ventas`;
}

// Ejecuta la inicialización cuando la página carga
document.addEventListener(
    "DOMContentLoaded",
    initSales
);