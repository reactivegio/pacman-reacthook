import React, { forwardRef, useImperativeHandle, useState } from "react";
import {
  BISCUIT,
  DOWN,
  EMPTY,
  LEFT,
  KEY,
  NONE,
  PILL,
  RIGHT,
  UP,
} from "../constants/game";
import { useCallback } from "react";

const User = (props, ref) => {
  const { ctx, game, gameMapRef } = props;
  const [position, setPosition] = useState(null);
  const [direction, setDirection] = useState(null);
  const [eaten, setEaten] = useState(null);
  const [due, setDue] = useState(null);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [keyMap, setKeyMap] = useState({
    [KEY.ARROW_LEFT]: LEFT,
    [KEY.ARROW_UP]: UP,
    [KEY.ARROW_RIGHT]: RIGHT,
    [KEY.ARROW_DOWN]: DOWN,
  });

  const newLevel = useCallback(() => {
    resetPosition();
    setEaten(0);
  }, []);

  const resetPosition = () => {
    setPosition({ x: 90, y: 120 });
    setDirection(LEFT);
    setDue(LEFT);
  };

  const keyDown = (e) => {
    if (typeof keyMap[e.keyCode] !== "undefined") {
      setDue(keyMap[e.keyCode]);
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    return true;
  };

  const getNewCoord = (dir, current) => {
    return {
      x: current.x + ((dir === LEFT && -2) || (dir === RIGHT && 2) || 0),
      y: current.y + ((dir === DOWN && 2) || (dir === UP && -2) || 0),
    };
  };

  const onWholeSquare = (x) => {
    return x % 10 === 0;
  };

  const pointToCoord = (x) => {
    return Math.round(x / 10);
  };

  const nextSquare = (x, dir) => {
    let rem = x % 10;
    if (rem === 0) {
      return x;
    } else if (dir === RIGHT || dir === DOWN) {
      return x + (10 - rem);
    } else {
      return x - rem;
    }
  };

  const next = useCallback((pos, dir) => {
    return {
      y: pointToCoord(nextSquare(pos.y, dir)),
      x: pointToCoord(nextSquare(pos.x, dir)),
    };
  }, []);

  const onGridSquare = useCallback((pos) => {
    return onWholeSquare(pos.y) && onWholeSquare(pos.x);
  }, []);

  const isOnSamePlane = (due, dir) => {
    return (
      ((due === LEFT || due === RIGHT) && (dir === LEFT || dir === RIGHT)) ||
      ((due === UP || due === DOWN) && (dir === UP || dir === DOWN))
    );
  };

  const isMidSquare = (x) => {
    let rem = x % 10;
    return rem > 3 || rem < 7;
  };

  const calcAngle = (dir, pos) => {
    if (dir == RIGHT && pos.x % 10 < 5) {
      return { start: 0.25, end: 1.75, direction: false };
    } else if (dir === DOWN && pos.y % 10 < 5) {
      return { start: 0.75, end: 2.25, direction: false };
    } else if (dir === UP && pos.y % 10 < 5) {
      return { start: 1.25, end: 1.75, direction: true };
    } else if (dir === LEFT && pos.x % 10 < 5) {
      return { start: 0.75, end: 1.25, direction: true };
    }
    return { start: 0, end: 2, direction: false };
  };

  const draw = () => {
    let s = props.blockSize,
      angle = calcAngle(direction, position);

    ctx.fillStyle = "#FFFF00";

    ctx.beginPath();

    ctx.moveTo((position.x / 10) * s + s / 2, (position.y / 10) * s + s / 2);

    ctx.arc(
      (position.x / 10) * s + s / 2,
      (position.y / 10) * s + s / 2,
      s / 2,
      Math.PI * angle.start,
      Math.PI * angle.end,
      angle.direction
    );

    ctx.fill();
  };

  const addScore = useCallback(
    (nScore) => {
      setScore(score + nScore);
      if (score >= 10000 && score - nScore < 10000) {
        setLives(lives + 1);
      }
    },
    [lives, score]
  );

  useImperativeHandle(
    ref,
    () => ({
      getLives: () => {
        return lives;
      },

      addScore: (score) => {
        addScore(score);
      },

      drawDead: (ctx, amount) => {
        let size = props.blockSize,
          half = size / 2;

        if (amount >= 1) {
          return;
        }

        ctx.fillStyle = "#FFFF00";
        ctx.beginPath();
        ctx.moveTo(
          (position.x / 10) * size + half,
          (position.y / 10) * size + half
        );

        ctx.arc(
          (position.x / 10) * size + half,
          (position.y / 10) * size + half,
          half,
          0,
          Math.PI * 2 * amount,
          true
        );

        ctx.fill();
      },
      move: () => {
        let npos = null,
          nextWhole = null,
          oldPosition = position,
          block = null;

        if (due !== direction) {
          npos = getNewCoord(due, position);

          if (
            isOnSamePlane(due, direction) ||
            (onGridSquare(position) &&
              gameMapRef.current.isFloorSpace(next(npos, due)))
          ) {
            setDirection(due);
          } else {
            npos = null;
          }
        }

        if (npos === null) {
          npos = getNewCoord(direction, position);
        }

        if (
          onGridSquare(position) &&
          gameMapRef.current.isWall(next(npos, direction))
        ) {
          setDirection(NONE);
        }

        if (direction === NONE) {
          return { new: position, old: position };
        }

        if (npos.y === 100 && npos.x >= 190 && direction === RIGHT) {
          npos = { y: 100, x: -10 };
        }

        if (npos.y === 100 && npos.x <= -12 && direction === LEFT) {
          npos = { y: 100, x: 190 };
        }

        setPosition(npos);
        nextWhole = next(position, direction);

        block = gameMapRef.current.block(nextWhole);

        if (
          ((isMidSquare(position.y) || isMidSquare(position.x)) &&
            block === BISCUIT) ||
          block === PILL
        ) {
          gameMapRef.current.setBlock(nextWhole, EMPTY);
          addScore(block === BISCUIT ? 10 : 50);
          setEaten(eaten + 1);

          /** TODO */
          if (eaten === 182) {
            game.completedLevel();
          }
          /** TODO */
          if (block === PILL) {
            game.eatenPill();
          }
        }

        return {
          new: position,
          old: oldPosition,
        };
      },

      theScore: () => {
        return score;
      },

      initUser: () => {
        setScore(0);
        setLives(3);
        newLevel();
      },

      loseLife: () => {
        setLives(lives - 1);
      },

      resetPosition: () => {
        resetPosition();
      },
    }),
    [
      addScore,
      direction,
      due,
      eaten,
      game,
      gameMapRef,
      lives,
      newLevel,
      next,
      onGridSquare,
      position,
      props.blockSize,
      score,
    ]
  );
  return <div></div>;
};

export default forwardRef(User);
