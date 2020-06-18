import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import EatpillSound from "./assets/audio/eatpill.ogg";
import StartSound from "./assets/audio/opening_song.ogg";
import DieSound from "./assets/audio/die.ogg";
import EatghostSound from "./assets/audio/eatghost.ogg";
import EatingSound from "./assets/audio/eating.short.ogg";
import Eating2Sound from "./assets/audio/eating.ogg";

import Audio from "./components/audio";
import GameMap from "./components/gameMap";
import Ghost from "./components/ghost";
import User from "./components/user";
import {
  GHOSTSSPECS,
  COUNTDOWN,
  DYING,
  EATEN_PAUSE,
  FPS,
  KEY,
  PAUSE,
  PLAYING,
  WAITING,
} from "./constants/game";
import "./App.css";

function App() {
  const audioRef = useRef();
  const gameMapRef = useRef();
  const userRef = useRef();
  const ghostsRef = useRef([]);

  const [audioFiles, setAudioFiles] = useState(null);
  const [isFirst, setIsFirst] = useState(true);
  const [soundDisabled, setSoundDisabled] = useState(false);
  const [blockSize, setBlockSize] = useState(null);
  const [ctx, setCtx] = useState(null);
  const [eatenCount, setEatenCount] = useState(0);
  const [ghosts, setGhosts] = useState([]);
  const [ghostsPos, setGhostsPos] = useState([]);
  const [keyPressed, setKeyPressed] = useState(false);
  const [timer, setTimer] = useState(null);
  const [timerStart, setTimerStart] = useState(null);
  const [stateGame, setStateGame] = useState(WAITING);
  const [stateChanged, setStateChanged] = useState(true);
  const [tick, setTick] = useState(0);
  const [lastTime, setLastTime] = useState(0);
  const [level, setLevel] = useState(1);
  const [userPos, setUserPos] = useState(null);

  const redrawBlock = useCallback((pos) => {
    gameMapRef.current.drawBlock(
      Math.floor(pos.y / 10),
      Math.floor(pos.x / 10)
    );
    gameMapRef.current.drawBlock(Math.ceil(pos.y / 10), Math.ceil(pos.x / 10));
  }, []);

  const startLevel = useCallback(() => {
    userRef.current.resetPosition();
    for (var i = 0; i < ghosts.length; i += 1) {
      ghostsRef.current[i].current.reset();
    }
    audioRef.current.play("start");
    setTimerStart(tick);
    setStateGame(COUNTDOWN);
  }, [ghosts, tick]);

  const loseLife = useCallback(() => {
    setStateGame(WAITING);
    userRef.current.loseLife();
    if (userRef.current.getLives() > 0) {
      startLevel();
    }
  }, [startLevel]);

  const drawFooter = useCallback(() => {
    if (!ctx) return null;
    var topLeft = gameMapRef.current.getHeight() * blockSize,
      textBase = topLeft + 17;

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, topLeft, gameMapRef.current.getWidth() * blockSize, 30);

    ctx.fillStyle = "#FFFF00";

    for (var i = 0, len = userRef.current.getLives(); i < len; i++) {
      ctx.fillStyle = "#FFFF00";
      ctx.beginPath();
      ctx.moveTo(150 + 25 * i + blockSize / 2, topLeft + 1 + blockSize / 2);

      ctx.arc(
        150 + 25 * i + blockSize / 2,
        topLeft + 1 + blockSize / 2,
        blockSize / 2,
        Math.PI * 0.15,
        Math.PI * 1.85,
        false
      );
      ctx.fill();
    }

    ctx.fillStyle = !soundDisabled ? "#00FF00" : "#FF0000";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("♪", 10, textBase);
    //ctx.fillText("s", 10, textBase);

    ctx.fillStyle = "#FFFF00";
    ctx.font = "14px BDCartoonShoutRegular";
    ctx.fillText("Score: " + userRef.current.theScore(), 30, textBase);
    ctx.fillText("Level: " + level, 260, textBase);
  }, [blockSize, ctx, level, soundDisabled]);

  const collided = (user, ghost) => {
    return (
      Math.sqrt(Math.pow(ghost.x - user.x, 2) + Math.pow(ghost.y - user.y, 2)) <
      10
    );
  };

  const drawScore = useCallback(
    (text, position) => {
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "12px BDCartoonShoutRegular";
      ctx.fillText(
        text,
        (position["new"]["x"] / 10) * blockSize,
        ((position["new"]["y"] + 5) / 10) * blockSize
      );
    },
    [blockSize, ctx]
  );

  const mainDraw = useCallback(() => {
    let diff, nScore;

    let ghostPos = [];

    for (let i = 0; i < ghosts.length; i++) {
      ghostPos.push(ghostsRef.current[i].current.move(ctx));
    }

    setGhostsPos(ghostPos);
    let u = userRef.current.move(ctx);

    for (let i = 0; i < ghosts.length; i += 1) {
      redrawBlock(ghostPos[i].old);
    }
    redrawBlock(u.old);

    for (let i = 0; i < ghosts.length; i += 1) {
      ghostsRef.current[i].current.draw();
    }
    userRef.current.draw();

    setUserPos(u["new"]);

    for (let i = 0; i < ghosts.length; i += 1) {
      if (collided(userPos, ghostPos[i]["new"])) {
        if (ghostsRef.current[i].current.isVunerable()) {
          audioRef.current.play("eatghost");
          ghostsRef.current[i].current.eat();
          let eatenCtn = eatenCount + 1;
          setEatenCount(eatenCtn);
          nScore = eatenCtn * 50;
          drawScore(nScore, ghostPos[i]);
          userRef.current.addScore(nScore);
          setStateGame(EATEN_PAUSE);
          setTimerStart(tick);
        } else if (ghostsRef[i].current.isDangerous()) {
          audioRef.current.play("die");
          setStateGame(DYING);
          setTimerStart(tick);
        }
      }
    }
  }, [ctx, drawScore, eatenCount, ghosts, redrawBlock, tick, userPos]);

  const setTextMsg = useCallback(
    (text) => {
      if (!ctx) return null;
      ctx.font = "22px 'Major Mono Display', monospace";
      //ctx.fillStyle = "#FFF";
      ctx.shadowColor = "black";
      ctx.shadowBlur = 5;
      ctx.lineWidth = 7;
      ctx.strokeStyle = "#555";
      let width = ctx.measureText(text).width,
        x = (gameMapRef.current.getWidth() * blockSize - width) / 2;
      ctx.strokeText(text, x, gameMapRef.current.getHeight() * 10 + 8);
      //ctx.shadowBlur = 0;
      ctx.fillStyle = "#FFF";
      ctx.fillText(text, x, gameMapRef.current.getHeight() * 10 + 8);
    },
    [blockSize, ctx]
  );

  const mainLoop = useCallback(() => {
    let diff = 0;

    if (!gameMapRef.current) return;
    if (stateGame !== PAUSE) {
      setTick(tick + 1);
    }

    gameMapRef.current.drawPills();

    if (stateGame === PLAYING) {
      mainDraw();
    } else if (stateGame === WAITING && stateChanged) {
      //setStateChanged(false);

      if (gameMapRef.current) {
        gameMapRef.current.reset();
        gameMapRef.current.draw();
      }
      setTextMsg("Press N to start a New game");
    } else if (stateGame === EATEN_PAUSE && tick - timerStart > FPS / 3) {
      gameMapRef.current.draw();
      setStateGame(PLAYING);
    } else if (stateGame === DYING) {
      if (tick - timerStart > FPS * 2) {
        loseLife();
      } else {
        redrawBlock(userPos);
        for (let i = 0; i < ghosts.length; i++) {
          redrawBlock(ghostsPos[i].old);
          let ghostPos = [...ghostsPos];
          ghostPos.push(ghostsRef[i].current.draw());
          setGhostsPos(ghostPos);
        }
        userRef.current.drawDead(ctx, (tick - timerStart) / (FPS * 2));
      }
    } else if (stateGame === COUNTDOWN) {
      diff = 5 + Math.floor((timerStart - tick) / FPS);

      if (diff === 0) {
        gameMapRef.current.draw();
        setStateGame(PLAYING);
      } else {
        if (diff !== lastTime) {
          setLastTime(diff);
          gameMapRef.current.draw();
          setTextMsg("Starting in: " + diff);
        }
      }
    }

    drawFooter();
    setIsFirst(false);
  }, [
    ctx,
    drawFooter,
    ghosts.length,
    ghostsPos,
    lastTime,
    loseLife,
    mainDraw,
    redrawBlock,
    setTextMsg,
    stateChanged,
    stateGame,
    tick,
    timerStart,
    userPos,
  ]);

  const startNewGame = useCallback(() => {
    setStateGame(WAITING);
    setLevel(1);
    userRef.current.resetPosition();
    gameMapRef.current.reset();

    gameMapRef.current.draw();
    // userRef.current.initUser();
    startLevel();
  }, [startLevel]);

  const loadGame = useCallback(() => {
    if (audioFiles)
      audioRef.current.play(
        "start",
        audioFiles["start"][0],
        audioFiles["start"][1]
      );
  }, [audioFiles]);

  // If pressed key is our target key then set to true
  const downHandler = useCallback(
    ({ key }) => {
      switch (key) {
        case "n":
          loadGame();
          break;
        default:
          break;
      }
    },
    [loadGame]
  );

  // If released key is our target key then set to false
  const upHandler = useCallback(({ key }) => {
    if (key === "n") {
      setKeyPressed(false);
    }
  }, []);

  useEffect(() => {
    const wrapper = document.getElementById("pacman");
    if (wrapper.offsetWidth > 0) {
      let newBlockSize = wrapper.offsetWidth / 19;
      setBlockSize(newBlockSize);
    }
  }, [blockSize]);

  useEffect(() => {
    const wrapper = document.getElementById("pacman");
    if (!ctx && blockSize) {
      let canvas = document.createElement("canvas");
      canvas.setAttribute("id", "game_canvas");
      canvas.setAttribute("width", blockSize * 19 + "px");
      canvas.setAttribute("height", blockSize * 22 + 30 + "px");

      wrapper.appendChild(canvas);

      let ctxCan = canvas.getContext("2d");
      setCtx(ctxCan);
    }
  }, [blockSize, ctx]);

  useEffect(() => {
    if (ghosts.length === 0) {
      let ghostsArr = [];
      for (let g = 0; g < GHOSTSSPECS.length; g++) {
        ghostsRef.current.push([]);
        let ghost = (
          <Ghost
            key={"ghost_" + g}
            blockSize={blockSize}
            ctx={ctx}
            ref={ghostsRef.current[g].current}
          />
        );

        //new Pacman.Ghost({"getTick":getTick}, map, ghostSpecs[g]);
        ghostsArr.push(ghost);
      }
      setGhosts(ghostsArr);
    }
  }, [blockSize, ctx, ghosts]);

  useEffect(() => {
    const extension = "ogg"; //Modernizr.audioRef.current.ogg ? "ogg" : "mp3";
    const root = "./";
    setAudioFiles({
      start: [StartSound, "start"],
      die: [DieSound, "die"],
      eatghost: [EatghostSound, "eatghost"],
      eatpill: [EatpillSound, "eatpill"],
      eating: [EatingSound, "eating"],
      eating2: [Eating2Sound, "eating2"],
    });
  }, []);

  // Add event listeners
  useEffect(() => {
    if (!ctx) return;

    window.addEventListener("keydown", downHandler);
    window.addEventListener("keyup", upHandler);
    if (isFirst && stateChanged && blockSize) mainLoop();

    /*
    const interval = setInterval(() => {
      mainLoop();
    }, 1000 / FPS);
*/
    // Remove event listeners on cleanup
    return () => {
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
      //return () => clearInterval(interval);
    };
  }, [blockSize, ctx, downHandler, isFirst, mainLoop, stateChanged, upHandler]); // Empty array ensures that effect is only run on mount and unmount

  for (let i = 48; i <= 57; i++) {
    KEY["" + (i - 48)] = i;
  }
  /* A - Z */
  for (let i = 65; i <= 90; i++) {
    KEY["" + String.fromCharCode(i)] = i;
  }
  /* NUM_PAD_0 - NUM_PAD_9 */
  for (let i = 96; i <= 105; i++) {
    KEY["NUM_PAD_" + (i - 96)] = i;
  }
  /* F1 - F12 */
  for (let i = 112; i <= 123; i++) {
    KEY["F" + (i - 112 + 1)] = i;
  }

  return (
    <div
      id="pacman"
      style={{ width: "400px", height: "50vh", margin: "0 auto" }}
    >
      <Audio
        ref={audioRef}
        audioFiles={audioFiles}
        soundDisabled={soundDisabled}
      />

      {blockSize && ctx && (
        <GameMap ref={gameMapRef} blockSize={blockSize} ctx={ctx} />
      )}
      <User
        ref={userRef}
        ctx={ctx}
        gameMapRef={gameMapRef}
        blockSize={blockSize}
      />

      {ghosts}
    </div>
  );
}

export default App;
