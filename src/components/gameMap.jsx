import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

import "./style.css";

const GameMap = (props, ref) => {
  const rows = props.board.map((item, i) => {
    return (
      <div className="row">
        {item.map((elem, n) => {
          let classVal = "square";
          if (elem === 0) classVal = "square";
          if (elem === 1) classVal = "square wall";
          if (elem === 2) classVal = "square dot";
          if (elem === 3) classVal = "square power dot";
          return <div className={classVal}></div>;
        })}
      </div>
    );
  });
  return rows;
};

export default forwardRef(GameMap);
