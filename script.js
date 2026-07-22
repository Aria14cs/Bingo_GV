/* ==========================================================================
   ESTADO DEL JUEGO
   ========================================================================== */
const TOTAL_NUMEROS = 75;
const INTERVALO_SEGUNDOS = 7;
const CLAVE_STORAGE = 'bingoGranjaVilla';

let tombola = [];
let numerosCantados = [];
let autoPlayInterval = null;

/* ==========================================================================
   REFERENCIAS AL DOM
   ========================================================================== */
const dom = {
  balotaDisplay: document.getElementById('balotaDisplay'),
  direccionDisplay: document.getElementById('direccionDisplay'),
  tablero: document.getElementById('tableroBingo'),
  contadorInfo: document.getElementById('contadorInfo'),
  btnManual: document.getElementById('btnManual'),
  btnAuto: document.getElementById('btnAuto'),
  btnReset: document.getElementById('btnReset'),
  modalGracias: document.getElementById('modalGracias'),
  btnCerrarModal: document.getElementById('btnCerrarModal'),
  logoBox: document.getElementById('logoBox'),
  logoInput: document.getElementById('logoInput'),
};

/* ==========================================================================
   UTILIDADES DE DIRECCIONES(TEMA DEL BINGO)
   ========================================================================== */
function obtenerNombreDireccion(numero) {
  if (numero <= 15) return `Bolillero digital #${numero}`;
  if (numero <= 30) return `Bolillero digital #${numero}`;
  if (numero <= 45) return `Bolillero digital #${numero}`;
  if (numero <= 60) return `Bolillero digital #${numero}`;
  return `Bolillero digital #${numero}`;
}

/* ==========================================================================
   TABLERO
   ========================================================================== */
function inicializarTablero() {
  dom.tablero.innerHTML = '';
  const letras = ['B', 'I', 'N', 'G', 'O'];

  letras.forEach((letra, index) => {
    const fila = document.createElement('div');
    fila.className = 'fila-bingo';

    const indicador = document.createElement('div');
    indicador.className = 'letra-indicador';
    indicador.innerText = letra;
    fila.appendChild(indicador);

    const inicioRango = index * 15 + 1;
    for (let j = 0; j < 15; j++) {
      const numero = inicioRango + j;
      const casilla = document.createElement('div');
      casilla.className = 'casilla-numero';
      casilla.id = `num-${numero}`;
      casilla.innerText = String(numero).padStart(2, '0');
      fila.appendChild(casilla);
    }

    dom.tablero.appendChild(fila);
  });
}

function marcarCasilla(numero) {
  const casilla = document.getElementById(`num-${numero}`);
  if (casilla) casilla.classList.add('marcada');
}

function actualizarContador() {
  dom.contadorInfo.innerText = `Direcciones cantadas: ${numerosCantados.length} / ${TOTAL_NUMEROS}`;
}

/* ==========================================================================
   SONIDO (Web Audio API, sin archivos externos)
   ========================================================================== */
function reproducirAlertaSonora() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    reproducirTono(audioCtx, 880, 0, 0.1);
    reproducirTono(audioCtx, 1200, 0.1, 0.15);
  } catch (error) {
    console.warn('Audio no soportado o bloqueado por el navegador');
  }
}

function reproducirTono(audioCtx, frecuencia, retrasoSegundos, duracionSegundos) {
  setTimeout(() => {
    const oscilador = audioCtx.createOscillator();
    const ganancia = audioCtx.createGain();
    oscilador.type = 'sine';
    oscilador.frequency.setValueAtTime(frecuencia, audioCtx.currentTime);
    ganancia.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscilador.connect(ganancia);
    ganancia.connect(audioCtx.destination);
    oscilador.start();
    oscilador.stop(audioCtx.currentTime + duracionSegundos);
  }, retrasoSegundos * 1000);
}

/* ==========================================================================
   LÓGICA PRINCIPAL DEL SORTEO
   ========================================================================== */
function cantarNumero() {
  if (tombola.length === 0) {
    detenerAutoPlay();
    mostrarModalGracias();
    return false;
  }

  const indiceAleatorio = Math.floor(Math.random() * tombola.length);
  const balota = tombola.splice(indiceAleatorio, 1)[0];
  numerosCantados.push(balota);

  dom.balotaDisplay.innerText = balota;
  dom.direccionDisplay.innerText = obtenerNombreDireccion(balota);

  marcarCasilla(balota);
  reproducirAlertaSonora();
  actualizarContador();

  if (tombola.length === 0) {
    detenerAutoPlay();
    setTimeout(mostrarModalGracias, 200);
  }

  return true;
}

/* ==========================================================================
   AUTO-PLAY
   ========================================================================== */
function toggleAutoPlay() {
  if (autoPlayInterval) {
    detenerAutoPlay();
    return;
  }

  cantarNumero();
  autoPlayInterval = setInterval(cantarNumero, INTERVALO_SEGUNDOS * 1000);
  dom.btnAuto.innerText = '⏸️ DETENER AUTO-PLAY';
  dom.btnAuto.classList.add('activo');
  dom.btnManual.disabled = true;
}

function detenerAutoPlay() {
  if (autoPlayInterval) {
    clearInterval(autoPlayInterval);
    autoPlayInterval = null;
  }
  dom.btnAuto.innerText = '⏱️ INICIAR AUTO-PLAY (7s)';
  dom.btnAuto.classList.remove('activo');
  dom.btnManual.disabled = false;
}

/* ==========================================================================
   REINICIO DEL JUEGO
   ========================================================================== */
function reiniciarJuego() {
  detenerAutoPlay();
  tombola = crearTombola();
  numerosCantados = [];

  dom.balotaDisplay.innerText = '--';
  dom.direccionDisplay.innerText = '¡Preparando motores en la línea de salida!';

  inicializarTablero();
  actualizarContador();
}

function crearTombola() {
  return Array.from({ length: TOTAL_NUMEROS }, (_, i) => i + 1);
}

/* ==========================================================================
   MODAL DE AGRADECIMIENTO
   ========================================================================== */
function mostrarModalGracias() {
  dom.modalGracias.classList.add('activo');
}

function cerrarModal() {
  dom.modalGracias.classList.remove('activo');
}

/* ==========================================================================
   ALMACENAMIENTO LOCAL (logo y fotos de animales)
   ========================================================================== */
function obtenerImagenesGuardadas() {
  try {
    const datos = localStorage.getItem(CLAVE_STORAGE);
    return datos ? JSON.parse(datos) : {};
  } catch (error) {
    console.warn('No se pudo leer localStorage:', error);
    return {};
  }
}

function guardarImagen(id, dataUrl) {
  try {
    const imagenes = obtenerImagenesGuardadas();
    imagenes[id] = dataUrl;
    localStorage.setItem(CLAVE_STORAGE, JSON.stringify(imagenes));
  } catch (error) {
    console.warn('No se pudo guardar en localStorage (imagen muy pesada):', error);
  }
}

function pintarImagen(contenedor, dataUrl) {
  contenedor.innerHTML = `<img src="${dataUrl}" alt="imagen">`;
}

function cargarImagenesGuardadas() {
  const imagenes = obtenerImagenesGuardadas();
  Object.keys(imagenes).forEach((id) => {
    const contenedor = document.getElementById(id);
    if (contenedor) pintarImagen(contenedor, imagenes[id]);
  });
}

/* ==========================================================================
   CARGA DE IMÁGENES (LOGO Y ANIMALES)
   ========================================================================== */
function cargarImagen(archivo, contenedor) {
  if (!archivo) return;

  const lector = new FileReader();
  lector.onload = (evento) => {
    const dataUrl = evento.target.result;
    pintarImagen(contenedor, dataUrl);
    guardarImagen(contenedor.id, dataUrl);
  };
  lector.readAsDataURL(archivo);
}

function configurarSelectorImagen(cajaId, inputId) {
  const caja = document.getElementById(cajaId);
  const input = document.getElementById(inputId);

  caja.addEventListener('click', () => input.click());
  input.addEventListener('change', (evento) => {
    cargarImagen(evento.target.files[0], caja);
  });
}

/* ==========================================================================
   EVENTOS
   ========================================================================== */
function registrarEventos() {
  dom.btnManual.addEventListener('click', cantarNumero);
  dom.btnAuto.addEventListener('click', toggleAutoPlay);
  dom.btnReset.addEventListener('click', reiniciarJuego);
  dom.btnCerrarModal.addEventListener('click', cerrarModal);

  configurarSelectorImagen('logoBox', 'logoInput');
  for (let i = 1; i <= 5; i++) {
    configurarSelectorImagen(`animalBox${i}`, `animalInput${i}`);
  }
}

/* ==========================================================================
   INICIALIZACIÓN
   ========================================================================== */
function iniciar() {
  tombola = crearTombola();
  inicializarTablero();
  actualizarContador();
  registrarEventos();
  cargarImagenesGuardadas();
}

document.addEventListener('DOMContentLoaded', iniciar);
