import { useEffect, useMemo, useRef, useState } from "react";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const WORD_HINTS = {
  A: "Apple",
  B: "Ball",
  C: "Cat",
  D: "Dog",
  E: "Egg",
  F: "Fish",
  G: "Grape",
  H: "Hat",
  I: "Ice",
  J: "Juice",
  K: "Kite",
  L: "Lion",
  M: "Moon",
  N: "Nest",
  O: "Orange",
  P: "Pencil",
  Q: "Queen",
  R: "Rainbow",
  S: "Sun",
  T: "Tree",
  U: "Umbrella",
  V: "Violin",
  W: "Whale",
  X: "Xylophone",
  Y: "Yacht",
  Z: "Zebra",
};

const CANVAS_WIDTH = 760;
const CANVAS_HEIGHT = 320;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function HandwritingPracticePage() {
  const [letter, setLetter] = useState("A");
  const [brushSize, setBrushSize] = useState(10);
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]);

  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const pointerIdRef = useRef(null);
  const originalBodyUserSelectRef = useRef("");

  const hintWord = WORD_HINTS[letter];

  const nextLetter = useMemo(() => {
    const index = LETTERS.indexOf(letter);
    return LETTERS[(index + 1) % LETTERS.length];
  }, [letter]);

  useEffect(() => {
    renderPracticeSheet(canvasRef.current, letter);
    setScore(null);
  }, [letter]);

  useEffect(() => () => {
    document.body.style.userSelect = originalBodyUserSelectRef.current;
  }, []);

  const startDraw = (event) => {
    event.preventDefault();

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    canvas.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;

    originalBodyUserSelectRef.current = document.body.style.userSelect;
    document.body.style.userSelect = "none";

    if (window.getSelection) {
      window.getSelection().removeAllRanges();
    }

    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = clamp(event.clientY - rect.top, 0, rect.height);

    const normalizedX = (x / rect.width) * canvas.width;
    const normalizedY = (y / rect.height) * canvas.height;

    drawingRef.current = true;
    context.beginPath();
    context.moveTo(normalizedX, normalizedY);
  };

  const endDraw = (event) => {
    if (event) {
      event.preventDefault();

      if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) {
        return;
      }
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (pointerIdRef.current !== null && canvas.hasPointerCapture(pointerIdRef.current)) {
      canvas.releasePointerCapture(pointerIdRef.current);
    }

    pointerIdRef.current = null;
    drawingRef.current = false;
    document.body.style.userSelect = originalBodyUserSelectRef.current;
    context.beginPath();
  };

  const drawStroke = (event) => {
    if (!drawingRef.current) {
      return;
    }

    if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) {
      return;
    }

    if (event.buttons === 0) {
      endDraw(event);
      return;
    }

    event.preventDefault();

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    const x = clamp(event.clientX - rect.left, 0, rect.width);
    const y = clamp(event.clientY - rect.top, 0, rect.height);

    const normalizedX = (x / rect.width) * canvas.width;
    const normalizedY = (y / rect.height) * canvas.height;

    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = "#1f6feb";
    context.lineWidth = brushSize;

    context.lineTo(normalizedX, normalizedY);
    context.stroke();
    context.beginPath();
    context.moveTo(normalizedX, normalizedY);
  };

  const resetCanvas = () => {
    renderPracticeSheet(canvasRef.current, letter);
    setScore(null);
  };

  const checkResult = () => {
    const canvas = canvasRef.current;
    const drawCtx = canvas.getContext("2d");
    const drawing = drawCtx.getImageData(0, 0, canvas.width, canvas.height).data;

    const guideCanvas = document.createElement("canvas");
    guideCanvas.width = canvas.width;
    guideCanvas.height = canvas.height;
    const guideCtx = guideCanvas.getContext("2d");
    drawLetterTemplates(guideCtx, letter, { forScoring: true });

    const guide = guideCtx.getImageData(0, 0, canvas.width, canvas.height).data;

    let templatePixels = 0;
    let matchedPixels = 0;

    for (let i = 0; i < guide.length; i += 4) {
      const guideAlpha = guide[i + 3];
      const hasGuide = guideAlpha > 0;
      if (!hasGuide) {
        continue;
      }
      templatePixels += 1;

      const isDrawn = drawing[i + 2] > 150 && drawing[i + 3] > 0;
      if (isDrawn) {
        matchedPixels += 1;
      }
    }

    const accuracy = templatePixels
      ? Math.round((matchedPixels / templatePixels) * 100)
      : 0;

    const result = {
      letter,
      accuracy,
      timestamp: new Date().toLocaleTimeString(),
    };

    setHistory((current) => [result, ...current].slice(0, 6));
    setScore(result);
  };

  return (
    <section className="practice-page">
      <section className="panel controls">
        <label>
          練習字母
          <select value={letter} onChange={(event) => setLetter(event.target.value)}>
            {LETTERS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          筆刷粗細：{brushSize}px
          <input
            type="range"
            min="6"
            max="20"
            value={brushSize}
            onChange={(event) => setBrushSize(Number(event.target.value))}
          />
        </label>

        <div className="actions">
          <button type="button" className="ghost" onClick={resetCanvas}>
            清除重寫
          </button>
          <button type="button" onClick={checkResult}>
            評分
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="hint-row">
          <p>
            目前字母：<strong>{letter}</strong> / <strong>{letter.toLowerCase()}</strong>
          </p>
          <p>
            單字提示：<strong>{hintWord}</strong>
          </p>
          <p>
            下一個字母：<strong>{nextLetter}</strong>
          </p>
        </div>

        <canvas
          ref={canvasRef}
          className="practice-canvas"
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={startDraw}
          onPointerMove={drawStroke}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
          onPointerCancel={endDraw}
        />

        {score && (
          <p className="score">
            本次 {score.letter} 描紅吻合度：<strong>{score.accuracy}%</strong>
          </p>
        )}
      </section>

      <section className="panel">
        <h2>最近練習紀錄</h2>
        {history.length === 0 ? (
          <p className="muted">還沒有紀錄，先描一次樣版再按評分吧！</p>
        ) : (
          <ul className="history">
            {history.map((item, index) => (
              <li key={`${item.timestamp}-${index}`}>
                <span>{item.letter}</span>
                <span>{item.accuracy}%</span>
                <span>{item.timestamp}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

function renderPracticeSheet(canvas, letter) {
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawGuidelines(context);
  drawLetterTemplates(context, letter, { forScoring: false });
}

function drawGuidelines(context) {
  context.save();
  context.strokeStyle = "#e8edf9";
  context.lineWidth = 2;

  const rowTop = [32, 130, 228];
  rowTop.forEach((top) => {
    [top, top + 28, top + 56].forEach((y) => {
      context.beginPath();
      context.moveTo(24, y);
      context.lineTo(CANVAS_WIDTH - 24, y);
      context.stroke();
    });
  });

  context.restore();
}

function drawLetterTemplates(context, letter, { forScoring }) {
  context.save();

  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = forScoring ? 16 : 3;
  context.strokeStyle = forScoring ? "#000000" : "#cfd9ee";
  context.fillStyle = forScoring ? "#000000" : "#d8e1f5";
  context.setLineDash(forScoring ? [] : [8, 8]);

  const rows = [84, 182, 280];
  const cols = [70, 190, 310, 430, 550, 670];

  rows.forEach((baseline) => {
    cols.forEach((x, index) => {
      const char = index < 3 ? letter : letter.toLowerCase();
      context.font = "700 60px 'Trebuchet MS', sans-serif";
      context.strokeText(char, x, baseline);

      if (!forScoring && index % 3 === 0) {
        context.beginPath();
        context.arc(x - 14, baseline - 42, 4, 0, 2 * Math.PI);
        context.fill();
      }
    });
  });

  context.restore();
}
