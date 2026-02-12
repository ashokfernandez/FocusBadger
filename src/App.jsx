import { useEffect, useMemo, useState } from "react";

const WEB_PLUGIN_PATH = "web/PolySynth/index.html";
const RENDER_MANIFEST_PATH = "renders/renders-manifest.json";

function buildAssetUrl(relativePath) {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base}${relativePath}`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "";
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${remainder}`;
}

export default function App() {
  const [activeView, setActiveView] = useState("demo");
  const [renderManifest, setRenderManifest] = useState({ tracks: [] });

  useEffect(() => {
    const controller = new AbortController();
    fetch(buildAssetUrl(RENDER_MANIFEST_PATH), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load render manifest");
        return response.json();
      })
      .then((manifest) => {
        const tracks = Array.isArray(manifest?.tracks) ? manifest.tracks : [];
        setRenderManifest({ tracks });
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error(error);
          setRenderManifest({ tracks: [] });
        }
      });

    return () => controller.abort();
  }, []);

  const webDemoUrl = useMemo(() => buildAssetUrl(WEB_PLUGIN_PATH), []);

  return (
    <main className="page-shell">
      <header className="top-nav">
        <div>
          <p className="eyebrow">GitHub Pages Demo</p>
          <h1>PolySynth</h1>
        </div>
        <nav className="tabs" aria-label="Primary">
          <button
            type="button"
            className={activeView === "demo" ? "active" : ""}
            onClick={() => setActiveView("demo")}
          >
            Live web plugin
          </button>
          <button
            type="button"
            className={activeView === "renders" ? "active" : ""}
            onClick={() => setActiveView("renders")}
          >
            Audio renders
          </button>
        </nav>
      </header>

      <section className={activeView === "demo" ? "panel" : "panel hidden"}>
        <div className="panel-header">
          <h2>Latest PolySynth web build</h2>
          <a href={webDemoUrl} target="_blank" rel="noreferrer">
            Open plugin in a new tab
          </a>
        </div>
        <div className="plugin-frame-wrap">
          <iframe
            title="PolySynth Web Demo"
            src={webDemoUrl}
            className="plugin-frame"
            loading="lazy"
          />
        </div>
        <p className="panel-note">
          This embed is populated by CI and updated on every push to <code>main</code>.
        </p>
      </section>

      <section className={activeView === "renders" ? "panel" : "panel hidden"}>
        <div className="panel-header">
          <h2>Audio renders</h2>
          <button type="button" onClick={() => setActiveView("demo")}>
            Back to live demo
          </button>
        </div>
        {renderManifest.tracks.length ? (
          <ul className="render-grid">
            {renderManifest.tracks.map((track) => (
              <li key={track.file} className="render-card">
                <h3>{track.name ?? track.file}</h3>
                <p>{track.description ?? "PolySynth render"}</p>
                <audio controls preload="none" src={buildAssetUrl(`renders/${track.file}`)} />
                <small>{formatDuration(track.durationSeconds)}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="empty-state">
            No audio renders yet. Add wav files under <code>public/renders/</code> and list them in
            <code>public/renders/renders-manifest.json</code>.
          </p>
        )}
      </section>
    </main>
  );
}
