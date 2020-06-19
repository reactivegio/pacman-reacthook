import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import * as gameConstants from "../constants/game";

import "./style.css";

const GhostRandom = (props, ref) => {
  const [ghostPos, setGhostPos] = useState({
    x: 14,
    old_x: 14,
    y: 14,
    old_y: 14,
    direction: "up",
    isExitHouse: false,
  });

  const checkCollision = useCallback(
    (x, y, direction) => {
      let value = null;

      if (direction === "right") value = props.playerPos.board[y][x + 1];
      if (direction === "left") value = props.playerPos.board[y][x - 1];
      if (direction === "down") value = props.playerPos.board[y + 1][x];
      if (direction === "up") value = props.playerPos.board[y - 1][x];
      return value;
    },
    [props]
  );

  const runIt = useCallback(
    (x, y, signX, signY, direction) => {
      let currentLeft = x;
      let currentTop = y;
      let cloneBoard = [...props.playerPos.board];

      /** if not exited from ghosts house not go up or down otherwise it free  */
      let arrayDirection = ghostPos.isExitHouse
        ? ["up", "down", "left", "right"]
        : ["left", "right"];
      let collisionVal = checkCollision(currentLeft, currentTop, direction);

      let newDirection =
        arrayDirection[Math.floor(Math.random() * arrayDirection.length)];
      /** change random direction */

      if (collisionVal === 1) {
        setGhostPos({
          ...ghostPos,
          direction: newDirection,
          isExitHouse: true,
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
        direction: direction,
        score: newScore,
        sign: signX ? Math.sign(signX) : Math.sign(signY),
        isExitHouse: ghostPos.isExitHouse,
      });
    },
    [props.playerPos.board, checkCollision, ghostPos]
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
        <div className="ghost" style={{ background: "#71F3DA" }}>
          <div className={"eyes " + ghostPos.direction}></div>
          <div className="skirt"></div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default forwardRef(GhostRandom);
