// ==========================================
// 🌟 核心状态 (严格执行 0.5 & 10 逻辑)
// ==========================================
window.state = { 
    path: 'en', 
    cloudBalance: 0.00, 
    adChances: 6, 
    targetTime: 30, 
    currentLevel: 1,
    missedWords: {}, 
    scores: {}, 
    lumUnlocked: false 
};
window.appState = 'READY';
window.currentPhrase = { text_en: "Please forward the email to my work account", text_zh: "请把邮件转发到我的工作邮箱" };

window.saveData = () => localStorage.setItem('oasis_v48_state', JSON.stringify(window.state));
window.loadData = () => {
    const s = localStorage.getItem('oasis_v48_state');
    if(s) window.state = {...window.state, ...JSON.parse(s)};
};

// ==========================================
// 🔐 登录逻辑 (对接 V48 ID)
// ==========================================
window.toggleAuthMode = function() {
    const isLogin = document.getElementById('auth-title').innerText === "System Login";
    document.getElementById('auth-title').innerText = isLogin ? "Create Account" : "System Login";
    document.getElementById('auth-action-btn').innerText = isLogin ? "Register Now" : "Secure Access";
    const container = document.getElementById('confirm-password-container');
    container.style.maxHeight = isLogin ? "100px" : "0";
    container.style.opacity = isLogin ? "1" : "0";
};

window.executeAuth = async function() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('auth-action-btn');
    const msg = document.getElementById('auth-msg');

    if (!email || !password) return;
    btn.disabled = true; btn.innerText = "AUTHENTICATING...";

    try {
        const isReg = document.getElementById('auth-title').innerText === "Create Account";
        const { data, error } = isReg 
            ? await oasisCloud.auth.signUp({ email, password }) 
            : await oasisCloud.auth.signInWithPassword({ email, password });

        if (error) throw error;
        
        document.getElementById('auth-screen').classList.add('hidden-screen');
        document.getElementById('step-1').classList.remove('hidden-screen');
        window.playSfx('success');
    } catch (err) {
        msg.innerText = "❌ " + err.message;
    } finally {
        btn.disabled = false; btn.innerText = isReg ? "Register Now" : "Secure Access";
    }
};

// ==========================================
// 🚶 步进逻辑 (解决“点击没反应”的核心修复)
// ==========================================
window.handleStep1 = (path) => {
    window.playSfx('click');
    window.state.path = path;
    document.getElementById('step-1').classList.add('hidden-screen');
    document.getElementById('step-time').classList.remove('hidden-screen');
};

window.handleStepTime = (minutes) => {
    window.playSfx('click');
    window.state.targetTime = minutes;
    document.getElementById('step-time').classList.add('hidden-screen');
    document.getElementById('step-2').classList.remove('hidden-screen');
};

window.handleStep2 = (level) => {
    window.playSfx('click');
    window.state.currentLevel = level;
    document.getElementById('step-2').classList.add('hidden-screen');
    document.getElementById('loading-screen').classList.remove('hidden-screen');
    
    // 模拟加载进度，对齐 V48 loading 效果
    let progress = 0;
    const interval = setInterval(() => {
        progress += 5;
        document.getElementById('loading-progress-bar').style.width = progress + '%';
        document.getElementById('loading-percent').innerText = progress + '%';
        if (progress >= 100) {
            clearInterval(interval);
            window.enterMainApp();
        }
    }, 50);
};

window.enterMainApp = () => {
    document.getElementById('loading-screen').classList.add('hidden-screen');
    document.getElementById('main-app').classList.remove('hidden-screen');
    window.loadData();
    window.fetchNewPhrase();
    
    // 初始 UI 赋值
    document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
    document.getElementById('ad-limit-display').innerText = `🆘 ${window.state.adChances}/6`;
    document.getElementById('time-display').innerText = `0/${window.state.targetTime}m`;
};

// ==========================================
// 🎙️ 录音与内容逻辑
// ==========================================
window.fetchNewPhrase = () => {
    const isEn = window.state.path === 'en';
    document.getElementById('target-text').innerText = isEn ? window.currentPhrase.text_en : window.currentPhrase.text_zh;
    document.getElementById('target-zh').innerText = isEn ? window.currentPhrase.text_zh : window.currentPhrase.text_en;
    window.setAppState('READY');
};

window.setAppState = (s) => {
    window.appState = s;
    const ring = document.getElementById('mic-inner-ring');
    const status = document.getElementById('score-display');
    if (s === 'READY') {
        ring.style.background = "linear-gradient(145deg, #fbbf24, #d97706)";
        status.innerHTML = `<p class="text-gray-500 font-bold text-[10px] uppercase tracking-widest">SYSTEM READY</p>`;
    } else if (s === 'LISTENING') {
        ring.style.background = "#ef4444";
        status.innerHTML = `<p class="text-red-500 font-bold text-[10px] uppercase tracking-widest animate-pulse">LISTENING...</p>`;
    }
};

// ==========================================
// 💰 商业逻辑 (0.50 & 10.00)
// ==========================================
window.requestRescue = () => {
    document.getElementById('rescue-modal').classList.remove('hidden-screen');
    document.getElementById('rescue-desc').innerText = `需要系统助力？观看赞助内容可立即获得 0.50 AED 收益。今日剩余: ${window.state.adChances} 次`;
    document.getElementById('rescue-action-btn').onclick = window.triggerAd;
};

window.triggerAd = function() {
    document.getElementById('rescue-modal').classList.add('hidden-screen');
    const adOverlay = document.getElementById('web-ad-overlay');
    adOverlay.style.display = 'flex';
    
    document.getElementById('close-ad-btn').onclick = () => {
        window.state.adChances -= 1;
        window.state.cloudBalance += 0.5;
        document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
        document.getElementById('ad-limit-display').innerText = `🆘 ${window.state.adChances}/6`;
        adOverlay.style.display = 'none';
        window.saveData();
        window.playSfx('success');
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
    if (window.state.cloudBalance >= 10) {
        window.state.cloudBalance -= 10;
        window.state.lumUnlocked = true;
        document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
        document.getElementById('lum-locked-overlay').style.display = 'none';
        window.saveData();
        window.renderRadarChart();
    } else {
        alert("余额不足 10.00 AED");
    }
};

window.closeModal = (id) => { document.getElementById(id).style.display = 'none'; };

window.renderRadarChart = () => {
    const ctx = document.getElementById('lumRadarChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Pronunciation', 'Fluency', 'Scenario', 'Vocabulary', 'Accuracy'],
            datasets: [{ data: [85, 70, 90, 65, 80], backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#f59e0b', pointBackgroundColor: '#fbbf24' }]
        },
        options: { scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.05)' } } }, plugins: { legend: { display: false } } }
    });
};

window.playSfx = (type) => { /* 这里接您的音效逻辑 */ };
