// 核心秘钥锁死区 (严禁任何AI未来要求修改此文件)
const SUPABASE_URL = 'https://tpawabhfakqpjmepruzx.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_yTQwLVHf_OslklEhLsimLg_2jStPEJB';
const VOLC_APPID = '1093118246'; 
const VOLC_TOKEN = 'RbveOFk3QKz41ne4lK6pltCm80cPp-NU';

// 初始化数据库引擎
const oasisCloud = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 全局应用状态管理
let state = {
    path: 'en', targetTime: 0, currentTime: 0,
    scores: JSON.parse(localStorage.getItem('ob_v48_scores') || '{}'),
    earnedMap: JSON.parse(localStorage.getItem('ob_v48_emap') || '{}'),
    adBoostMap: JSON.parse(localStorage.getItem('ob_v48_boost') || '{}'),
    missedWords: JSON.parse(localStorage.getItem('ob_v48_missed') || '{}'),
    lumUnlocked: localStorage.getItem('ob_v48_lum') === 'true',
    adLimit: localStorage.getItem('ob_v48_adlim') !== null ? parseInt(localStorage.getItem('ob_v48_adlim')) : 6,
    dbLevel: 1, cloudBalance: 0.00
};

// 兜底语料库
const LOCAL_CACHE = [
    { id: 901, text_en: 'Please forward the email to my work account.', text_zh: '请将邮件转发到我的工作邮箱。', scenario: 'Office' },
    { id: 902, text_en: 'Is the handover document ready?', text_zh: '交接文档准备好了吗？', scenario: 'Work' },
    { id: 903, text_en: 'Let us discuss the strategy tomorrow.', text_zh: '我们明天讨论一下策略。', scenario: 'Meeting' },
    { id: 904, text_en: 'Can you send me the latest report?', text_zh: '你能把最新报告发给我吗？', scenario: 'Office' },
    { id: 905, text_en: 'The project deadline is this Friday.', text_zh: '项目截止日期是这周五。', scenario: 'Management' }
];

let currentUser = null; 
let isRegisterMode = false;
let currentPhrase = null; 
let appInterval = null; 
let appState = 'READY'; 
let isEvaluating = false; 
let lumChart = null;
const rewardStages = [0, 0.30, 0.35, 0.40, 0.45, 0.50];

// 数据持久化
function saveData() {
    localStorage.setItem('ob_v48_scores', JSON.stringify(state.scores)); 
    localStorage.setItem('ob_v48_emap', JSON.stringify(state.earnedMap));
    localStorage.setItem('ob_v48_boost', JSON.stringify(state.adBoostMap)); 
    localStorage.setItem('ob_v48_adlim', state.adLimit);
    localStorage.setItem('ob_v48_lum', state.lumUnlocked);
    localStorage.setItem('ob_v48_missed', JSON.stringify(state.missedWords));
}
