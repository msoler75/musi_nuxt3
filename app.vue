<template>
  <div class="flex-expander h-full content base-100 base-content">
    <div class="overflow-x-auto mb-auto flex-grow" ref="scroller">
      <div id="output"></div>
    </div>
    <div class="mt-auto p-4 space-x-4 w-full justify-between">
      <div class="flex">
        <div class="flex space-x-4">
          <select v-model="current_lesson" class="select select-bordered">
            <option v-for="lesson, index of courses[settings.course].lessons" :key="index">{{ lesson.name }}</option>
          </select>
          <button class="btn btn-primary" @click="regenerate()">
            <Icon name='codicon:debug-restart' />
          </button>
        </div>
        <div class="flex items-center ml-auto space-x-4">
          <span>{{ speed }}</span>
          <button class="btn btn-secondary" @click="position = 0; pause();">
            <Icon name="mdi:rewind" />
          </button>
          <button class="btn btn-secondary" @click="speed -= 10">
            <Icon name="mdi:speedometer-slow" />
          </button>
          <button class="btn btn-secondary" @click="speed += 10">
            <Icon name="mdi:speedometer" />
          </button>
          <button class="btn btn-primary" @click="playpause()">
            <Icon :name="playIcon" />
          </button>
        </div>
      </div>
    </div>
  </div>
</template>


<script setup>
import Vex from 'vexflow';
const { Registry, StaveNote } = Vex;

const settings = useSettings()

// play

var rAF = null // window.requestAnimationFrame || window.setTimeout(func, 1000/16)
const scroller = ref(null)
const playing = ref(false)
const playIcon = computed(() => !playing.value ? 'material-symbols:play-arrow-rounded' : 'material-symbols:pause')
const position = ref(0)
const speed = ref(30)


function restart() {
  position.value = 0
}

function play() {
  playing.value = true
}

function pause() {
  playing.value = false
}

function playpause() {
  if (playing.value) pause(); else play()
}

function nextFrame() {
  rAF(() => {
    if (playing.value) {
      position.value += speed.value / (1000 / 16)
    }
    nextFrame()
  })
}

watch(position, value => {
  scroller.value.scrollLeft = value
})




// score
const concat = (a, b) => a.concat(b);
const transpose = ref(0)
const bars = ref([])

// output
const ready = ref(false)

// lessons
const current_lesson = ref("E, G")
const current_course = computed(() => settings.course >= 0 && settings.course < courses.value.length ? courses.value[settings.course] : null)
const current_lesson_data = computed(() => current_course.value ? current_course.value.lessons.find(les => les.name == current_lesson.value) : null)

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
      { name: 'Examen 1', notes: 'E4, G4, F4, A4, B4, C5, D5, E5, F5' },
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
      { name: 'Examen 2', notes: 'F3 ,G3, A3, B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5, G5, A5, B5, C6, D6, E6' },
    ]
  }])


watch(current_lesson_data, value => {
  if (!value) return
  position.value = 0
  regenerate()
})

function regenerate() {
  if (!current_lesson_data.value) return
  ready.value = false
  playing.value = false
  position.value = 0
  bars.value.splice(0, bars.value.length)
  addbars(current_lesson_data.value.notes.length * 1.25)
  render()
}

const sharpNotes = ['C', 'C#', 'D', 'D#', 'E', 'E#', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'B#']
function transposeNote(note) {
  // console.assert(sharpNotes.length==14, 'must be 14 notes')
  return note.replace(/(\w[#b]?)(\d)/, function (match, note, octave) {
    octave = parseInt(octave)
    var idx = sharpNotes.findIndex(snote => snote == note)
    idx += transpose.value
    while (idx > 14) {
      idx -= 14
      octave++
    }
    return sharpNotes[idx] + octave
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
  if (!current_lesson_data.value) return
  const randomNotes = current_lesson_data.value.notes.split(/\s*,\s*/g).filter(x => !!x)
  const priorityNotes = current_lesson_data.value.priority ? current_lesson_data.value.priority.split(/\s*?,\s*?/g).filter(x => !!x) : []
  const bar = { notes: [] }
  for (var i = 0; i < 4; i++)
    bar.notes.push(getRandomNote(randomNotes, priorityNotes))
  bars.value.push(bar)
}

function addbars(num) {
  for (var i = 0; i < num; i++)
    addbar()
}

function render() {

  document.getElementById('output').innerHTML = ''

  const { Factory, EasyScore, System } = Vex.Flow;

  const f = new Factory({
    renderer: { elementId: 'output', width: 200 + bars.value.length * 220, height: 200 },
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
        .addClef(current_course.value.clef)
        .addKeySignature('C')
        .addTimeSignature('4/4');

      system.addConnector('singleLeft');

    }
    system.addConnector('singleRight');

  }

  f.draw();

}

onMounted(() => {

  regenerate()

  // start scrolling
  rAF = window.requestAnimationFrame || window.setTimeout(func, 1000 / 16)

  nextFrame()

})

</script>




<style>
* {
  box-sizing: border-box;
}

body,
html {
  margin: 0;
  padding: 0;
}

body {
  min-height: 100vh;
}

.flex-expander {
  @apply flex-grow flex-shrink-0 flex flex-col;
}

.content {
  @apply flex-grow;
  min-height: 100vh;
}
</style>