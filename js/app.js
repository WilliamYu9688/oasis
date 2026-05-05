// ==========================================
// 🌟 核心状态还原 (业务红线：0.5 & 10)
// ==========================================
window.state = { path: 'en', cloudBalance: 0.00, adChances: 6, missedWords: {}, scores: {}, adBoostMap: {}, earnedMap: {} };
window.appState = 'READY';
window.currentUser = null;
window.currentPhrase = { text_en: "Please forward the email to my work account", text_zh: "请把邮件转发到我的工作邮箱" };

window.saveData = () => localStorage.setItem('oasis_state_v2', JSON.stringify(window.state));
window.loadData = () => {
    const s = localStorage.getItem('oasis_state_v2');
    if(s) window.state = {...window.state, ...JSON.parse(s)};
};

// ==========================================
// 🔐 登录逻辑还原 (解决无法登录问题)
// ==========================================
window.toggleAuthMode = function() {
    window.playSfx('click');
    const isLogin = document.getElementById('auth-title').innerText === "System Login";
    document.getElementById('auth-title').innerText = isLogin ? "Create Account" : "System Login";
};

window.executeAuth = async function() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('auth-action-btn');
    const msg = document.getElementById('auth-msg');

    if (!email || !password) return alert("Please enter credentials.");

    btn.disabled = true; btn.innerText = "AUTHENTICATING...";
    try {
        const isReg = document.getElementById('auth-title').innerText === "Create Account";
        const { data, error } = isReg 
            ? await oasisCloud.auth.signUp({ email, password }) 
            : await oasisCloud.auth.signInWithPassword({ email, password });

        if (error) throw error;
        
        window.currentUser = data.user;
        window.playSfx('success');
        document.getElementById('auth-screen').classList.add('hidden-screen');
        document.getElementById('step-1').classList.remove('hidden-screen');
    } catch (err) {
        msg.innerText = "❌ " + err.message;
    } finally {
        btn.disabled = false; btn.innerText = "Secure Access";
    }
};

// ==========================================
// 📺 收益逻辑 (0.5 AED 广告)
// ==========================================
window.triggerAd = function() {
    window.playSfx('click');
    if (window.state.adChances <= 0) return alert("Daily boosts exhausted.");
    
    const overlay = document.getElementById('web-ad-overlay');
    overlay.style.display = 'flex';
    document.getElementById('close-ad-btn').onclick = () => {
        window.state.adChances -= 1;
        window.state.cloudBalance += 0.5; // 还原 0.5 逻辑
        document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
        document.getElementById('ad-chances-display').innerText = window.state.adChances;
        overlay.style.display = 'none';
        window.saveData();
        window.playSfx('success');
    };
};

// ==========================================
// 👁️ LUM 逻辑 (10 AED 解锁)
// ==========================================
window.unlockLUM = function() {
    window.playSfx('click');
    if (window.state.cloudBalance >= 10) {  
        window.state.cloudBalance -= 10;
        document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
        window.saveData();
        document.getElementById('lum-lock-overlay').style.display = 'none';
        window.renderMockChart();
    } else {
        alert(`Need ${(10 - window.state.cloudBalance).toFixed(2)} AED more. Use 'Boost' or practice.`);
    }
};

window.closeLUM = () => { window.playSfx('click'); document.getElementById('lum-screen').classList.add('hidden-screen'); };
window.toggleLUM = () => { window.playSfx('click'); document.getElementById('lum-screen').classList.remove('hidden-screen'); };

// ==========================================
// 🚀 核心流程引导
// ==========================================
window.startPractice = (lang) => {
    window.playSfx('click');
    window.state.path = lang;
    document.getElementById('step-1').classList.add('hidden-screen');
    document.getElementById('loading-screen').classList.remove('hidden-screen');
    // 如果 Whisper 引擎已加载，直接进；否则等 1.5s
    if (window.initWhisper) window.initWhisper();
    else setTimeout(window.enterMainApp, 1500);
};

window.enterMainApp = () => {
    document.getElementById('loading-screen').classList.add('hidden-screen');
    document.getElementById('main-app').classList.remove('hidden-screen');
    window.loadData();
    window.fetchNewPhrase();
    document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
    document.getElementById('ad-chances-display').innerText = window.state.adChances !== undefined ? window.state.adChances : 6;
};

window.fetchNewPhrase = () => {
    document.getElementById('target-text').innerText = window.state.path === 'en' ? window.currentPhrase.text_en : window.currentPhrase.text_zh;
    document.getElementById('translated-text').innerText = window.state.path === 'en' ? window.currentPhrase.text_zh : window.currentPhrase.text_en;
    window.setAppState('READY');
};

window.setAppState = (s) => {
    window.appState = s;
    const b = document.getElementById('record-btn');
    const i = document.getElementById('mic-icon');
    if (s === 'READY') {
        b.className = "w-24 h-24 bg-white text-black rounded-full flex items-center justify-center shadow-2xl z-10";
        i.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v8a3 3 0 006 0V5a3 3 0 00-3-3z"></path>';
        document.getElementById('status-text').innerText = "TAP TO SPEAK";
    } else if (s === 'LISTENING') {
        b.className = "w-24 h-24 bg-red-500 text-white rounded-full flex items-center justify-center shadow-2xl recording-pulse z-10";
        i.innerHTML = '<rect x="9" y="9" width="6" height="6" fill="currentColor"></rect>';
        document.getElementById('status-text').innerText = "LISTENING...";
    }
};

window.renderMockChart = () => {
    const c = document.getElementById('lumChart');
    if (c && window.Chart) {
        new Chart(c, {
            type: 'radar',
            data: {
                labels: ['Pronunciation', 'Fluency', 'Grammar', 'Vocabulary', 'Speed'],
                datasets: [{ label: 'LUM', data: [80, 70, 90, 85, 75], backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#f59e0b' }]
            },
            options: { scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.1)' } } }, plugins: { legend: { display: false } } }
        });
    }
};
