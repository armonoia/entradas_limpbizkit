const PRECIO_CAMPO = 95000;

const campo = document.getElementById("campo");
const inputSector = document.getElementById("sector");
const selectCantidad = document.getElementById("cantidad");
const totalEl = document.getElementById("total");
const btnConfirmar = document.getElementById("btnConfirmar");
const stockEl = document.getElementById("stock");
const modalAgotado = new bootstrap.Modal(document.getElementById("modalAgotado"));

let sectorSeleccionado = false;

function formatearPesos(valor) {
  return "$" + valor.toLocaleString("es-AR");
}

function actualizarTotal() {
  const cantidad = parseInt(selectCantidad.value, 10);
  totalEl.textContent = sectorSeleccionado ? formatearPesos(PRECIO_CAMPO * cantidad) : "$0";
}

// Seleccionar / deseleccionar el campo
campo.addEventListener("click", () => {
  sectorSeleccionado = !sectorSeleccionado;
  campo.classList.toggle("seleccionado", sectorSeleccionado);
  inputSector.value = sectorSeleccionado ? "Campo general" : "Ningún sector seleccionado";
  btnConfirmar.disabled = !sectorSeleccionado;
  actualizarTotal();
});

selectCantidad.addEventListener("change", actualizarTotal);

// Confirmar compra: simula procesar y muestra el popup de "sin entradas"
btnConfirmar.addEventListener("click", () => {
  btnConfirmar.disabled = true;
  btnConfirmar.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

  setTimeout(() => {
    stockEl.textContent = "0";
    modalAgotado.show();
    btnConfirmar.innerHTML = "Confirmar compra";
    btnConfirmar.disabled = !sectorSeleccionado;
  }, 1800);
});

// Efecto de urgencia: el stock baja solo mientras estás en la página
let stock = 12;
const timer = setInterval(() => {
  if (stock > 3) {
    stock -= 1;
    stockEl.textContent = stock;
  } else {
    clearInterval(timer);
  }
}, 4000);
