// ==========================================
// 🌟 状态初始化 (0.5 & 10 红线)
// ==========================================
window.state = { path: 'en', cloudBalance: 0.00, adChances: 6, targetTime: 30, currentLevel: 1, lumUnlocked: false };
window.saveData = () => localStorage.setItem('oasis_v48_state', JSON.stringify(window.state));

// ==========================================
// 🚶 导航逻辑 (严格对齐 V48 HTML)
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
    // 初始化 V48 UI 数值
    document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
    document.getElementById('ad-limit-display').innerText = `🆘 ${window.state.adChances}/6`;
    document.getElementById('time-display').innerText = `0/${window.state.targetTime}m`;
};

window.fetchNewPhrase = () => {
    const isEn = window.state.path === 'en';
    const enText = "Please forward the email to my work account";
    const zhText = "请把邮件转发到我的工作邮箱";
    document.getElementById('target-text').innerText = isEn ? enText : zhText;
    document.getElementById('target-zh').innerText = isEn ? zhText : enText;
    document.getElementById('scene-display').innerText = "BUSINESS";
};

// ==========================================
// 🚪 退出逻辑 (修复点击退出没反应)
// ==========================================
window.promptExit = () => {
    const modal = document.getElementById('exit-modal');
    const content = document.getElementById('exit-content');
    modal.style.display = 'flex';
    content.innerHTML = `
        <h3 class="text-2xl font-black text-white mb-2">退出当前会话？</h3>
        <p class="text-slate-400 text-xs mb-8 uppercase tracking-widest text-center">Session Progress will be saved</p>
        <div class="space-y-3">
            <button onclick="location.reload()" class="w-full py-4 bg-red-600 text-white font-black rounded-xl uppercase tracking-widest shadow-lg shadow-red-600/20">确认结束</button>
            <button onclick="window.closeModal('exit-modal')" class="w-full py-4 glass-panel text-white font-bold rounded-xl uppercase tracking-widest">返回练习</button>
        </div>
    `;
};

// ==========================================
// 💰 商业逻辑 (0.50 & 10.00)
// ==========================================
window.requestRescue = () => {
    if (window.state.adChances <= 0) return alert("Daily boosts exhausted.");
    document.getElementById('rescue-modal').style.display = 'flex';
    document.getElementById('rescue-desc').innerText = "观看赞助视频获取 0.50 AED 助力奖励";
    document.getElementById('rescue-action-btn').onclick = window.triggerAd;
};

window.triggerAd = () => {
    document.getElementById('rescue-modal').style.display = 'none';
    document.getElementById('web-ad-overlay').classList.remove('hidden');
    document.getElementById('close-ad-btn').onclick = () => {
        window.state.adChances -= 1;
        window.state.cloudBalance += 0.5; // 0.5 AED 逻辑
        document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
        document.getElementById('ad-limit-display').innerText = `🆘 ${window.state.adChances}/6`;
        document.getElementById('web-ad-overlay').classList.add('hidden');
        window.saveData();
    };
};

window.openLUM = () => {
    document.getElementById('lum-modal').style.display = 'flex';
    if (window.state.lumUnlocked) {
        document.getElementById('lum-locked-overlay').style.display = 'none';
        window.renderRadarChart();
    }
};

window.buyLUM = () => {
    if (window.state.cloudBalance >= 10) { // 10 AED 逻辑
        window.state.cloudBalance -= 10;
        window.state.lumUnlocked = true;
        document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
        document.getElementById('lum-locked-overlay').style.display = 'none';
        window.renderRadarChart();
    } else {
        alert("Need 10.00 AED to unlock.");
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

window.setAppState = (s) => {
    const ring = document.getElementById('mic-inner-ring');
    if (s === 'LISTENING') ring.style.background = "#ef4444";
    else ring.style.background = "linear-gradient(145deg, #fbbf24, #d97706)";
};
