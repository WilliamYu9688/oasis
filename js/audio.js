const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

window.playSfx = function(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    if (type === 'click') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
        gain.gain.setValueAtTime(0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
    } else if (type === 'success') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(600, now + 0.1); osc.frequency.setValueAtTime(1000, now + 0.2);
        gain.gain.setValueAtTime(0.3, now); gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now); osc.stop(now + 0.4);
    }
};

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ==========================================
// 🎙️ TTS 引擎 (昨日 OK 版：中英双轨)
// ==========================================
window.playAudio = async () => {
    window.playSfx('click');
    const textEl = document.getElementById('target-text');
    if (!textEl) return;
    const text = textEl.innerText.replace(/"/g, "");
    const isEn = window.state.path === 'en'; // 修正：从全局 state 读取路径
    if (!text || text === "Connecting...") return;

    if (isEn) {
        const u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.9;
        window.speechSynthesis.speak(u);
    } else {
        try {
            const response = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer;${window.VOLC_TOKEN}` },
                body: JSON.stringify({
                    app: { appid: String(window.VOLC_APPID), token: window.VOLC_TOKEN, cluster: "volcano_tts" },
                    user: { uid: "oasis_tester" },
                    audio: { voice_type: 'BV002_streaming', encoding: "mp3", speed_ratio: 0.9 },
                    request: { reqid: generateUUID(), text: text, text_type: "plain", operation: "query" }
                })
            });
            const result = await response.json();
            if (result.data) new Audio("data:audio/mp3;base64," + result.data).play();
            else throw new Error("TTS Fail");
        } catch (err) {
            const u = new SpeechSynthesisUtterance(text); u.lang = 'zh-CN'; window.speechSynthesis.speak(u);
        }
    }
};

// ... 此处保留昨日 OK 版的 analyzeMistakes 和 processAndScore 逻辑 ...
