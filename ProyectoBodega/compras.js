// Configuración de EmailJS
const EMAILJS_PUBLIC_KEY = "ln4lawwy60ag-vtOI";
const EMAILJS_SERVICE_ID = "service_3o917fr";
const EMAILJS_TEMPLATE_ID = "template_7hydai8";

let compras = [];

// Inicialización del módulo de compras
function initCompras() {
  requireSession();
  
  compraFecha.value = new Date().toISOString().slice(0, 10);
  compras = DB.get("compras", []);
  
  cargarProductosCompra();
  
  // Event listeners
  purchaseForm.addEventListener("submit", guardarCompra);
  compraCantidad.addEventListener("input", actualizarTotalCompra);
  compraPrecio.addEventListener("input", actualizarTotalCompra);
  
  renderCompras();
  
  // Inicializar EmailJS si las llaves han sido configuradas
  if (window.emailjs && EMAILJS_PUBLIC_KEY !== "TU_PUBLIC_KEY") {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
  }
}

// Carga las opciones del menú desplegable de productos
function cargarProductosCompra() {
  const productos = DB.get("productos", []);
  
  compraProducto.innerHTML = '<option value="">Seleccione un producto</option>' + 
    productos.map(p => `<option value="${p.id}">${esc(p.nombre)} · Stock: ${p.stock}</option>`).join("");
}

// Actualiza en tiempo real el costo total de la compra
function actualizarTotalCompra() {
  const cantidad = Number(compraCantidad.value);
  const precio = Number(compraPrecio.value);
  
  compraTotal.textContent = money(cantidad * precio);
}

// Registra la nueva compra y actualiza el stock en la base de datos local
async function guardarCompra(e) {
  e.preventDefault();
  
  const productos = DB.get("productos", []);
  const producto = productos.find(p => p.id === compraProducto.value);
  const cantidad = Number(compraCantidad.value);
  const precio = Number(compraPrecio.value);

  // Validaciones básicas
  if (!producto) return alert("Seleccione un producto.");
  if (cantidad <= 0 || precio < 0) return alert("Cantidad o precio inválido.");

  // Actualización de stock e historial de compras
  producto.stock += cantidad;
  const total = cantidad * precio;
  
  const compra = {
    id: uid(),
    fecha: compraFecha.value,
    proveedor: compraProveedor.value.trim(),
    productoId: producto.id,
    producto: producto.nombre,
    cantidad,
    precio,
    total,
    correo: correoCompra.value.trim()
  };

  compras.unshift(compra);
  DB.set("productos", productos);
  DB.set("compras", compras);

  // Registro en historial de movimientos y notificación
  registrarMovimiento("ENTRADA", producto.nombre, cantidad, `Compra a ${compra.proveedor}`);
  await enviarCorreo(compra);

  // Reiniciar formulario y refrescar interfaz
  purchaseForm.reset();
  compraFecha.value = new Date().toISOString().slice(0, 10);
  cargarProductosCompra();
  renderCompras();
  
  alert("Compra registrada y stock actualizado.");
}

// Envío del correo electrónico mediante la API de EmailJS
async function enviarCorreo(compra) {
  if (!window.emailjs || EMAILJS_PUBLIC_KEY === "TU_PUBLIC_KEY") {
    console.info("EmailJS no configurado. Complete las credenciales en compras.js.");
    return;
  }

  try {
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: compra.correo,
      fecha: compra.fecha,
      proveedor: compra.proveedor,
      producto: compra.producto,
      cantidad: compra.cantidad,
      total: money(compra.total)
    });
  } catch (error) {
    console.error("Error enviando correo:", error);
    alert("La compra se registró, pero el correo no pudo enviarse. Revise la configuración de EmailJS.");
  }
}

// Renderizado de la tabla con el listado de compras
function renderCompras() {
  purchaseBody.innerHTML = compras.map(c => `
    <tr>
      <td>${esc(c.fecha)}</td>
      <td>${esc(c.proveedor)}</td>
      <td>${esc(c.producto)}</td>
      <td>${c.cantidad}</td>
      <td>${money(c.total)}</td>
      <td>${esc(c.correo)}</td>
    </tr>
  `).join("");

  purchaseEmpty.style.display = compras.length ? "none" : "block";
}

// Inicialización al cargar el DOM
document.addEventListener("DOMContentLoaded", initCompras);
