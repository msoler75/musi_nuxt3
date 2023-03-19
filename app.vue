<template>
  <div>
    <button class="btn" @click="addbar">Add</button>
    <input v-model="randomNotes" type="text">
    <p>Bars: {{ bars.length }}</p>
    <div id="output"></div>
  </div>
</template>


<script setup>
import Vex from 'vexflow';
const { Registry, StaveNote } = Vex;

const concat = (a, b) => a.concat(b);
const bars = ref([])
const randomNotes = ref('C4, C5, D4, D5')

var lastNote = null  // sirve para que no se repitan notas tan a menudo
function getRandomNote(arrstr) {
  const arr = arrstr.split(/,\s*/g)
  var idx
  do {
    idx = Math.floor(Math.random() * arr.length)
  } while (lastNote == arr[idx] && Math.random() > .2)
  lastNote = arr[idx]
  return arr[idx]
}

function addbar() {
  const bar = { notes: [] }
  for (var i = 0; i < 4; i++)
    bar.notes.push(getRandomNote(randomNotes.value))
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

  for (var i=0;i<bars.value.length;i++) {
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

    if(i==0) {
     r 
      .addClef('treble')
      .addKeySignature('C')
      .addTimeSignature('4/4');

      system.addConnector('brace');
      system.addConnector('singleLeft');

    }
    else  {
      
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


