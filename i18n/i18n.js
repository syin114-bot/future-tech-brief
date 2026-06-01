/**
 * =====================================
 * 多语言管理系统 (i18n System)
 * =====================================
 * 支持语言: 中文简体 (zh-CN), 中文繁体 (zh-TW), 英文 (en), 马来文 (ms)
 * 存储: localStorage('selectedLanguage')
 */

let translations = {};
let currentLanguage = 'zh-CN';

// ── 语言配置 ──
const SUPPORTED_LANGUAGES = {
  'zh-CN': '中文（简体）',
  'zh-TW': '中文（繁體）',
  'en': 'English',
  'ms': 'Bahasa Melayu'
};

const LANGUAGE_FLAGS = {
  'zh-CN': '🇨🇳',
  'zh-TW': '🇹🇼',
  'en': '🇬🇧',
  'ms': '🇲🇾'
};

/**
 * 加载翻译文件
 */
async function loadTranslations() {
  try {
    const response = await fetch('/i18n/translations.json');
    if (!response.ok) throw new Error('Failed to load translations');
    translations = await response.json();
  } catch (error) {
    console.error('❌ 翻译文件加载失败:', error);
    // 使用空对象作为备选
    translations = {};
  }
}

/**
 * 从浏览器检测用户语言
 * 优先级: localStorage > 浏览器语言 > 默认语言
 */
function detectUserLanguage() {
  // 1. 检查 localStorage 中的选择
  const saved = localStorage.getItem('selectedLanguage');
  if (saved && SUPPORTED_LANGUAGES[saved]) {
    return saved;
  }

  // 2. 检查 URL 参数 (?lang=en)
  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang');
  if (langParam && SUPPORTED_LANGUAGES[langParam]) {
    return langParam;
  }

  // 3. 从浏览器语言检测
  const browserLang = navigator.language || navigator.userLanguage;
  
  // 精确匹配
  if (SUPPORTED_LANGUAGES[browserLang]) {
    return browserLang;
  }

  // 前缀匹配 (例: zh-Hans -> zh-CN)
  const langPrefix = browserLang.substring(0, 2);
  if (langPrefix === 'zh') {
    // 检查脚本类型来区分简体/繁体
    if (browserLang.includes('Hans') || browserLang.includes('SG') || browserLang.includes('CN')) {
      return 'zh-CN';
    } else if (browserLang.includes('Hant') || browserLang.includes('TW') || browserLang.includes('HK') || browserLang.includes('MO')) {
      return 'zh-TW';
    }
    return 'zh-CN'; // 默认简体
  }
  
  if (langPrefix === 'ms') return 'ms';
  if (langPrefix === 'en') return 'en';

  // 4. 默认语言
  return 'zh-CN';
}

/**
 * 翻译函数 - 获取翻译文本
 * 用法: t('nav.home') => "首页"
 *       t('auth.success_login', { nickname: 'Alice' }) => "✅ 欢迎回来，Alice！"
 */
function t(key, params = {}) {
  const keys = key.split('.');
  let value = translations[currentLanguage] || {};

  for (const k of keys) {
    value = value[k];
    if (value === undefined) {
      console.warn(`⚠️ 翻译键未找到: ${key} (${currentLanguage})`);
      return key; // 返回键名作为备选
    }
  }

  // 处理参数替换 (例: {nickname})
  if (typeof value === 'string') {
    Object.keys(params).forEach(key => {
      value = value.replace(`{${key}}`, params[key]);
    });
  }

  return value;
}

/**
 * 设置当前语言并保存到 localStorage
 */
function setLanguage(lang) {
  if (!SUPPORTED_LANGUAGES[lang]) {
    console.error(`❌ 不支持的语言: ${lang}`);
    return;
  }

  currentLanguage = lang;
  localStorage.setItem('selectedLanguage', lang);

  // 更新 HTML 的 lang 属性
  document.documentElement.lang = lang;

  // 触发语言变更事件
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

/**
 * 初始化多语言系统
 */
async function initializeI18n() {
  await loadTranslations();
  const detectedLang = detectUserLanguage();
  setLanguage(detectedLang);
  
  // 检查是否首次访问 - 显示语言选择弹窗
  const hasVisited = localStorage.getItem('hasSelectedLanguage');
  if (!hasVisited) {
    showLanguageSelector();
    localStorage.setItem('hasSelectedLanguage', 'true');
  }
}

/**
 * 显示语言选择弹窗（首屏）
 */
function showLanguageSelector() {
  // 创建弹窗 DOM
  const modal = document.createElement('div');
  modal.id = 'language-selector-modal';
  modal.className = 'language-selector-overlay';
  modal.innerHTML = `
    <div class="language-selector-modal">
      <div class="language-selector-content">
        <h1 class="language-selector-title">
          <span class="lang-text">选择语言 / Choose Language / Pilih Bahasa</span>
        </h1>
        <p class="language-selector-subtitle">Select your preferred language to continue</p>
        
        <div class="language-options">
          <button class="language-option" data-lang="zh-CN">
            <span class="lang-flag">🇨🇳</span>
            <span class="lang-name">中文（简体）</span>
          </button>
          <button class="language-option" data-lang="zh-TW">
            <span class="lang-flag">🇹🇼</span>
            <span class="lang-name">中文（繁體）</span>
          </button>
          <button class="language-option" data-lang="en">
            <span class="lang-flag">🇬🇧</span>
            <span class="lang-name">English</span>
          </button>
          <button class="language-option" data-lang="ms">
            <span class="lang-flag">🇲🇾</span>
            <span class="lang-name">Bahasa Melayu</span>
          </button>
        </div>

        <p class="language-selector-hint">You can change language anytime in the top-right corner</p>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 添加事件监听
  document.querySelectorAll('.language-option').forEach(btn => {
    btn.addEventListener('click', function() {
      const selectedLang = this.dataset.lang;
      setLanguage(selectedLang);
      
      // 关闭弹窗
      modal.classList.add('closing');
      setTimeout(() => {
        modal.remove();
        // 刷新页面以应用语言变化
        window.location.reload();
      }, 300);
    });
  });

  // 自动选择浏览器语言
  setTimeout(() => {
    modal.classList.add('show');
  }, 100);
}

/**
 * 创建语言选择按钮（导航栏）
 */
function createLanguageButton() {
  const button = document.createElement('button');
  button.className = 'lang-btn';
  button.id = 'language-dropdown-btn';
  button.innerHTML = `🌐 ${currentLanguage}`;
  
  button.addEventListener('click', function(e) {
    e.stopPropagation();
    showLanguageDropdown(this);
  });

  return button;
}

/**
 * 显示语言下拉菜单
 */
function showLanguageDropdown(triggerBtn) {
  // 移除已存在的下拉菜单
  const existingDropdown = document.querySelector('.language-dropdown-menu');
  if (existingDropdown) {
    existingDropdown.remove();
    return;
  }

  const dropdown = document.createElement('div');
  dropdown.className = 'language-dropdown-menu';
  
  const items = Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => {
    const isActive = code === currentLanguage ? ' active' : '';
    return `
      <button class="language-dropdown-item${isActive}" data-lang="${code}">
        <span class="lang-flag">${LANGUAGE_FLAGS[code]}</span>
        <span>${name}</span>
        ${isActive ? '<span class="check-mark">✓</span>' : ''}
      </button>
    `;
  }).join('');

  dropdown.innerHTML = items;
  
  // 添加到页面
  document.body.appendChild(dropdown);

  // 定位下拉菜单
  const rect = triggerBtn.getBoundingClientRect();
  dropdown.style.top = (rect.bottom + 8) + 'px';
  dropdown.style.right = (window.innerWidth - rect.right) + 'px';

  // 添加事件监听
  document.querySelectorAll('.language-dropdown-item').forEach(item => {
    item.addEventListener('click', function() {
      const selectedLang = this.dataset.lang;
      setLanguage(selectedLang);
      dropdown.remove();
      
      // 更新按钮文本
      document.getElementById('language-dropdown-btn').textContent = `🌐 ${selectedLang}`;
      
      // 重新渲染页面内容
      renderPageContent();
    });
  });

  // 点击外部关闭
  setTimeout(() => {
    document.addEventListener('click', function closeDropdown(e) {
      if (!dropdown.contains(e.target) && e.target !== triggerBtn) {
        dropdown.remove();
        document.removeEventListener('click', closeDropdown);
      }
    });
  }, 0);

  dropdown.classList.add('show');
}

/**
 * 监听语言变更事件并重新渲染页面
 */
window.addEventListener('languageChanged', function(e) {
  console.log(`✅ 语言已切换到: ${e.detail.language}`);
  renderPageContent();
});

/**
 * 导出函数供 HTML 使用
 */
window.i18n = {
  t,
  setLanguage,
  initializeI18n,
  showLanguageSelector,
  currentLanguage: () => currentLanguage,
  SUPPORTED_LANGUAGES,
  LANGUAGE_FLAGS
};
