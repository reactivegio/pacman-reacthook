import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import EatpillSound from "../assets/audio/eatpill.ogg";
import StartSound from "../assets/audio/opening_song.ogg";
import DieSound from "../assets/audio/die.ogg";
import EatghostSound from "../assets/audio/eatghost.ogg";
import EatingSound from "../assets/audio/eating.short.ogg";
import Eating2Sound from "../assets/audio/eating.ogg";

import Audio from "../components/audio";
import FooterScore from "../components/footerScore";
import GameMap from "./gameMap";
import GhostChaser from "./ghostChaser";
import GhostRandom from "./ghostRandom";
import MessageBoard from "./messageBoard";
import { boardMapping } from "../constants/board";
import * as gameConstants from "../constants/game";
import "./style.css";

export const GHOSTSSPECS = ["#00FFDE", "#FF0000", "#FFB8DE", "#FFB847"];

const Pacman = (props, ref) => {
  const audioRef = useRef();
  const ghostsRandomRef = useRef();
  const ghostChaserRef = useRef();

  const [gameState, setGameState] = useState(gameConstants.WAITING);
  const [audioFiles, setAudioFiles] = useState(null);
  const [playerPos, setPlayerPos] = useState({
    board: boardMapping,
    x: 12,
    old_x: 12,
    y: 17,
    old_y: 17,
    direction: "right",
    score: 0,
  });

  const checkCollision = useCallback(
    (x, y, direction) => {
      let value = null;

      if (direction === "right") value = playerPos.board[y][x + 1];
      if (direction === "left") value = playerPos.board[y][x - 1];
      if (direction === "down") value = playerPos.board[y + 1][x];
      if (direction === "up") value = playerPos.board[y - 1][x];
      return value;
    },
    [playerPos]
  );

  const checkTunnel = useCallback(
    (currentXVal) => {
      let xMax = playerPos.board[playerPos.y].length - 1;
      if (currentXVal === 0 && playerPos.direction === "left") {
        return {
          xVal: xMax,
          direction: "left",
        };
      } else if (currentXVal === xMax && playerPos.direction === "right") {
        return {
          xVal: 0,
          direction: "right",
        };
      }
      return {
        xVal: currentXVal,
        direction: playerPos.direction,
      };
    },
    [playerPos.board, playerPos.direction, playerPos.y]
  );

  const moveIt = useCallback(
    (x, y, signX, signY, direction) => {
      let currentLeft = x;
      let currentTop = y;
      let cloneBoard = [...playerPos.board];

      let collisionVal = checkCollision(currentLeft, currentTop, direction);

      if (collisionVal === 1) return;

      let left = currentLeft;
      let top = currentTop;
      let newScore = playerPos.score;

      if (collisionVal !== 1) {
        if (direction === "right" && currentLeft < 27) left += 1;
        if (direction === "left" && currentLeft > 0) left -= 1;
        if (direction === "down" && currentTop < 30) top += 1;
        if (direction === "up" && currentTop > 0) top -= 1;
      }

      if (collisionVal === 0) {
        let tunnelNewPos = checkTunnel(left);
        left = tunnelNewPos.xVal;
        direction = tunnelNewPos.direction;
      }

      if (collisionVal === 2) {
        audioRef.current.play(
          "eating",
          audioFiles["eating"][0],
          audioFiles["eating"][1]
        );
        newScore = newScore + 1;
        cloneBoard[top][left] = 0;
      } else if (collisionVal === 3) {
        // ghost vulnerability
        cloneBoard[top][left] = 0;
        audioRef.current.play(
          "eating2",
          audioFiles["eating2"][0],
          audioFiles["eating2"][1]
        );
      }

      setPlayerPos({
        x: left,
        y: top,
        board: cloneBoard,
        old_x: currentLeft,
        old_y: currentTop,
        direction: direction,
        score: newScore,
        sign: signX ? Math.sign(signX) : Math.sign(signY),
      });
    },
    [playerPos.board, playerPos.score, checkCollision, checkTunnel, audioFiles]
  );

  const moveSelection = useCallback(
    (evt) => {
      switch (evt.keyCode) {
        // pressed "n"
        case 78:
          setGameState(gameConstants.COUNTDOWN);
          audioRef.current.play(
            "start",
            audioFiles["start"][0],
            audioFiles["start"][1]
          );
          setTimeout(() => {
            setGameState(gameConstants.PLAYING);
          }, 4000);

          break;
        case 37:
          setPlayerPos({
            ...playerPos,
            direction: "left",
            sign: -1,
          });
          break;
        case 39:
          setPlayerPos({
            ...playerPos,
            direction: "right",
            sign: 1,
          });
          break;
        case 38:
          setPlayerPos({
            ...playerPos,
            direction: "up",
            sign: -1,
          });
          break;
        case 40:
          setPlayerPos({
            ...playerPos,
            direction: "down",
            sign: 1,
          });
          break;
        default:
          debugger;
          break;
      }
    },
    [audioFiles, playerPos]
  );

  useEffect(() => {
    const extension = "ogg"; //Modernizr.audioRef.current.ogg ? "ogg" : "mp3";
    const root = "./";
    if (!audioFiles)
      setAudioFiles({
        start: [StartSound, "start"],
        die: [DieSound, "die"],
        eatghost: [EatghostSound, "eatghost"],
        eatpill: [EatpillSound, "eatpill"],
        eating: [EatingSound, "eating"],
        eating2: [Eating2Sound, "eating2"],
      });
  }, [audioFiles]);

  useEffect(() => {
    let signX =
      playerPos.direction === "left"
        ? -1
        : playerPos.direction === "right"
        ? 1
        : null;
    let signY =
      playerPos.direction === "up"
        ? -1
        : playerPos.direction === "down"
        ? 1
        : null;

    window.addEventListener("keydown", moveSelection);
    let timerId = setInterval(() => {
      if (gameState === gameConstants.PLAYING) {
        moveIt(playerPos.x, playerPos.y, signX, signY, playerPos.direction);
      }
    }, 300);

    return () => {
      window.removeEventListener("keydown", moveSelection);
      clearInterval(timerId);
    };
  }, [
    gameState,
    moveIt,
    moveSelection,
    playerPos.direction,
    playerPos.x,
    playerPos.y,
  ]);

  useImperativeHandle(
    ref,
    () => ({
      /*
      block: (pos) => {
        return map[pos.y][pos.x];
      },*/
    }),
    []
  );

  //

  let xPercent = (playerPos.x * 100) / 28;
  let yPercent = (playerPos.y * 100) / 31;
  let addedStyle = {};
  if (playerPos.direction === "down") {
    addedStyle = {
      marginTop: "10px",
      marginLeft: "13px",
    };
  } else if (playerPos.direction === "up") {
    addedStyle = {
      marginTop: "10px",
      marginLeft: "-9px",
    };
  }

  return (
    <React.Fragment>
      <FooterScore life={3} score={playerPos.score} />
      <div
        className="containerPacman"
        style={Object.assign(
          {
            left: xPercent + "%",
            top: yPercent - 3 + "%",
            transform:
              playerPos.direction === "left" || playerPos.direction === "right"
                ? `scaleX(${playerPos.sign}`
                : `rotate(${90 * playerPos.sign}deg`,
          },
          addedStyle
        )}
      >
        <div className="pacman">
          <div className="pacman__eye"></div>
          <div className="pacman__mouth"></div>
        </div>
      </div>
      <GhostRandom
        gameState={gameState}
        ref={ghostsRandomRef}
        playerPos={playerPos}
      />
      <GhostChaser
        gameState={gameState}
        ref={ghostChaserRef}
        playerPos={playerPos}
      />
      <GameMap board={playerPos.board} />
      {gameState === gameConstants.WAITING ||
      gameState === gameConstants.PAUSE ? (
        <MessageBoard
          message={
            gameConstants.WAITING ? "Press n to start new game" : "paused"
          }
        />
      ) : null}

      <Audio ref={audioRef} audioFiles={audioFiles} soundDisabled={false} />
    </React.Fragment>
  );
};

export default forwardRef(Pacman);
