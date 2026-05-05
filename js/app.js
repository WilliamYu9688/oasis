// ==========================================
// 🌟 核心状态与初始化 (0.5 & 10 红线)
// ==========================================
window.state = { path: 'en', cloudBalance: 0.00, adChances: 6, targetTime: 30, currentLevel: 1, lumUnlocked: false };
window.currentPhrase = { text_en: "Please forward the email to my work account", text_zh: "请把邮件转发到我的工作邮箱" };

window.saveData = () => localStorage.setItem('oasis_v48_state', JSON.stringify(window.state));
window.loadData = () => {
    const s = localStorage.getItem('oasis_v48_state');
    if(s) window.state = {...window.state, ...JSON.parse(s)};
};

// ==========================================
// 🔐 登录 (V48 对接)
// ==========================================
window.executeAuth = () => {
    document.getElementById('auth-screen').classList.add('hidden-screen');
    document.getElementById('step-1').classList.remove('hidden-screen');
};

// ==========================================
// 🚶 导航流 (Step 1 -> Time -> Step 2 -> Loading)
// ==========================================
window.handleStep1 = (path) => {
    window.state.path = path;
    document.getElementById('step-1').classList.add('hidden-screen');
    document.getElementById('step-time').classList.remove('hidden-screen');
};

window.handleStepTime = (minutes) => {
    window.state.targetTime = minutes;
    document.getElementById('step-time').classList.add('hidden-screen');
    document.getElementById('step-2').classList.remove('hidden-screen');
};

window.handleStep2 = (level) => {
    window.state.currentLevel = level;
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
    window.fetchNewPhrase(); // 🚨 确保执行，解决“连接中”
    
    // UI 同步
    document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
    document.getElementById('ad-limit-display').innerText = `🆘 ${window.state.adChances}/6`;
    document.getElementById('time-display').innerText = `0/${window.state.targetTime}m`;
};

window.fetchNewPhrase = () => {
    const isEn = window.state.path === 'en';
    const textEn = window.currentPhrase.text_en;
    const textZh = window.currentPhrase.text_zh;
    
    // 强制写入文本，干掉“Connecting...”
    document.getElementById('target-text').innerText = isEn ? textEn : textZh;
    document.getElementById('target-zh').innerText = isEn ? textZh : textEn;
    document.getElementById('scene-display').innerText = "BUSINESS PRACTICAL";
};

// ==========================================
// 🚪 退出逻辑 (还原：返回至 Step 1)
// ==========================================
window.promptExit = () => {
    const modal = document.getElementById('exit-modal');
    modal.style.display = 'flex';
    modal.classList.remove('hidden-screen');
    document.getElementById('exit-content').innerHTML = `
        <h3 class="text-2xl font-black text-white mb-2 italic">Terminate Session?</h3>
        <p class="text-slate-400 text-[10px] mb-8 uppercase tracking-[0.3em]">Progress Saved</p>
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
// 🆘 时间/助力广告 (0.50 AED)
// ==========================================
window.requestRescue = () => {
    if (window.state.adChances <= 0) return alert("No more boosts today.");
    const modal = document.getElementById('rescue-modal');
    modal.style.display = 'flex';
    modal.classList.remove('hidden-screen');
    document.getElementById('rescue-desc').innerText = `观看赞助内容赚取 0.50 AED 奖励。今日剩余: ${window.state.adChances}`;
    document.getElementById('rescue-action-btn').onclick = window.triggerAd;
};

window.triggerAd = () => {
    document.getElementById('rescue-modal').style.display = 'none';
    const adUI = document.getElementById('web-ad-overlay');
    adUI.style.display = 'flex';
    adUI.classList.remove('hidden');
    document.getElementById('close-ad-btn').onclick = () => {
        window.state.adChances -= 1;
        window.state.cloudBalance += 0.5; // 0.5 AED 逻辑
        document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
        document.getElementById('ad-limit-display').innerText = `🆘 ${window.state.adChances}/6`;
        adUI.style.display = 'none';
        window.saveData();
    };
};

// ==========================================
// 👁️ LUM 逻辑 (10 AED)
// ==========================================
window.openLUM = () => {
    const modal = document.getElementById('lum-modal');
    modal.style.display = 'flex';
    if (window.state.lumUnlocked) {
        document.getElementById('lum-locked-overlay').style.display = 'none';
        window.renderRadarChart();
    }
};

window.buyLUM = () => {
    if (window.state.cloudBalance >= 10) {
        window.state.cloudBalance -= 10;
        window.state.lumUnlocked = true;
        document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
        document.getElementById('lum-locked-overlay').style.display = 'none';
        window.saveData();
        window.renderRadarChart();
    } else {
        alert("Earn 10.00 AED to unlock.");
    }
};

window.closeModal = (id) => { document.getElementById(id).style.display = 'none'; };

window.renderRadarChart = () => {
    const ctx = document.getElementById('lumRadarChart');
    if(!ctx || !window.Chart) return;
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Pronunciation', 'Fluency', 'Grammar', 'Vocabulary', 'Accuracy'],
            datasets: [{ data: [85, 75, 90, 70, 80], backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#f59e0b' }]
        },
        options: { scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.05)' } } }, plugins: { legend: { display: false } } }
    });
};
