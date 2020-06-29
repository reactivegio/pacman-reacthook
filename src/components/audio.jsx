import React, {
  useCallback,
  useImperativeHandle,
  useState,
  forwardRef,
} from "react";

const Audio = (props, ref) => {
  const { audioFiles, soundDisabled } = props;

  const { game } = props;

  const [endEvents, setEndEvents] = useState([]);
  const [progressEvents, setProgressEvents] = useState([]);
  const [playing, setPlaying] = useState([]);

  const ended = useCallback(
    (name) => {
      let i,
        tmp = [],
        found = false;
      if (!audioFiles || audioFiles.length === 0) return;
      audioFiles[name].removeEventListener("ended", endEvents[name], true);

      for (i = 0; i < playing.length; i++) {
        if (!found && playing[i]) {
          found = true;
        } else {
          tmp.push(playing[i]);
        }
      }
      setPlaying(tmp);
    },
    [audioFiles, endEvents, playing]
  );

  const progress = useCallback(
    (event, name, callback) => {
      if (event.loaded === event.total && typeof callback === "function") {
        callback();
        audioFiles[name].removeEventListener(
          "canplaythrough",
          progressEvents[name],
          true
        );
      }
    },
    [audioFiles, progressEvents]
  );

  useImperativeHandle(
    ref,
    () => ({
      play: (name, path, cb) => {
        if (!path) return null;
        let f;
        if (document.getElementById(name + "_audio")) {
          f = document.getElementById(name + "_audio");
          f.playbackRate = 1.5;
          var promise = f.play();
          if (promise !== undefined) {
            promise
              .then((_) => {
                // Autoplay started!
              })
              .catch((error) => {
                // Autoplay was prevented.
                // Show a "Play" button so that user can start playback.
              });
          }
        } else {
          f = document.createElement("audio");

          f.setAttribute("id", name + "_audio");
          //f.addEventListener("canplaythrough", progressEvents[name], true);
          f.setAttribute("preload", "true");
          f.setAttribute("autobuffer", "true");
          f.setAttribute("src", path);
          f.autoplay = true;
          f.load();
          f.addEventListener(
            "load",
            function () {
              f.play();
            },
            true
          );
        }
        document.body.appendChild(f);
      },

      disableSound: () => {
        for (let i = 0; i < playing.length; i++) {
          audioFiles[playing[i]].pause();
          audioFiles[playing[i]].currentTime = 0;
        }
        setPlaying([]);
      },

      pause: () => {
        for (let i = 0; i < playing.length; i++) {
          audioFiles[playing[i]].pause();
        }
      },

      resume: () => {
        for (let i = 0; i < playing.length; i++) {
          audioFiles[playing[i]].play();
        }
      },
    }),
    [audioFiles, playing]
  );

  return <div className="audio_empty" ref={ref} />;
};

export default forwardRef(Audio);
