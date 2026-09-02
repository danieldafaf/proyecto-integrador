let productos = [];

// Crea productos de ejemplo para cargar el inventario por primera vez
function seedProductos() {
    return [
        { id: uid(), codigo: "PROD-001", nombre: "Teclado inalámbrico", categoria: "Tecnología", descripcion: "Teclado USB inalámbrico", proveedor: "Proveedor General", ubicacion: "A-01", stock: 25, minimo: 8, maximo: 40, precio: 25 },
        { id: uid(), codigo: "PROD-002", nombre: "Mouse óptico", categoria: "Tecnología", descripcion: "Mouse USB", proveedor: "Proveedor General", ubicacion: "A-02", stock: 7, minimo: 10, maximo: 30, precio: 12 },
        { id: uid(), codigo: "PROD-003", nombre: "Resma de papel", categoria: "Oficina", descripcion: "Papel A4 75 g", proveedor: "Papelería Central", ubicacion: "B-01", stock: 0, minimo: 5, maximo: 25, precio: 5.5 }
    ];
}

// Inicializa el módulo de inventario
function initInventory() {
    requireSession(); // Verifica que exista una sesión activa

    productos = DB.get("productos", []); // Carga productos guardados

    // Si no existen productos, carga los de ejemplo
    if (!productos.length) {
        productos = seedProductos();
        DB.set("productos", productos);
    }

    // Eventos de búsqueda, filtros y formulario
    invSearch.addEventListener("input", renderInventory);
    invCategory.addEventListener("change", renderInventory);
    invStatus.addEventListener("change", renderInventory);
    productForm.addEventListener("submit", saveProduct);

    renderInventory(); // Muestra los productos
}

// Determina el estado de stock de un producto
function statusProduct(producto) {
    if (Number(producto.stock) <= 0) return "out"; // Agotado
    if (Number(producto.stock) <= Number(producto.minimo)) return "low"; // Stock bajo
    return "ok"; // Stock normal
}

// Convierte el estado interno a texto visible
function statusText(estado) {
    return estado === "out" ? "Agotado" : estado === "low" ? "Stock bajo" : "En stock";
}

// Abre el formulario para crear o editar productos
function openProduct(id = "") {
    productForm.reset();
    productId.value = "";
    minimo.value = 5;
    maximo.value = 20;
    productTitle.textContent = "Nuevo producto";

    // Si recibe un ID carga los datos para edición
    if (id) {
        const producto = productos.find(item => item.id === id);
        if (!producto) return;

        productId.value = producto.id;
        codigo.value = producto.codigo;
        nombre.value = producto.nombre;
        categoria.value = producto.categoria;
        descripcion.value = producto.descripcion;
        proveedor.value = producto.proveedor;
        ubicacion.value = producto.ubicacion;
        stock.value = producto.stock;
        minimo.value = producto.minimo;
        maximo.value = producto.maximo;
        precio.value = producto.precio;

        productTitle.textContent = "Editar producto";
    }

    modal("productModal", true); // Muestra el modal
}

// Cierra el formulario modal
function closeProduct() {
    modal("productModal", false);
}

// Guarda un producto nuevo o actualiza uno existente
function saveProduct(evento) {
    evento.preventDefault();

    // Obtiene los datos del formulario
    const datos = {
        codigo: codigo.value.trim().toUpperCase(),
        nombre: nombre.value.trim(),
        categoria: categoria.value.trim(),
        descripcion: descripcion.value.trim(),
        proveedor: proveedor.value.trim(),
        ubicacion: ubicacion.value.trim(),
        stock: Number(stock.value),
        minimo: Number(minimo.value),
        maximo: Number(maximo.value),
        precio: Number(precio.value)
    };

    // Validaciones
    if (datos.maximo < datos.minimo) return alert("El stock máximo debe ser mayor o igual al stock mínimo.");
    if (datos.stock < 0 || datos.minimo < 0 || datos.maximo < 0 || datos.precio < 0) return alert("Los valores numéricos no pueden ser negativos.");

    const id = productId.value;

    // Evita códigos duplicados
    if (productos.some(p => p.codigo === datos.codigo && p.id !== id))
        return alert("Ese código ya existe.");

    // Edita producto existente
    if (id) {
        const existente = productos.find(p => p.id === id);
        Object.assign(existente, datos);
    } else {
        // Crea nuevo producto
        const nuevo = { id: uid(), ...datos };
        productos.push(nuevo);

        // Registra la entrada inicial al inventario
        registrarMovimiento("ENTRADA", nuevo.nombre, nuevo.stock, "Registro inicial del producto");
    }

    DB.set("productos", productos); // Guarda cambios
    closeProduct();
    renderInventory();
}

// Elimina un producto del inventario
function deleteProduct(id) {
    if (!confirm("¿Eliminar este producto del inventario?")) return;

    const producto = productos.find(p => p.id === id);

    productos = productos.filter(p => p.id !== id);

    DB.set("productos", productos);

    // Registra la eliminación en el historial
    if (producto) {
        registrarMovimiento("ELIMINACIÓN", producto.nombre, producto.stock, "Producto eliminado del inventario");
    }

    renderInventory();
}

// Muestra los productos en la tabla
function renderInventory() {
    const busqueda = invSearch.value.trim().toLowerCase();
    const categoriaSeleccionada = invCategory.value;
    const estadoSeleccionado = invStatus.value;

    // Filtra los productos según búsqueda y filtros
    const filtrados = productos.filter(producto => {
        const texto = `${producto.codigo} ${producto.nombre} ${producto.categoria} ${producto.proveedor}`.toLowerCase();

        return texto.includes(busqueda) &&
            (!categoriaSeleccionada || producto.categoria === categoriaSeleccionada) &&
            (!estadoSeleccionado || statusProduct(producto) === estadoSeleccionado);
    });

    // Genera automáticamente las categorías existentes
    const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
    const actual = invCategory.value;

    invCategory.innerHTML =
        `<option value="">Todas las categorías</option>` +
        categorias.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join("");

    invCategory.value = categorias.includes(actual) ? actual : "";

    // Genera las filas de la tabla
    invBody.innerHTML = filtrados.map(producto => {
        const estado = statusProduct(producto);

        return `<tr>
            <td class="mono">${esc(producto.codigo)}</td>
            <td><strong>${esc(producto.nombre)}</strong><br><small>${esc(producto.descripcion)}</small></td>
            <td>${esc(producto.categoria)}</td>
            <td>${esc(producto.proveedor)}</td>
            <td>${esc(producto.ubicacion)}</td>
            <td class="mono">${producto.stock}</td>
            <td>${money(producto.precio)}</td>
            <td><span class="badge ${estado}">${statusText(estado)}</span></td>
            <td><div class="row-actions">
                <button class="icon-btn" onclick="openProduct('${producto.id}')" title="Editar">✎</button>
                <button class="icon-btn" onclick="deleteProduct('${producto.id}')" title="Eliminar">🗑</button>
            </div></td>
        </tr>`;
    }).join("");

    // Muestra mensaje si no hay productos
    invEmpty.style.display = filtrados.length ? "none" : "block";

    // Calcula estadísticas del inventario
    const unidades = productos.reduce((t, p) => t + Number(p.stock || 0), 0);
    const valor = productos.reduce((t, p) => t + Number(p.stock || 0) * Number(p.precio || 0), 0);
    const problemas = productos.filter(p => statusProduct(p) !== "ok").length;

    // Actualiza indicadores del dashboard
    invModels.textContent = productos.length;
    invUnits.textContent = unidades;
    invValue.textContent = money(valor);
    invLow.textContent = problemas;
    invCount.textContent = `${filtrados.length} de ${productos.length} productos`;
}

// Ejecuta la inicialización cuando la página termina de cargar
document.addEventListener("DOMContentLoaded", initInventory);