// Arreglo que almacenará todos los clientes cargados desde localStorage
let clients = [];

// Inicializa el módulo de clientes
function initClients() {

    // Verifica que exista una sesión iniciada
    requireSession();

    // Carga los clientes almacenados
    clients = DB.get("clientes", []);

    // Evento para buscar clientes en tiempo real
    clientSearch.addEventListener("input", renderClients);

    // Evento para guardar clientes al enviar el formulario
    clientForm.addEventListener("submit", saveClient);

    // Muestra la lista inicial de clientes
    renderClients();
}

// Abre el formulario para crear o editar un cliente
function openClient(id = "") {

    // Limpia el formulario
    clientForm.reset();

    // Vacía el campo oculto del ID
    clientId.value = "";

    // Título por defecto
    clientTitle.textContent = "Nuevo cliente";

    // Si se recibe un ID, se cargan los datos para edición
    if (id) {

        const cliente = clients.find(item => item.id === id);

        // Llena los campos con la información existente
        clientId.value = cliente.id;
        cedula.value = cliente.cedula;
        nombre.value = cliente.nombre;
        telefono.value = cliente.telefono;
        correo.value = cliente.correo;
        direccion.value = cliente.direccion;

        // Cambia el título del formulario
        clientTitle.textContent = "Editar cliente";
    }

    // Muestra la ventana modal
    modal("clientModal", true);
}

// Cierra la ventana modal de clientes
function closeClient() {
    modal("clientModal", false);
}

// Guarda un cliente nuevo o actualiza uno existente
function saveClient(evento) {

    // Evita que el formulario recargue la página
    evento.preventDefault();

    // Valida que la cédula tenga 10 dígitos
    if (!validCedula(cedula.value)) {
        alert("La cédula debe contener 10 números.");
        return;
    }

    // Valida el número telefónico
    if (!/^\d{7,10}$/.test(telefono.value)) {
        alert("Ingrese un teléfono válido.");
        return;
    }

    // Objeto con los datos del cliente
    const datosCliente = {
        cedula: cedula.value,
        nombre: nombre.value.trim().toUpperCase(),
        telefono: telefono.value,
        correo: correo.value.trim(),
        direccion: direccion.value.trim().toUpperCase()
    };

    // Obtiene el ID del cliente si existe
    const id = clientId.value;

    // Verifica que no exista otra cédula igual
    const cedulaRepetida = clients.some(cliente => {
        return (
            cliente.cedula === datosCliente.cedula &&
            cliente.id !== id
        );
    });

    // Si la cédula ya existe, cancela el registro
    if (cedulaRepetida) {
        alert("La cédula ya está registrada.");
        return;
    }

    // Si existe ID, actualiza el cliente
    if (id) {

        const clienteExistente = clients.find(
            cliente => cliente.id === id
        );

        Object.assign(clienteExistente, datosCliente);

    } else {

        // Si no existe ID, crea un nuevo cliente
        clients.push({
            id: uid(),
            ...datosCliente
        });
    }

    // Guarda los cambios en localStorage
    DB.set("clientes", clients);

    // Cierra el formulario
    closeClient();

    // Actualiza la tabla
    renderClients();
}

// Elimina un cliente
function deleteClient(id) {

    // Solicita confirmación antes de eliminar
    const confirmar = confirm(
        "¿Eliminar este cliente?"
    );

    if (!confirmar) {
        return;
    }

    // Filtra la lista eliminando el cliente seleccionado
    clients = clients.filter(
        cliente => cliente.id !== id
    );

    // Guarda los cambios
    DB.set("clientes", clients);

    // Actualiza la tabla
    renderClients();
}

// Muestra los clientes en la tabla
function renderClients() {

    // Obtiene el texto de búsqueda
    const busqueda = clientSearch.value
        .trim()
        .toLowerCase();

    // Filtra clientes por nombre o cédula
    const clientesFiltrados = clients.filter(cliente => {

        const texto = `${cliente.nombre} ${cliente.cedula}`
            .toLowerCase();

        return texto.includes(busqueda);
    });

    // Genera dinámicamente las filas de la tabla
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

                            <!-- Botón para editar -->
                            <button
                                class="icon-btn"
                                onclick="openClient('${cliente.id}')"
                                title="Editar cliente"
                            >
                                ✎
                            </button>

                            <!-- Botón para eliminar -->
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

    // Muestra mensaje si no existen resultados
    clientEmpty.style.display =
        clientesFiltrados.length ? "none" : "block";

    // Actualiza el contador de clientes
    clientCount.textContent =
        `${clientesFiltrados.length} de ${clients.length} clientes`;
}

// Ejecuta la inicialización cuando la página termina de cargar
document.addEventListener("DOMContentLoaded", initClients);