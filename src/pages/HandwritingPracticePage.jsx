import { useEffect, useMemo, useRef, useState } from "react";

const PRACTICE_SETS = [
  { label: "單字", items: ["Sunrise", "Rainbow", "Pencil", "Mountain", "Library"] },
  {
    label: "句子",
    items: [
      "Why did the math book look sad? It had too many problems.",
      "I told my pencil a joke. It drew a blank.",
      "Why did the bicycle fall over? It was two tired.",
      "What do you call a sleeping bull? A bulldozer.",
      "Why did the cookie go to the doctor? It felt crummy.",
      "What do you get when you cross a snowman and a dog? Frostbite.",
      "Why did the tomato blush? It saw the salad dressing.",
      "Why did the scarecrow win an award? He was outstanding in his field.",
      "What did one wall say to the other? I'll meet you at the corner.",
      "Why was the computer cold? It left its Windows open.",
      "What do you call cheese that is not yours? Nacho cheese.",
      "Why did the golfer bring two pants? In case he got a hole in one.",
      "How do you organize a space party? You planet.",
      "Why did the banana go to the doctor? It was not peeling well.",
      "What do you call a bear with no teeth? A gummy bear.",
      "Why did the music teacher go to jail? He got caught with sharp notes.",
      "What did the zero say to the eight? Nice belt.",
      "Why do bees have sticky hair? They use honeycombs.",
      "What do you call a fish with no eyes? Fsh.",
      "Why did the chicken join a band? It had the drumsticks.",
    ],
  },
];

const FONT_OPTIONS = [
  { label: "Comic Sans", value: "'Comic Sans MS', 'Comic Sans', cursive" },
  { label: "Bradley Hand", value: "'Bradley Hand', 'Bradley Hand ITC', cursive" },
  { label: "Segoe Print", value: "'Segoe Print', 'Segoe Script', cursive" },
  { label: "Chalkboard", value: "'Chalkboard SE', 'Chalkboard', cursive" },
  { label: "Trebuchet", value: "'Trebuchet MS', sans-serif" },
];

const TRACE_STYLES = [
  { label: "填滿", value: "fill" },
  { label: "描邊", value: "stroke" },
];

const CANVAS_WIDTH = 760;
const CANVAS_HEIGHT = 320;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

export default function HandwritingPracticePage({ onBack }) {
  const [practiceSet, setPracticeSet] = useState(PRACTICE_SETS[1].label);
  const [practiceItem, setPracticeItem] = useState(PRACTICE_SETS[1].items[0]);
  const [fontFamily, setFontFamily] = useState(FONT_OPTIONS[4].value);
  const [traceStyle, setTraceStyle] = useState(TRACE_STYLES[0].value);
  const [brushSize, setBrushSize] = useState(6);
  const [score, setScore] = useState(null);
  const [history, setHistory] = useState([]);
  const [visibleWordCount, setVisibleWordCount] = useState(1);
  const [canvasSize, setCanvasSize] = useState({
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
  });

  const canvasRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const layoutRef = useRef(null);
  const drawingRef = useRef(false);
  const pointerIdRef = useRef(null);
  const originalBodyUserSelectRef = useRef("");
  const originalHtmlUserSelectRef = useRef("");
  const originalBodyWebkitUserSelectRef = useRef("");
  const originalHtmlWebkitUserSelectRef = useRef("");

  const currentSet = useMemo(
    () => PRACTICE_SETS.find((set) => set.label === practiceSet) || PRACTICE_SETS[0],
    [practiceSet]
  );

  const renderSheet = (visibleCount) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const layout = renderPracticeSheet(
      canvas,
      practiceItem,
      fontFamily,
      traceStyle,
      visibleCount
    );
    layoutRef.current = layout;
  };

  useEffect(() => {
    const wrapper = canvasWrapperRef.current;
    if (!wrapper) {
      return;
    }

    const updateSize = () => {
      const borderSize = 4;
      const nextWidth = Math.max(320, Math.floor(wrapper.clientWidth) - borderSize);
      const nextHeight = Math.max(320, Math.floor(wrapper.clientHeight) - borderSize);
      setCanvasSize((current) => {
        if (current.width === nextWidth && current.height === nextHeight) {
          return current;
        }
        return { width: nextWidth, height: nextHeight };
      });
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) {
      return;
    }
    setVisibleWordCount(1);
    renderSheet(1);
    setScore(null);
  }, [practiceItem, canvasSize, fontFamily, traceStyle]);

  useEffect(() => () => {
    document.body.style.userSelect = originalBodyUserSelectRef.current;
    document.documentElement.style.userSelect = originalHtmlUserSelectRef.current;
    document.body.style.webkitUserSelect = originalBodyWebkitUserSelectRef.current;
    document.documentElement.style.webkitUserSelect =
      originalHtmlWebkitUserSelectRef.current;
  }, []);

  const startDraw = (event) => {
    event.preventDefault();

    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();

    canvas.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;

    originalBodyUserSelectRef.current = document.body.style.userSelect;
    originalHtmlUserSelectRef.current = document.documentElement.style.userSelect;
    originalBodyWebkitUserSelectRef.current = document.body.style.webkitUserSelect;
    originalHtmlWebkitUserSelectRef.current =
      document.documentElement.style.webkitUserSelect;

    document.body.style.userSelect = "none";
    document.documentElement.style.userSelect = "none";
    document.body.style.webkitUserSelect = "none";
    document.documentElement.style.webkitUserSelect = "none";

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
    document.documentElement.style.userSelect = originalHtmlUserSelectRef.current;
    document.body.style.webkitUserSelect = originalBodyWebkitUserSelectRef.current;
    document.documentElement.style.webkitUserSelect =
      originalHtmlWebkitUserSelectRef.current;
    context.beginPath();
    checkWordCompletion();
  };

  const drawStroke = (event) => {
    if (!drawingRef.current) {
      return;
    }

    if (pointerIdRef.current !== null && event.pointerId !== pointerIdRef.current) {
      return;
    }

    if (event.pointerType === "mouse" && event.buttons === 0) {
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
    setVisibleWordCount(1);
    renderSheet(1);
    setScore(null);
  };

  const checkWordCompletion = () => {
    const canvas = canvasRef.current;
    const layout = layoutRef.current;
    if (!canvas || !layout || layout.words.length === 0) {
      return;
    }

    if (visibleWordCount >= layout.words.length) {
      return;
    }

    const currentIndex = Math.max(0, visibleWordCount - 1);
    const completion = getWordMatchPercent(canvas, layout, currentIndex);
    if (completion < 0.55) {
      return;
    }

    const nextCount = Math.min(layout.words.length, visibleWordCount + 1);
    setVisibleWordCount(nextCount);
    const context = canvas.getContext("2d");
    drawPracticeTemplates(context, layout, traceStyle, nextCount, {
      forScoring: false,
      startIndex: currentIndex + 1,
    });
  };

  const checkResult = () => {
    const canvas = canvasRef.current;
    const drawCtx = canvas.getContext("2d");
    const drawing = drawCtx.getImageData(0, 0, canvas.width, canvas.height).data;

    const guideCanvas = document.createElement("canvas");
    guideCanvas.width = canvas.width;
    guideCanvas.height = canvas.height;
    const guideCtx = guideCanvas.getContext("2d");
    const guideLayout = getTextLayout(guideCtx, practiceItem, fontFamily);
    drawPracticeTemplates(
      guideCtx,
      guideLayout,
      traceStyle,
      guideLayout.words.length,
      { forScoring: true }
    );

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

      const isDrawn = hasUserInk(
        drawing[i],
        drawing[i + 1],
        drawing[i + 2],
        drawing[i + 3]
      );
      if (isDrawn) {
        matchedPixels += 1;
      }
    }

    const accuracy = templatePixels
      ? Math.round((matchedPixels / templatePixels) * 100)
      : 0;

    const result = {
      text: practiceItem,
      accuracy,
      timestamp: new Date().toLocaleTimeString(),
    };

    setHistory((current) => [result, ...current].slice(0, 6));
    setScore(result);
  };

  return (
    <section className="practice-page">
      <section className="panel controls">
        <button type="button" className="ghost" onClick={onBack}>
          返回
        </button>
        <label>
          練習類型
          <select
            value={practiceSet}
            onChange={(event) => {
              const nextSet = event.target.value;
              const nextItems =
                PRACTICE_SETS.find((set) => set.label === nextSet)?.items ||
                PRACTICE_SETS[0].items;
              setPracticeSet(nextSet);
              setPracticeItem(nextItems[0]);
            }}
          >
            {PRACTICE_SETS.map((set) => (
              <option key={set.label} value={set.label}>
                {set.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          練習內容
          <select
            value={practiceItem}
            onChange={(event) => setPracticeItem(event.target.value)}
          >
            {currentSet.items.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          字體
          <select
            value={fontFamily}
            onChange={(event) => setFontFamily(event.target.value)}
          >
            {FONT_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          描字樣式
          <select
            value={traceStyle}
            onChange={(event) => setTraceStyle(event.target.value)}
          >
            {TRACE_STYLES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
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

      <section className="panel practice-sheet">
        <div className="practice-sheet-body" ref={canvasWrapperRef}>
          <canvas
            ref={canvasRef}
            className="practice-canvas"
            width={canvasSize.width}
            height={canvasSize.height}
            onPointerDown={startDraw}
            onPointerMove={drawStroke}
            onPointerUp={endDraw}
            onPointerLeave={endDraw}
            onPointerCancel={endDraw}
          />
        </div>

        {score && (
          <p className="score">
            本次描紅吻合度：<strong>{score.accuracy}%</strong>
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
                <span>{item.text}</span>
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

function renderPracticeSheet(canvas, text, fontFamily, traceStyle, visibleCount) {
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  const layout = getTextLayout(context, text, fontFamily);
  drawGuidelines(context, layout);
  drawPracticeTemplates(context, layout, traceStyle, visibleCount, {
    forScoring: false,
  });
  return layout;
}

function drawGuidelines(context, layout) {
  context.save();
  const { baselines, fontSize } = layout;
  const topOffset = fontSize * 0.85;
  const midOffset = fontSize * 0.45;
  const left = 24;
  const right = context.canvas.width - 24;

  baselines.forEach((baseline) => {
    context.strokeStyle = "#dfe6f5";
    context.lineWidth = 2;
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(left, baseline - topOffset);
    context.lineTo(right, baseline - topOffset);
    context.stroke();

    context.strokeStyle = "#e6ecf8";
    context.lineWidth = 2;
    context.setLineDash([6, 8]);
    context.beginPath();
    context.moveTo(left, baseline - midOffset);
    context.lineTo(right, baseline - midOffset);
    context.stroke();

    context.strokeStyle = "#dfe6f5";
    context.lineWidth = 2;
    context.setLineDash([]);
    context.beginPath();
    context.moveTo(left, baseline);
    context.lineTo(right, baseline);
    context.stroke();
  });

  context.restore();
}

function drawPracticeTemplates(
  context,
  layout,
  traceStyle,
  visibleCount,
  { forScoring, startIndex = 0 }
) {
  context.save();

  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = forScoring ? 12 : 2.4;
  context.fillStyle = forScoring ? "#000000" : "#b9c3dd";
  context.strokeStyle = forScoring ? "#000000" : "#b9c3dd";
  context.setLineDash([]);

  const { fontSize, fontFamily, words } = layout;
  context.font = `700 ${fontSize}px ${fontFamily}`;

  const limit = Math.min(visibleCount, words.length);
  for (let index = startIndex; index < limit; index += 1) {
    const word = words[index];
    if (traceStyle === "stroke") {
      context.strokeText(word.text, word.x, word.y);
    } else {
      context.fillText(word.text, word.x, word.y);
    }
    if (!forScoring) {
      context.beginPath();
      context.arc(44, word.y - fontSize + 18, 4, 0, 2 * Math.PI);
      context.fill();
    }
  }

  context.restore();
}

function getTextLayout(context, text, fontFamily) {
  const rowCount = 4;
  const paddingTop = 16;
  const paddingBottom = 16;
  const usableHeight = Math.max(0, context.canvas.height - paddingTop - paddingBottom);
  const rowHeight = usableHeight / rowCount;
  const lineHeightRatio = 1.4;
  const baseSize = 58;
  const minSize = 32;
  const maxWidth = context.canvas.width - 120;

  const splitLines = (fontSize) => {
    context.font = `700 ${fontSize}px ${fontFamily}`;
    const spaceWidth = context.measureText(" ").width;
    const words = text.split(/\s+/).filter(Boolean);
    const lines = [];
    let current = "";

    words.forEach((word) => {
      const next = current ? `${current} ${word}` : word;
      if (context.measureText(next).width <= maxWidth) {
        current = next;
        return;
      }
      if (current) {
        lines.push(current);
      }
      current = word;
    });

    if (current) {
      lines.push(current);
    }

    return { lines, spaceWidth };
  };

  const maxFontSizeByHeight = Math.floor(rowHeight / lineHeightRatio);
  let fontSize = Math.min(baseSize, maxFontSizeByHeight);
  fontSize = Math.max(fontSize, minSize);

  let { lines, spaceWidth } = splitLines(fontSize);
  while (lines.length > rowCount && fontSize > minSize) {
    fontSize -= 2;
    ({ lines, spaceWidth } = splitLines(fontSize));
  }

  const baselines = Array.from({ length: rowCount }, (_, index) =>
    Math.round(paddingTop + rowHeight * (index + 1))
  );

  const lineWords = lines.map((line) => line.split(/\s+/));
  const wordPositions = [];
  lineWords.forEach((line, lineIndex) => {
    let x = 60;
    const y = baselines[lineIndex];
    line.forEach((word) => {
      const width = context.measureText(word).width;
      wordPositions.push({ text: word, x, y, width });
      x += width + spaceWidth;
    });
  });

  return {
    baselines,
    fontSize,
    fontFamily,
    words: wordPositions,
  };
}

function getWordMatchPercent(canvas, layout, wordIndex) {
  const guideCanvas = document.createElement("canvas");
  guideCanvas.width = canvas.width;
  guideCanvas.height = canvas.height;
  const guideCtx = guideCanvas.getContext("2d");
  const word = layout.words[wordIndex];

  if (!word) {
    return 0;
  }

  guideCtx.font = `700 ${layout.fontSize}px ${layout.fontFamily}`;
  guideCtx.fillStyle = "#000000";
  guideCtx.fillText(word.text, word.x, word.y);

  const guide = guideCtx.getImageData(0, 0, canvas.width, canvas.height).data;
  const drawing = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height)
    .data;

  let templatePixels = 0;
  let matchedPixels = 0;

  for (let i = 0; i < guide.length; i += 4) {
    if (guide[i + 3] === 0) {
      continue;
    }
    templatePixels += 1;

    if (hasUserInk(drawing[i], drawing[i + 1], drawing[i + 2], drawing[i + 3])) {
      matchedPixels += 1;
    }
  }

  return templatePixels ? matchedPixels / templatePixels : 0;
}

function hasUserInk(red, green, blue, alpha) {
  return alpha > 0 && red < 90 && green < 160 && blue > 120;
}
