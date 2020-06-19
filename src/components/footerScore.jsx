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
  return (
    <div className="scoreBoard">
      <div style={{ display: "flex" }}>
        <div style={{ flex: "1 0 50%" }}>
          <div
            style={{
              position: "absolute",
              marginTop: "-10px",
              fontWeight: 600,
            }}
          >
            life:{" "}
          </div>
          {renderLife()}
        </div>
        <div style={{ flex: "1 0 50%" }}>
          <div
            style={{
              position: "absolute",
              marginTop: "-10px",
              fontWeight: 600,
            }}
          >
            score:{" "}
          </div>
          <div
            style={{ marginTop: "10px", fontSize: "25px", fontWeight: "bold" }}
          >
            {props.score}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FooterScore;
