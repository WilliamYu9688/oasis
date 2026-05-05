// ==========================================
// 🎙️ 语音引擎核心 (火山引擎直连版)
// ==========================================

// 严谨的 UUID 生成器，满足火山引擎 reqid 格式要求
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

window.playAudio = async () => {
    const textEl = document.getElementById('target-text');
    if (!textEl) return;
    const text = textEl.innerText.replace(/"/g, "");
    const isEn = window.state.path === 'en';
    
    if (!text || text === "Connecting...") return;

    // 1. 英文路径：调用设备原生顶级发音 (更自然、带情感)
    if (isEn) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = 0.9;
        const voices = window.speechSynthesis.getVoices();
        const bestVoice = voices.find(v => v.lang.includes('en') && (v.name.includes('Premium') || v.name.includes('Siri') || v.name.includes('Google')));
        if (bestVoice) u.voice = bestVoice;
        window.speechSynthesis.speak(u);
        return;
    }

    // 2. 中文路径：强制调用火山引擎 (拒绝老外味中文)
    try {
        const response = await fetch("/api/tts", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "Authorization": `Bearer;${VOLC_TOKEN}` 
            },
            body: JSON.stringify({
                app: { appid: String(VOLC_APPID), token: VOLC_TOKEN, cluster: "volcano_tts" },
                user: { uid: "oasis_tester" },
                audio: { 
                    voice_type: 'BV002_streaming', // 还原：通用男声 (地道中文)
                    encoding: "mp3", 
                    speed_ratio: 1.0 
                },
                request: { 
                    reqid: generateUUID(), 
                    text: text, 
                    text_type: "plain", 
                    operation: "query" 
                }
            })
        });

        const result = await response.json();
        if (result.code === 3000 && result.data) {
            const audio = new Audio("data:audio/mp3;base64," + result.data);
            audio.play();
        } else {
            throw new Error(result.message || "TTS Error");
        }
    } catch (err) {
        console.warn("火山接口调用异常，启用保底中文:", err);
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN'; // 强制指定中文发音库
        window.speechSynthesis.speak(u);
    }
};

window.playSfx = (type) => { /* 预留音效接口 */ };
