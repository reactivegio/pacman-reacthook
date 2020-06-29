import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import * as gameConstants from "../constants/game";
import "./style.css";

const Ghost = (props, ref) => {
  const [ghostPos, setGhostPos] = useState({
    x: 13,
    old_x: 13,
    y: 14,
    old_y: 14,
    direction: "up",
    isExitHouse: false,
    bundleDirection: ["left", "right"], // at beginning to exit from ghost house
  });

  const checkCollision = useCallback(
    (x, y, direction) => {
      let value = null;
      // I need to check actual position
      if (!x && !y) {
        value = props.playerPos.board[ghostPos.y][ghostPos.x];
        return value;
      }
      if (direction === "right") value = props.playerPos.board[y][x + 1];
      if (direction === "left") value = props.playerPos.board[y][x - 1];
      if (direction === "down") value = props.playerPos.board[y + 1][x];
      if (direction === "up") value = props.playerPos.board[y - 1][x];
      return value;
    },
    [ghostPos.x, ghostPos.y, props.playerPos.board]
  );

  const checkBestDirection = useCallback(
    (arrayDir) => {
      let returnedDirection;
      for (let j = 0; j < arrayDir.length; j++) {
        if (ghostPos.direction === arrayDir[j]) {
          continue;
        } else {
          let nexCollision = checkCollision(null, null, arrayDir[j]);
          if (nexCollision === 1) {
            continue;
          }
        }
        returnedDirection = arrayDir[j];
        break;
      }
      return returnedDirection;
    },
    [checkCollision, ghostPos.direction]
  );

  const runIt = useCallback(
    (x, y, signX, signY, direction) => {
      let currentLeft = x;
      let currentTop = y;
      let cloneBoard = [...props.playerPos.board];
      let arrayDirection = [];
      if (
        currentLeft === props.playerPos.x &&
        currentTop === props.playerPos.y
      ) {
        props.eaten();
        return;
      } else {
        // find best direction to catch Pacman it's a chaser ghost
        let vertical = props.playerPos.y - ghostPos.y;
        let horizontal = props.playerPos.x - ghostPos.x;

        if (ghostPos.isExitHouse) {
          for (let d = 0; d < 4; d++) {
            if (vertical > horizontal) {
              if (Math.sign(vertical) > 0) {
                arrayDirection.push("down");
              } else {
                arrayDirection.push("down");
              }
              if (Math.sign(horizontal) > 0) {
                arrayDirection.push("right");
              } else {
                arrayDirection.push("left");
              }
              arrayDirection = arrayDirection.concat([
                "up",
                "left",
                "right",
                "down",
              ]);
            } else {
              if (Math.sign(horizontal) > 0) {
                arrayDirection.push("right");
              } else {
                arrayDirection.push("left");
              }
              if (Math.sign(vertical) > 0) {
                arrayDirection.push("down");
              } else {
                arrayDirection.push("up");
              }
              arrayDirection = arrayDirection.concat([
                "right",
                "down",
                "up",
                "left",
              ]);
            }
          }
        } else {
          arrayDirection = ["left", "right"];
        }
      }
      arrayDirection = arrayDirection.filter((val, idx, self) => {
        return idx === self.indexOf(val);
      });
      debugger;
      let collisionVal = checkCollision(currentLeft, currentTop, direction);

      let newDirection = checkBestDirection(arrayDirection);
      // arrayDirection[Math.floor(Math.random() * arrayDirection.length)];
      /** change random direction */
      if (collisionVal === 1) {
        setGhostPos({
          ...ghostPos,
          direction: newDirection,
          isExitHouse: ghostPos.isExitHouse
            ? ghostPos.isExitHouse
            : ![13, 14, 15].includes(ghostPos.x) ||
              ![14, 13, 12, 11].includes(ghostPos.y),
        });
        return;
      }
      let left = currentLeft;
      let top = currentTop;
      let newScore = ghostPos.score;

      if (collisionVal !== 1) {
        if (direction === "right" && currentLeft < 27) left += 1;
        if (direction === "left" && currentLeft > 0) left -= 1;
        if (direction === "down" && currentTop < 30) top += 1;
        if (direction === "up" && currentTop > 0) top -= 1;
      }

      setGhostPos({
        x: left,
        y: top,
        board: cloneBoard,
        old_x: currentLeft,
        old_y: currentTop,
        direction: ghostPos.isExitHouse ? newDirection : direction,
        score: newScore,
        sign: signX ? Math.sign(signX) : Math.sign(signY),
        isExitHouse: ghostPos.isExitHouse
          ? ghostPos.isExitHouse
          : ![13, 14, 15].includes(ghostPos.x) ||
            ![14, 13, 12, 11].includes(ghostPos.y),
      });
    },
    [props, checkCollision, checkBestDirection, ghostPos]
  );

  useEffect(() => {
    let signX =
      ghostPos.direction === "left"
        ? -1
        : ghostPos.direction === "right"
        ? 1
        : null;
    let signY =
      ghostPos.direction === "up"
        ? -1
        : ghostPos.direction === "down"
        ? 1
        : null;
    let timerGhostId = setInterval(() => {
      if (props.gameState === gameConstants.PLAYING)
        runIt(ghostPos.x, ghostPos.y, signX, signY, ghostPos.direction);
    }, 300);

    return () => {
      clearInterval(timerGhostId);
    };
  }, [runIt, ghostPos.direction, ghostPos.x, ghostPos.y, props.gameState]);

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

  let xPercent = (ghostPos.x * 100) / 28;
  let yPercent = (ghostPos.y * 100) / 31;
  let addedStyle = {};
  return (
    <React.Fragment>
      <div
        className="containerGhost"
        style={Object.assign(
          {
            left: xPercent + "%",
            top: yPercent + "%",
          },
          addedStyle
        )}
      >
        <div className="ghost" style={{ background: "red" }}>
          <div className={"eyes " + ghostPos.direction}></div>
          <div className="skirt"></div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default forwardRef(Ghost);
