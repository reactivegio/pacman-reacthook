import React, { useState } from "react";

import "./style.css";

const FooterScore = (props) => {
  const renderLife = () => {
    let lifeArray = [];
    for (let i = 0; i < props.life; i++) {
      lifeArray.push(<div className="hearth"></div>);
    }
    return lifeArray;
  };
  return <div className="scoreBoard">{renderLife()}</div>;
};

export default FooterScore;
