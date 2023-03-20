import Wad from "web-audio-daw";

export const usePitchDetector = () => {
  var voice = null;
  var tuner = null;
  const running = ref(false);
  const note = ref("");

  function init() {
    voice = new Wad({ source: "mic" }); // At this point, your browser will ask for permission to access your microphone.

    tuner = new Wad.Poly();
    tuner.setVolume(0); // If you're not using headphones, you can eliminate microphone feedback by muting the output from the tuner.
    tuner.add(voice);
  }

  var lastNotes = [];
  const numSamples = (1000 / 60) * 0.5; // 1/2 of second
  const minSamples = numSamples / 2;

  function clearLastNote() {
    lastNotes = [];
  }

  function getEffectiveNote() {
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
      if (notes[note] > bestScore && notes[note] > minSamples) {
        bestNote = note;
        bestScore = notes[note];
      }
    }
    return bestNote;
  }

  function start() {
    voice.play(); // You must give your browser permission to access your microphone before calling play().

    tuner.updatePitch(); // The tuner is now calculating the pitch and note name of its input 60 times per second. These values are stored in <code>tuner.pitch</code> and <code>tuner.noteName</code>.

    const logPitch = function () {
      lastNotes.push(tuner.noteName);

      if (lastNotes.length >= numSamples) lastNotes.shift();

      note.value = getEffectiveNote();
      // console.log(tuner.pitch, tuner.noteName, note.value, numSamples);

      if (running.value) requestAnimationFrame(logPitch);
    };
    running.value = true;

    logPitch();
  }

  function stop() {
    tuner.stopUpdatingPitch(); // Stop calculating the pitch if you don't need to know it anymore.
    running.value = false;
  }

  return { init, start, stop, running, note, clearLastNote };
};
