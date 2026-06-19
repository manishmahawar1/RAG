import { useState, useEffect } from "react";
import axios from "axios";

export default function App() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);        // ← live logs!
  const [result, setResult] = useState(null);
  const [documents, setDocuments] = useState([]);

  // Add log helper
  const addLog = (msg, type = "info") => {
    const icons = { 
      info: "ℹ️", 
      success: "✅", 
      error: "❌", 
      step: "➡️" 
    };
    setLogs(prev => [...prev, {
      msg, 
      type, 
      icon: icons[type],
      time: new Date().toLocaleTimeString()
    }]);
  };

  // Fetch existing documents
  const fetchDocuments = async () => {
    const res = await axios.get("http://localhost:5000/documents");
    setDocuments(res.data);
  };

  useEffect(() => { fetchDocuments(); }, []);

  // Upload handler
  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setLogs([]);      // logs clear karo
    setResult(null);

    addLog(`Starting ingestion for: ${file.name}`, "step");
    addLog("Step 1: Sending file to backend...", "step");

    const formData = new FormData();
    formData.append("file", file);

    try {
      addLog("Step 2: Extracting text from PDF...", "step");
      addLog("Step 3: Creating chunks (250 words each)...", "step");
      addLog("Step 4: Generating embeddings via OpenAI...", "step");
      addLog("Step 5: Storing vectors in PostgreSQL...", "step");

      const res = await axios.post(
        "http://localhost:5000/upload", 
        formData
      );

      addLog(res.data.message, "success");
      addLog(`Total chunks stored: ${res.data.chunks}`, "success");
      addLog(`Time taken: ${res.data.timeTaken}s`, "success");

      setResult(res.data);
      fetchDocuments(); // refresh list

    } catch (err) {
      addLog(`Error: ${err.response?.data?.error}`, "error");
    }

    setLoading(false);
  };

  return (
    <div style={{ 
      maxWidth: 800, 
      margin: "40px auto", 
      padding: 20,
      fontFamily: "monospace"  // developer feel!
    }}>
      <h1>⚖️ RAG Ingestion Pipeline</h1>
      <p style={{ color: "gray" }}>
        Upload PDF → Chunks → Embeddings → PostgreSQL
      </p>

      {/* Upload Box */}
      <div style={{ 
        border: "2px dashed #ccc", 
        padding: 30, 
        borderRadius: 12,
        marginBottom: 20,
        textAlign: "center"
      }}>
        <input
          type="file"
          accept=".pdf"
          onChange={(e) => {
            setFile(e.target.files[0]);
            setLogs([]);
          }}
          style={{ marginBottom: 15 }}
        />
        <br />
        <button
          onClick={handleUpload}
          disabled={!file || loading}
          style={{ 
            padding: "12px 30px", 
            background: loading ? "#ccc" : "#2563eb",
            color: "white", 
            border: "none", 
            borderRadius: 8,
            cursor: loading ? "not-allowed" : "pointer",
            fontSize: 16
          }}>
          {loading ? "⏳ Processing..." : "🚀 Start Ingestion"}
        </button>
      </div>

      {/* LIVE LOGS — tumhare liye! */}
      {logs.length > 0 && (
        <div style={{ 
          background: "#1e1e1e",   // dark terminal look
          color: "#00ff00",         // green text
          padding: 20, 
          borderRadius: 12,
          marginBottom: 20,
          fontFamily: "monospace"
        }}>
          <p style={{ color: "#888", margin: "0 0 10px" }}>
            📟 LIVE LOGS:
          </p>
          {logs.map((log, i) => (
            <div key={i} style={{ 
              marginBottom: 6,
              color: log.type === "error" ? "#ff4444" : 
                     log.type === "success" ? "#00ff88" : "#00ff00"
            }}>
              <span style={{ color: "#888" }}>[{log.time}]</span>
              {" "}{log.icon} {log.msg}
            </div>
          ))}
          {loading && (
            <div style={{ color: "#ffff00" }}>
              ⏳ Processing... please wait...
            </div>
          )}
        </div>
      )}

      {/* Result Card */}
      {result && (
        <div style={{ 
          background: "#f0fdf4", 
          border: "1px solid #86efac",
          padding: 20, 
          borderRadius: 12,
          marginBottom: 20
        }}>
          <h3>🎉 Ingestion Complete!</h3>
          <p>📄 File: {file?.name}</p>
          <p>📦 Chunks stored: <strong>{result.chunks}</strong></p>
          <p>⏱️ Time: <strong>{result.timeTaken}s</strong></p>
        </div>
      )}

      {/* Stored Documents Table */}
      {documents.length > 0 && (
        <div>
          <h3>📚 Documents in PostgreSQL:</h3>
          <table style={{ 
            width: "100%", 
            borderCollapse: "collapse" 
          }}>
            <thead>
              <tr style={{ background: "#2563eb", color: "white" }}>
                <th style={{ padding: 10, textAlign: "left" }}>File Name</th>
                <th style={{ padding: 10 }}>Chunks</th>
                <th style={{ padding: 10 }}>Uploaded</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc, i) => (
                <tr key={i} style={{ 
                  background: i % 2 === 0 ? "#f8fafc" : "white" 
                }}>
                  <td style={{ padding: 10 }}>📄 {doc.source}</td>
                  <td style={{ padding: 10, textAlign: "center" }}>
                    {doc.total_chunks}
                  </td>
                  <td style={{ padding: 10, textAlign: "center" }}>
                    {new Date(doc.uploaded_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}