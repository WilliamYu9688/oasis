// ==========================================
// 🌟 核心业务状态 (0.5 AED & 10 AED)
// ==========================================
window.state = { 
    path: 'en', 
    cloudBalance: 0.00, 
    adChances: 6, 
    targetTime: 30, // 默认 30 分钟
    currentLevel: 1, 
    lumUnlocked: false 
};

window.saveData = () => localStorage.setItem('oasis_v48_state', JSON.stringify(window.state));

// ==========================================
// 🚶 导航与步进 (严格对接 V48 HTML)
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

window.handleStepTime = (minutes) => {
    window.state.targetTime = minutes; // 恢复时间目标记录
    document.getElementById('step-time').classList.add('hidden-screen');
    document.getElementById('step-2').classList.remove('hidden-screen');
};

window.handleStep2 = (level) => {
    window.state.currentLevel = level;
    document.getElementById('step-2').classList.add('hidden-screen');
    document.getElementById('loading-screen').classList.remove('hidden-screen');
    
    // 还原加载进度条动画
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        const bar = document.getElementById('loading-progress-bar');
        const percent = document.getElementById('loading-percent');
        if (bar) bar.style.width = progress + '%';
        if (percent) percent.innerText = progress + '%';
        if (progress >= 100) { 
            clearInterval(interval); 
            window.enterMainApp(); 
        }
    }, 150);
};

window.enterMainApp = () => {
    document.getElementById('loading-screen').classList.add('hidden-screen');
    document.getElementById('main-app').classList.remove('hidden-screen');
    window.fetchNewPhrase();
    
    // 核心 UI 同步
    document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
    document.getElementById('ad-limit-display').innerText = `🆘 ${window.state.adChances}/6`;
    document.getElementById('time-display').innerText = `0/${window.state.targetTime}m`;
};

// ==========================================
// 🚪 退出逻辑 (还原：返回至路径选择)
// ==========================================
window.promptExit = () => {
    const modal = document.getElementById('exit-modal');
    const content = document.getElementById('exit-content');
    modal.classList.remove('hidden-screen');
    modal.style.display = 'flex';
    content.innerHTML = `
        <h3 class="text-2xl font-black text-white mb-2 italic">Terminate Session?</h3>
        <p class="text-slate-400 text-[10px] mb-8 uppercase tracking-[0.3em]">Progress Saved</p>
        <div class="space-y-3">
            <button onclick="window.confirmExit()" class="w-full py-4 bg-red-600 text-white font-black rounded-xl uppercase tracking-widest active:scale-95">Yes, Exit Path</button>
            <button onclick="window.closeModal('exit-modal')" class="w-full py-4 glass-panel text-slate-300 font-bold rounded-xl uppercase tracking-widest">Keep Practicing</button>
        </div>
    `;
};

window.confirmExit = () => {
    document.getElementById('exit-modal').style.display = 'none';
    document.getElementById('main-app').classList.add('hidden-screen');
    document.getElementById('step-1').classList.remove('hidden-screen');
};

// ==========================================
// 📺 救济/时间广告 (还原 0.50 AED 逻辑)
// ==========================================
window.requestRescue = () => {
    if (window.state.adChances <= 0) return alert("今日助力次数已达上限");
    const modal = document.getElementById('rescue-modal');
    modal.style.display = 'flex';
    modal.classList.remove('hidden-screen');
    
    document.getElementById('rescue-title').innerText = "专属系统助力";
    document.getElementById('rescue-desc').innerText = `观看赞助内容，即可获得 0.50 AED 助力收益。今日剩余: ${window.state.adChances} 次`;
    document.getElementById('rescue-action-btn').onclick = window.triggerAd;
};

window.triggerAd = () => {
    document.getElementById('rescue-modal').style.display = 'none';
    const adOverlay = document.getElementById('web-ad-overlay');
    adOverlay.classList.remove('hidden');
    adOverlay.style.display = 'flex';
    
    document.getElementById('close-ad-btn').onclick = () => {
        window.state.adChances -= 1;
        window.state.cloudBalance += 0.5; // 严格 0.5 AED 奖励
        document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
        document.getElementById('ad-limit-display').innerText = `🆘 ${window.state.adChances}/6`;
        adOverlay.classList.add('hidden');
        adOverlay.style.display = 'none';
        window.saveData();
    };
};

// ==========================================
// 👁️ LUM 逻辑 (10.00 AED)
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
    } else {
        alert(`还需 ${(10 - window.state.cloudBalance).toFixed(2)} AED 解锁 LUM 智慧透视仪`);
    }
};

window.closeModal = (id) => { document.getElementById(id).style.display = 'none'; };

// ==========================================
// 🎙️ 录音与界面状态
// ==========================================
window.fetchNewPhrase = () => {
    const isEn = window.state.path === 'en';
    const en = "Please forward the email to my work account";
    const zh = "请把邮件转发到我的工作邮箱";
    document.getElementById('target-text').innerText = isEn ? en : zh;
    document.getElementById('target-zh').innerText = isEn ? zh : en;
    document.getElementById('scene-display').innerText = "Business Communication";
};

window.toggleRecord = () => {
    const ring = document.getElementById('mic-inner-ring');
    if (window.appState === 'READY') {
        window.appState = 'LISTENING';
        ring.style.background = "#ef4444";
    } else {
        window.appState = 'READY';
        ring.style.background = "linear-gradient(145deg, #fbbf24, #d97706)";
    }
};

window.renderRadarChart = () => {
    const ctx = document.getElementById('lumRadarChart');
    if (!ctx || !window.Chart) return;
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Pronunciation', 'Fluency', 'Grammar', 'Vocabulary', 'Accuracy'],
            datasets: [{ data: [85, 75, 90, 70, 80], backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#f59e0b' }]
        },
        options: { scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.05)' } } }, plugins: { legend: { display: false } } }
    });
};
