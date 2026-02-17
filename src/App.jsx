import { useState } from "react";
import HandwritingPracticePage from "./pages/HandwritingPracticePage.jsx";

const PAGES = {
  home: "home",
  handwriting: "handwriting",
};

export default function App() {
  const [activePage, setActivePage] = useState(PAGES.home);

  return (
    <main className="app">
      <header className="header panel">
        <p className="eyebrow">Learning App</p>
        <h1>學習練習中心</h1>
        <p className="subtitle">把不同功能放在不同子頁面，避免整個 App 架構被單一功能覆蓋。</p>

        <nav className="tab-row" aria-label="Main navigation">
          <button
            type="button"
            className={activePage === PAGES.home ? "tab active" : "tab"}
            onClick={() => setActivePage(PAGES.home)}
          >
            首頁
          </button>
          <button
            type="button"
            className={activePage === PAGES.handwriting ? "tab active" : "tab"}
            onClick={() => setActivePage(PAGES.handwriting)}
          >
            手寫練習
          </button>
        </nav>
      </header>

      {activePage === PAGES.home ? <HomePage onStart={() => setActivePage(PAGES.handwriting)} /> : null}
      {activePage === PAGES.handwriting ? <HandwritingPracticePage /> : null}
    </main>
  );
}

function HomePage({ onStart }) {
  return (
    <section className="panel home-page">
      <h2>首頁</h2>
      <p>
        這裡保留主應用入口，手寫英文字練習已被拆分為獨立子頁面。
        你可以從這裡進入練習，不需要把整個 WebApp 都替換掉。
      </p>
      <button type="button" onClick={onStart}>
        進入手寫練習
      </button>
    </section>
  );
}
