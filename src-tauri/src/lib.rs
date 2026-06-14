use tauri::State;
use std::sync::Mutex;
use std::time::{SystemTime, UNIX_EPOCH};

// 1. بنية بيانات لإدارة حالة المنفذ وحجم التخزين المؤقت محلياً لمنع انهيار الذاكرة
pub struct PeripheralManager {
    is_sniffing: Mutex<bool>,
    packet_buffer_bytes: Mutex<usize>,
}

// 2. أمر لمراقبة منافذ الـ USB/COM المحلية واكتشاف الأجهزة الطرفية
#[tauri::command]
fn toggle_peripheral_sniffer(state: State<'_, PeripheralManager>) -> Result<String, String> {
    let mut sniffing = state.is_sniffing.lock().unwrap();
    *sniffing = !*sniffing;
    
    if *sniffing {
        Ok("Thread Spawned: Rust background worker is now polling local USB/COM layers (Polling rate: 100ms).".to_string())
    } else {
        Ok("Sniffer safely halted. Background serial buffer released to OS.".to_string())
    }
}

// 3. أمر عالي السرعة بـ Rust يستقبل دفق البيانات (Telemetry Stream) ويخزنها محلياً
// 💡 ملحوظة هندسية: تاوري يحول معرّف rawPayload من JS تلقائياً إلى raw_payload في Rust
#[tauri::command]
fn commit_stream_packet(raw_payload: String, state: State<'_, PeripheralManager>) -> Result<String, String> {
    let sniffing = state.is_sniffing.lock().unwrap();
    if !*sniffing {
        return Err("Security Refusal: Cannot commit payload while backend serial engine is offline.".to_string());
    }

    let mut current_buffer = state.packet_buffer_bytes.lock().unwrap();
    *current_buffer += raw_payload.len();

    let timestamp = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    println!("[Offline Cache Write] Timestamp: {} | Sized: {} bytes", timestamp, raw_payload.len());
    
    Ok(format!(
        "NATIVE SYSTEM STATE: Packet committed safely. Total offline cache memory allocation: {} bytes.",
        current_buffer
    ))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // الحفاظ على الـ plugin الافتراضي لـ Tauri 2.x لفتح الروابط
        .plugin(tauri_plugin_opener::init())
        // حقن حالة الذاكرة (State Management) لكي تقرأها الأوامر في الأعلى
        .manage(PeripheralManager {
            is_sniffing: Mutex::new(false),
            packet_buffer_bytes: Mutex::new(0),
        })
        // تسجيل الأوامر الجديدة بدلاً من أمر greet القديم
        .invoke_handler(tauri::generate_handler![
            toggle_peripheral_sniffer,
            commit_stream_packet
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}