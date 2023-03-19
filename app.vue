<template>
  <div>
    <select v-model="current_lesson">
      <option v-for="level, index of courses[curso].lessons" :key="level.name">{{ level.name }}</option>
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
const bars = ref([])
const curso = ref(0)
const current_lesson = ref("")
const current_lesson_data = computed(() => courses.value[0].lessons.find(les => les.name == current_lesson.value))

const courses = ref([
  {
    name: 'treble', clef: 'treble',
    lessons: [
      { name: 'E, G', notes: 'E3, G3' },
      { name: 'Añade F3', notes: 'E3, G3, F3' },
      { name: 'Añade C4', notes: 'E3, G3, F3, C4', priority: 'C4' },
      { name: 'Añade B3', notes: 'E3, G3, F3, B3, C4', priority: 'B3' },
      { name: 'Añade A3', notes: 'E3, G3, F3, A3, B3, C4', priority: 'A3' },
      { name: 'Añade D4', notes: 'E3, G3, F3, A3, B3, C4, D4', priority: 'D4' },
      { name: 'Añade E4', notes: 'E3, G3, F3, A3, B3, C4, D4, E4', priority: 'E4' },
      { name: 'Añade F4', notes: 'E3, G3, F3, A3, B3, C4, D4, E4, F4', priority: 'F4' },
      { name: 'Examen', notes: 'E3, G3, F3, A3, B3, C4, D4, E4, F4' },
      { name: 'Añade C3, D3', notes: 'C3, D3, E3, G3, F3, A3, B3, C4, D4, E4, F4', priority: 'C3, D3' },
      { name: 'Añade B2', notes: 'B2, C3, D3, E3, G3, F3, A3, B3, C4, D4, E4, F4', priority: 'B2' },
      { name: 'Añade A2', notes: 'A2, B2, C3, D3, E3, G3, F3, A3, B3, C4, D4, E4, F4', priority: 'A2' },
      { name: 'Añade G2', notes: 'G2, A2, B2, C3, D3, E3, G3, F3, A3, B3, C4, D4, E4, F4', priority: 'G2' },
      { name: 'Añade F2', notes: 'F2 ,G2, A2, B2, C3, D3, E3, G3, F3, A3, B3, C4, D4, E4, F4', priority: 'F2' },
      { name: 'Lineas inferiores', notes: 'F2 ,G2, A2, B2, C3, D3, E3, G3, F3, A3, B3, C4, D4, E4, F4', priority: 'F2, G2, A2, B2, C3' },
      { name: 'Añade G4, A4', notes: 'F2 ,G2, A2, B2, C3, D3, E3, G3, F3, A3, B3, C4, D4, E4, F4, G4, A4', priority: 'G4, A4' },
      { name: 'Añade B4', notes: 'F2 ,G2, A2, B2, C3, D3, E3, G3, F3, A3, B3, C4, D4, E4, F4, G4, A4, B4', priority: 'B4' },
      { name: 'Añade C5', notes: 'F2 ,G2, A2, B2, C3, D3, E3, G3, F3, A3, B3, C4, D4, E4, F4, G4, A4, B4, C5', priority: 'C5' },
      { name: 'Añade D5', notes: 'F2 ,G2, A2, B2, C3, D3, E3, G3, F3, A3, B3, C4, D4, E4, F4, G4, A4, B4, C5, D5', priority: 'D5' },
      { name: 'Añade E5', notes: 'F2 ,G2, A2, B2, C3, D3, E3, G3, F3, A3, B3, C4, D4, E4, F4, G4, A4, B4, C5, D5, E5', priority: 'E5' },
      { name: 'Lineas superiores', notes: 'F2 ,G2, A2, B2, C3, D3, E3, G3, F3, A3, B3, C4, D4, E4, F4, G4, A4, B4, C5, D5, E5', priority: 'G4, A4, B4, C5, D5, E5' },
      { name: 'Examen', notes: 'F2 ,G2, A2, B2, C3, D3, E3, G3, F3, A3, B3, C4, D4, E4, F4, G4, A4, B4, C5, D5, E5' },
    ]
  }])


watch(current_lesson_data, value => {
  if (!value) return
  bars.value.splice(0, bars.value.length)
  addbars(8)
})

var lastNote = null  // sirve para que no se repitan notas tan a menudo
function getRandomNote(arr, priority) {
  var idx
  do {
    idx = Math.floor(Math.random() * arr.length)
  } while ((lastNote == arr[idx] && Math.random() > .2) || // un 20% de posibilidades de repetir la nota anterior
    (priority.length && Math.random() < .5 && !priority.includes(arr[idx]))) // si hay notas de prioridad, el 50% deben ser de la lista de prioritarias
  lastNote = arr[idx]
  return arr[idx]
}

function addbar() {
  const randomNotes = current_lesson_data.value.notes.split(/\s*?,\s*?/g).map(x=>!!x)
  const priorityNotes = current_lesson_data.value.priority ? current_lesson_data.value.priority.split(/\s*?,\s*?/g).map(x=>!!x) : []
  const bar = { notes: [] }
  for (var i = 0; i < 4; i++)
    bar.notes.push(getRandomNote(randomNotes, priorityNotes))
  bars.value.push(bar)
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


