<template>
  <div class="flex-expander h-full content base-100 base-content">
    <div class="overflow-x-auto mb-auto flex-grow" ref="scroller">
      <div id="output" :style="{ transform: `scale(${1 + zoom / 10})` }"></div>
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
const settings = useSettings()
const score = useScore()

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
      { name: 'Acordes de 2a', notes: 'C4, D4, E4, F4, G4, A4, B4, C5, D5, E5', chords: ['2'] },
      { name: 'Acordes de 3a', notes: 'B4, C4, D4, E4, F4, G4, A4, B4, C5, D5, E5', chords: ['4'] },
      { name: 'Acordes de 4a', notes: 'A4, B4, C4, D4, E4, F4, G4, A4, B4, C5, D5, E5, F5', chords: ['6'] },
      { name: 'Acordes de 5a', notes: 'G4, A4, B4, C4, D4, E4, F4, G4, A4, B4, C5, D5, E5, F5', chords: ['7'] },
      { name: 'Acordes mix', notes: 'F4, G4, A4, B4, C4, D4, E4, F4, G4, A4, B4, C5, D5, E5, F5, G5', chords: ['2', '4', '6', '7'] },
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