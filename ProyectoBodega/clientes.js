let clients = [];
function initClients() {
    requireSession();

    clients = DB.get("clientes", []);

    clientSearch.addEventListener("input", renderClients);
    clientForm.addEventListener("submit", saveClient);

    renderClients();
}

function openClient(id = "") {
    clientForm.reset();
    clientId.value = "";
    clientTitle.textContent = "Nuevo cliente";

    if (id) {
        const cliente = clients.find(item => item.id === id);

        clientId.value = cliente.id;
        cedula.value = cliente.cedula;
        nombre.value = cliente.nombre;
        telefono.value = cliente.telefono;
        correo.value = cliente.correo;
        direccion.value = cliente.direccion;

        clientTitle.textContent = "Editar cliente";
    }

    modal("clientModal", true);
}

function closeClient() {
    modal("clientModal", false);
}

function saveClient(evento) {
    evento.preventDefault();

    if (!validCedula(cedula.value)) {
        alert("La cédula debe contener 10 números.");
        return;
    }

    if (!/^\d{7,10}$/.test(telefono.value)) {
        alert("Ingrese un teléfono válido.");
        return;
    }

    const datosCliente = {
        cedula: cedula.value,
        nombre: nombre.value.trim().toUpperCase(),
        telefono: telefono.value,
        correo: correo.value.trim(),
        direccion: direccion.value.trim().toUpperCase()
    };

    const id = clientId.value;

    const cedulaRepetida = clients.some(cliente => {
        return (
            cliente.cedula === datosCliente.cedula &&
            cliente.id !== id
        );
    });

    if (cedulaRepetida) {
        alert("La cédula ya está registrada.");
        return;
    }

    if (id) {
        const clienteExistente = clients.find(
            cliente => cliente.id === id
        );

        Object.assign(clienteExistente, datosCliente);
    } else {
        clients.push({
            id: uid(),
            ...datosCliente
        });
    }

    DB.set("clientes", clients);

    closeClient();
    renderClients();
}

function deleteClient(id) {
    const confirmar = confirm(
        "¿Eliminar este cliente?"
    );

    if (!confirmar) {
        return;
    }

    clients = clients.filter(
        cliente => cliente.id !== id
    );

    DB.set("clientes", clients);
    renderClients();
}

function renderClients() {
    const busqueda = clientSearch.value
        .trim()
        .toLowerCase();

    const clientesFiltrados = clients.filter(cliente => {
        const texto = `${cliente.nombre} ${cliente.cedula}`
            .toLowerCase();

        return texto.includes(busqueda);
    });

    clientBody.innerHTML = clientesFiltrados
        .map(cliente => {
            return `
                <tr>
                    <td class="mono">
                        ${esc(cliente.cedula)}
                    </td>

                    <td>
                        ${esc(cliente.nombre)}
                    </td>

                    <td>
                        ${esc(cliente.telefono)}
                    </td>

                    <td>
                        ${esc(cliente.correo)}
                    </td>

                    <td>
                        ${esc(cliente.direccion)}
                    </td>

                    <td>
                        <div class="row-actions">
                            <button
                                class="icon-btn"
                                onclick="openClient('${cliente.id}')"
                                title="Editar cliente"
                            >
                                ✎
                            </button>

                            <button
                                class="icon-btn"
                                onclick="deleteClient('${cliente.id}')"
                                title="Eliminar cliente"
                            >
                                🗑
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        })
        .join("");

    clientEmpty.style.display =
        clientesFiltrados.length ? "none" : "block";

    clientCount.textContent =
        `${clientesFiltrados.length} de ${clients.length} clientes`;
}

document.addEventListener("DOMContentLoaded", initClients);
