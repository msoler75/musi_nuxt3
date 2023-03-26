import createTuner from '@pedroloch/tuner'

// Creating the tuner
const tuner = createTuner()


document
.getElementById("start-button")
  .addEventListener("click", ()=> {

    // Starts to listen to the frequencies captured by the microfone.
    tuner.start()

    setInterval(()=>{
      tuner.getData((data) => {
        console.log(data, calcularNota(data.frequency)) // => {frequency: 220.47996157982865, pitch: 220, note: "A", diff: 7}
      })
    })
  

  });



// Turns off the microfone and stops sending data.
// tuner.stop()

// Check if the tuner is on or off.
// tuner.isOn // return true or false



function calcularNota(frecuencia) {
  const notas = {
    "C": 16.35,
    "C#": 17.32,
    "D": 18.35,
    "D#": 19.45,
    "E": 20.60,
    "F": 21.83,
    "F#": 23.12,
    "G": 24.50,
    "G#": 25.96,
    "A": 27.50,
    "A#": 29.14,
    "B": 30.87
  };
  
  const nota = Object.keys(notas).find(key => {
    const diferencia = Math.abs(notas[key] - frecuencia);
    return diferencia <= notas[key] * 0.05; // tolerancia del 5%
  });

  if (!nota) {
    return "Nota no encontrada";
  }

  const octava = Math.floor(Math.log2(frecuencia / notas[nota] / 2) * 12 + 4);
  
  return nota + octava;
}
