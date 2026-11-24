# EdgeStream Console (prototype)

A small desktop app built with Tauri 2, Rust and React. It is a learning prototype for a telemetry console for embedded devices such as an ESP32.

## What it does today
- A Rust backend holds app state (a sniffer on/off flag and a byte counter) in a `PeripheralManager` struct guarded by `Mutex`.
- Two Tauri commands, `toggle_peripheral_sniffer` and `commit_stream_packet`, are called from the React UI over Tauri IPC.
- Packets can only be committed while the sniffer is "on". Otherwise the backend returns an error.
- You type a payload into the UI, push it, and the backend adds its length to the counter and prints a timestamped line to stdout.

## What it does not do yet
- It does not read real serial, USB or COM ports. The "sniffer" is a simulated toggle.
- There is no background polling thread and no performance benchmark.

## Next steps
- Read real serial data with a Rust serial crate on a background thread.
- Stream parsed packets to the UI with Tauri events.
- Measure UI and CPU behavior under a high data rate.

## Run locally
```bash
git clone https://github.com/Mr-Noor-aldeen/edgestream-console.git
cd edgestream-console
npm install
npm run tauri dev
```
Needs Node.js, Rust, and the Tauri 2 prerequisites for your OS.
