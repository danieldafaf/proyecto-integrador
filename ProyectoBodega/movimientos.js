let movimientos = [];

// Inicializa el módulo de movimientos
function initMovimientos() {
  requireSession(); // Verifica que exista una sesión activa

  // Carga los movimientos almacenados
  movimientos = DB.get("movimientos", []);

  // Eventos para búsqueda y filtrado
  movSearch.addEventListener("input", renderMovimientos);
  movTipo.addEventListener("change", renderMovimientos);

  // Muestra los movimientos
  renderMovimientos();
}

// Renderiza la tabla de movimientos
function renderMovimientos() {

  // Obtiene los filtros aplicados
  const q = movSearch.value.trim().toLowerCase();
  const tipo = movTipo.value;

  // Filtra movimientos por texto y tipo
  const filtrados = movimientos.filter(
    (m) =>
      `${m.tipo || ''} ${m.producto || ''} ${m.usuario || ''} ${m.detalle || ''}`
        .toLowerCase()
        .includes(q) &&
      (!tipo || m.tipo === tipo)
  );

  // Genera las filas de la tabla
  movBody.innerHTML = filtrados
    .map((m) => {

      // Formatea la fecha para mostrarla correctamente
      let fechaTexto = m.fecha;

      if (
        m.fecha &&
        !isNaN(Date.parse(m.fecha)) &&
        !String(m.fecha).includes("/")
      ) {
        fechaTexto = new Date(m.fecha).toLocaleString("es-EC");
      }

      // Asigna una clase visual según el tipo de movimiento
      const badgeClass =
        m.tipo === "ENTRADA"
          ? "ok"       // Verde
          : m.tipo === "SALIDA"
          ? "low"      // Amarillo/Naranja
          : "out";     // Rojo para eliminación u otros

      return `<tr>
        <td>${esc(fechaTexto || "")}</td>

        <td>
          <span class="badge ${badgeClass}">
            ${esc(m.tipo || "")}
          </span>
        </td>

        <td>
          <strong>${esc(m.producto || "")}</strong>
        </td>

        <td class="mono">
          ${m.cantidad}
        </td>

        <td>
          ${esc(m.detalle || "")}
        </td>

        <td>
          ${esc(m.usuario || "Sistema")}
        </td>
      </tr>`;
    })
    .join("");

  // Muestra u oculta el mensaje de tabla vacía
  movEmpty.style.display = filtrados.length ? "none" : "block";
}

// Ejecuta la inicialización al cargar la página
document.addEventListener("DOMContentLoaded", initMovimientos);