// ==========================================
// 🌟 状态初始化 (0.5 & 10 逻辑)
// ==========================================
window.state = { path: 'en', cloudBalance: 0.00, adChances: 6, targetTime: 30, currentLevel: 1, lumUnlocked: false };

window.saveData = () => localStorage.setItem('oasis_v48_state', JSON.stringify(window.state));

// ==========================================
// 🚶 步进导航 (严格对接 V48 HTML 按钮)
// ==========================================
window.executeAuth = () => {
    document.getElementById('auth-screen').classList.add('hidden-screen');
    document.getElementById('step-1').classList.remove('hidden-screen');
};

window.handleStep1 = (path) => {
    window.state.path = path; // 'cn' 或 'en'
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
    
    // 进度条动画
    let p = 0;
    const inv = setInterval(() => {
        p += 5;
        document.getElementById('loading-progress-bar').style.width = p + '%';
        document.getElementById('loading-percent').innerText = p + '%';
        if (p >= 100) { clearInterval(inv); window.enterMainApp(); }
    }, 50);
};

window.enterMainApp = () => {
    document.getElementById('loading-screen').classList.add('hidden-screen');
    document.getElementById('main-app').classList.remove('hidden-screen');
    window.fetchNewPhrase();
    // 还原 V48 顶栏 UI 数据
    document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
    document.getElementById('ad-limit-display').innerText = `🆘 ${window.state.adChances}/6`;
    document.getElementById('time-display').innerText = `0/${window.state.targetTime}m`;
};

// ==========================================
// 🚪 退出逻辑 (修复 Quit 按钮没反应)
// ==========================================
window.promptExit = () => {
    const modal = document.getElementById('exit-modal');
    const content = document.getElementById('exit-content');
    modal.classList.remove('hidden-screen');
    // 强制赋予 flex 布局确保可见
    modal.style.display = 'flex'; 
    content.innerHTML = `
        <div class="p-6">
            <h3 class="text-2xl font-black text-white mb-2">Terminate Session?</h3>
            <p class="text-slate-400 text-xs mb-8 uppercase tracking-widest">Progress will be saved</p>
            <div class="space-y-4">
                <button onclick="location.reload()" class="w-full py-4 bg-red-600 text-white font-black rounded-xl uppercase active:scale-95">Confirm Exit</button>
                <button onclick="window.closeModal('exit-modal')" class="w-full py-4 glass-panel text-white font-bold rounded-xl uppercase active:scale-95">Cancel</button>
            </div>
        </div>
    `;
};

// ==========================================
// 👁️ LUM 逻辑 (10 AED)
// ==========================================
window.openLUM = () => {
    const modal = document.getElementById('lum-modal');
    modal.style.display = 'flex';
    modal.classList.remove('hidden-screen');
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
    } else { alert("Need 10.00 AED"); }
};

window.closeModal = (id) => {
    const m = document.getElementById(id);
    m.style.display = 'none';
    m.classList.add('hidden-screen');
};

// ==========================================
// 🎙️ 录音与业务逻辑
// ==========================================
window.fetchNewPhrase = () => {
    const en = "Please forward the email to my work account";
    const zh = "请把邮件转发到我的工作邮箱";
    const isEn = window.state.path === 'en';
    document.getElementById('target-text').innerText = isEn ? en : zh;
    document.getElementById('target-zh').innerText = isEn ? zh : en;
    document.getElementById('scene-display').innerText = "BUSINESS";
};

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
