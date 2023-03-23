import Vex from "vexflow";

export const useScore = () => {
  const { Registry, StaveNote } = Vex;
  const lessonData = ref({});

  // settings
  const globalTranspose = ref(0); // global transpose

  // score
  const concat = (a, b) => a.concat(b);
  const notesSequence = ref([])
  const bars = ref([]);


  function draw(domElement, _lessonData, clef) {
    if (!_lessonData) return;

    lessonData.value = _lessonData;

    bars.value.splice(0, bars.value.length);
    addbars(lessonData.value.notes.length * 1.25);
    render(domElement, clef);
  }

  const semitones = [
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
  function transposeNote(note, transpose) {
    if (!transpose) return note;
    return note.replace(/(\w[#b]?)(\d)/, function (match, note, octave) {
      octave = parseInt(octave);
      var idx = semitones.findIndex((snote) => snote == note);
      console.assert(idx >= 0, "idx es cero");
      idx += transpose;
      while (idx >= 12) {
        idx -= 12;
        octave++;
      }
      return semitones[idx] + octave;
    });
  }

  // distance in semitones
  function getDistance(note1, note2) {
    const o1 = parseInt(note1.match(/\d/));
    const o2 = parseInt(note2.match(/\d/));
    const n1 = note1.replace(/\d+/, "");
    const n2 = note2.replace(/\d+/, "");
    var idx1 = note1 ? semitones.findIndex((snote) => snote == n1) : 0;
    var idx2 = semitones.findIndex((snote) => snote == n2);
    const dist = Math.abs(idx1 + o1 * 12 - (idx2 + o2 * 12));
    return dist;
  }

  function isSharp(note) {
    return note.indexOf("#") >= 0;
  }

  var lastNote = "C3"; // sirve para que no se repitan notas tan a menudo
  function getRandomNote(settings) {
    const arr = settings.notes.split(/\s*,\s*/g).filter((x) => !!x);
    const priority = settings.priority
      ? settings.priority.split(/\s*?,\s*?/g).filter((x) => !!x)
      : [];
    var idx;
    var distance = 2;
    var loops = 24;
    var bestNote;
    var bestScore = 0;
    var fail = false;
    do {
      idx = Math.floor(Math.random() * arr.length);
      var note = arr[idx];
      distance = getDistance(lastNote, note);
      const cond1 = distance < settings.maxDistance || Math.random() < 0.05; // el 95% de los intervalos deben estar dentro del rango máximo
      const cond2 =
        settings.priorizeDistances.includes(distance) || Math.random() > 0.85; // el 85% de intervalos deberían de estar entre la lista
      const cond3 = settings.hasSharpedNotes || !isSharp(note); // en el 100% de los casos no puede haber notas sharp, si no está permitido
      const cond4 =
        !priority.length || priority.includes(note) || Math.random() < 0.4; // si hay notas de prioridad, el 60% de intentos deben ser notas prioritarias
      const cond5 = lastNote != note; // no deben repetirse notas
      const score1 = cond1 ? 1 : 0;
      const score2 = cond2 ? 1 : 0;
      const score3 = cond3 ? 1 : 0;
      const score4 = cond4 ? 1 : 0;
      const score5 = cond5 ? 2 : 0;
      const score = score1 + score2 + score3 + score4 + score5;
      fail = score < 6;
      if (score > bestScore) {
        bestNote = note;
        bestScore = score;
      }
    } while (loops-- > 0 && fail);

    lastNote = bestNote;
    var finalNote = transposeNote(bestNote, globalTranspose.value);
    if (settings.chords) {
      const idx = Math.floor(Math.random() * settings.chords.length);
      const chord = settings.chords[idx]
        .split(/\s*,\s*/)
        .map((x) => parseInt(x));
      const notes = [finalNote];
      for (const extra of chord) {
        var addedNote = transposeNote(finalNote, extra);
        const cond = settings.hasSharpedNotes || !isSharp(addedNote);
        if (!cond) addedNote = transposeNote(addedNote, -1);
        notes.push(addedNote);
      }
      finalNote = "(" + notes.join(" ") + ")";
    }
    return finalNote;
  }

  
  function addbar() {
    if (!lessonData.value) return;
    const bar = { notes: [] };
    for (var i = 0; i < 4; i++) 
    {
      const id = notesSequence.value.length
      const note = getRandomNote(lessonData.value)
      notesSequence.value.push({note, id})
      bar.notes.push(note+`/q[id="${id}"]`);
    }
    bars.value.push(bar);
  }

  function addbars(num) {
    for (var i = 0; i < num; i++) addbar();
  }

  function render(domElement, clef) {
    domElement.innerHTML = "";

    if (!domElement.id) domElement.id = "scoreOutput";

    const { Factory, EasyScore, System } = Vex.Flow;

    const f = new Factory({
      renderer: {
        elementId: domElement.id,
        width: 200 + bars.value.length * 220,
        height: 200,
      },
    });

    const score = f.EasyScore();

    const registry = new Registry();
    Registry.enableDefaultRegistry(registry);

    // Retrieve the element from the registry and cast to StaveNote, so we can call .addModifier( ) later.
    const id = (id) => registry.getElementById(id);

    // Bind these three functions so the code looks cleaner.
    // Instead of score.voice(...), just call voice(...).
    const voice = score.voice.bind(score);
    const notes = score.notes.bind(score);
    const beam = score.beam.bind(score);

    let x = 120;
    let y = 80;

    function appendSystem(width) {
      const system2 = f.System({ x, y, width, spaceBetweenStaves: 10 });
      x += width;
      return system2;
    }

    score.set({ time: "4/4" });

    for (var i = 0; i < bars.value.length; i++) {
      const bar = bars.value[i];

      const notestr = bar.notes.map((note) => note).join(",");

      let system = appendSystem(220);

      let r = system.addStave({
        voices: [voice([notes(notestr)].reduce(concat))],
      });

      /* system
    .addStave({ voices: [voice(notes('(G3 B3 D4)/h, A3/q, A2/q', { clef: 'bass' }))] })
    .addClef('bass')
    .addKeySignature('C')
    .addTimeSignature('4/4');
    */

      if (i == 0) {
        r.addClef(clef)
          .addKeySignature("C")
          .addTimeSignature("4/4");

        system.addConnector("singleLeft");
      }
      system.addConnector("singleRight");
    }

    f.draw();
  }

  return { draw, globalTranspose, notesSequence };
}
