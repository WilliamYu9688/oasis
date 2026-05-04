// ==========================================
// 🔐 登录与鉴权逻辑 (之前漏搬的模块)
// ==========================================
window.toggleAuthMode = function() {
    playSfx('click');
    const container = document.getElementById('confirm-password-container');
    const isReg = document.getElementById('auth-title').innerText === "System Login";
    if (isReg) { 
        container.style.maxHeight = "100px"; container.style.opacity = "1"; 
        document.getElementById('auth-title').innerText = "Create Account"; 
        document.getElementById('auth-action-btn').innerText = "Register & Enter"; 
    } else { 
        container.style.maxHeight = "0"; container.style.opacity = "0"; 
        document.getElementById('auth-title').innerText = "System Login"; 
        document.getElementById('auth-action-btn').innerText = "Secure Access"; 
    }
}

window.executeAuth = async function() {
    const email = document.getElementById('email').value.trim(); 
    const password = document.getElementById('password').value.trim();
    const btn = document.getElementById('auth-action-btn'); 
    btn.disabled = true; btn.innerText = "AUTHENTICATING...";
    try {
        const isReg = document.getElementById('auth-title').innerText === "Create Account";
        const { data, error } = isReg ? await oasisCloud.auth.signUp({ email, password }) : await oasisCloud.auth.signInWithPassword({ email, password });
        if (error) throw error;
        currentUser = data.user;
        const { data: prof } = await oasisCloud.from('profiles').select('*').eq('id', currentUser.id).maybeSingle();
        if (!prof) await oasisCloud.from('profiles').insert({ id: currentUser.id, wallet_balance: 0 });
        state.cloudBalance = Number(prof?.wallet_balance) || 0.00;
        document.getElementById('total-earned').innerText = state.cloudBalance.toFixed(2);
        document.getElementById('auth-screen').classList.add('hidden-screen'); 
        document.getElementById('step-1').classList.remove('hidden-screen');
        playSfx('success');
    } catch (err) { 
        document.getElementById('auth-msg').innerText = "❌ " + err.message; 
    } finally { 
        btn.disabled = false; 
        btn.innerText = document.getElementById('auth-title').innerText === "Create Account" ? "Register & Enter" : "Secure Access"; 
    }
}

// ==========================================
// 📺 广告管理器 (之前漏搬的模块)
// ==========================================
window.AdManager = {
    adUnitId: 'ca-app-pub-5083945196856634/5740020253',
    isNativeAdMob: false, isAdLoaded: false,
    init: async function() {
        if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.AdMob) {
            this.isNativeAdMob = true;
            try { await window.Capacitor.Plugins.AdMob.initialize({ requestTrackingAuthorization: true }); this.loadAd(); } catch (e) {}
        }
    },
    loadAd: async function() {
        if (!this.isNativeAdMob) return;
        try { await window.Capacitor.Plugins.AdMob.prepareRewardVideoAd({ adId: this.adUnitId }); this.isAdLoaded = true; } catch (e) { this.isAdLoaded = false; }
    },
    showAd: async function(onSuccess, onCancel) {
        if (this.isNativeAdMob) {
            if (!this.isAdLoaded) { alert("广告极速加载中..."); this.loadAd(); onCancel(); return; }
            const { AdMob, RewardAdPluginEvents } = window.Capacitor.Plugins;
            AdMob.addListener(RewardAdPluginEvents.Rewarded, () => { onSuccess(); this.isAdLoaded = false; this.loadAd(); });
            AdMob.addListener(RewardAdPluginEvents.FailedToLoad, () => { onCancel(); this.loadAd(); });
            await AdMob.showRewardVideoAd();
        } else {
            const adUI = document.getElementById('web-ad-overlay');
            adUI.style.display = 'flex';
            document.getElementById('close-ad-btn').onclick = () => { adUI.style.display = 'none'; onSuccess(); };
        }
    }
};
document.addEventListener('DOMContentLoaded', () => window.AdManager.init());

// ... （下方保留您 js/app.js 原有的 function hideAll() 等代码不动）
// ==========================================
// 📺 弹窗控制与全局状态
// ==========================================
function hideAll() { document.querySelectorAll('.app-screen').forEach(el => el.classList.add('hidden-screen')); }
window.closeModal = function(id) { document.getElementById(id).classList.remove('active'); }
window.openModal = function(id) { document.getElementById(id).classList.add('active'); playSfx('click'); }

window.handleStep1 = (p) => { playSfx('click'); state.path = p; hideAll(); document.getElementById('step-time').classList.remove('hidden-screen'); }
window.handleStepTime = (t) => { playSfx('click'); state.targetTime = t; hideAll(); document.getElementById('step-2').classList.remove('hidden-screen'); }
window.handleStep2 = async (lv) => { playSfx('click'); state.dbLevel = lv; hideAll(); if (!window.whisperPipeline) { document.getElementById('loading-screen').classList.remove('hidden-screen'); window.initWhisper(); } else { window.enterMainApp(); } }

window.enterMainApp = function() {
    document.getElementById('loading-screen').classList.add('hidden-screen'); document.getElementById('main-app').classList.remove('hidden-screen');
    window.fetchNewPhrase();
    if(appInterval) clearInterval(appInterval);
    appInterval = setInterval(() => { if(state.currentTime < state.targetTime) { state.currentTime += (1/60); updateTopBar(); } }, 1000);
}

window.fetchNewPhrase = async function() {
    playSfx('click');
    const tEl = document.getElementById('target-text'); const zhEl = document.getElementById('target-zh');
    tEl.innerText = "Connecting..."; 
    document.getElementById('lum-diagnosis').innerHTML = ""; 
    
    let pool = [];
    try { const { data } = await oasisCloud.from('phrases').select('*').eq('difficulty', state.dbLevel); if (data && data.length > 0) pool = data; } catch (e) {}
    if (pool.length === 0) pool = LOCAL_CACHE;
    
    let newPhrase;
    do { newPhrase = pool[Math.floor(Math.random() * pool.length)]; } while (pool.length > 1 && currentPhrase && newPhrase.id === currentPhrase.id);
    currentPhrase = newPhrase;

    tEl.innerText = `"${state.path === 'en' ? currentPhrase.text_en : currentPhrase.text_zh}"`;
    zhEl.innerText = state.path === 'en' ? currentPhrase.text_zh : currentPhrase.text_en;
    document.getElementById('scene-display').innerText = "SCENE: " + (currentPhrase.scenario || "WORK").toUpperCase();
    syncPhraseState(); setAppState('READY');
}

function updateTopBar() {
    document.getElementById('total-earned').innerText = state.cloudBalance.toFixed(2);
    document.getElementById('time-display').innerText = `${Math.floor(state.currentTime)}/${state.targetTime}m`;
    document.getElementById('ad-limit-display').innerText = state.adLimit <= 0 ? "REFILL" : `🆘 ${state.adLimit}/6`;
}

function syncPhraseState() {
    const t = state.path === 'en' ? currentPhrase.text_en : currentPhrase.text_zh;
    document.getElementById('item-best-score').innerText = state.scores[t] || 0;
    document.getElementById('item-earned').innerText = (state.earnedMap[t] || 0).toFixed(2);
    updateTopBar();
}

function setAppState(s) {
    appState = s; const fb = document.getElementById('score-display'); const btn = document.getElementById('record-btn');
    switch(s) {
        case 'READY': fb.innerHTML = `<p class="text-gray-500 font-bold text-[10px] uppercase tracking-widest">SYSTEM READY</p>`; btn.classList.remove('recording-active'); btn.disabled = false; document.getElementById('refresh-btn').disabled = false; break;
        case 'LISTENING': fb.innerHTML = `<p class="text-amber-400 font-bold text-[10px] animate-pulse uppercase tracking-widest">🎙️ RECORDING...</p>`; btn.classList.add('recording-active'); document.getElementById('refresh-btn').disabled = true; break;
        case 'PROCESSING': fb.innerHTML = `<p class="text-blue-400 font-bold text-[10px] animate-pulse uppercase tracking-widest">🔄 ANALYZING...</p>`; btn.classList.remove('recording-active'); btn.disabled = true; break;
        case 'REWARDING': btn.disabled = true; break;
    }
}

// ==========================================
// 👁️ LUM 智慧透视仪渲染逻辑
// ==========================================
window.openLUM = () => {
    playSfx('click');
    if (state.lumUnlocked) {
        document.getElementById('lum-locked-overlay').style.display = 'none';
        renderLUMChart(); renderWeakWords();
    } else {
        document.getElementById('lum-locked-overlay').style.display = 'flex';
    }
    window.openModal('lum-modal');
}

window.buyLUM = () => {
    playSfx('click');
    if (state.cloudBalance >= 50) {
        state.cloudBalance -= 50; state.lumUnlocked = true; saveData(); updateTopBar();
        document.getElementById('lum-locked-overlay').classList.add('opacity-0');
        playSfx('success');
        setTimeout(() => {
            document.getElementById('lum-locked-overlay').style.display = 'none';
            renderLUMChart(); renderWeakWords();
        }, 500);
    } else { alert("AED 余额不足，快去练习吧！"); }
}

function renderLUMChart() {
    const ctx = document.getElementById('lumRadarChart').getContext('2d');
    const scoresArr = Object.values(state.scores);
    const avg = scoresArr.length ? scoresArr.reduce((a,b)=>a+b,0)/scoresArr.length : 0;
    const mastery = Math.min(100, (scoresArr.length / 50) * 100);
    
    if (lumChart) lumChart.destroy();
    lumChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Articulation', 'Fluency', 'Scenario Mastery'],
            datasets: [{
                data: [avg, (avg * 0.9) + 5, mastery],
                backgroundColor: 'rgba(251, 191, 36, 0.2)',
                borderColor: '#fbbf24',
                pointBackgroundColor: '#fbbf24',
                borderWidth: 2
            }]
        },
        options: {
            scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { color: '#94a3b8', font: { size: 10, weight: 'bold' } } } },
            plugins: { legend: { display: false } }
        }
    });
}

function renderWeakWords() {
            const container = document.getElementById('lum-weak-words');
            container.innerHTML = "";
            const sorted = Object.entries(state.missedWords).sort((a,b)=>b[1]-a[1]).slice(0, 15);
            if (sorted.length === 0) {
                container.innerHTML = `<p class="text-slate-600 text-[10px] italic">暂无薄弱单词，请继续练习。</p>`; return;
            }
            sorted.forEach(([word, count]) => {
                const tag = document.createElement('span'); tag.className = "lum-tag";
                tag.innerHTML = `${word.toUpperCase()} <span class="text-[8px] opacity-50 ml-1">x${count}</span>`;
                container.appendChild(tag);
            });
}

// ==========================================
// 🛡️ 广告闭环与退出逻辑
// ==========================================
window.promptExit = () => {
    playSfx('click');
    const left = Math.ceil(state.targetTime - state.currentTime);
    const content = document.getElementById('exit-content');
    if (left <= 0) { content.innerHTML = `<h3 class="text-2xl font-black text-emerald-400 mb-2">Target Met!</h3><button onclick="window.confirmExit()" class="w-full py-4 rounded-xl bg-amber-600 text-white font-black">EXIT</button>`; }
    else { content.innerHTML = `<h3 class="text-2xl font-black text-red-400 mb-2">Goal Not Met</h3><p class="text-slate-300 text-sm mb-6">${left} mins remaining.</p><button onclick="window.watchAd('time')" class="w-full py-4 ad-btn-bg text-white rounded-xl font-black mb-3 shadow-lg">Watch Ad (+5 Mins)</button><button onclick="window.confirmExit()" class="w-full py-4 bg-gray-800 text-slate-400 rounded-xl mb-2">QUIT ANYWAY</button><button onclick="window.closeModal('exit-modal')" class="w-full py-4 glass-btn rounded-xl font-bold">CONTINUE</button>`; }
    window.openModal('exit-modal');
}

window.requestRescue = function() {
    playSfx('click'); checkAdRefresh(); if (appState === 'REWARDING') return;
    if (state.adLimit <= 0) {
        document.getElementById('rescue-title').innerText = "LIMIT REACHED"; 
        document.getElementById('rescue-action-btn').onclick = () => window.watchAd('refill'); 
        window.openModal('rescue-modal'); return;
    }
    window.watchAd('boost');
}

window.watchAd = (type) => {
    playSfx('click');
    window.closeModal('rescue-modal'); window.closeModal('exit-modal');
    window.AdManager.showAd(() => {
        if (type === 'time') { state.currentTime += 5; updateTopBar(); }
        else if (type === 'boost') { 
            state.adLimit--; 
            const t = state.path === 'en' ? currentPhrase.text_en : currentPhrase.text_zh;
            state.adBoostMap[t] = Math.min(5, (state.adBoostMap[t] || 0) + 1);
            window.processAndScore(""); 
        }
        else if (type === 'refill') { state.adLimit = 6; updateTopBar(); }
        saveData();
        playSfx('success');
    }, () => setAppState('READY'));
}

window.confirmExit = () => { clearInterval(appInterval); hideAll(); document.getElementById('step-1').classList.remove('hidden-screen'); window.closeModal('exit-modal'); }
window.openStore = () => { document.getElementById('store-balance').innerText = state.cloudBalance.toFixed(2); window.openModal('store-modal'); }
window.submitWithdrawal = async function() { alert("Processing Withdrawal (3-5 Days)"); }
