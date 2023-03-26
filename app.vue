<template>
  <div class="flex-expander h-full content base-100 base-content">
    <div class="fixed left-2 top-2">{{ Math.round(performance * 100) + '%' }} {{ hits }}/{{ hits + fails }} {{ nextNote ?
      nextNote.note : "" }}
    </div>
    <div class="overflow-x-auto mb-auto flex-grow" ref="scroller">
      <div class="fixed right-2 top-2 text-xl font-bold">{{ clearNote }}
      </div>
      <div id="output" :style="{ transform: `scale(${1 + zoom / 10})` }"></div>
    </div>
    <div v-if="false">
      <button class="btn btn-secondary" @click="recorder.start()">
        Rec
      </button>
      <button class="btn btn-secondary" @click="recorder.stop()">
        Stop
      </button>
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
          <button class="btn btn-secondary" @click="rewind">
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

        <div class="flex items-center ml-auto space-x-4">
          <button class="btn text-red-500" @click="escuchar">
            <Icon name="mdi:checkbox-blank-circle" />
          </button>
        </div>

      </div>
    </div>
    <input type="checkbox" v-model="showModal" class="modal-toggle" />
    <div class="modal">
      <div class="modal-box text-center py-8 text-lg font-bold">
        <p v-if="muestreado" >¡Calibrado!</p>
        <p v-else>Pulsa la tecla {{ nextNote ? nextNote.note : '' }}</p>
      </div>
    </div>
  </div>
</template>


<script setup>

const settings = useSettings()
const score = useScore()
const tuner = useTuner()
const recorder = useRecorder()
const muestreado = ref(false)
const showModal = ref(false)

// play

var rAF = null // window.requestAnimationFrame || window.setTimeout(func, 1000/16)
const scroller = ref(null)
const playing = ref(false)
const playIcon = computed(() => !playing.value ? 'material-symbols:play-arrow-rounded' : 'material-symbols:pause')
const position = ref(0)
const notePosition = ref(0)
const hits = ref(0)
const fails = ref(0)
const performance = computed(() => hits.value / (0.0001 + hits.value + fails.value))
const zoom = ref(1)
const speed = ref(30)
const lastNoteKeyboard = ref(null)
// const currentNote = computed(() => tuner.note.value) // ? tuner.note.value : lastNoteKeyboard.value ? lastNoteKeyboard.value : '')
const clearNote = computed(() => tuner.clarity.value > .8 ? tuner.note.value : '')

function rewind() {
  if (calibrating.value) {
    hits.value = 0
    fails.value = 0
    position.value = 0;
    var elements = document.querySelectorAll('.note-hit, .note-fail')
    for (var i = 0; i < elements.length; i++) {
      elements[i].classList.remove('note-fail')
      elements[i].classList.remove('note-hit')
    }

    notePosition.value = 0
    highlightNextNote()
    scrollToNextNote()
  }

  pause();
}

function play() {
  playing.value = true
}


var prevNote = ""
function getNoteValueIgnoringSharp(note) {
  return note.replace(/\d+/, '').replace("#", "")
}



var lastNoteTime = 0
watch(() => tuner.note.value, note => {
  const now = +new Date();
  if (tuner.clarity.value < 0.8) return
  console.log('note_change', note)
  if (note != prevNote) {
    if (note) {
      lastNoteTime = now
      if (!prevNote || getNoteValueIgnoringSharp(prevNote) != getNoteValueIgnoringSharp(note)) {
        checkPlayedNote(note)
      }
    }
  }
  prevNote = note
})



function escuchar() {
  tuner.start()
  console.log('escuchar')
  if (!muestreado.value) {
    calibrating.value = true
    showModal.value = true
  }
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

const defaultLessonSettings = {
  maxDistance: 12, // semitones
  priorizeDistances: [1, 2, 4, 7], // semitones
  hasSharpedNotes: false, // dont show sharp
  notes: "C4, G4",
};
const courses = ref([
  {
    name: 'treble', clef: 'treble',
    lessons: [
      { name: 'E, G', notes: 'E4, G4' },
      { name: '+F4', notes: 'E4, G4, F4' },
      { name: '+C5', notes: 'E4, G4, F4, C5', priority: 'C5' },
      { name: '+B4', notes: 'E4, G4, F4, B4, C5', priority: 'B4' },
      { name: '+A4', notes: 'E4, G4, F4, A4, B4, C5', priority: 'A4' },
      { name: '+D5', notes: 'E4, G4, F4, A4, B4, C5, D5', priority: 'D5' },
      { name: '+E5', notes: 'E4, G4, F4, A4, B4, C5, D5, E5', priority: 'E5' },
      { name: '+F5', notes: 'E4, G4, F4, A4, B4, C5, D5, E5, F5', priority: 'F5' },
      { name: 'Examen 1', notes: 'E4, G4, F4, A4, B4, C5, D5, E5, F5' },
      { name: '+C4, D4', notes: 'C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5', priority: 'C4, D4' },
      { name: '+B3', notes: 'B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5', priority: 'B3' },
      { name: '+A3', notes: 'A3, B3, C4, D4, E4, G4, F4, A4, B4, C5, D5', priority: 'A3' },
      { name: '+G3', notes: 'G3, A3, B3, C4, D4, E4, G4, F4, A4, B4', priority: 'G3' },
      { name: '+F3', notes: 'F3 ,G3, A3, B3, C4, D4, E4, G4, F4, A4', priority: 'F3' },
      { name: 'Lineas inferiores', notes: 'F3 ,G3, A3, B3, C4, D4, E4, G4, F4', priority: 'F3, G3, A3, B3, C4' },
      { name: '+G5, A5', notes: 'A3, B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5, G5, A5', priority: 'G5, A5' },
      { name: '+B5', notes: 'B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5, G5, A5, B5', priority: 'B5' },
      { name: '+C6', notes: 'C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5, G5, A5, B5, C6', priority: 'C6' },
      { name: '+D6', notes: 'D4, E4, G4, F4, A4, B4, C5, D5, E5, F5, G5, A5, B5, C6, D6', priority: 'D6' },
      { name: '+E6', notes: 'E4, G4, F4, A4, B4, C5, D5, E5, F5, G5, A5, B5, C6, D6, E6', priority: 'E6' },
      { name: 'Lineas superiores', notes: 'D5, E5, F5, G5, A5, B5, C6, D6, E6', priority: 'G5, A5, B5, C6, D6, E6' },
      { name: 'Examen 2', notes: 'F3 ,G3, A3, B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5, G5, A5, B5, C6, D6, E6' },
      { name: 'Acordes de 2a', notes: 'C4, D4, E4, F4, G4, A4, B4, C5, D5, E5', chords: ['2'] },
      { name: 'Acordes de 3a', notes: 'B4, C4, D4, E4, F4, G4, A4, B4, C5, D5, E5', chords: ['4'] },
      { name: 'Acordes de 4a', notes: 'A4, B4, C4, D4, E4, F4, G4, A4, B4, C5, D5, E5, F5', chords: ['6'] },
      { name: 'Acordes de 5a', notes: 'G4, A4, B4, C4, D4, E4, F4, G4, A4, B4, C5, D5, E5, F5', chords: ['7'] },
      { name: 'Acordes mix', notes: 'F4, G4, A4, B4, C4, D4, E4, F4, G4, A4, B4, C5, D5, E5, F5, G5', chords: ['2', '4', '6', '7'] },
      { name: 'Triadas 1', notes: 'F3 ,G3, A3, B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5, G5', chords: ['4,7'] },
      { name: '1a inversión', notes: 'F3 ,G3, A3, C4, D4, E4, G4, F4, A4, C5, D5, E5, F5, G5', chords: ['6,9'] },
      { name: '2a inversión', notes: 'F3 ,G3, A3, B3, C4, D4, E4, G4, F4, A4, B4, C5, D5, E5, F5, G5', chords: ['4,9'] },
      { name: 'Triadas Mix', notes: 'F3 ,G3, A3, C4, D4, E4, G4, F4, A4, C5, D5, E5, F5, G5', chords: ['4,7', '6,9', '4,9'] },
    ]
  }])



// lessons
const current_course = computed(() => settings.course >= 0 && settings.course < courses.value.length ? courses.value[settings.course] : null)
const current_lesson_data = computed(() => current_course.value ? { ...defaultLessonSettings, ...current_course.value.lessons.find(les => les.name == settings.currentLesson) } : null)



watch(current_lesson_data, value => {
  if (!value) return
  drawScore()
})

function calculateHeightWindow() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

function drawScore() {
  playing.value = false;
  position.value = 0;
  score.draw(document.querySelector("#output"), current_lesson_data.value, current_course.value.clef)
}

onMounted(() => {

  window.addEventListener("resize", calculateHeightWindow)

  calculateHeightWindow();

  drawScore()

  // start scrolling
  rAF = window.requestAnimationFrame || window.setTimeout(func, 1000 / 16)

  nextFrame()

  // nextTick(() => tuner.start())

  window.addEventListener('keydown', onKey)

  // recorder.init()

  if (!calibrating.value)
    highlightNextNote()

})

function onUnmount() {
  window.removeEventListener('keydown', this.onKey);
}

// incomplete keyboard to test
function onKey(ev) {
  // obtener la tecla pulsada
  const key = ev.key.toLowerCase();
  // determinar la nota correspondiente
  let note = null;
  switch (key) {
    case 'q': note = 'C4'; break;
    case 'w': note = 'D4'; break;
    case 'e': note = 'E4'; break;
    case 'r': note = 'F4'; break;
    case 't': note = 'G4'; break;
    case 'y': note = 'A4'; break;
    case 'u': note = 'B4'; break;
    case 'i': note = 'C5'; break;
    case 'o': note = 'D5'; break;
    case 'p': note = 'E5'; break;
    case '2': note = 'C#5'; break;
    case '3': note = 'D#5'; break;
    case '5': note = 'F#5'; break;
    case '6': note = 'G#5'; break;
    case '7': note = 'A#5'; break;
    default:
      note = null
  }
  switch (ev.keyCode) {
    case 186: note = 'F5'; break;
    case 187: note = 'G5'; break;
  }
  // guardar la última nota tocada en la variable lastNoteKeyboard
  lastNoteKeyboard.value = note;
  if (note)
    checkPlayedNote(note)
}

const calibrating = ref(true)
const notesSequence = computed(() => calibrating.value ? notesCalibrate : score.notesSequence.value)
const nextNote = computed(() => notePosition.value < notesSequence.value.length ? notesSequence.value[notePosition.value] : null)

const notesCalibrate = [{ note: "C" }, { note: "E" }, { note: "G" }]

function calibrar() {
  calibrating.value = true
  notePosition.value = 0
  showModal.value = true
}

function finCalibracion() {
  showModal.value = false
  muestreado.value = true
  calibrating.value = false
    notePosition.value = -1
    nextPosition()
}

function nextPosition() {
  if (notePosition.value + 1 < notesSequence.value.length) {
    notePosition.value++
    if (!calibrating.value) {
      highlightNextNote()
      scrollToNextNote()
    }
  }
  else {
    if (calibrating.value) {
      finCalibracion()
    }
  }
}

watch(notesSequence, () => { rewind() })


function checkPlayedNote(note) {
  if (!nextNote.value) return
  const matchNote = getNoteValueIgnoringSharp(note) == getNoteValueIgnoringSharp(nextNote.value.note)

  if (!calibrating.value) {
    if (matchNote) {
      hits.value++
      addClassToNote('note-hit')
    }
    else {
      fails.value++
      addClassToNote('note-fail')
    }
  }
  else if (!matchNote) return // mientras está calibrando no avanza a la siguiente nota hasta que la acierte


  tuner.waitPeak()
  // next Note move
  nextPosition()
}


function scrollToNextNote() {
  if (!nextNote.value) return
  const element = document.getElementById('vf-' + nextNote.value.id)
  if (element) {
    element.scrollIntoView({
      behavior: 'smooth',
      inline: 'center'
    });
  }
}

function highlightNextNote() {
  var element = document.querySelector('.next-note')
  if (element) element.classList.remove('next-note')
  addClassToNote('next-note')
}

function addClassToNote(cls) {
  if (!nextNote.value) return
  const element = document.getElementById('vf-' + nextNote.value.id)
  element.classList.add(cls)
}

</script>




<style>
.next-note {
  stroke: blue;
  fill: blue
}

.note-hit {
  stroke: green;
  fill: green
}

.note-fail {
  stroke: red;
  fill: red
}

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