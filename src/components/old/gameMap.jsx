import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import {
  BISCUIT,
  BLOCK,
  DOWN,
  EMPTY,
  LEFT,
  KEY,
  MAP,
  NONE,
  PILL,
  RIGHT,
  WALL,
  WALLS,
} from "../constants/game";

const GameMap = (props, ref) => {
  const { blockSize, ctx } = props;

  const [height, setHeight] = useState(null);
  const [width, setWidth] = useState(null);
  const [pillSize, setPillSize] = useState(null);
  const [map, setMap] = useState([]);

  const withinBounds = useCallback(
    (y, x) => {
      return y >= 0 && y < height && x >= 0 && x < width;
    },
    [height, width]
  );

  const drawWall = useCallback(() => {
    let i, j, p, line;

    ctx.strokeStyle = "#99CBFF";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";

    for (i = 0; i < WALLS.length; i += 1) {
      line = WALLS[i];
      ctx.beginPath();

      for (j = 0; j < line.length; j += 1) {
        p = line[j];

        if (p.move) {
          ctx.moveTo(p.move[0] * blockSize, p.move[1] * blockSize);
        } else if (p.line) {
          ctx.lineTo(p.line[0] * blockSize, p.line[1] * blockSize);
        } else if (p.curve) {
          ctx.quadraticCurveTo(
            p.curve[0] * blockSize,
            p.curve[1] * blockSize,
            p.curve[2] * blockSize,
            p.curve[3] * blockSize
          );
        }
      }
      ctx.stroke();
    }
  }, [blockSize, ctx]);

  const drawBlock = useCallback(
    (cloneMap, y, x) => {
      let layout = cloneMap[y][x];

      if (layout === PILL) {
        return;
      }

      ctx.beginPath();

      if (layout === EMPTY || layout === BLOCK || layout === BISCUIT) {
        ctx.fillStyle = "#000";
        ctx.fillRect(x * blockSize, y * blockSize, blockSize, blockSize);

        if (layout === BISCUIT) {
          ctx.fillStyle = "#FFF";
          ctx.fillRect(
            x * blockSize + blockSize / 2.5,
            y * blockSize + blockSize / 2.5,
            blockSize / 8,
            blockSize / 8
          );
        }
      }
      ctx.closePath();
    },
    [blockSize, ctx]
  );

  const draw = useCallback(
    (cloneMap, customWidth, customHeight) => {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, customWidth * blockSize, customHeight * blockSize);

      drawWall();

      for (let i = 0; i < customHeight; i += 1) {
        for (let j = 0; j < customWidth; j += 1) {
          drawBlock(cloneMap, i, j);
        }
      }
    },
    [blockSize, ctx, drawBlock, drawWall]
  );

  useImperativeHandle(
    ref,
    () => ({
      block: (pos) => {
        return map[pos.y][pos.x];
      },

      getWidth: () => {
        console.log("**** game Width" + width);
        return width;
      },
      getHeight: () => {
        return height;
      },
      reset: () => {
        const cloneMap = [...MAP];
        setMap(cloneMap);
        setHeight(MAP.length);
        if (MAP.length > 0) setWidth(MAP[0].length);
        draw(cloneMap, MAP[0].length, MAP.length);
      },
      drawBlock: (y, x) => {
        drawBlock(map, y, x);
      },
      draw: () => {
        draw(map, width, height);
      },

      drawPills: () => {
        let pillSizeCounter = pillSize + 1;
        setPillSize(pillSizeCounter);
        if (pillSizeCounter > 30) {
          setPillSize(0);
        }

        for (let i = 0; i < height; i++) {
          for (let j = 0; j < width; j++) {
            if (map[i][j] === PILL) {
              ctx.beginPath();

              ctx.fillStyle = "#000";
              ctx.fillRect(j * blockSize, i * blockSize, blockSize, blockSize);

              ctx.fillStyle = "#FFF";
              ctx.arc(
                j * blockSize + blockSize / 2,
                i * blockSize + blockSize / 2,
                Math.abs(5 - pillSize / 3),
                0,
                Math.PI * 2,
                false
              );
              ctx.fill();
              ctx.closePath();
            }
          }
        }
      },

      isFloorSpace: (pos) => {
        if (!withinBounds(pos.y, pos.x)) {
          return false;
        }
        let peice = map[pos.y][pos.x];
        return peice === EMPTY || peice === BISCUIT || peice === PILL;
      },

      isWall: (pos) => {
        return withinBounds(pos.y, pos.x) && map[pos.y][pos.x] === WALL;
      },

      setBlock: (pos, type) => {
        let cloneMap = [...map];
        cloneMap[pos.y][pos.x] = type;
        setMap(cloneMap);
      },
    }),
    [
      blockSize,
      ctx,
      draw,
      drawBlock,
      height,
      map,
      pillSize,
      width,
      withinBounds,
    ]
  );

  //

  return <div id="gamemap" />;
};

export default forwardRef(GameMap);
