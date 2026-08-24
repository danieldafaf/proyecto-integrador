let batteries = [];

function seedBatteries() {
    return [
        {
            id: uid(),
            codigo: "BAT-001",
            marca: "BOSCH",
            modelo: "S4 60D",
            tipo: "AUTO",
            voltaje: "12 V",
            capacidad: "60 Ah",
            stock: 12,
            minimo: 5,
            precio: 105
        },
        {
            id: uid(),
            codigo: "BAT-002",
            marca: "YUASA",
            modelo: "YTX7L-BS",
            tipo: "MOTO",
            voltaje: "12 V",
            capacidad: "6 Ah",
            stock: 3,
            minimo: 5,
            precio: 48
        },
        {
            id: uid(),
            codigo: "BAT-003",
            marca: "MAC",
            modelo: "AGM 70",
            tipo: "CAMIONETA",
            voltaje: "12 V",
            capacidad: "70 Ah",
            stock: 0,
            minimo: 3,
            precio: 142
        }
    ];
}

function initInventory() {
    requireSession();

    batteries = DB.get("baterias", null);

    if (!batteries) {
        batteries = seedBatteries();
        DB.set("baterias", batteries);
    }

    invSearch.addEventListener(
        "input",
        renderInventory
    );

    invType.addEventListener(
        "change",
        renderInventory
    );

    invStatus.addEventListener(
        "change",
        renderInventory
    );

    batteryForm.addEventListener(
        "submit",
        saveBattery
    );
    renderInventory();
}
function statusBattery(bateria) {
    if (bateria.stock <= 0) {
        return "out";
    }
    if (bateria.stock < bateria.minimo) {
        return "low";
    }
    return "ok";
}
function statusText(estado) {
    if (estado === "out") {
        return "Agotado";
    }
    if (estado === "low") {
        return "Stock bajo";
    }
    return "En stock";
}
function openBattery(id = "") {
    batteryForm.reset();
    batteryId.value = "";
    minimo.value = 5;
    batteryTitle.textContent = "Nueva batería";
    if (id) {
        const bateria = batteries.find(
            item => item.id === id
        );
        batteryId.value = bateria.id;
        codigo.value = bateria.codigo;
        marca.value = bateria.marca;
        modelo.value = bateria.modelo;
        tipo.value = bateria.tipo;
        voltaje.value = bateria.voltaje;
        capacidad.value = bateria.capacidad;
        stock.value = bateria.stock;
        minimo.value = bateria.minimo;
        precio.value = bateria.precio;
        batteryTitle.textContent = "Editar batería";
    }
    modal("batteryModal", true);
}
function closeBattery() {
    modal("batteryModal", false);
}
function saveBattery(evento) {
    evento.preventDefault();
    const datosBateria = {
        codigo: codigo.value.trim().toUpperCase(),
        marca: marca.value.trim().toUpperCase(),
        modelo: modelo.value.trim().toUpperCase(),
        tipo: tipo.value,
        voltaje: voltaje.value.trim(),
        capacidad: capacidad.value.trim(),
        stock: Number(stock.value),
        minimo: Number(minimo.value),
        precio: Number(precio.value)
    };
    const id = batteryId.value;
    const codigoRepetido = batteries.some(bateria => {
        return (
            bateria.codigo === datosBateria.codigo &&
            bateria.id !== id
        );
    });
    if (codigoRepetido) {
        alert("Ese código ya existe.");
        return;
    }
    if (id) {
        const bateriaExistente = batteries.find(
            bateria => bateria.id === id
        );
        Object.assign(
            bateriaExistente,
            datosBateria
        );
    } else {
        batteries.push({
            id: uid(),
            ...datosBateria
        });
    }
    DB.set("baterias", batteries);
    closeBattery();
    renderInventory();
}
function deleteBattery(id) {
    const confirmar = confirm(
        "¿Eliminar esta batería del inventario?"
    );
    if (!confirmar) {
        return;
    }
    batteries = batteries.filter(
        bateria => bateria.id !== id
    );
    DB.set("baterias", batteries);
    renderInventory();
}
function renderInventory() {
    const busqueda = invSearch.value
        .trim()
        .toLowerCase();
    const tipoSeleccionado = invType.value;
    const estadoSeleccionado = invStatus.value;
    const bateriasFiltradas = batteries.filter(bateria => {
        const texto =
            `${bateria.codigo} ${bateria.marca} ${bateria.modelo}`
                .toLowerCase();
        const coincideBusqueda =
            texto.includes(busqueda);
        const coincideTipo =
            !tipoSeleccionado ||
            bateria.tipo === tipoSeleccionado;
        const coincideEstado =
            !estadoSeleccionado ||
            statusBattery(bateria) === estadoSeleccionado;
        return (
            coincideBusqueda &&
            coincideTipo &&
            coincideEstado
        );
    });
    invBody.innerHTML = bateriasFiltradas
     .map(bateria => {
       const estado = statusBattery(bateria);
            return `
                <tr>
                    <td class="mono">
                        ${esc(bateria.codigo)}
                    </td>

                    <td>
                        <strong>
                            ${esc(bateria.marca)}
                        </strong>

                        <br>

                        <small>
                            ${esc(bateria.modelo)}
                        </small>
                    </td>

                    <td>
                        ${esc(bateria.tipo)}
                    </td>

                    <td>
                        ${esc(bateria.voltaje)}
                    </td>

                    <td>
                        ${esc(bateria.capacidad)}
                    </td>

                    <td class="mono">
                        ${bateria.stock}
                    </td>

                    <td>
                        ${money(bateria.precio)}
                    </td>

                    <td>
                        <span class="badge ${estado}">
                            ${statusText(estado)}
                        </span>
                    </td>

                    <td>
                        <div class="row-actions">
                            <button
                                class="icon-btn"
                                onclick="openBattery('${bateria.id}')"
                                title="Editar batería"
                            >
                                ✎
                            </button>

                            <button
                                class="icon-btn"
                                onclick="deleteBattery('${bateria.id}')"
                                title="Eliminar batería"
                            >
                                🗑
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join("");
    invEmpty.style.display =
        bateriasFiltradas.length ? "none" : "block";
    const totalUnidades = batteries.reduce(
        (total, bateria) =>
            total + bateria.stock,
        0);
    const valorInventario = batteries.reduce(
        (total, bateria) =>
            total + bateria.stock * bateria.precio,
        0);
    const bateriasConProblemas = batteries.filter(
        bateria => statusBattery(bateria) !== "ok"
    ).length;
    invModels.textContent = batteries.length;
    invUnits.textContent = totalUnidades;
    invValue.textContent = money(valorInventario);
    invLow.textContent = bateriasConProblemas;
    invCount.textContent =
        `${bateriasFiltradas.length} de ${batteries.length} baterías`;
}
document.addEventListener("DOMContentLoaded", initInventory);
