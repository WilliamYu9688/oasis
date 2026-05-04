// ==========================================
// 🎵 原生 Web Audio 音效引擎
// ==========================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSfx(type) {
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
}

// ==========================================
// 🎙️ TTS 引擎 (Netlify直连探针版)
// ==========================================
window.playAudio = async () => {
    playSfx('click');
    const text = document.getElementById('target-text').innerText.replace(/"/g, "");
    const isEn = state.path === 'en';
    if (!text || text === "Connecting...") return;

    const btn = event.currentTarget || document.querySelector('button[onclick="window.playAudio()"]');
    const originalContent = btn.innerHTML;
    btn.innerHTML = `<svg class="w-5 h-5 text-amber-400 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
    btn.disabled = true;

    try {
        const response = await fetch("/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer;${VOLC_TOKEN}` },
            body: JSON.stringify({
                app: { appid: VOLC_APPID, token: VOLC_TOKEN, cluster: "volcano_tts" },
                user: { uid: currentUser?.id || "oasis_tester" },
                audio: { voice_type: isEn ? 'en_male_adam' : 'zh_male_sunfeiyu', encoding: "mp3", speed_ratio: 0.9 },
                request: { reqid: "req_" + Date.now(), text: text, text_type: "plain", operation: "query" }
            })
        });
        
        if (!response.ok) throw new Error(`Netlify代理层断联 (状态码: ${response.status})`);
        const result = await response.json();
        if (result.code !== 3000) throw new Error(`火山引擎拒绝访问: ${result.message}`);
        
        const audio = new Audio("data:audio/mp3;base64," + result.data);
        audio.onended = () => { btn.innerHTML = originalContent; btn.disabled = false; };
        audio.onerror = () => { btn.innerHTML = originalContent; btn.disabled = false; };
        audio.play();

    } catch (err) {
        alert("发音诊断报告:\n\n" + err.message + "\n\n(提示：请确保已上传 _redirects 文件并在 Netlify 线上环境测试)");
        btn.innerHTML = originalContent; btn.disabled = false;
        const u = new SpeechSynthesisUtterance(text); u.lang = isEn ? 'en-US' : 'zh-CN'; 
        u.onend = () => { btn.innerHTML = originalContent; btn.disabled = false; };
        window.speechSynthesis.speak(u);
    }
}

// ==========================================
// 🤖 Whisper 离线识别引擎与靶向打分
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
            playSfx('success');
            if (oasisCloud.auth.user()) {
                oasisCloud.from('profiles').update({ wallet_balance: state.cloudBalance }).eq('id', oasisCloud.auth.user().id).then();
            }
        }
        document.getElementById('score-display').innerHTML = `<span class="text-4xl font-black ${score>=80?'text-emerald-400':'text-amber-400'}">${score}</span><br><span class="text-[10px] text-gray-400 block px-4">HEARD: "${fmtC}"</span>`;
        saveData(); syncPhraseState();
        setTimeout(() => { isEvaluating = false; if (diff > 0) window.fetchNewPhrase(); else setAppState('READY'); }, 2200);
    } catch (e) { setAppState('READY'); isEvaluating = false; }
}

import { pipeline, env } from 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.1';
env.allowLocalModels = false; window.whisperPipeline = null;
window.initWhisper = async function() {
    const bar = document.getElementById('loading-progress-bar');
    try {
        window.whisperPipeline = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
            progress_callback: (d) => { if (d.status === 'downloading') { const p = Math.round((d.loaded/d.total)*100); bar.style.width = p+'%'; document.getElementById('loading-percent').innerText = p+'%'; } }
        });
        window.enterMainApp();
    } catch (e) { alert("AI Load Error"); }
}

window.toggleRecord = async function() {
    if (appState === 'LISTENING') { if (window.mediaRecorder) window.mediaRecorder.stop(); return; }
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        playSfx('record');
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
