import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import "./style.css";

const Ghost = (props, ref) => {
  const [ghostPos, setGhostPos] = useState({
    /*
    x: 14,
    old_x: 14,
    y: 14,
    old_y: 14,
    direction: "up", 
    */
    x: 12,
    old_x: 12,
    y: 17,
    old_y: 17,
    direction: "up",
    score: 0,
  });

  const checkCollision = useCallback(
    (x, y, direction) => {
      let value = null;

      if (direction === "right") value = props.board[y][x + 1];
      if (direction === "left") value = props.board[y][x - 1];
      if (direction === "down") value = props.board[y + 1][x];
      if (direction === "up") value = props.board[y - 1][x];
      return value;
    },
    [props]
  );

  const runIt = useCallback(
    (x, y, signX, signY, direction) => {
      const { pacmanMove } = props;
      let currentLeft = x;
      let currentTop = y;
      let cloneBoard = [...props.board];

      let arrayDirection = ["up", "down", "left", "right"];
      let collisionVal = checkCollision(currentLeft, currentTop, direction);

      /* TODO Find out the direction (angle) the Ghost needs to move towards
      Using SOH-CAH-TOA trignometic rations */
      let opposite = pacmanMove.y - ghostPos.y;
      let adjacent = pacmanMove.x - ghostPos.x;
      let angle = Math.atan(opposite / adjacent) || 0;
      if (ghostPos.x > pacmanMove.x) angle = angle + 180;
      debugger;
      /*Use this angle to calculate the velocity vector of the Ghost
      Once again using SOH-CAH-TOA trignometic rations*/
      let velocity = 15; // #pixels per frame

      let vx = velocity * Math.cos(angle);
      let vy = velocity * Math.sin(angle);
      console.log("ANGLE:: " + angle);
      console.log("ANGLE vx:: " + vx);
      console.log("ANGLE vy:: " + vy);

      let newDirection =
        arrayDirection[Math.floor(Math.random() * arrayDirection.length)];
      /** change random direction */
      if (collisionVal === 1) {
        setGhostPos({
          ...ghostPos,
          direction: newDirection,
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
      });
    },
    [props, checkCollision, ghostPos]
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
      runIt(ghostPos.x, ghostPos.y, signX, signY, ghostPos.direction);
    }, 300);

    return () => {
      clearInterval(timerGhostId);
    };
  }, [runIt, ghostPos.direction, ghostPos.x, ghostPos.y]);

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
        <div className="ghost">
          <div className="eyes"></div>
          <div className="skirt"></div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default forwardRef(Ghost);
