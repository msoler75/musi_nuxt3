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

// const SAMPLE_RATE = 16; // Frecuencia de muestreo en milisegundos
const PEAK_THRESHOLD_RATIO = 0.65; // Umbral de detección de picos
const PEAK_HISTORY_SIZE = 30; // Tamaño del historial de picos
const PEAK_MIN_TIME = 300; // tiempo mínimo entre picos (milisegundos)
const VOLUME_HISTORY_SIZE = 0.9 * PEAK_MIN_TIME / 16; // nº de muestras de los últimos pitch registrados
var maxPeakDetected = 20;
var peakAverage = 0;
var lastPeakTime = 0;
var waitingPeak = true;
var volumeAverage = 0

const peakHistory = [20]; // Historial de picos detectados
let volumeHistory = []

function detectPeak(inputLevel) {
  const now = +new Date();

  volumeAverage = getVolumeAverage()

  volumeHistory.push(inputLevel);
  if (volumeHistory.length > VOLUME_HISTORY_SIZE) {
    volumeHistory.shift();
  }

  // Detectar el inicio de una nota (cuando el nivel de entrada supera el umbral)
  
  maxPeakDetected = Math.max(inputLevel, maxPeakDetected);

  peakAverage = getPeakAverage();
  maxPeakDetected -= maxPeakDetected > peakAverage * 1.5 ? 2 : 0.05; // baja mucho más rápido el maxPeakDetected si acaso se ha detectado un anómalo peak maximo ;

  // primer filtro: el inputLevel actual es suficiente como para estar en la categoría de pico?
  if (
    inputLevel >
    (PEAK_THRESHOLD_RATIO * (maxPeakDetected + peakAverage)) / 2
  ) {
    // Agregar el nuevo pico al historial de picos y recortar el historial si es necesario
    
    peakHistory.push(inputLevel);
    if (peakHistory.length > PEAK_HISTORY_SIZE) {
      peakHistory.shift();
    }

    const elapsed = now - lastPeakTime;
    
    // segundo filtro:
    // -estamos esperando un pico? porque si hemos tenido un pico reciente hemos de esperar al menos PEAK_MIN_TIME milisegundos
    // -este pico detectado es una caída de los últimos milisegundos? porque si estamos en caída no es un pico real

    // si estamos pendientes del próximo pico
    if (waitingPeak && elapsed > PEAK_MIN_TIME && inputLevel > volumeAverage) {
      // Calcular el valor pico promedio de los últimos picos detectados
      const peakAverage = getPeakAverage();
      lastPeakTime = now;
      volumeHistory.splice(0,volumeHistory.length)
      // Devolver el valor pico promedio como peak
      return peakAverage;
    }
  }

  // Si no se ha detectado el inicio de una nota,(o no la estábamos esperando con waitPeak) devolver 0
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

function getVolumeAverage() {
  return volumeHistory.length?volumeHistory.reduce((sum, value) => sum + value, 0) / volumeHistory.length: 0
}

export const useTuner = () => {
  const running = ref(false);
  const pitch = ref(0);
  const clarity = ref(0);
  const note = ref("");
  const volumeMeter = ref(0);
  const maxPeak = ref(0);
  const avgPeak = ref(0);

  var audioContext = null;

  // Polyfill para requestAnimationFrame
  const requestAnimationFrame =
    window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    window.msRequestAnimationFrame ||
    function (callback) {
      window.setTimeout(callback, 1000 / 60);
    };

  var lastNotes = [];
  const numSamples = (1000 / 60) * 0.1; // 1/10 of second
  // const minSamples = numSamples / 2;

  function waitPeak() {
    lastNotes = [];
    waitingPeak = true;
    // note.value = "";
  }

  function getBestNote() {
    const notes = {};
    for (var i = 0; i < lastNotes.length; i++) {
      var note = lastNotes[i];
      if (!note) continue;
      if (!(note in notes)) notes[note] = 1;
      else notes[note]++;
    }
    var bestNote = "";
    var bestScore = 0;
    // console.log(notes)
    for (var note in notes) {
      if (notes[note] > bestScore /* && notes[note] > minSamples*/) {
        bestNote = note;
        bestScore = notes[note];
        // console.log("bestScore", bestScore);
      }
    }
    return bestNote;
  }

  function start() {
    if (running.value) return;
    running.value = true;

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

        const peak = detectPeak(volume);

        analyserNode.getFloatTimeDomainData(input);
        const [pitchDetected, clarityDetected] = detector.findPitch(
          input,
          sampleRate
        );

        volumeMeter.value = volume;
        maxPeak.value = Math.round(maxPeakDetected);
        avgPeak.value = Math.round(peakAverage);
        clarity.value = clarityDetected;
        pitch.value = pitchDetected;
        note.value = peak ? calcularNota(pitchDetected) : "";

        lastNotes.push(note.value);

        if (lastNotes.length >= numSamples) lastNotes.shift();

        // note.value = getBestNote();

        console.log(
          "pitch:", 
          Math.round(pitch.value),
          "avgPeak:",
          Math.round(avgPeak.value),
          "maxPeak:",
          Math.round(maxPeak.value),
          "volume:",
          Math.round(volumeAverage),
          "note:",
          note.value,
          "clarity:",
          clarity.value
        );

        if (running.value) {
          requestAnimationFrame(() =>
            loop(analyserNode, detector, input, sampleRate)
          );
        }
      }

      const detector = PitchDetector.forFloat32Array(analyserNode.fftSize);
      const input = new Float32Array(detector.inputLength);
      loop(analyserNode, detector, input, audioContext.sampleRate);
    });
  }

  function stop() {
    running.value = false;
  }

  return {
    start,
    stop,
    running,
    note,
    pitch,
    clarity,
    volumeMeter,
    maxPeak,
    avgPeak,
    waitPeak,
    lastNotes,
  };
};
