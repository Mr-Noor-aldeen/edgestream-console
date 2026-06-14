import { useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css"; 

function App() {
  const [engineStatus, setEngineStatus] = useState("Console Dormant. Awaiting Signal.");
  const [telemetryLog, setTelemetryLog] = useState("");
  const [isActive, setIsActive] = useState(false);
  const [inputStream, setInputStream] = useState("HEX_DATA_PACKET [0x23 0x9A]: High-frequency telemetry chunk from ESP32 serial interface.");

  async function handleToggleEngine() {
    try {
      // استدعاء أمر الـ Rust لتشغيل الفاحص الخلفي
      const response = await invoke("toggle_peripheral_sniffer");
      setEngineStatus(response);
      setIsActive(!isActive);
    } catch (error) {
      setEngineStatus(`Kernel Error: ${error}`);
    }
  }

  async function handlePacketPush() {
    try {
      // تمرير البيانات عبر خطوط الـ IPC إلى الـ Rust backend
      const response = await invoke("commit_stream_packet", { rawPayload: inputStream });
      setTelemetryLog(response);
    } catch (error) {
      setTelemetryLog(`Pipeline Blocked: ${error}`);
    }
  }

  return (
    <div style={{ backgroundColor: "#0f0f0f", color: "#33ff33", padding: "30px", fontFamily: "Consolas, monospace", minHeight: "100vh", textAlign: "left" }}>
      <h2 style={{ color: "#ffffff", margin: "0 0 5px 0" }}>EdgeStream Console v1.0</h2>
      <p style={{ color: "#666", margin: "0 0 20px 0" }}>Personal Tauri 2.x + Rust Native Workspace Utility for Embedded Hardware Diagnostics</p>
      <hr style={{ borderColor: "#222", margin: "20px 0" }} />
      
      <div style={{ background: "#151515", padding: "15px", borderRadius: "4px", marginBottom: "20px", border: "1px solid #222" }}>
        <button 
          onClick={handleToggleEngine} 
          style={{ padding: "12px 24px", fontFamily: "monospace", cursor: "pointer", fontWeight: "bold", backgroundColor: isActive ? "#990000" : "#005500", color: "#fff", border: "none", borderRadius: "3px" }}
        >
          {isActive ? "HALT BACKGROUND SNIFFER" : "INITIALIZE LOCAL HARDWARE SNIFFER"}
        </button>
        <p style={{ marginTop: "15px", margin_bottom: "0" }}><strong>Engine Thread State:</strong> <span style={{ color: isActive ? "#33ff33" : "#ff3333" }}>{engineStatus}</span></p>
      </div>

      <div style={{ background: "#151515", padding: "15px", borderRadius: "4px", border: "1px solid #222" }}>
        <h3 style={{ color: "#fff", marginTop: "0" }}>Simulate Device Telemetry Stream (High-Frequency Input):</h3>
        <textarea 
          value={inputStream} 
          onChange={(e) => setInputStream(e.target.value)}
          style={{ width: "100%", height: "70px", backgroundColor: "#000", color: "#33ff33", border: "1px solid #333", padding: "10px", fontFamily: "monospace", boxSizing: "border-box" }}
        />
        <br /><br />
        <button 
          onClick={handlePacketPush} 
          disabled={!isActive} 
          style={{ padding: "10px 20px", fontFamily: "monospace", cursor: "pointer", opacity: isActive ? 1 : 0.5, backgroundColor: "#222", color: "#33ff33", border: "1px solid #33ff33" }}
        >
          PUSH PAYLOAD VIA TAURI IPC BOUNDARY
        </button>
      </div>

      <div style={{ backgroundColor: "#000", padding: "15px", border: "1px solid #222", marginTop: "25px", borderRadius: "4px" }}>
        <h4 style={{ color: "#888", margin: "0 0 10px 0" }}>Native Thread IPC Trace Log:</h4>
        <p style={{ color: "#00ff00", margin: "0", fontSize: "14px" }}>{telemetryLog || "Awaiting asynchronous hardware cycle..."}</p>
      </div>
    </div>
  );
}

export default App;