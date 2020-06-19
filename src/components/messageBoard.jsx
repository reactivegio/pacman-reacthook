import React, { useCallback } from "react";

import "./style.css";

const MessageBoard = (props) => {
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

  return <div className="boardCenteredMsg">{props.message}</div>;
};

export default MessageBoard;
