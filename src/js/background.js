/**
 * 倒计时 Chrome 扩展 - 后台 Service Worker (Manifest V3)
 * 
 * 功能：
 * 1. 处理扩展的后台任务
 * 2. 管理通知和提醒
 * 3. 处理存储和配置
 */

// ============================================
// 后台脚本主逻辑
// ============================================

/**
 * 扩展安装时的初始化
 */
chrome.runtime.onInstalled.addListener(() => {
  console.log('[安装] 倒计时扩展已安装');
  
  chrome.storage.local.get('config', (data) => {
    if (!data.config) {
      console.log('[安装] 设置默认配置');
      chrome.storage.local.set({ config: {
        workType: 'standard',
        customWorkDays: ['1', '2', '3', '4', '5'],
        onWorkTime: '09:00',
        offWorkTime: '18:00',
        payOffDay: 10,
        lunchReminderTime: '11:00',
        lunchReminderEnabled: true,
        dinnerReminderTime: '17:00',
        dinnerReminderEnabled: false,
        notificationsEnabled: true,
        onWorkNotifyEnabled: true,
        offWorkNotifyEnabled: true
      }});
    }
  });
  
  chrome.alarms.create('checkReminders', { periodInMinutes: 1 });
});

/**
 * 监听来自 popup 的消息
 */
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('收到消息:', request);
  
  switch (request.action) {
    case 'getConfig':
      chrome.storage.local.get('config', (data) => {
        sendResponse({ config: data.config || {} });
      });
      return true;
      
    case 'saveConfig':
      chrome.storage.local.set({ config: request.config }, () => {
        sendResponse({ success: true });
      });
      return true;
      
    case 'sendNotification':
      sendNotification(request.title, request.message);
      sendResponse({ success: true });
      return true;
      
    // 新增：popup 请求同步配置
    case 'syncConfig':
      chrome.storage.local.set({ config: request.config }, () => {
        console.log('[同步] 配置已从 popup 同步:', request.config);
        sendResponse({ success: true });
      });
      return true;
      
    default:
      sendResponse({ error: '未知操作' });
      return false;
  }
});

/**
 * 发送系统通知
 * @param {string} title - 通知标题
 * @param {string} message - 通知内容
 */
function sendNotification(title, message) {
  const iconUrl = chrome.runtime.getURL('images/icon128.png');
  console.log('[提醒] 准备发送通知:', title, message);
  
  chrome.notifications.create({
    type: 'basic',
    iconUrl: iconUrl,
    title: title,
    message: message,
    priority: 2,
    requireInteraction: true,  // 需要用户手动关闭，防止自动消失
    silent: false
  }, (notificationId) => {
    if (chrome.runtime.lastError) {
      console.error('[提醒] 通知创建失败:', chrome.runtime.lastError.message);
    } else {
      console.log('[提醒] 通知创建成功，ID:', notificationId);
      // 30秒后自动清除（给用户足够时间看到）
      setTimeout(() => { chrome.notifications.clear(notificationId); }, 30000);
    }
  });
}

/**
 * 监听通知点击事件
 */
chrome.notifications.onClicked.addListener((notificationId) => {
  console.log('通知被点击:', notificationId);
  // 点击通知后关闭
  chrome.notifications.clear(notificationId);
});

/**
 * 监听通知关闭事件
 */
chrome.notifications.onClosed.addListener((notificationId, byUser) => {
  console.log('通知关闭:', notificationId, '用户关闭:', byUser);
});

/**
 * 判断今天是否为工作日
 */
function isWorkDay(config) {
  const now = new Date();
  const day = String(now.getDay());
  
  // 确保 workDays 是数组（chrome.storage 可能将数组存为对象）
  const toArray = (v) => Array.isArray(v) ? v : (v && typeof v === 'object' ? Object.values(v) : ['1','2','3','4','5']);
  
  if (config.workType === 'alternating') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now - startOfYear) / (24 * 60 * 60 * 1000));
    const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return weekNum % 2 === 1 
      ? ['1', '2', '3', '4', '5', '6'].includes(day)
      : ['1', '2', '3', '4', '5'].includes(day);
  } else {
    const workDays = toArray(config.customWorkDays);
    return workDays.includes(day);
  }
}

/**
/**
 * 简化可靠的提醒机制
 * - alarm 每分钟触发，检查是否需要发送通知
 * - 如果距离提醒时间 ≤ 1 分钟，启动秒级检查确保精确触发
 */

// 存储秒级定时器
let secondTimer = null;

// 上班鼓励话术
const encourageMessages = [
  '新的一天开始啦，加油！💪',
  '早安！今天也要元气满满哦！☀️',
  '今天会是美好的一天，加油！🌟',
  '又是充满希望的一天，冲鸭！🚀',
  '今天也要努力鸭！你可以的！✨',
  '早起的鸟儿有虫吃，加油！🐦',
  '新的一天，新的开始，加油！🌅',
  '今天也要开心工作哦！😊',
  '早安！今天的目标是什么？🎯',
  '又是奋斗的一天，加油！💪'
];

// 获取当前时间字符串
const getCurrentTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

// 检查时间是否匹配
const isExactTime = (current, target) => {
  if (!current || !target) return false;
  return current === target;
};

// 检查距离目标时间还有多少秒
const getSecondsUntil = (target) => {
  if (!target) return -1;
  const now = new Date();
  const [tH, tM] = target.split(':').map(Number);
  const targetSeconds = tH * 3600 + tM * 60;
  const currentSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
  return targetSeconds - currentSeconds;
};

// 核心检查函数
function checkReminders() {
  console.log('[提醒] ==================== 开始检查 ====================');
  chrome.storage.local.get(['config', 'remindedMeals'], (data) => {
    const config = data.config || {};
    const remindedMeals = data.remindedMeals || {};
    const now = new Date();
    const currentTime = getCurrentTime();
    const today = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    
    if (!remindedMeals[today]) remindedMeals[today] = {};
    
    // 检查是否为工作日
    if (!isWorkDay(config)) {
      console.log('[提醒] 今天不是工作日，跳过');
      return;
    }
    
    console.log(`[提醒] 当前时间: ${currentTime}, 配置:`, JSON.stringify({
      lunch: config.lunchReminderTime,
      lunchOn: config.lunchReminderEnabled,
      dinner: config.dinnerReminderTime,
      dinnerOn: config.dinnerReminderEnabled
    }));
    
    let changed = false;
    
    // 获取随机鼓励话术
    const getRandomEncourage = () => encourageMessages[Math.floor(Math.random() * encourageMessages.length)];
    
    // 检查所有提醒类型
    const reminders = [
      { type: 'lunch', enabled: config.lunchReminderEnabled, time: config.lunchReminderTime, title: '午餐提醒', message: '该点午餐啦！别饿着肚子工作哦~' },
      { type: 'dinner', enabled: config.dinnerReminderEnabled, time: config.dinnerReminderTime, title: '晚餐提醒', message: '该点晚餐啦！加班也要好好吃饭~' },
      { type: 'onWork', enabled: config.onWorkNotifyEnabled !== false, time: config.onWorkTime, title: '上班提醒', message: getRandomEncourage() },
      { type: 'offWork', enabled: config.offWorkNotifyEnabled !== false, time: config.offWorkTime, title: '下班提醒', message: '到点啦！准备收拾东西回家吧！' }
    ];
    
    for (const r of reminders) {
      if (r.enabled && isExactTime(currentTime, r.time) && !remindedMeals[today][r.type]) {
        console.log(`[提醒] ✅ 触发${r.title}`);
        sendNotification(r.title, r.message);
        remindedMeals[today][r.type] = true;
        changed = true;
      }
    }
    
    // 保存提醒记录
    if (changed) {
      const keys = Object.keys(remindedMeals);
      if (keys.length > 7) keys.slice(0, keys.length - 7).forEach(key => delete remindedMeals[key]);
      chrome.storage.local.set({ remindedMeals });
      console.log('[提醒] 已保存提醒记录');
    }
    
    // 检查是否有未触发的提醒需要秒级检查
    let hasPendingReminder = false;
    
    for (const r of reminders) {
      if (r.enabled && !remindedMeals[today][r.type]) {
        const secondsUntil = getSecondsUntil(r.time);
        console.log(`[提醒] 距离 ${r.time} 还有 ${secondsUntil} 秒, 已触发: ${remindedMeals[today][r.type] || false}`);
        
        if (secondsUntil > 0 && secondsUntil <= 60) {
          console.log(`[提醒] 启动秒级检查，目标: ${r.time}`);
          startSecondCheck(r.time);
          return;
        }
        
        if (secondsUntil > 60) {
          hasPendingReminder = true;
        }
      }
    }
    
    if (hasPendingReminder) {
      console.log('[提醒] 当前小时内有未触发的提醒，等待 alarm');
    } else {
      console.log('[提醒] 当前小时内所有提醒已触发或已过时，等待下小时');
    }
    
    console.log('[提醒] ==================== 检查结束 ====================');
  });
}

// 秒级检查（精确触发）
function startSecondCheck(targetTime) {
  if (secondTimer) {
    clearInterval(secondTimer);
    secondTimer = null;
  }
  
  // 先检查是否已经过了目标时间
  const secondsUntil = getSecondsUntil(targetTime);
  if (secondsUntil <= 0) {
    console.log(`[秒级检查] 目标时间 ${targetTime} 已过，不启动`);
    return;
  }
  
  console.log(`[秒级检查] 启动，目标: ${targetTime}，还有 ${secondsUntil} 秒`);
  
  secondTimer = setInterval(() => {
    const currentTime = getCurrentTime();
    const remain = getSecondsUntil(targetTime);
    
    // 到达目标时间，立即检查
    if (remain <= 0) {
      console.log(`[秒级检查] 到达目标时间，触发检查`);
      clearInterval(secondTimer);
      secondTimer = null;
      checkReminders();
      return;
    }
  }, 1000);
}

/**
 * 监听 alarm 事件 - 每分钟检查一次
 */
chrome.alarms.onAlarm.addListener((alarm) => {
  console.log('[alarm] 触发:', alarm.name);
  if (alarm.name === 'checkReminders') {
    checkReminders();
  }
});

/**
 * 处理浏览器图标点击事件（V3 使用 chrome.action）
 */
chrome.action.onClicked.addListener(() => {
  // 这个事件不会触发，因为我们设置了 default_popup
  // 但可以在这里添加其他逻辑
  console.log('扩展图标被点击');
});

/**
 * 监听配置变化 - 重置对应的已提醒标记
 */
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.config) {
    const oldConfig = changes.config.oldValue || {};
    const newConfig = changes.config.newValue || {};
    console.log('[配置变化] 检测到配置更新');
    
    // 检查哪些提醒时间变化了，重置对应的已提醒标记
    const today = (() => {
      const now = new Date();
      return `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
    })();
    
    chrome.storage.local.get('remindedMeals', (data) => {
      const remindedMeals = data.remindedMeals || {};
      if (!remindedMeals[today]) return;
      
      let changed = false;
      
      // 午餐提醒时间变化
      if (oldConfig.lunchReminderTime !== newConfig.lunchReminderTime) {
        console.log(`[配置变化] 午餐时间 ${oldConfig.lunchReminderTime} -> ${newConfig.lunchReminderTime}，重置标记`);
        delete remindedMeals[today].lunch;
        changed = true;
      }
      
      // 晚餐提醒时间变化
      if (oldConfig.dinnerReminderTime !== newConfig.dinnerReminderTime) {
        console.log(`[配置变化] 晚餐时间 ${oldConfig.dinnerReminderTime} -> ${newConfig.dinnerReminderTime}，重置标记`);
        delete remindedMeals[today].dinner;
        changed = true;
      }
      
      // 上班时间变化
      if (oldConfig.onWorkTime !== newConfig.onWorkTime) {
        console.log(`[配置变化] 上班时间 ${oldConfig.onWorkTime} -> ${newConfig.onWorkTime}，重置标记`);
        delete remindedMeals[today].onWork;
        changed = true;
      }
      
      // 下班时间变化
      if (oldConfig.offWorkTime !== newConfig.offWorkTime) {
        console.log(`[配置变化] 下班时间 ${oldConfig.offWorkTime} -> ${newConfig.offWorkTime}，重置标记`);
        delete remindedMeals[today].offWork;
        changed = true;
      }
      
      if (changed) {
        chrome.storage.local.set({ remindedMeals });
        console.log('[配置变化] 已重置提醒标记，重新检查');
        checkReminders();
      }
    });
  }
});

/**
 * 扩展启动时的初始化
 */
chrome.runtime.onStartup.addListener(() => {
  console.log('[启动] 浏览器启动');
  chrome.alarms.create('checkReminders', { periodInMinutes: 1 });
  
  // 检查配置
  chrome.storage.local.get('config', (data) => {
    if (!data.config) {
      console.log('[启动] 配置不存在，设置默认配置');
      chrome.storage.local.set({ config: {
        workType: 'standard',
        customWorkDays: ['1', '2', '3', '4', '5'],
        onWorkTime: '09:00',
        offWorkTime: '18:00',
        payOffDay: 10,
        lunchReminderTime: '11:00',
        lunchReminderEnabled: true,
        dinnerReminderTime: '17:00',
        dinnerReminderEnabled: false,
        notificationsEnabled: true,
        onWorkNotifyEnabled: true,
        offWorkNotifyEnabled: true
      }});
    }
  });
  
  // 立即检查一次
  checkReminders();
});
