import { useEffect, useRef, useState } from "react";
import { loadImage, drawToBlob, getExt, isImageFile } from "./utils/convert";
import "./App.css";

const MAX_FILES = 100;

function triggerDownload(url, filename) {
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export default function App() {
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState("image/webp");
  const [quality, setQuality] = useState(85);
  const [maxWidth, setMaxWidth] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [results, setResults] = useState([]);
  const inputRef = useRef(null);
  const resultsRef = useRef([]);

  function revokeAll(list) {
    list.forEach((r) => r.url && URL.revokeObjectURL(r.url));
  }

  // Component band hone par saare URLs cleanup
  useEffect(() => {
    return () => revokeAll(resultsRef.current);
  }, []);

  // Ek converted result list me add karo (purane results hatte nahi)
  function addResult(item) {
    resultsRef.current = [...resultsRef.current, item];
    setResults(resultsRef.current);
  }

  // Poori list saaf karo
  function clearResults() {
    revokeAll(resultsRef.current);
    resultsRef.current = [];
    setResults([]);
  }

  function pick(fileList) {
    // FileList ko turant array me copy karo (input clear hone se pehle)
    const all = [...fileList].filter(isImageFile);
    const picked = all.slice(0, MAX_FILES);

    setFiles(picked);
    setProgress(0);

    if (all.length === 0) {
      setStatus("Koi image file nahi mili.");
    } else if (all.length > MAX_FILES) {
      setStatus(
        `Sirf pehli ${MAX_FILES} files li gayi (aapne ${all.length} di thi).`
      );
    } else {
      setStatus(`${picked.length} files select hui.`);
    }
  }

  async function handleConvert() {
    if (!files.length || busy) return;

    setBusy(true);
    setProgress(0);

    let okCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      setStatus(`Converting ${i + 1} / ${files.length}: ${f.name}`);

      const base = f.name.replace(/\.[^.]+$/, "");
      const filename = `${base}.${getExt(format)}`;

      try {
        const img = await loadImage(f);
        const blob = await drawToBlob(img, format, quality, maxWidth);
        // Convert hote hi list me add, download option turant dikhega
        addResult({
          name: f.name,
          filename,
          url: URL.createObjectURL(blob),
          ok: true,
        });
        okCount++;
      } catch (err) {
        console.error(err);
        addResult({ name: f.name, filename, url: null, ok: false });
        failCount++;
      }

      setProgress(((i + 1) / files.length) * 100);
    }

    setStatus(
      `Ho gaya: ${okCount} converted` +
        (failCount ? `, ${failCount} fail` : "") +
        ". Neeche se download karo."
    );
    setBusy(false);
  }

  function downloadOne(r) {
    triggerDownload(r.url, r.filename);
  }

  // Sab converted files ek-ek karke download
  async function downloadAll() {
    for (const r of resultsRef.current) {
      if (!r.ok) continue;
      triggerDownload(r.url, r.filename);
      await new Promise((res) => setTimeout(res, 300));
    }
  }

  const okCount = results.filter((r) => r.ok).length;

  return (
    <div className="wrap">
      <h1>Image Converter</h1>
      <p className="hint">
        PNG, JPG, HEIC, WEBP aur doosri images ko WEBP/JPG/PNG me badlo.
      </p>

      <div
        className={`drop ${dragOver ? "over" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pick(e.dataTransfer.files);
        }}
      >
        <p>Yahan images drag karo ya click karke select karo</p>
        <small>Max {MAX_FILES} files</small>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,.heic,.heif"
          hidden
          onChange={(e) => {
            pick(e.target.files);
            e.target.value = ""; // same files dobara select ho sakein
          }}
        />
      </div>

      <div className="panel">
        <div className="row">
          <label>Output format</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="image/webp">WEBP</option>
            <option value="image/jpeg">JPG</option>
            <option value="image/png">PNG</option>
          </select>
        </div>

        <div className="row">
          <label>Quality: {quality}%</label>
          <input
            type="range"
            min="10"
            max="100"
            value={quality}
            onChange={(e) => setQuality(+e.target.value)}
          />
        </div>

        <div className="row">
          <label>Max width (px, 0 = original)</label>
          <input
            type="number"
            min="0"
            value={maxWidth}
            onChange={(e) => setMaxWidth(+e.target.value || 0)}
            style={{ width: 120 }}
          />
        </div>

        <button onClick={handleConvert} disabled={!files.length || busy}>
          {busy ? "Converting..." : `Convert (${files.length})`}
        </button>

        <div className="progress">
          <div style={{ width: `${progress}%` }} />
        </div>

        <div className="status">{status}</div>

        {files.length > 0 && !busy && (
          <div className="list">{files.map((f) => f.name).join(", ")}</div>
        )}

        {results.length > 0 && (
          <>
            <div className="row" style={{ marginTop: 16 }}>
              <strong>Converted ({okCount})</strong>
              <div style={{ display: "flex", gap: 8 }}>
                {okCount > 1 && (
                  <button
                    onClick={downloadAll}
                    style={{ width: "auto", marginTop: 0, padding: "6px 12px", fontSize: "0.85rem", background: "#334155" }}
                  >
                    Sab download
                  </button>
                )}
                <button
                  onClick={clearResults}
                  disabled={busy}
                  style={{ width: "auto", marginTop: 0, padding: "6px 12px", fontSize: "0.85rem", background: "#7f1d1d" }}
                >
                  Clear list
                </button>
              </div>
            </div>

            <ul className="list">
              {results.map((r, i) => (
                <li
                  key={i}
                  className={r.ok ? "ok" : "fail"}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 8,
                    padding: "4px 0",
                  }}
                >
                  <span>
                    {r.ok ? "✓" : "✗"} {r.name}
                  </span>
                  {r.ok && (
                    <button
                      onClick={() => downloadOne(r)}
                      style={{
                        width: "auto",
                        marginTop: 0,
                        padding: "4px 12px",
                        fontSize: "0.85rem",
                      }}
                    >
                      Download
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}