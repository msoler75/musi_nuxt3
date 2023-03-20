import Wad from "web-audio-daw";

export const useRecorder = () => {
  var voice = null;
  var polywad = null;

  function init() {
    voice = new Wad({ source: "mic" });
    polywad = new Wad.Poly({
      recorder: {
        options: { mimeType: "audio/webm" },
        onstop: function (event) {
          let blob = new Blob(this.recorder.chunks, {
            type: "audio/webm;codecs=opus",
          });
          window.open(URL.createObjectURL(blob));
        },
      },
    });
    polywad.add(voice);
    voice.play();
  }

  function start() {
    polywad.recorder.start();
  }

  function stop() {
    polywad.recorder.stop();
  }

  return { init, start, stop };
};
