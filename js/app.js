// ==========================================
// 🌟 全局状态与本地存储
// ==========================================
window.state = { path: 'en', cloudBalance: 0.00, adChances: 6, missedWords: {}, scores: {}, adBoostMap: {}, earnedMap: {} };
window.currentUser = null;
window.appState = 'READY'; 
window.isEvaluating = false;
window.currentPhrase = { text_en: "Please forward the email to my work account", text_zh: "请把邮件转发到我的工作邮箱" };
window.rewardStages = [0, 0.5, 1.0, 1.5, 2.0, 2.5];

window.saveData = function() { localStorage.setItem('oasis_state', JSON.stringify(window.state)); };
window.loadData = function() {
    const saved = localStorage.getItem('oasis_state');
    if (saved) window.state = { ...window.state, ...JSON.parse(saved) };
};

// ==========================================
// 🔐 登录与鉴权逻辑
// ==========================================
window.toggleAuthMode = function() {
    window.playSfx('click');
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
};

window.executeAuth = async function() {
    window.playSfx('click');
    const btn = document.getElementById('auth-action-btn'); 
    btn.disabled = true; btn.innerText = "AUTHENTICATING...";
    // 秒进系统
    setTimeout(() => {
        document.getElementById('auth-screen').classList.add('hidden-screen'); 
        document.getElementById('step-1').classList.remove('hidden-screen');
        window.playSfx('success');
        btn.disabled = false; btn.innerText = "Secure Access";
    }, 500);
};

// ==========================================
// 📺 广告管理器与触发器 (0.5 AED 逻辑)
// ==========================================
window.AdManager = {
    init: function() {},
    showAd: function(onSuccess, onCancel) {
        const adUI = document.getElementById('web-ad-overlay');
        if (adUI) {
            adUI.style.display = 'flex';
            document.getElementById('close-ad-btn').onclick = () => { 
                adUI.style.display = 'none'; 
                onSuccess(); 
            };
        } else {
            setTimeout(() => onSuccess(), 500); 
        }
    }
};

window.triggerAd = function() {
    window.playSfx('click');
    if (window.state.adChances === undefined) window.state.adChances = 6; 
    if (window.state.adChances <= 0) { alert("今日广告增收次数已用完，请明天再来！"); return; }

    window.AdManager.showAd(
        () => {
            window.state.adChances -= 1;
            window.state.cloudBalance += 0.5; // 严格执行 0.5 AED
            const earnedEl = document.getElementById('total-earned');
            if (earnedEl) {
                earnedEl.innerText = window.state.cloudBalance.toFixed(2);
                earnedEl.classList.add('money-jump');
                setTimeout(() => earnedEl.classList.remove('money-jump'), 500);
            }
            const counter = document.getElementById('ad-chances-display');
            if(counter) counter.innerText = window.state.adChances;
            window.saveData();
            alert(`✅ 0.5 AED 收益已到账！今日剩余 ${window.state.adChances} 次机会。`);
        },
        () => { console.log("用户取消"); }
    );
};

// ==========================================
// 👁️ LUM 仪表盘逻辑 (10 AED 解锁 + 返回键)
// ==========================================
window.toggleLUM = function() {
    window.playSfx('click');
    const screen = document.getElementById('lum-screen');
    if (screen) screen.classList.remove('hidden-screen');
};

window.closeLUM = function() {
    window.playSfx('click');
    const screen = document.getElementById('lum-screen');
    if (screen) screen.classList.add('hidden-screen');
};

window.unlockLUM = function() {
    window.playSfx('click');
    if (window.state.cloudBalance >= 10) {  
        window.state.cloudBalance -= 10;
        const earnedEl = document.getElementById('total-earned');
        if(earnedEl) earnedEl.innerText = window.state.cloudBalance.toFixed(2);
        window.saveData();
        
        const lockOverlay = document.getElementById('lum-lock-overlay');
        if(lockOverlay) lockOverlay.style.display = 'none';
        
        window.renderMockChart();
    } else {
        alert(`⚠️ 余额不足，还差 ${(10 - window.state.cloudBalance).toFixed(2)} AED 解锁靶向治疗！\n（点击左上角看广告赚钱）`);
    }
};

window.renderMockChart = function() {
    const ctx = document.getElementById('lumChart');
    if (ctx && window.Chart) {
        new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Articulation', 'Fluency', 'Scenario', 'Vocabulary', 'Confidence'],
                datasets: [{
                    label: 'LUM Insight',
                    data: [85, 90, 78, 92, 88],
                    backgroundColor: 'rgba(245, 158, 11, 0.2)',
                    borderColor: 'rgba(245, 158, 11, 1)',
                    pointBackgroundColor: 'rgba(245, 158, 11, 1)'
                }]
            },
            options: { scales: { r: { min: 0, max: 100, ticks: { display: false }, grid: { color: 'rgba(255,255,255,0.1)' }, pointLabels: { color: '#e2e8f0' } } }, plugins: { legend: { display: false } } }
        });
    }
};

// ==========================================
// 🚀 主流程 UI 交互
// ==========================================
window.startPractice = function(lang) {
    window.playSfx('click');
    window.state.path = lang;
    document.getElementById('step-1').classList.add('hidden-screen');
    document.getElementById('loading-screen').classList.remove('hidden-screen');
    if (window.initWhisper) window.initWhisper();
    else setTimeout(window.enterMainApp, 1500);
};

window.enterMainApp = function() {
    document.getElementById('loading-screen').classList.add('hidden-screen');
    document.getElementById('main-app').classList.remove('hidden-screen');
    window.loadData();
    window.fetchNewPhrase();
    
    const earnedEl = document.getElementById('total-earned');
    if (earnedEl) earnedEl.innerText = window.state.cloudBalance.toFixed(2);
    const counter = document.getElementById('ad-chances-display');
    if(counter) counter.innerText = window.state.adChances !== undefined ? window.state.adChances : 6;
};

window.fetchNewPhrase = function() {
    window.currentPhrase = { text_en: "Please forward the email to my work account", text_zh: "请把邮件转发到我的工作邮箱" };
    const textEl = document.getElementById('target-text');
    const transEl = document.getElementById('translated-text');
    if (textEl) textEl.innerText = window.state.path === 'en' ? window.currentPhrase.text_en : window.currentPhrase.text_zh;
    if (transEl) transEl.innerText = window.state.path === 'en' ? window.currentPhrase.text_zh : window.currentPhrase.text_en;
    window.setAppState('READY');
};

window.setAppState = function(newState) {
    window.appState = newState;
    const btn = document.getElementById('record-btn');
    const icon = document.getElementById('mic-icon');
    const status = document.getElementById('status-text');
    if(!btn) return;

    if (newState === 'READY') {
        btn.className = "w-24 h-24 bg-white text-black rounded-full flex items-center justify-center shadow-2xl hover:bg-amber-400 transition-all z-10";
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-20a3 3 0 00-3 3v8a3 3 0 006 0V5a3 3 0 00-3-3z"></path>';
        if(status) status.innerText = "TAP TO SPEAK";
    } else if (newState === 'LISTENING') {
        btn.className = "w-24 h-24 bg-red-500 text-white rounded-full flex items-center justify-center shadow-2xl recording-pulse z-10";
        icon.innerHTML = '<rect x="9" y="9" width="6" height="6" stroke-width="2" stroke="currentColor" fill="currentColor"></rect>';
        if(status) status.innerText = "LISTENING...";
    } else if (newState === 'PROCESSING') {
        btn.className = "w-24 h-24 bg-amber-500 text-black rounded-full flex items-center justify-center shadow-2xl opacity-50 cursor-not-allowed z-10";
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>';
        if(status) status.innerText = "ANALYZING...";
    }
};

window.syncPhraseState = function() {}; // 防报错占位
document.addEventListener('DOMContentLoaded', () => { window.AdManager.init(); });
