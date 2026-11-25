const PRECIO_CAMPO = 95000;

const campo = document.getElementById("campo");
const inputSector = document.getElementById("sector");
const selectCantidad = document.getElementById("cantidad");
const totalEl = document.getElementById("total");
const btnConfirmar = document.getElementById("btnConfirmar");
const stockEl = document.getElementById("stock");
const modalAgotado = new bootstrap.Modal(document.getElementById("modalAgotado"));

let sectorSeleccionado = false;

// ---------- Audios del cartel + notificación de Fede ----------
// Después del cartel de "sin entradas" suenan estos audios, uno atrás del otro
// (poné los archivos en esta carpeta). Cuando termina el último aparece la notificación.
// Para sumar o cambiar audios, editá esta lista (se reproducen en orden).
const AUDIOS_CARTEL = ["audio-agotado-1.wav", "audio-agotado-2.wav"];
const SONIDO_NOTIF = "sonido-mensaje.mp3"; // el "ruidito" de mensaje nuevo
const PAUSA_ENTRE_AUDIOS = 300; // ms entre un audio y el siguiente
const PAUSA_DESPUES_AUDIO = 600; // ms entre que termina el último audio y aparece la notificación
const NOTIF_SIN_AUDIO = 1500; // ms de espera si ningún audio suena (no están o el navegador no deja)

const notifWsp = document.getElementById("notifWsp");
const notifAvatar = document.getElementById("notifAvatar");
// Un solo reproductor para todos los audios del cartel: el click en "Confirmar" lo habilita
// una vez y después le vamos cambiando el archivo (así el navegador deja sonar el 2º, 3º, etc.)
const audioCartel = new Audio();
audioCartel.preload = "auto";
const audioNotif = new Audio(SONIDO_NOTIF);
audioNotif.preload = "auto";
let notifMostrada = false;
let audiosListos = false;

// Foto de Fede: si existe foto-fede.png se usa, si no queda el emoji
const fotoFede = new Image();
fotoFede.alt = "Fede";
fotoFede.onload = () => {
  notifAvatar.textContent = "";
  notifAvatar.appendChild(fotoFede);
};
fotoFede.src = "foto-fede.png";

// Los navegadores solo dejan sonar después de un click: con el click en
// "Confirmar compra" se "preparan" los dos audios en silencio.
function prepararAudio(audio) {
  try {
    audio.muted = true;
    const listo = () => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = false;
    };
    const p = audio.play();
    if (p && p.then) p.then(listo).catch(() => (audio.muted = false));
    else listo();
  } catch (e) {
    audio.muted = false;
  }
}

function prepararAudios() {
  if (audiosListos) return;
  audiosListos = true;
  audioCartel.src = AUDIOS_CARTEL[0];
  prepararAudio(audioCartel);
  prepararAudio(audioNotif);
}

function mostrarNotificacion() {
  if (notifMostrada) return;
  notifMostrada = true;
  notifWsp.removeAttribute("aria-hidden");
  notifWsp.removeAttribute("tabindex");
  notifWsp.classList.add("visible");
  try {
    audioNotif.currentTime = 0;
    const p = audioNotif.play();
    if (p && p.catch) p.catch(() => {});
  } catch (e) {}
  try {
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  } catch (e) {}
}

// Suenan los audios del cartel en orden y, al terminar el último, llega la notificación de Fede.
// Si un audio no está o no se puede reproducir, se saltea y sigue con el próximo
// (en la consola del navegador, F12, aparece un aviso con el nombre del archivo que falló).
function reproducirAudiosCartel() {
  let sono = false;

  const siguiente = (i) => {
    if (i >= AUDIOS_CARTEL.length) {
      setTimeout(mostrarNotificacion, sono ? PAUSA_DESPUES_AUDIO : NOTIF_SIN_AUDIO);
      return;
    }
    const archivo = AUDIOS_CARTEL[i];
    let terminado = false;
    const pasar = (ok) => {
      if (terminado) return;
      terminado = true;
      audioCartel.removeEventListener("ended", alTerminar);
      audioCartel.removeEventListener("error", alFallar);
      if (ok) sono = true;
      setTimeout(() => siguiente(i + 1), ok ? PAUSA_ENTRE_AUDIOS : 0);
    };
    const alTerminar = () => {
      console.log("[audio] terminó: " + archivo);
      pasar(true);
    };
    const alFallar = (err) => {
      const motivo = (audioCartel.error && audioCartel.error.message) || (err && err.name) || "desconocido";
      console.warn("[audio] falló: " + archivo + " → " + motivo);
      pasar(false);
    };
    audioCartel.addEventListener("ended", alTerminar);
    audioCartel.addEventListener("error", alFallar);
    try {
      audioCartel.muted = false;
      audioCartel.src = archivo;
      console.log("[audio] reproduciendo: " + archivo);
      const p = audioCartel.play();
      if (p && p.catch) p.catch(alFallar); // el navegador no lo dejó sonar
    } catch (e) {
      alFallar();
    }
  };

  siguiente(0);
}

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
  prepararAudios();
  btnConfirmar.disabled = true;
  btnConfirmar.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Procesando...';

  setTimeout(() => {
    stockEl.textContent = "0";
    clearInterval(timer);            // frena el contador de stock
    campo.style.pointerEvents = "none";   // ya no se puede clickear el campo
    selectCantidad.disabled = true;
    document.getElementById("nombre").disabled = true;
    document.getElementById("email").disabled = true;
    btnConfirmar.innerHTML = "Agotado";   // el botón queda deshabilitado
    modalAgotado.show();
    reproducirAudiosCartel(); // al terminar los audios aparece la notificación de Fede
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
