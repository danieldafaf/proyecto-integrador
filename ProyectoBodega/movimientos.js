let movimientos = [];

function initMovimientos() {
  requireSession();
  movimientos = DB.get("movimientos", []);
  movSearch.addEventListener("input", renderMovimientos);
  movTipo.addEventListener("change", renderMovimientos);
  renderMovimientos();
}

function renderMovimientos() {
  const q = movSearch.value.trim().toLowerCase();
  const tipo = movTipo.value;

  const filtrados = movimientos.filter(
    (m) =>
      `${m.tipo || ''} ${m.producto || ''} ${m.usuario || ''} ${m.detalle || ''}`
        .toLowerCase()
        .includes(q) &&
      (!tipo || m.tipo === tipo)
  );

  movBody.innerHTML = filtrados
    .map((m) => {
      // Formateo seguro de fecha
      let fechaTexto = m.fecha;
      if (m.fecha && !isNaN(Date.parse(m.fecha)) && !String(m.fecha).includes("/")) {
        fechaTexto = new Date(m.fecha).toLocaleString("es-EC");
      }

      // badge CSS: ENTRADA -> verde (ok), SALIDA -> amarillo/naranja (low), ELIMINACIÓN/Otros -> rojo (out)
      const badgeClass =
        m.tipo === "ENTRADA"
          ? "ok"
          : m.tipo === "SALIDA"
          ? "low"
          : "out";

      return `<tr>
        <td>${esc(fechaTexto || "")}</td>
        <td>
          <span class="badge ${badgeClass}">${esc(m.tipo || "")}</span>
        </td>
        <td><strong>${esc(m.producto || "")}</strong></td>
        <td class="mono">${m.cantidad}</td>
        <td>${esc(m.detalle || "")}</td>
        <td>${esc(m.usuario || "Sistema")}</td>
      </tr>`;
    })
    .join("");

  movEmpty.style.display = filtrados.length ? "none" : "block";
}

document.addEventListener("DOMContentLoaded", initMovimientos);