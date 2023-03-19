<template>
  <div class="flex-expander h-full content base-100 base-content">
    <div class="overflow-x-auto mb-auto flex-grow" ref="scroller">
      <div id="output"
      :style="{transform: `scale(${1+zoom/10})`}"></div>
    </div>
    <div class="mt-auto p-4 space-x-4 w-full justify-between">
      <div class="flex">
        <div class="flex space-x-4">
          <button class="btn btn-primary hidden lg:inline" @click="regenerate()">
            <Icon name='codicon:debug-restart' />
          </button>
          <select v-model="settings.currentLesson" class="select select-bordered">
            <option v-for="lesson, index of courses[settings.course].lessons" :key="index">{{ lesson.name }}</option>
          </select>
          <button class="hidden lg:inline btn btn-secondary" @click="retrocederNivel()">
            <Icon name='mdi:arrow-left' />
          </button>
          <button class="hidden sm:inline btn btn-secondary" @click="avanzarNivel()">
            <Icon name='mdi:arrow-right' />
          </button>
        </div>

        <div class="hidden md:flex items-center ml-auto space-x-4">
          <button class="btn btn-secondary" @click="zoom++">
            <Icon name="octicon:zoom-in-16" />
          </button>
          <button class="btn btn-secondary" @click="zoom--">
            <Icon name="octicon:zoom-out-16" />
          </button>
          </div>

        <div class="flex items-center ml-auto space-x-4">
          <button class="hidden lg:inline btn btn-secondary" @click="position = 0; pause();">
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
const zoom = ref(1)
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


// settings
const transpose = ref(0) // global transpose
const defaultLessonSettings = {
  maxDistance: 12, // semitones
  priorizeDistances: [2, 4, 7], // semitones
  hasSharpedNotes: false // dont show sharp 
}


var lastNote = "C3"  // sirve para que no se repitan notas tan a menudo
function getRandomNote(settings) {
  const arr = settings.notes.split(/\s*,\s*/g).filter(x => !!x)
  const priority = settings.priority ? settings.priority.split(/\s*?,\s*?/g).filter(x => !!x) : []
  var idx
  var distance = 2
  var loops = 24
  var bestNote
  var bestScore = 0
  var fail = false
  do {
    idx = Math.floor(Math.random() * arr.length)
    var note = arr[idx]
    distance = getDistance(lastNote, note)
    const cond1 = distance<settings.maxDistance || Math.random() < .05 // el 95% de los intervalos deben estar dentro del rango máximo
    const cond2 = settings.priorizeDistances.includes(distance) || Math.random()<.5 // el 50% de intervalos deberían de estar entre la lista
    const cond3 = settings.hasSharpedNotes || note.indexOf('#')==-1 // en el 100% de los casos no puede haber notas sharp, si no está permitido
    const cond4 = !priority.length || priority.includes(note) || Math.random()<.5 // si hay notas de prioridad, el 50% deben ser prioritarias
    const cond5 = lastNote != note // no deben repetirse notas
    const score1 = cond1?1:0 
    const score2 = cond2?1:0 
    const score3 = cond3?1:0 
    const score4 = cond4?1:0 
    const score5 = cond5?2:0 
    const score = score1+score2+score3+score4+score5
    fail = score<6
    if(score>bestScore) {
      bestNote = note
      bestScore = score
    }
  } while (loops-->0 && fail)

  lastNote = bestNote
  console.log(note, "!")
  return transposeNote(arr[idx])
}


// score
const concat = (a, b) => a.concat(b);
const bars = ref([])

// output
const ready = ref(false)

// lessons
const current_course = computed(() => settings.course >= 0 && settings.course < courses.value.length ? courses.value[settings.course] : null)
const current_lesson_data = computed(() => current_course.value ? {...defaultLessonSettings, ...current_course.value.lessons.find(les => les.name == settings.currentLesson)} : null)


function retrocederNivel() {
  if (!current_lesson_data.value) return
  const idx = current_course.value.lessons.findIndex(les => les.name == settings.currentLesson)
  if (idx > 0)
    settings.currentLesson = current_course.value.lessons[idx - 1].name
}

function avanzarNivel() {
  if (!current_lesson_data.value) return
  const idx = current_course.value.lessons.findIndex(les => les.name == settings.currentLesson)
  if (idx + 1 < current_course.value.lessons.length)
    settings.currentLesson = current_course.value.lessons[idx + 1].name
}

const courses = ref([
  {
    name: 'treble', clef: 'treble',
    lessons: [
    { name: 'test', notes: 'G3, C4, G4, C5, G5, C6' },
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

const semitones = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
function transposeNote(note) {
  return note.replace(/(\w[#b]?)(\d)/, function (match, note, octave) {
    octave = parseInt(octave)
    var idx = semitones.findIndex(snote => snote == note)
    idx += transpose.value
    while (idx > 12) {
      idx -= 12
      octave++
    }
    return semitones[idx] + octave
  })
}

// distance in semitones
function getDistance(note1, note2) {
  const o1 = parseInt(note1.match(/\d/))
  const o2 = parseInt(note2.match(/\d/))
  const n1 = note1.replace(/\d+/,'')
  const n2 = note2.replace(/\d+/,'')
  var idx1 = note1?semitones.findIndex(snote => snote == n1):0
  var idx2 = semitones.findIndex(snote => snote == n2)
  const dist = Math.abs(idx1+o1*12-(idx2+o2*12) )
  return dist
  }
  



function addbar() {
  if (!current_lesson_data.value) return
   const bar = { notes: [] }
  for (var i = 0; i < 4; i++)
    bar.notes.push(getRandomNote(current_lesson_data.value))
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

function calculateHeightWindow() {
  const vh = window.innerHeight * 0.01; 
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

onMounted(() => {

  window.addEventListener("resize", calculateHeightWindow)

  calculateHeightWindow();

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

.flex-expander {
  @apply flex-grow flex-shrink-0 flex flex-col;
}

.content {
  @apply flex-grow;
  min-height: calc(100 * var(--vh));
}

.btn {
  @apply text-[200%];
}
</style>