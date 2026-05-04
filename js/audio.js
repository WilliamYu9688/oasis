// ==========================================
// 🎵 原生 Web Audio 音效引擎
// ==========================================
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

// 严谨的 UUID 生成器，解决火山引擎 400 校验错误
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

// ==========================================
// 🎙️ TTS 引擎 (Vercel 直连 + 严格参数校验版)
// ==========================================
window.playAudio = async () => {
    window.playSfx('click');
    const text = document.getElementById('target-text').innerText.replace(/"/g, "");
    const isEn = state.path === 'en';
    if (!text || text === "Connecting...") return;

    const btn = event.currentTarget || document.querySelector('button[onclick="window.playAudio()"]');
    const originalContent = btn.innerHTML;
    btn.innerHTML = `<svg class="w-5 h-5 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
    btn.disabled = true;

    try {
        // 关键点：Bearer; 后面绝不能有空格，APPID 必须转为字符串
        const response = await fetch("/api/tts", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "Authorization": `Bearer;${VOLC_TOKEN}` 
            },
            body: JSON.stringify({
                app: { appid: String(VOLC_APPID), token: VOLC_TOKEN, cluster: "volcano_tts" },
                user: { uid: currentUser?.id || "oasis_tester" },
                // 采用最通用的基础音色，确保 3001 报错不再出现
                audio: { 
                    voice_type: isEn ? 'en_male_narration' : 'zh_male_xiaoming', 
                    encoding: "mp3", 
                    speed_ratio: 0.9 
                },
                request: { 
                    reqid: generateUUID(), 
                    text: text, 
                    text_type: "plain", 
                    operation: "query" 
                }
            })
        });
        
        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`请求拦截 (状态码: ${response.status})。\n反馈: ${errText}`);
        }
        
        const result = await response.json();
        if (result.code !== 3000) throw new Error(`火山引擎拒绝: ${result.message}`);
        
        const audio = new Audio("data:audio/mp3;base64," + result.data);
        audio.onended = () => { btn.innerHTML = originalContent; btn.disabled = false; };
        audio.onerror = () => { btn.innerHTML = originalContent; btn.disabled = false; };
        audio.play();

    } catch (err) {
        alert("语音系统诊断报告:\n\n" + err.message);
        btn.innerHTML = originalContent; btn.disabled = false;
        // 自动保底，不干扰练习
        const u = new SpeechSynthesisUtterance(text); 
        u.lang = isEn ? 'en-US' : 'zh-CN'; 
        u.onend = () => { btn.innerHTML = originalContent; btn.disabled = false; };
        window.speechSynthesis.speak(u);
    }
};

// ==========================================
// 🎯 LUM 靶向分析与 Whisper 识别
// ==========================================
function analyzeMistakes(target, captured) {
    const tWords = target.toLowerCase().replace(/[^\w\s\u4e00-\u9fa5]/g,"").split(state.path==='en'?' ':'');
    const cWords = captured.toLowerCase().replace(/[^\w\s\u4e00-\u9fa5]/g,"").split(state.path==='en'?' ':'');
    const missed = tWords.filter(w => w && !cWords.includes(w));
    missed.forEach(w => { state.missedWords[w] = (state.missedWords[w] || 0) + 1; });
    return missed;
}

window.processAndScore = async function(txt) {
    if (isEvaluating) return; isEvaluating = true; setAppState('PROCESSING');
    try {
        const rawT = state.path === 'en' ? currentPhrase.text_en : currentPhrase.text_zh;
        const fmtC = (txt||"").toLowerCase().replace(/[^\w\s\u4e00-\u9fa5]/g,"");
        const fmtT = rawT.toLowerCase().replace(/[^\w\s\u4e00-\u9fa5]/g,"");
        
        analyzeMistakes(fmtT, fmtC);

        const dp = Array(fmtC.length + 1).fill(0).map((_, i) => i);
        for (let i = 1; i <= fmtT.length; i++) {
            let prev = dp[0]; dp[0] = i;
            for (let j = 1; j <= fmtC.length; j++) {
                let temp = dp[j]; dp[j] = fmtT[i-1] === fmtC[j-1] ? prev : Math.min(dp[j-1], dp[j], prev) + 1; prev = temp;
            }
        }
        let score = Math.max(0, Math.round((1 - dp[fmtC.length] / Math.max(fmtT.length, fmtC.length)) * 100));
        if(score >= 85) score = 100;

        if (score > (state.scores[rawT] || 0)) state.scores[rawT] = score;
        let tier = score >= 100 ? 5 : (score >= 90 ? 4 : (score >= 80 ? 3 : (score >= 70 ? 2 : (score >= 60 ? 1 : 0))));
        const finalTier = Math.max(tier, state.adBoostMap[rawT] || 0);
        const diff = Math.round((rewardStages[finalTier] - (state.earnedMap[rawT] || 0)) * 100) / 100;

        if (diff > 0) {
            setAppState('REWARDING'); state.cloudBalance += diff; state.earnedMap[rawT] = rewardStages[finalTier];
            document.getElementById('total-earned').classList.add('money-jump');
            window.playSfx('success');
            if (currentUser && currentUser.id) {
                oasisCloud.from('profiles').update({ wallet_balance: state.cloudBalance }).eq('id', currentUser.id).then();
            }
        }
        document.getElementById('score-display').innerHTML = `<span class="text-4xl font-black ${score>=80?'text-emerald-400':'text-amber-400'}">${score}</span><br><span class="text-[10px] text-gray-400 block px-4">HEARD: "${fmtC}"</span>`;
        saveData(); syncPhraseState();
        setTimeout(() => { isEvaluating = false; if (diff > 0) window.fetchNewPhrase(); else setAppState('READY'); }, 2200);
    } catch (e) { setAppState('READY'); isEvaluating = false; }
};

window.whisperPipeline = null;
import('https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1').then(({ pipeline, env }) => {
    env.allowLocalModels = false;
    window.initWhisper = async function() {
        const bar = document.getElementById('loading-progress-bar');
        try {
            window.whisperPipeline = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
                progress_callback: (d) => { if (d.status === 'downloading') { const p = Math.round((d.loaded/d.total)*100); bar.style.width = p+'%'; document.getElementById('loading-percent').innerText = p+'%'; } }
            });
            window.enterMainApp();
        } catch (e) { alert("AI 唤醒失败"); }
    }

    window.toggleRecord = async function() {
        if (appState === 'LISTENING') { if (window.mediaRecorder) window.mediaRecorder.stop(); return; }
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            window.playSfx('record');
            window.mediaRecorder = new MediaRecorder(stream); let chunks = [];
            window.mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
            window.mediaRecorder.onstop = async () => {
                setAppState('PROCESSING');
                const blob = new Blob(chunks, { type: 'audio/webm' });
                const buf = await blob.arrayBuffer();
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
                const decoded = await audioCtx.decodeAudioData(buf);
                const result = await window.whisperPipeline(decoded.getChannelData(0), { language: state.path==='en'?'english':'chinese', task: 'transcribe' });
                window.processAndScore(result.text || "");
            };
            window.mediaRecorder.start(); setAppState('LISTENING');
        } catch (e) { setAppState('READY'); }
    }
}).catch(err => console.error("Transformer Load Error:", err));
