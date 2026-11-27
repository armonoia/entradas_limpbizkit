// ============================================================
//  CHAT DE FEDE
//  Es el mismo chat de whatsapp.js, pero solo con Fede: se abre
//  desde la notificación que aparece en la web de entradas.
//  Arranca con tu botón "amigo conseguiste entrada?" y sigue la charla.
// ============================================================
const CHAT = {
  nombre: "Fede",
  avatar: "😎",
  foto: "foto-fede.png", // opcional: si no está el archivo, se ve el emoji
  guion: [
    // Primero hablás vos: el botón y el mensaje enviado dicen exactamente lo mismo
    {
      hora: "15:09", // hora a la que sale tu mensaje
      opciones: [
        {
          boton: "amigo conseguiste entrada?",
          envia: "amigo conseguiste entrada?",
        },
      ],
    },

    { de: "fede", texto: "siii amigo", hora: "15:10" },

    // Poné la captura en captura-entradas.png (en esta misma carpeta)
    {
      de: "fede",
      imagen: "captura-entradas.png",
      texto: "re voy, venis no? o te conseguimos entradas? conozco un tipo que revende, no va a salir unos mangos pero vamoooo",
      hora: "15:10",
    },

    {
      opciones: [
        {
          boton: "si amigoooo olvidate ya fue",
          envia: "no amigo, trabajo ese día asi que pinchó mal, me lo llego a pedir y me matan",
        },
        {
          boton: "re falto al laburo no me importa nada",
          envia: "no tranqui amigo no consegui y aparte laburo ese dia, ya falte una banda imposible pedirme otro día más",
        },
        {
          boton: "gordo no me hagas estoooo",
          envia: "no amigo ando full laburo ese día, asi que ya fue. Me llego a pedir el dia y me rajan ni pinta",
        },
      ],
    },

    { de: "fede", texto: "daa amigooo, pero posta te lo vas a perder? es tu banda", hora: "15:12" },
    { de: "fede", texto: "ya fuee cerra todo y vamo si total siempre te dejan en banda a vos ahí, todo bien que te guste el laburo pero es limp bizkit boludo", hora: "15:12" },

    {
      opciones: [
        {
          boton: "sabes que si tenes razon gordo, olvidateee yendo",
          envia: "no amigo posta no puedo, hay que laburar es así",
        },
        {
          boton: "uh lpm pero si quiero irrr",
          envia: "no amigo tranka otro vez será ya fuee, prefiero bancarmela esta vez",
        },
        {
          boton: "QUE SIII QUIERO IRRRR",
          envia: "amigoo, laburo olvidate, gracias igual pero no puedo faltar de nuevo",
        },
      ],
    },

    { de: "fede", texto: "👍", hora: "15:14" },
    { de: "fede", texto: "bueno amigo olvidate tranqui, ya se nos dará", hora: "15:15" },
  ],
};

// Sonido que suena cuando llega un mensaje (poné el archivo en esta misma carpeta)
const SONIDO_MENSAJE = "sonido-mensaje.mp3";

// Sonido que suena cuando tocás una respuesta y se envía tu mensaje
const SONIDO_ENVIADO = "sonido-enviado.mp3";

// ---------- Elementos ----------
const panelesEl = document.getElementById("paneles");
const opcionesCont = document.getElementById("opcionesCont");
const estadoEl = document.getElementById("estado");
const headerAvatar = document.getElementById("headerAvatar");
const headerTitulo = document.getElementById("headerTitulo");

const chat = CHAT;
chat.escribiendo = false;
chat.ultimaHora = null;

// ---------- Utilidades ----------
const esperar = (ms) => new Promise((res) => setTimeout(res, ms));

function el(etiqueta, clase) {
  const nodo = document.createElement(etiqueta);
  if (clase) nodo.className = clase;
  return nodo;
}

function horaActual() {
  return new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}

// "09:05" + 1 minuto -> "09:06"
function sumarMinutos(hora, minutos) {
  const [h, m] = hora.split(":").map(Number);
  const total = (h * 60 + m + minutos) % (24 * 60);
  return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
}

// ---------- Sonidos ----------
const audioMensaje = new Audio(SONIDO_MENSAJE);
const audioEnviado = new Audio(SONIDO_ENVIADO);
audioMensaje.preload = "auto";
audioEnviado.preload = "auto";

function reproducir(audio) {
  try {
    audio.currentTime = 0;
    const p = audio.play();
    if (p && p.catch) p.catch(() => {}); // si el navegador lo bloquea o falta el archivo, sigue sin sonido
  } catch (e) {}
}

const sonar = () => reproducir(audioMensaje); // llega un mensaje
const sonarEnviado = () => reproducir(audioEnviado); // se envía tu mensaje

// Los navegadores solo dejan sonar después de un toque: se "preparan" en silencio
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
  } catch (e) {}
}

// El primer toque en la pantalla (por ejemplo, elegir una respuesta) habilita los sonidos
document.addEventListener(
  "pointerdown",
  () => {
    prepararAudio(audioMensaje);
    prepararAudio(audioEnviado);
  },
  { once: true }
);

function bajarScroll(suave = true) {
  chat.panel.scrollTo({ top: chat.panel.scrollHeight, behavior: suave ? "smooth" : "auto" });
}

// Foto del contacto: si existe el archivo se ve la foto, si no, el emoji
function ponerAvatar(nodo) {
  nodo.textContent = chat.avatar;
  if (!chat.foto) return;
  const img = new Image();
  img.alt = chat.nombre;
  img.onload = () => {
    nodo.textContent = "";
    nodo.appendChild(img);
  };
  img.src = chat.foto;
}

function refrescarEstado() {
  estadoEl.textContent = chat.escribiendo ? "escribiendo..." : "en línea";
  estadoEl.classList.toggle("escribiendo", chat.escribiendo);
}

// ---------- Armado de la conversación ----------
chat.panel = el("section", "mensajes activo");
const dia = el("div", "dia");
dia.textContent = "Hoy";
chat.panel.appendChild(dia);
panelesEl.appendChild(chat.panel);

chat.opcionesEl = el("div", "opciones activo");
opcionesCont.appendChild(chat.opcionesEl);

ponerAvatar(headerAvatar);
headerTitulo.textContent = chat.nombre;
document.title = chat.nombre + " | Mensajes";
refrescarEstado();

// ---------- Mensajes ----------
function agregarMensaje(paso, tipo, suave = true) {
  const burbuja = el("div", "burbuja " + tipo);

  if (paso.imagen) {
    burbuja.classList.add("con-foto");
    const foto = el("div", "foto");
    const img = new Image();
    img.alt = "Captura de pantalla";
    img.addEventListener("load", () => bajarScroll(suave));
    img.addEventListener("error", () => {
      // Si todavía no está el archivo, se muestra un recuadro en su lugar
      foto.classList.add("falta");
      foto.textContent = "📷 Acá va la captura (" + paso.imagen + ")";
    });
    img.src = paso.imagen;
    foto.appendChild(img);
    burbuja.appendChild(foto);
  }

  if (paso.texto) {
    const texto = el("span", "texto");
    texto.textContent = paso.texto;
    burbuja.appendChild(texto);
  }

  const meta = el("span", "meta");
  meta.textContent = paso.hora || horaActual();

  let tilde = null;
  if (tipo === "saliente") {
    tilde = el("span", "tilde");
    tilde.textContent = "✓✓";
    meta.appendChild(tilde);
  }

  burbuja.appendChild(meta);
  chat.panel.appendChild(burbuja);
  bajarScroll(suave);
  return tilde;
}

function mostrarEscribiendo() {
  const indicador = el("div", "escribiendo-burbuja");
  indicador.innerHTML = "<span></span><span></span><span></span>";
  chat.panel.appendChild(indicador);
  chat.escribiendo = true;
  refrescarEstado();
  bajarScroll();
  return indicador;
}

function ocultarEscribiendo(indicador) {
  indicador.remove();
  chat.escribiendo = false;
  refrescarEstado();
}

async function mensajeEntrante(paso) {
  const indicador = mostrarEscribiendo();
  // Cuanto más largo el mensaje, más tarda en "escribirlo"
  await esperar(900 + Math.min((paso.texto || "").length * 25, 1800));
  ocultarEscribiendo(indicador);
  agregarMensaje(paso, "entrante");
  if (paso.hora) chat.ultimaHora = paso.hora;
  sonar();
  await esperar(500);
}

// ---------- Texto con temblor ----------
// Cómo tiemblan las notas de pensamiento:
//   "letras"   -> cada letra por separado (el más lindo, pero el más pesado)
//   "palabras" -> tiembla cada palabra entera (mucho más liviano)
//   "no"       -> sin temblor
const TEMBLOR = "palabras";

function llenarConTemblor(elemento, texto) {
  if (TEMBLOR === "no") {
    elemento.textContent = texto;
    return;
  }

  const palabras = texto.split(" ");
  palabras.forEach((palabra, i) => {
    const contenedorPalabra = document.createElement("span");
    contenedorPalabra.className = "palabra";

    if (TEMBLOR === "palabras") {
      contenedorPalabra.classList.add("letra");
      contenedorPalabra.textContent = palabra;
      contenedorPalabra.style.animationDuration = (0.18 + Math.random() * 0.25).toFixed(2) + "s";
      contenedorPalabra.style.animationDelay = (-Math.random() * 0.5).toFixed(2) + "s";
      elemento.appendChild(contenedorPalabra);
      if (i < palabras.length - 1) elemento.appendChild(document.createTextNode(" "));
      return;
    }

    for (const letra of palabra) {
      const span = document.createElement("span");
      span.className = "letra";
      span.textContent = letra;
      span.style.animationDuration = (0.18 + Math.random() * 0.25).toFixed(2) + "s";
      span.style.animationDelay = (-Math.random() * 0.5).toFixed(2) + "s";
      contenedorPalabra.appendChild(span);
    }

    elemento.appendChild(contenedorPalabra);
    if (i < palabras.length - 1) elemento.appendChild(document.createTextNode(" "));
  });
}

// ---------- Respuestas del usuario ----------
function elegirRespuesta(opciones) {
  return new Promise((resolver) => {
    chat.opcionesEl.innerHTML = "";
    opciones.forEach((opcion) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "opcion";
      // El botón muestra lo que pensás de verdad...
      llenarConTemblor(btn, opcion.boton);
      btn.addEventListener("click", () => {
        chat.opcionesEl.innerHTML = "";
        // ...pero al chat sale la versión educada
        resolver(opcion.envia);
      });
      chat.opcionesEl.appendChild(btn);
    });
    bajarScroll();
  });
}

async function respuestaUsuario(opciones, horaFija) {
  const texto = await elegirRespuesta(opciones);
  // Sale un minuto después del último mensaje que llegó
  const hora = horaFija || (chat.ultimaHora ? sumarMinutos(chat.ultimaHora, 1) : horaActual());
  const tilde = agregarMensaje({ texto, hora }, "saliente");
  chat.ultimaHora = hora;
  sonarEnviado();
  // Los tildes se ponen verdes cuando "leen" el mensaje
  await esperar(900);
  tilde.classList.add("leido");
  await esperar(600);
}

// ---------- Motor ----------
async function correrGuion(desde = 0) {
  for (let i = desde; i < chat.guion.length; i++) {
    const paso = chat.guion[i];
    if (paso.opciones) {
      await respuestaUsuario(paso.opciones, paso.hora);
    } else {
      await mensajeEntrante(paso);
    }
  }
}

// ---------- Cartel final ----------
// Cuando termina la charla con Fede, aparece este cartel para volver a la tienda
const TEXTO_CARTEL_FINAL = "Volve a la tienda";

function mostrarCartelFinal() {
  // Capa que tapa toda la pantalla: no se puede tocar nada de lo de atrás
  const overlay = document.createElement("div");
  overlay.className = "cartel-overlay";
  const cartel = document.createElement("div");
  cartel.className = "cartel-final";
  cartel.setAttribute("role", "alertdialog");
  cartel.innerHTML =
    '<div class="cartel-barra"><span></span><span></span><span></span></div>' +
    '<div class="cartel-texto"></div>';
  cartel.querySelector(".cartel-texto").textContent = TEXTO_CARTEL_FINAL;
  overlay.appendChild(cartel);
  document.body.appendChild(overlay);
  // Bloquea también el teclado y los clicks en el chat de atrás
  document.querySelector(".app").inert = true;
  // Un instante después, para que se vea la animación de entrada
  requestAnimationFrame(() => cartel.classList.add("visible"));
}

async function iniciar() {
  await esperar(800);
  await correrGuion(0);
  await esperar(1200);
  mostrarCartelFinal();
}

// ---------- Patrón de fondo con tus imágenes ----------
// Pone las imágenes chiquitas, en posiciones y giros al azar, repartidas
// por todo el fondo del chat (con un poco de opacidad).
const IMAGENES_PATRON = ["estrella.png", "espiral.png", "flor.png"];
const COLOR_FONDO_CHAT = "#2b1a3c"; // violeta de la paleta

// Se dibuja todo UNA sola vez en un canvas (una sola imagen fija), así el
// navegador no tiene que recalcular nada mientras usás el chat.
let imagenesPatron = null; // se cargan una sola vez

function cargarImagenesPatron() {
  if (!imagenesPatron) {
    imagenesPatron = Promise.all(
      IMAGENES_PATRON.map(
        (src) =>
          new Promise((resolver) => {
            const img = new Image();
            img.onload = () => resolver(img);
            img.onerror = () => resolver(null); // si falta una, se ignora
            img.src = src;
          })
      )
    ).then((lista) => lista.filter(Boolean));
  }
  return imagenesPatron;
}

// ajustes: celda (cuanto más chica, más imágenes), tamaño y opacidad
async function generarPatron(patron, ajustes) {
  const { celda, tamMin, tamMax, alfaMin, alfaMax, fondo } = ajustes;
  const ancho = patron.clientWidth;
  const alto = patron.clientHeight;
  if (!ancho || !alto) return;

  let canvas = patron.querySelector("canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    patron.appendChild(canvas);
  }

  const escala = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = ancho * escala;
  canvas.height = alto * escala;
  canvas.style.width = ancho + "px";
  canvas.style.height = alto + "px";

  const ctx = canvas.getContext("2d");
  ctx.scale(escala, escala);

  // Fondo liso (cambiá el color arriba si querés otro)
  ctx.fillStyle = fondo;
  ctx.fillRect(0, 0, ancho, alto);

  const imagenes = await cargarImagenesPatron();
  if (imagenes.length === 0) return;

  // Si el navegador no soporta filtros en canvas (ej. Safari), se usa
  // otro modo de mezcla para que no queden cuadrados blancos.
  const soportaFiltro = "filter" in ctx;

  const columnas = Math.ceil(ancho / celda);
  const filas = Math.ceil(alto / celda);

  for (let f = 0; f < filas; f++) {
    for (let c = 0; c < columnas; c++) {
      if (Math.random() < 0.2) continue; // deja algunos huecos

      const img = imagenes[Math.floor(Math.random() * imagenes.length)];
      const tam = tamMin + Math.random() * (tamMax - tamMin);
      const cx = c * celda + celda / 2 + (Math.random() - 0.5) * (celda - tam);
      const cy = f * celda + celda / 2 + (Math.random() - 0.5) * (celda - tam);

      // Recorte cuadrado desde el centro de la imagen
      const lado = Math.min(img.width, img.height);
      const sx = (img.width - lado) / 2;
      const sy = (img.height - lado) / 2;

      ctx.save();
      ctx.globalAlpha = alfaMin + Math.random() * (alfaMax - alfaMin);
      if (soportaFiltro) {
        ctx.globalCompositeOperation = "screen";
        ctx.filter = "invert(1) hue-rotate(180deg)";
      } else {
        ctx.globalCompositeOperation = "multiply";
      }
      ctx.translate(cx, cy);
      ctx.rotate((Math.random() * 360 * Math.PI) / 180);
      ctx.drawImage(img, sx, sy, lado, lado, -tam / 2, -tam / 2, tam, tam);
      ctx.restore();
    }
  }
}

// Tamaño, cantidad y opacidad de las imágenes del patrón
const AJUSTES_CHAT = { celda: 90, tamMin: 32, tamMax: 52, alfaMin: 0.1, alfaMax: 0.2, fondo: COLOR_FONDO_CHAT };

function dibujarPatrones() {
  generarPatron(document.getElementById("patron"), AJUSTES_CHAT);
}

// Si cambia el tamaño de la ventana, se vuelve a armar el patrón
let timerPatron;
window.addEventListener("resize", () => {
  clearTimeout(timerPatron);
  timerPatron = setTimeout(dibujarPatrones, 250);
});

// ---------- Arranque ----------
dibujarPatrones();
iniciar();
