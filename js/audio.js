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
    } else if (type === 'record') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(300, now);
        gain.gain.setValueAtTime(0.2, now); gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
    }
};

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ==========================================
// 🎙️ TTS 引擎 (完全还原昨日 OK 逻辑)
// ==========================================
window.playAudio = async () => {
    window.playSfx('click');
    const textEl = document.getElementById('target-text');
    if (!textEl) return;
    const text = textEl.innerText.replace(/"/g, "");
    
    // 🚨 修正：显式访问全局 window.state 确保路径正确
    const isEn = window.state.path === 'en';
    if (!text || text === "Connecting...") return;

    // 寻找按钮并显示 Loading
    const btn = event.currentTarget || document.querySelector('button[onclick="window.playAudio()"]');
    const originalContent = btn.innerHTML;
    btn.innerHTML = `<svg class="w-5 h-5 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
    btn.disabled = true;

    if (isEn) {
        // 英文：系统原声
        const u = new SpeechSynthesisUtterance(text); 
        u.lang = 'en-US'; u.rate = 0.9;
        const voices = window.speechSynthesis.getVoices();
        const bestVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Premium') || v.name.includes('Siri') || v.name.includes('Google')));
        if (bestVoice) u.voice = bestVoice;
        u.onend = () => { btn.innerHTML = originalContent; btn.disabled = false; };
        window.speechSynthesis.speak(u);
    } else {
        // 中文：火山引擎
        try {
            const response = await fetch("/api/tts", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer;${window.VOLC_TOKEN}` },
                body: JSON.stringify({
                    app: { appid: String(window.VOLC_APPID), token: window.VOLC_TOKEN, cluster: "volcano_tts" },
                    user: { uid: window.currentUser?.id || "oasis_tester" },
                    audio: { voice_type: 'BV002_streaming', encoding: "mp3", speed_ratio: 1.0 },
                    request: { reqid: generateUUID(), text: text, text_type: "plain", operation: "query" }
                })
            });
            const result = await response.json();
            if (result.data) {
                const audio = new Audio("data:audio/mp3;base64," + result.data);
                audio.onended = () => { btn.innerHTML = originalContent; btn.disabled = false; };
                audio.play();
            } else { throw new Error(result.message); }
        } catch (err) {
            console.error("火山调用失败，保底中文:", err);
            const u = new SpeechSynthesisUtterance(text); u.lang = 'zh-CN'; 
            u.onend = () => { btn.innerHTML = originalContent; btn.disabled = false; };
            window.speechSynthesis.speak(u);
        }
    }
};

// ... 此处保留您提供的 analyzeMistakes, processAndScore, initWhisper, toggleRecord 代码 ...
