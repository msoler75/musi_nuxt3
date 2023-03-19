<template>
  <div>
    <select v-model="current_lesson">
      <option v-for="lesson, index of courses[curso].lessons" :key="index">{{ lesson.name }}</option>
    </select>
    {{ current_lesson_data }}
    <button class="btn" @click="addbar">Add</button>
    <p>Bars: {{ bars.length }}</p>
    <div id="output"></div>
  </div>
</template>


<script setup>
import Vex from 'vexflow';
const { Registry, StaveNote } = Vex;

const concat = (a, b) => a.concat(b);
const transpose = ref(0)
const bars = ref([])
const curso = ref(0)
const current_lesson = ref("")
const current_lesson_data = computed(() => courses.value[0].lessons.find(les => les.name == current_lesson.value))

const courses = ref([
  {
    name: 'treble', clef: 'treble',
    lessons: [
      { name: 'E, G', notes: 'E4, G4' },
      { name: 'Añade F4', notes: 'E4, G4, F4' },
      { name: 'Añade C5', notes: 'E4, G4, F4, C5', priority: 'C5' },
      { name: 'Añade B4', notes: 'E4, G4, F4, B4, C5', priority: 'B4' },
      { name: 'Añade A4', notes: 'E4, G4, F4, A4, B4, C5', priority: 'A4' },
      { name: 'Añade D5', notes: 'E4, G4, F4, A4, B4, C5, D5', priority: 'D5' },
      { name: 'Añade E5', notes: 'E4, G4, F4, A4, B4, C5, D5, E5', priority: 'E5' },
      { name: 'Añade F5', notes: 'E4, G4, F4, A4, B4, C5, D5, E5, F5', priority: 'F5' },
      { name: 'Examen', notes: 'E4, G4, F4, A4, B4, C5, D5, E5, F5' },
      { name: 'Añade C4, D4', notes: 'C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5', priority: 'C4, D4' },
      { name: 'Añade B3', notes: 'B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5', priority: 'B3' },
      { name: 'Añade A3', notes: 'A3, B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5', priority: 'A3' },
      { name: 'Añade G3', notes: 'G3, A3, B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5', priority: 'G3' },
      { name: 'Añade F3', notes: 'F3 ,G3, A3, B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5', priority: 'F3' },
      { name: 'Lineas inferiores', notes: 'F3 ,G3, A3, B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5', priority: 'F3, G3, A3, B3, C4' },
      { name: 'Añade G5, A5', notes: 'F3 ,G3, A3, B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5, G5, A5', priority: 'G5, A5' },
      { name: 'Añade B5', notes: 'F3 ,G3, A3, B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5, G5, A5, B5', priority: 'B5' },
      { name: 'Añade C6', notes: 'F3 ,G3, A3, B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5, G5, A5, B5, C6', priority: 'C6' },
      { name: 'Añade D6', notes: 'F3 ,G3, A3, B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5, G5, A5, B5, C6, D6', priority: 'D6' },
      { name: 'Añade E6', notes: 'F3 ,G3, A3, B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5, G5, A5, B5, C6, D6, E6', priority: 'E6' },
      { name: 'Lineas superiores', notes: 'F3 ,G3, A3, B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5, G5, A5, B5, C6, D6, E6', priority: 'G5, A5, B5, C6, D6, E6' },
      { name: 'Examen', notes: 'F3 ,G3, A3, B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5, G5, A5, B5, C6, D6, E6' },
    ]
  }])


watch(current_lesson_data, value => {
  if (!value) return
  bars.value.splice(0, bars.value.length)
  addbars(1)
})

const sharpNotes = ['C','C#', 'D','D#', 'E','E#', 'F','F#','G','G#','A','A#', 'B', 'B#']
function transposeNote(note) {
  console.assert(sharpNotes.length==14, 'must be 14 notes')
  return note.replace(/(\w[#b]?)(\d)/, function(match, note, octave) {
    octave = parseInt(octave)
    var idx = sharpNotes.findIndex(snote=>snote==note)
    idx+=transpose.value
    while(idx>14)
    {
      idx-=14
      octave++
    }
    return sharpNotes[idx]+octave
  })
}

var lastNote = null  // sirve para que no se repitan notas tan a menudo
function getRandomNote(arr, priority) {
  var idx
  do {
    idx = Math.floor(Math.random() * arr.length)
  } while ((lastNote == arr[idx] && Math.random() > .2) || // un 20% de posibilidades de repetir la nota anterior
    (priority.length && Math.random() < .5 && !priority.includes(arr[idx]))) // si hay notas de prioridad, el 50% deben ser de la lista de prioritarias
  lastNote = arr[idx]
  return transposeNote(arr[idx])
}

function addbar() {
  const randomNotes = current_lesson_data.value.notes.split(/\s*,\s*/g).filter(x=>!!x)
  const priorityNotes = current_lesson_data.value.priority ? current_lesson_data.value.priority.split(/\s*?,\s*?/g).filter(x=>!!x) : []
  const bar = { notes: [] }
  for (var i = 0; i < 4; i++)
    bar.notes.push(getRandomNote(randomNotes, priorityNotes))
  bars.value.push(bar)
  console.log(bars.value)
  render()
}

function addbars(num) {
  for (var i = 0; i < num; i++)
    addbar()
}

function render() {

  document.getElementById('output').innerHTML = ''

  const { Factory, EasyScore, System } = Vex.Flow;

  const f = new Factory({
    renderer: { elementId: 'output', width: 2500, height: 300 },
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

  score.set({ time: '4/4' });

  for (var i = 0; i < bars.value.length; i++) {
    const bar = bars.value[i]

    const notestr = bar.notes.map(note => note + '/q').join(',')

    let system = appendSystem(220);

    let r = system
      .addStave({
        voices: [
          voice([notes(notestr)].reduce(concat)),
        ],
      })


    /* system
      .addStave({ voices: [voice(notes('(G3 B3 D4)/h, A3/q, A2/q', { clef: 'bass' }))] })
      .addClef('bass')
      .addKeySignature('C')
      .addTimeSignature('4/4');
    */

    if (i == 0) {
      r
        .addClef('treble')
        .addKeySignature('C')
        .addTimeSignature('4/4');

      system.addConnector('brace');
      system.addConnector('singleLeft');

    }
    else {

    }
    system.addConnector('singleRight');

  }

  /*
    //  Measure 2 
    
    system = appendSystem(150);
    system.addStave({ voices: [voice(notes('D5/q, G4, G4'))] });
    system.addStave({ voices: [voice(notes('B3/h.', { clef: 'bass' }))] });
    system.addConnector('singleRight');
  
  
    //  Measure 3 
    system = appendSystem(350);
    system.addStave({
      voices: [voice([notes('E5/q[id="m3a"]'), beam(notes('C5/8, D5, E5, F5', { stem: 'down' }))].reduce(concat))],
    });
  
    system.addStave({ voices: [voice(notes('C4/h.', { clef: 'bass' }))] });
    system.addConnector('singleRight');
  
    //  Measure 4 
    system = appendSystem(150);
    system.addStave({ voices: [voice(notes('G5/q[id="m4a"], G4[id="m4b"], G4[id="m4c"]'))] });
  
    system.addStave({ voices: [voice(notes('B3/h.', { clef: 'bass' }))] });
    system.addConnector('singleRight');
  */


  f.draw();
}

onMounted(() => {

  render()

})

</script>


