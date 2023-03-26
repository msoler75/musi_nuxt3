import { PitchDetector } from "pitchy";

function calcularNota(frecuencia) {
  const notas = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];
  const numNotas = notas.length;

  // Calcular el número de semitonos desde A4 (la nota de referencia)
  const numSemitonos = 12 * (Math.log2(frecuencia / 440) + 4) + 21;

  // Calcular el índice de la nota en la lista de notas
  const indiceNota = Math.round(numSemitonos) % numNotas;
  const octava =
    Math.floor((Math.round(numSemitonos) - indiceNota) / numNotas) - 1;

  // Devolver la nota en formato "C#4", "D5", etc.
  return notas[indiceNota] + octava;
}

var audioContext = null;
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("resume-button")
    .addEventListener("click", () => audioContext.resume());

  document.getElementById("start-button").addEventListener("click", startRec);
});

// const SAMPLE_RATE = 16; // Frecuencia de muestreo en milisegundos
const PEAK_THRESHOLD_RATIO = 0.65; // Umbral de detección de picos
const PEAK_HISTORY_SIZE = 10; // Tamaño del historial de picos
var maxPeakDetected = 30;
var peakAverage = 0

let peakHistory = [50]; // Historial de picos detectados

function calcDelta(inputLevel) {
  // Detectar el inicio de una nota (cuando el nivel de entrada supera el umbral)
  maxPeakDetected = Math.max(inputLevel, maxPeakDetected);

  peakAverage = getPeakAverage();
  maxPeakDetected -= maxPeakDetected > peakAverage * 1.5 ? 4 : 0.05 // baja mucho más rápido el maxPeakDetected si acaso se ha detectado un anómalo peak maximo ;

  if (
    inputLevel >
    (PEAK_THRESHOLD_RATIO * (maxPeakDetected + getPeakAverage())) / 2
  ) {
    // Agregar el nuevo pico al historial de picos y recortar el historial si es necesario
    peakHistory.push(inputLevel);
    if (peakHistory.length > PEAK_HISTORY_SIZE) {
      peakHistory.shift();
    }

    // Calcular el valor pico promedio de los últimos picos detectados
    const peakAverage = getPeakAverage();

    // Devolver el valor pico promedio como delta
    return peakAverage;
  }

  // Si no se ha detectado el inicio de una nota, devolver null
  return 0;
}

function getPeakAverage() {
  // Calcular el valor pico promedio de los últimos picos detectados
  const peakValues = peakHistory.filter((value) => value > 0);
  const peakAverage =
    peakValues.reduce((sum, value) => sum + value, 0) / peakValues.length;

  // Si no se han detectado picos aún, devolver 0
  return peakValues.length > 0 ? peakAverage : 0;
}

// Polyfill para requestAnimationFrame
const requestAnimationFrame =
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  function (callback) {
    window.setTimeout(callback, 1000 / 60);
  };

function startRec() {
  // Obtener el objeto de audio del navegador
  audioContext = new AudioContext();

  // Obtener el flujo de audio desde el micrófono
  navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
    // Crear un nodo de entrada de audio
    const sourceNode = audioContext.createMediaStreamSource(stream);

    // Crear un nodo de analizador de espectro de frecuencia
    const analyserNode = audioContext.createAnalyser();
    // analyserNode.fftSize = 2048; // tamaño de la transformada de Fourier
    analyserNode.smoothingTimeConstant = 0.2;

    // Conectar el nodo de entrada al nodo de analizador
    sourceNode.connect(analyserNode);

    // Crear un búfer para almacenar los datos de nivel de entrada
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function loop(analyserNode, detector, input, sampleRate) {
      // Obtener los datos de nivel de entrada del analizador
      analyserNode.getByteFrequencyData(dataArray);

      // Calcular el promedio de los datos de nivel de entrada
      const volume = dataArray.reduce((a, b) => a + b) / bufferLength;

      const delta = calcDelta(volume);

      analyserNode.getFloatTimeDomainData(input);
      const [pitch, clarity] = detector.findPitch(input, sampleRate);

      document.getElementById("pitch").textContent = `${
        Math.round(pitch * 10) / 10
      } Hz`;
      document.getElementById("clarity").textContent = `${Math.round(
        clarity * 100
      )} %`;
      document.getElementById("volume").textContent = `${volume}`;
      document.getElementById("delta").textContent = `${delta}`;
      document.getElementById("note").textContent = delta
        ? calcularNota(pitch)
        : "";
      document.getElementById("data").textContent = `max: ${Math.round(maxPeakDetected)} avg: ${Math.round(peakAverage)}`;

      requestAnimationFrame(() =>
        loop(analyserNode, detector, input, sampleRate)
      );
    }

    const detector = PitchDetector.forFloat32Array(analyserNode.fftSize);
    const input = new Float32Array(detector.inputLength);
    loop(analyserNode, detector, input, audioContext.sampleRate);
  });
}
