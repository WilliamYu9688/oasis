// ==========================================
// 🌟 核心状态还原 (业务红线：0.5 & 10)
// ==========================================
window.state = { 
    path: 'en', 
    cloudBalance: 0.00, 
    adChances: 6, 
    targetTime: 30, // 默认 30m
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
// 🔐 登录逻辑 (对接 V48 样式)
// ==========================================
window.toggleAuthMode = function() {
    const isLogin = document.getElementById('auth-title').innerText === "System Login";
    document.getElementById('auth-title').innerText = isLogin ? "Create Account" : "System Login";
    document.getElementById('auth-action-btn').innerText = isLogin ? "Register Now" : "Secure Access";
    const container = document.getElementById('confirm-password-container');
    if(container) {
        container.style.maxHeight = isLogin ? "100px" : "0";
        container.style.opacity = isLogin ? "1" : "0";
    }
};

window.executeAuth = async function() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('auth-action-btn');
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
        const msg = document.getElementById('auth-msg');
        if(msg) msg.innerText = err.message;
    } finally {
        btn.disabled = false; btn.innerText = "Secure Access";
    }
};

// ==========================================
// 🚶 导航全流程 (Step 1 -> Time -> Step 2 -> Loading)
// ==========================================
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
    // 进度条逻辑
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
    // 还原 V48 仪表盘数值
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
        <h3 class="text-2xl font-black text-white mb-2 italic">Terminate Session?</h3>
        <p class="text-slate-400 text-[10px] mb-8 uppercase tracking-[0.3em]">Progress Saved</p>
        <div class="space-y-3">
            <button onclick="window.confirmExit()" class="w-full py-4 bg-red-600 text-white font-black rounded-xl uppercase tracking-widest active:scale-95">Yes, Exit Path</button>
            <button onclick="window.closeModal('exit-modal')" class="w-full py-4 glass-panel text-slate-300 font-bold rounded-xl uppercase tracking-widest">Keep Practicing</button>
        </div>
    `;
};

window.confirmExit = () => {
    // 核心逻辑：隐藏主程序，显示路径选择（Step 1）
    document.getElementById('exit-modal').style.display = 'none';
    document.getElementById('main-app').classList.add('hidden-screen');
    document.getElementById('step-1').classList.remove('hidden-screen');
    window.playSfx('click');
};

// ==========================================
// 📺 商业激励 (0.50 AED)
// ==========================================
window.requestRescue = () => {
    if (window.state.adChances <= 0) return alert("Limit Reached");
    document.getElementById('rescue-modal').style.display = 'flex';
    document.getElementById('rescue-desc').innerText = `Watch sponsored content to earn 0.50 AED.`;
    document.getElementById('rescue-action-btn').onclick = window.triggerAd;
};

window.triggerAd = () => {
    document.getElementById('rescue-modal').style.display = 'none';
    document.getElementById('web-ad-overlay').style.display = 'flex';
    document.getElementById('close-ad-btn').onclick = () => {
        window.state.adChances -= 1;
        window.state.cloudBalance += 0.5; // 0.5 逻辑
        document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
        document.getElementById('ad-limit-display').innerText = `🆘 ${window.state.adChances}/6`;
        document.getElementById('web-ad-overlay').style.display = 'none';
        window.saveData();
    };
};

// ==========================================
// 👁️ LUM 透视逻辑 (10.00 AED)
// ==========================================
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
        window.renderRadarChart();
    } else {
        alert("Earn 10.00 AED to unlock analytics.");
    }
};

window.closeModal = (id) => { document.getElementById(id).style.display = 'none'; };

// ==========================================
// 🎙️ 录音状态与显示
// ==========================================
window.fetchNewPhrase = () => {
    const isEn = window.state.path === 'en';
    document.getElementById('target-text').innerText = isEn ? window.currentPhrase.text_en : window.currentPhrase.text_zh;
    document.getElementById('target-zh').innerText = isEn ? window.currentPhrase.text_zh : window.currentPhrase.text_en;
    document.getElementById('scene-display').innerText = "Business Communication";
};

window.renderRadarChart = () => {
    const ctx = document.getElementById('lumRadarChart');
    if (!ctx) return;
    new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Pronunciation', 'Fluency', 'Grammar', 'Vocabulary', 'Coherence'],
            datasets: [{ data: [85, 75, 90, 65, 80], backgroundColor: 'rgba(245, 158, 11, 0.2)', borderColor: '#f59e0b' }]
        },
        options: { scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.05)' } } }, plugins: { legend: { display: false } } }
    });
};
