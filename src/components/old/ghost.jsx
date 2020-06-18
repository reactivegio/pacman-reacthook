import React, {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useState,
} from "react";
import { DOWN, FPS, LEFT, RIGHT, UP } from "../constants/game";
import "./style.css";

const Ghost = (props, ref) => {
  const { colour, ctx, game, map } = props;

  const [direction, setDirection] = useState(null);
  const [due, setDue] = useState(null);
  const [eatable, setEatable] = useState(null);
  const [eaten, setEaten] = useState(null);
  const [position, setPosition] = useState(null);

  const getNewCoord = (dir, current) => {
    let speed = isVunerable() ? 1 : isHidden() ? 4 : 2,
      xSpeed = (dir === LEFT && -speed) || (dir === RIGHT && speed) || 0,
      ySpeed = (dir === DOWN && speed) || (dir === UP && -speed) || 0;

    return {
      x: addBounded(current.x, xSpeed),
      y: addBounded(current.y, ySpeed),
    };
  };

  const addBounded = (x1, x2) => {
    let rem = x1 % 10,
      result = rem + x2;
    if (rem !== 0 && result > 10) {
      return x1 + (10 - rem);
    } else if (rem > 0 && result < 0) {
      return x1 - rem;
    }
    return x1 + x2;
  };

  const isVunerable = () => {
    return eatable !== null;
  };

  const isDangerous = () => {
    return eaten === null;
  };

  const isHidden = () => {
    return eatable === null && eaten !== null;
  };

  const getRandomDirection = useCallback(() => {
    let moves =
      direction === LEFT || direction === RIGHT ? [UP, DOWN] : [LEFT, RIGHT];
    return moves[Math.floor(Math.random() * 2)];
  });

  function onWholeSquare(x) {
    return x % 10 === 0;
  }

  function oppositeDirection(dir) {
    return (
      (dir === LEFT && RIGHT) ||
      (dir === RIGHT && LEFT) ||
      (dir === UP && DOWN) ||
      UP
    );
  }

  function makeEatable() {
    setDirection(oppositeDirection(direction));
    setEatable(game.getTick());
  }

  function eat() {
    setEatable(null);
    setEaten(game.getTick());
  }

  function pointToCoord(x) {
    return Math.round(x / 10);
  }

  function nextSquare(x, dir) {
    let rem = x % 10;
    if (rem === 0) {
      return x;
    } else if (dir === RIGHT || dir === DOWN) {
      return x + (10 - rem);
    } else {
      return x - rem;
    }
  }

  function onGridSquare(pos) {
    return onWholeSquare(pos.y) && onWholeSquare(pos.x);
  }

  function secondsAgo(tick) {
    return (game.getTick() - tick) / FPS;
  }

  function getColour() {
    if (eatable) {
      if (secondsAgo(eatable) > 5) {
        return game.getTick() % 20 > 10 ? "#FFFFFF" : "#0000BB";
      } else {
        return "#0000BB";
      }
    } else if (eaten) {
      return "#222";
    }
    return colour;
  }

  function pane(pos) {
    if (pos.y === 100 && pos.x >= 190 && direction === RIGHT) {
      return { y: 100, x: -10 };
    }

    if (pos.y === 100 && pos.x <= -10 && direction === LEFT) {
      return setPosition({ y: 100, x: 190 });
    }

    return false;
  }

  function move(ctx) {
    let oldPos = position,
      onGrid = onGridSquare(position),
      npos = null;

    if (due !== direction) {
      npos = getNewCoord(due, position);

      if (
        onGrid &&
        map.isFloorSpace({
          y: pointToCoord(nextSquare(npos.y, due)),
          x: pointToCoord(nextSquare(npos.x, due)),
        })
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
      onGrid &&
      map.isWallSpace({
        y: pointToCoord(nextSquare(npos.y, direction)),
        x: pointToCoord(nextSquare(npos.x, direction)),
      })
    ) {
      setDue(getRandomDirection());
      return move(ctx);
    }

    setPosition(npos);

    let tmp = pane(position);
    if (tmp) {
      setPosition(tmp);
    }

    setDue(getRandomDirection());

    return {
      new: position,
      old: oldPos,
    };
  }

  useImperativeHandle(
    ref,
    () => ({
      draw: () => {
        debugger;
        let s = props.blockSize,
          top = (position.y / 10) * s,
          left = (position.x / 10) * s;

        if (eatable && secondsAgo(eatable) > 8) {
          setEatable(null);
        }

        if (eaten && secondsAgo(eaten) > 3) {
          setEaten(null);
        }

        let tl = left + s;
        let base = top + s - 3;
        let inc = s / 10;

        let high = game.getTick() % 10 > 5 ? 3 : -3;
        let low = game.getTick() % 10 > 5 ? -3 : 3;

        ctx.fillStyle = getColour();
        ctx.beginPath();

        ctx.moveTo(left, base);

        ctx.quadraticCurveTo(left, top, left + s / 2, top);
        ctx.quadraticCurveTo(left + s, top, left + s, base);

        // Wavy things at the bottom
        ctx.quadraticCurveTo(tl - inc * 1, base + high, tl - inc * 2, base);
        ctx.quadraticCurveTo(tl - inc * 3, base + low, tl - inc * 4, base);
        ctx.quadraticCurveTo(tl - inc * 5, base + high, tl - inc * 6, base);
        ctx.quadraticCurveTo(tl - inc * 7, base + low, tl - inc * 8, base);
        ctx.quadraticCurveTo(tl - inc * 9, base + high, tl - inc * 10, base);

        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "#FFF";
        ctx.arc(left + 6, top + 6, s / 6, 0, 300, false);
        ctx.arc(left + s - 6, top + 6, s / 6, 0, 300, false);
        ctx.closePath();
        ctx.fill();

        let f = s / 12;
        let off = {};
        off[RIGHT] = [f, 0];
        off[LEFT] = [-f, 0];
        off[UP] = [0, -f];
        off[DOWN] = [0, f];

        ctx.beginPath();
        ctx.fillStyle = "#000";
        ctx.arc(
          left + 6 + off[direction][0],
          top + 6 + off[direction][1],
          s / 15,
          0,
          300,
          false
        );
        ctx.arc(
          left + s - 6 + off[direction][0],
          top + 6 + off[direction][1],
          s / 15,
          0,
          300,
          false
        );
        ctx.closePath();
        ctx.fill();
      },

      reset: () => {
        setEatable(null);
        setEaten(null);
        setPosition({ x: 90, y: 80 });
        setDirection(getRandomDirection());
        setDue(getRandomDirection());
      },
    }),
    [
      ctx,
      direction,
      eatable,
      eaten,
      game,
      getColour,
      getRandomDirection,
      position,
      props.blockSize,
      secondsAgo,
    ]
  );
  return <div className="ghosts"></div>;
};

export default forwardRef(Ghost);
