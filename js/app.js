window.state = { path: 'en', cloudBalance: 0.00, adChances: 6, targetTime: 30, currentLevel: 1, lumUnlocked: false, missedWords: {}, scores: {}, adBoostMap: {}, earnedMap: {} };
window.appState = 'READY';
window.currentPhrase = { text_en: "Please forward the email to my work account", text_zh: "请把邮件转发到我的工作邮箱" };

window.saveData = () => localStorage.setItem('oasis_v48_state', JSON.stringify(window.state));

// ==========================================
// 🚶 导航全流程 (对齐 V48 HTML)
// ==========================================
window.executeAuth = () => {
    document.getElementById('auth-screen').classList.add('hidden-screen');
    document.getElementById('step-1').classList.remove('hidden-screen');
};

window.handleStep1 = (p) => {
    window.state.path = p;
    document.getElementById('step-1').classList.add('hidden-screen');
    document.getElementById('step-time').classList.remove('hidden-screen');
};

window.handleStepTime = (t) => {
    window.state.targetTime = t;
    document.getElementById('step-time').classList.add('hidden-screen');
    document.getElementById('step-2').classList.remove('hidden-screen');
};

window.handleStep2 = (l) => {
    window.state.currentLevel = l;
    document.getElementById('step-2').classList.add('hidden-screen');
    document.getElementById('loading-screen').classList.remove('hidden-screen');
    let p = 0;
    const inv = setInterval(() => {
        p += 10;
        document.getElementById('loading-progress-bar').style.width = p + '%';
        document.getElementById('loading-percent').innerText = p + '%';
        if (p >= 100) { clearInterval(inv); window.enterMainApp(); }
    }, 100);
};

window.enterMainApp = () => {
    document.getElementById('loading-screen').classList.add('hidden-screen');
    document.getElementById('main-app').classList.remove('hidden-screen');
    window.fetchNewPhrase();
    // 实时同步 UI
    document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
    document.getElementById('ad-limit-display').innerText = `🆘 ${window.state.adChances}/6`;
    document.getElementById('time-display').innerText = `0/${window.state.targetTime}m`;
};

// ==========================================
// 🚪 退出逻辑 (还原：返回至 Step 1)
// ==========================================
window.promptExit = () => {
    const modal = document.getElementById('exit-modal');
    modal.style.display = 'flex';
    modal.classList.remove('hidden-screen');
    document.getElementById('exit-content').innerHTML = `
        <h3 class="text-2xl font-black text-white mb-2 italic tracking-tighter">Terminate Practice?</h3>
        <p class="text-slate-400 text-[10px] mb-8 uppercase tracking-[0.3em]">Session Progress Saved</p>
        <div class="space-y-3">
            <button onclick="window.confirmExit()" class="w-full py-4 bg-red-600 text-white font-black rounded-xl uppercase tracking-widest active:scale-95 shadow-lg shadow-red-600/20">Yes, Exit Path</button>
            <button onclick="window.closeModal('exit-modal')" class="w-full py-4 glass-panel text-slate-300 font-bold rounded-xl uppercase tracking-widest">Stay in Oasis</button>
        </div>
    `;
};

window.confirmExit = () => {
    document.getElementById('exit-modal').style.display = 'none';
    document.getElementById('main-app').classList.add('hidden-screen');
    document.getElementById('step-1').classList.remove('hidden-screen');
};

// ==========================================
// 🆘 广告逻辑 (0.50 AED)
// ==========================================
window.requestRescue = () => {
    if (window.state.adChances <= 0) return alert("No more boosts today.");
    const modal = document.getElementById('rescue-modal');
    modal.style.display = 'flex';
    modal.classList.remove('hidden-screen');
    document.getElementById('rescue-title').innerText = "System Rescue";
    document.getElementById('rescue-desc').innerText = `Watch sponsored content to earn 0.50 AED. Remaining: ${window.state.adChances}`;
    document.getElementById('rescue-action-btn').onclick = window.triggerAd;
};

window.triggerAd = () => {
    document.getElementById('rescue-modal').style.display = 'none';
    const adUI = document.getElementById('web-ad-overlay');
    adUI.style.display = 'flex';
    adUI.classList.remove('hidden');
    document.getElementById('close-ad-btn').onclick = () => {
        window.state.adChances -= 1;
        window.state.cloudBalance += 0.5;
        document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
        document.getElementById('ad-limit-display').innerText = `🆘 ${window.state.adChances}/6`;
        adUI.style.display = 'none';
        window.saveData();
        window.playSfx('success');
    };
};

window.fetchNewPhrase = () => {
    const isEn = window.state.path === 'en';
    document.getElementById('target-text').innerText = isEn ? window.currentPhrase.text_en : window.currentPhrase.text_zh;
    document.getElementById('target-zh').innerText = isEn ? window.currentPhrase.text_zh : window.currentPhrase.text_en;
    document.getElementById('scene-display').innerText = "BUSINESS PRACTICAL";
};

window.closeModal = (id) => { document.getElementById(id).style.display = 'none'; };
