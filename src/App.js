import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import Pacman from "./components/pacman";

import "./App.css";

function App() {
  return (
    <div className="board">
      <Pacman />
    </div>
  );
}

export default App;
