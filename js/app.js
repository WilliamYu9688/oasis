// 全局状态还原
window.state = { path: 'en', cloudBalance: 0.00, adChances: 6, missedWords: {}, scores: {}, adBoostMap: {}, earnedMap: {} };
window.appState = 'READY';

window.saveData = () => localStorage.setItem('oasis_v2_state', JSON.stringify(window.state));
window.loadData = () => {
    const s = localStorage.getItem('oasis_v2_state');
    if(s) window.state = {...window.state, ...JSON.parse(s)};
};

// 10 AED 解锁逻辑
window.unlockLUM = function() {
    window.playSfx('click');
    if (window.state.cloudBalance >= 10) {  
        window.state.cloudBalance -= 10;
        document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
        window.saveData();
        document.getElementById('lum-lock-overlay').style.display = 'none';
        window.renderMockChart();
    } else {
        alert(`Insufficient Balance: Need ${(10 - window.state.cloudBalance).toFixed(2)} AED more.`);
    }
};

// 0.5 AED 广告逻辑
window.triggerAd = function() {
    window.playSfx('click');
    if (window.state.adChances <= 0) return alert("No more boosts today.");
    
    document.getElementById('web-ad-overlay').style.display = 'flex';
    document.getElementById('close-ad-btn').onclick = () => {
        window.state.adChances -= 1;
        window.state.cloudBalance += 0.5;
        document.getElementById('total-earned').innerText = window.state.cloudBalance.toFixed(2);
        document.getElementById('ad-chances-display').innerText = window.state.adChances;
        document.getElementById('web-ad-overlay').style.display = 'none';
        window.saveData();
        window.playSfx('success');
    };
};

window.closeLUM = () => { 
    window.playSfx('click');
    document.getElementById('lum-screen').classList.add('hidden-screen'); 
};
window.toggleLUM = () => { 
    window.playSfx('click');
    document.getElementById('lum-screen').classList.remove('hidden-screen'); 
};

// 登录成功直接进入
window.executeAuth = () => {
    window.playSfx('success');
    document.getElementById('auth-screen').classList.add('hidden-screen');
    document.getElementById('step-1').classList.remove('hidden-screen');
};

// 后续基础流程 (fetchNewPhrase, startPractice 等) 请保持之前模块化拆分时的逻辑即可
