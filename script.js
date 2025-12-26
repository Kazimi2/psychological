// Supabase配置
const SUPABASE_URL = 'https://dtqytwjwwvbaucpvnpjl.supabase.co';
const SUPABASE_KEY = 'sb_publishable_t5HvE7KDW3MA7pzf_HZkLA_N4-WoOV_';

// 数据库表名
const TABLE_NAME = 'messages';

// 全局变量
let messages = [];
let remainingPosts = 2;

// DOM元素
const messageForm = document.getElementById('messageForm');
const nicknameInput = document.getElementById('nickname');
const contentInput = document.getElementById('content');
const moodSelect = document.getElementById('mood');
const submitBtn = document.getElementById('submitBtn');
const remainingCount = document.getElementById('remainingCount');
const charCount = document.getElementById('charCount');
const messagesContainer = document.getElementById('messagesContainer');
const emptyState = document.getElementById('emptyState');
const refreshBtn = document.getElementById('refreshBtn');
const formMessage = document.getElementById('formMessage');
const successModal = document.getElementById('successModal');
const closeModalBtn = document.getElementById('closeModalBtn');

// 初始化函数
function init() {
    // 检查今日留言次数
    checkDailyQuota();
    
    // 加载留言
    loadMessages();
    
    // 设置事件监听器
    setupEventListeners();
    
    // 实时字符计数
    contentInput.addEventListener('input', updateCharCount);
}

// 检查每日配额
function checkDailyQuota() {
    const today = new Date().toDateString();
    const storageKey = 'treehole_daily_posts';
    
    // 从localStorage获取数据
    const dailyData = JSON.parse(localStorage.getItem(storageKey)) || { date: today, count: 0 };
    
    // 如果是新的一天，重置计数
    if (dailyData.date !== today) {
        dailyData.date = today;
        dailyData.count = 0;
        localStorage.setItem(storageKey, JSON.stringify(dailyData));
    }
    
    remainingPosts = Math.max(0, 2 - dailyData.count);
    updateQuotaDisplay();
    
    // 如果达到限制，禁用提交按钮
    if (remainingPosts <= 0) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-ban"></i> 今日已达上限';
    }
}

// 更新配额显示
function updateQuotaDisplay() {
    remainingCount.textContent = remainingPosts;
    remainingCount.style.color = remainingPosts > 0 ? '#36b37e' : '#ef476f';
}

// 更新字符计数
function updateCharCount() {
    const length = contentInput.value.length;
    charCount.textContent = length;
    
    // 根据长度改变颜色
    if (length > 450) {
        charCount.style.color = '#ef476f';
    } else if (length > 400) {
        charCount.style.color = '#ffd166';
    } else {
        charCount.style.color = '#888';
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 表单提交
    messageForm.addEventListener('submit', handleSubmit);
    
    // 刷新按钮
    refreshBtn.addEventListener('click', loadMessages);
    
    // 关闭模态框
    closeModalBtn.addEventListener('click', () => {
        successModal.style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
        if (event.target === successModal) {
            successModal.style.display = 'none';
        }
    });
}

// 处理表单提交
async function handleSubmit(event) {
    event.preventDefault();
    
    // 验证表单
    if (!validateForm()) {
        return;
    }
    
    // 防止重复提交
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
    
    try {
        // 准备数据
        const messageData = {
            nickname: nicknameInput.value.trim() || '匿名',
            content: contentInput.value.trim(),
            mood: moodSelect.value,
            created_at: new Date().toISOString()
        };
        
        // 提交到Supabase
        const response = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(messageData)
        });
        
        if (!response.ok) {
            throw new Error(`提交失败: ${response.status}`);
        }
        
        // 更新本地配额
        updateLocalQuota();
        
        // 显示成功消息
        showSuccess();
        
        // 重置表单
        resetForm();
        
        // 重新加载留言
        setTimeout(loadMessages, 1000);
        
    } catch (error) {
        console.error('提交错误:', error);
        showFormMessage('提交失败，请稍后重试', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 发布留言';
    }
}

// 验证表单
function validateForm() {
    const content = contentInput.value.trim();
    
    if (!content) {
        showFormMessage('请输入留言内容', 'error');
        contentInput.focus();
        return false;
    }
    
    if (content.length < 5) {
        showFormMessage('留言内容太短了，至少5个字哦', 'error');
        contentInput.focus();
        return false;
    }
    
    return true;
}

// 更新本地配额
function updateLocalQuota() {
    const today = new Date().toDateString();
    const storageKey = 'treehole_daily_posts';
    
    const dailyData = JSON.parse(localStorage.getItem(storageKey)) || { date: today, count: 0 };
    
    // 确保是同一天
    if (dailyData.date === today) {
        dailyData.count += 1;
        localStorage.setItem(storageKey, JSON.stringify(dailyData));
        remainingPosts = Math.max(0, 2 - dailyData.count);
        updateQuotaDisplay();
        
        if (remainingPosts <= 0) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-ban"></i> 今日已达上限';
        }
    }
}

// 显示表单消息
function showFormMessage(message, type = 'info') {
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
    formMessage.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        formMessage.style.display = 'none';
    }, 3000);
}

// 显示成功模态框
function showSuccess() {
    successModal.style.display = 'flex';
}

// 重置表单
function resetForm() {
    contentInput.value = '';
    updateCharCount();
    submitBtn.disabled = remainingPosts <= 0;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> 发布留言';
}

// 加载留言
async function loadMessages() {
    try {
        // 显示加载状态
        messagesContainer.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-spinner fa-spin"></i>
                <p>正在加载树洞里的悄悄话...</p>
            </div>
        `;
        emptyState.style.display = 'none';
        
        // 从Supabase获取数据
        const response = await fetch(
            `${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&order=created_at.desc`,
            {
                headers: {
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`获取数据失败: ${response.status}`);
        }
        
        const data = await response.json();
        messages = data;
        
        // 显示留言
        displayMessages();
        
    } catch (error) {
        console.error('加载留言错误:', error);
        messagesContainer.innerHTML = `
            <div class="loading-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>加载失败，请刷新重试</p>
            </div>
        `;
    }
}

// 显示留言
function displayMessages() {
    if (!messages || messages.length === 0) {
        messagesContainer.innerHTML = '';
        emptyState.style.display = 'block';
        return;
    }
    
    // 随机选择10条留言
    const shuffled = [...messages].sort(() => Math.random() - 0.5);
    const selectedMessages = shuffled.slice(0, Math.min(10, shuffled.length));
    
    // 生成HTML
    const messagesHTML = selectedMessages.map(message => createMessageCard(message)).join('');
    messagesContainer.innerHTML = messagesHTML;
    emptyState.style.display = 'none';
}

// 创建留言卡片HTML
function createMessageCard(message) {
    // 格式化时间
    const date = new Date(message.created_at);
    const timeString = date.toLocaleString('zh-CN', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // 心情表情映射
    const moodEmojis = {
        '平静': '😌',
        '开心': '😊',
        '希望': '✨',
        '难过': '😔',
        '焦虑': '😰',
        '愤怒': '😠',
        '感恩': '🙏',
        '困惑': '🤔',
        '其他': '🌱'
    };
    
    const moodEmoji = moodEmojis[message.mood] || '🌱';
    
    return `
        <div class="message-card" data-mood="${message.mood}">
            <div class="message-header">
                <div class="message-nickname">
                    <i class="fas fa-user-circle"></i>
                    ${escapeHtml(message.nickname)}
                </div>
                <div class="message-mood">
                    ${moodEmoji} ${message.mood}
                </div>
            </div>
            <div class="message-content">
                ${escapeHtml(message.content).replace(/\n/g, '<br>')}
            </div>
            <div class="message-footer">
                <div class="message-time">
                    <i class="far fa-clock"></i>
                    ${timeString}
                </div>
            </div>
        </div>
    `;
}

// HTML转义函数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 添加一些初始数据提示
console.log('心灵树洞已加载');
console.log('Supabase URL:', SUPABASE_URL);
console.log('请确保在Supabase中创建了名为 "' + TABLE_NAME + '" 的表，包含以下字段：');
console.log('- id (uuid, 主键)');
console.log('- nickname (text)');
console.log('- content (text)');
console.log('- mood (text)');
console.log('- created_at (timestamp)');
