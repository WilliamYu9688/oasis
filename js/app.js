// ==========================================
// 🌟 核心状态还原
// ==========================================
window.state = { 
    path: 'en', 
    cloudBalance: 0.00, 
    adChances: 6, // 每天 6 次
    missedWords: {}, 
    scores: {}, 
    adBoostMap: {}, 
    earnedMap: {} 
};
window.appState = 'READY';
window.rewardStages = [0, 0.5, 1.0, 1.5, 2.0, 2.5];
window.currentPhrase = { text_en: "Please forward the email to my work account", text_zh: "请把邮件转发到我的工作邮箱" };

window.saveData = function() { localStorage.setItem('oasis_state_v2', JSON.stringify(window.state)); };
window.loadData = function() {
    const saved = localStorage.getItem('oasis_state_v2');
    if (saved) window.state = { ...window.state, ...JSON.parse(saved) };
};

// ==========================================
// 📺 广告逻辑 (精准还原 0.5 AED 奖励)
// ==========================================
window.triggerAd = function() {
    window.playSfx('click');
    if (window.state.adChances === undefined) window.state.adChances = 6; 
    
    if (window.state.adChances <= 0) {
        alert("今日加速次数已用完，请明天再来！");
        return;
    }

    const adUI = document.getElementById('web-ad-overlay');
    if (adUI) {
        adUI.style.display = 'flex';
        document.getElementById('close-ad-btn').onclick = () => { 
            adUI.style.display = 'none'; 
            window.state.adChances -= 1;
            window.state.cloudBalance += 0.5; // 严格执行 0.5 AED
            
            // 更新 UI
            document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
            document.getElementById('total-earned').classList.add('money-jump');
            setTimeout(() => document.getElementById('total-earned').classList.remove('money-jump'), 500);
            document.getElementById('ad-chances-display').innerText = window.state.adChances;
            
            window.saveData();
            window.playSfx('success');
        };
    }
};

// ==========================================
// 👁️ LUM 逻辑 (精准还原 10 AED 解锁与关闭)
// ==========================================
window.toggleLUM = function() {
    window.playSfx('click');
    document.getElementById('lum-screen').classList.remove('hidden-screen');
};

window.closeLUM = function() {
    window.playSfx('click');
    document.getElementById('lum-screen').classList.add('hidden-screen');
};

window.unlockLUM = function() {
    window.playSfx('click');
    if (window.state.cloudBalance >= 10) {  
        window.state.cloudBalance -= 10;
        document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
        window.saveData();
        
        document.getElementById('lum-lock-overlay').style.display = 'none';
        window.renderMockChart();
    } else {
        alert(`余额不足，还差 ${(10 - window.state.cloudBalance).toFixed(2)} AED 解锁。请通过练习或点击左上角广告获取收益。`);
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
                    label: 'Insight',
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
// 🚀 基础导航与状态控制
// ==========================================
window.executeAuth = function() {
    window.playSfx('success');
    document.getElementById('auth-screen').classList.add('hidden-screen'); 
    document.getElementById('step-1').classList.remove('hidden-screen');
};

window.startPractice = function(lang) {
    window.playSfx('click');
    window.state.path = lang;
    document.getElementById('step-1').classList.add('hidden-screen');
    document.getElementById('loading-screen').classList.remove('hidden-screen');
    if (window.initWhisper) {
        window.initWhisper();
    } else {
        setTimeout(window.enterMainApp, 1500);
    }
};

window.enterMainApp = function() {
    document.getElementById('loading-screen').classList.add('hidden-screen');
    document.getElementById('main-app').classList.remove('hidden-screen');
    window.loadData();
    window.fetchNewPhrase();
    
    document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
    document.getElementById('ad-chances-display').innerText = window.state.adChances !== undefined ? window.state.adChances : 6;
};

window.fetchNewPhrase = function() {
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
