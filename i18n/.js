/**
 * =====================================
 * 多语言管理系统 (i18n System) - 修复版
 * =====================================
 * 修复：语言切换后页面不更新的问题
 */

let translations = {};
let currentLanguage = 'zh-CN';
let translationsLoaded = false;

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
    // 加时间戳防止浏览器缓存旧文件
    const response = await fetch('/i18n/translations.json?v=' + Date.now());
    if (!response.ok) throw new Error('Failed to load translations');
    translations = await response.json();
    translationsLoaded = true;
    console.log('✅ 翻译文件加载成功');
  } catch (error) {
    console.error('❌ 翻译文件加载失败:', error);
    translations = {};
    translationsLoaded = false;
  }
}

/**
 * 检测用户语言
 */
function detectUserLanguage() {
  const saved = localStorage.getItem('selectedLanguage');
  if (saved && SUPPORTED_LANGUAGES[saved]) return saved;

  const urlParams = new URLSearchParams(window.location.search);
  const langParam = urlParams.get('lang');
  if (langParam && SUPPORTED_LANGUAGES[langParam]) return langParam;

  const browserLang = navigator.language || navigator.userLanguage;
  if (SUPPORTED_LANGUAGES[browserLang]) return browserLang;

  const langPrefix = browserLang.substring(0, 2);
  if (langPrefix === 'zh') {
    if (browserLang.includes('TW') || browserLang.includes('HK') || browserLang.includes('Hant')) return 'zh-TW';
    return 'zh-CN';
  }
  if (langPrefix === 'ms') return 'ms';
  if (langPrefix === 'en') return 'en';

  return 'zh-CN';
}

/**
 * 翻译函数
 */
function t(key, params = {}) {
  if (!translationsLoaded) return key;
  
  const keys = key.split('.');
  let value = translations[currentLanguage] || translations['zh-CN'] || {};

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) return key;
  }

  if (typeof value === 'string') {
    Object.keys(params).forEach(k => {
      value = value.replace(`{${k}}`, params[k]);
    });
  }

  return value || key;
}

/**
 * 设置语言 —— 不再 reload，直接重渲染
 */
function setLanguage(lang) {
  if (!SUPPORTED_LANGUAGES[lang]) return;

  currentLanguage = lang;
  localStorage.setItem('selectedLanguage', lang);
  document.documentElement.lang = lang;

  // 更新导航栏语言按钮
  const langBtn = document.getElementById('language-dropdown-btn');
  if (langBtn) {
    langBtn.innerHTML = `${LANGUAGE_FLAGS[lang]} ${lang}`;
  }

  // 触发事件通知其他模块
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

/**
 * 初始化
 */
async function initializeI18n() {
  await loadTranslations();               // 1. 先加载翻译
  const lang = detectUserLanguage();
  currentLanguage = lang;
  document.documentElement.lang = lang;
  localStorage.setItem('selectedLanguage', lang);

  // 2. 翻译加载完才渲染页面
  if (typeof window.renderPageContent === 'function') {
    window.renderPageContent();
  }

  // 3. 首次访问显示语言选择弹窗
  const hasVisited = localStorage.getItem('hasSelectedLanguage');
  if (!hasVisited) {
    showLanguageSelector();
    localStorage.setItem('hasSelectedLanguage', 'true');
  }
}

/**
 * 语言选择首屏弹窗
 */
function showLanguageSelector() {
  const existing = document.getElementById('language-selector-modal');
  if (existing) existing.remove();

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
          <button class="language-option${currentLanguage === 'zh-CN' ? ' active' : ''}" data-lang="zh-CN">
            <span class="lang-flag">🇨🇳</span>
            <span class="lang-name">中文（简体）</span>
          </button>
          <button class="language-option${currentLanguage === 'zh-TW' ? ' active' : ''}" data-lang="zh-TW">
            <span class="lang-flag">🇹🇼</span>
            <span class="lang-name">中文（繁體）</span>
          </button>
          <button class="language-option${currentLanguage === 'en' ? ' active' : ''}" data-lang="en">
            <span class="lang-flag">🇬🇧</span>
            <span class="lang-name">English</span>
          </button>
          <button class="language-option${currentLanguage === 'ms' ? ' active' : ''}" data-lang="ms">
            <span class="lang-flag">🇲🇾</span>
            <span class="lang-name">Bahasa Melayu</span>
          </button>
        </div>
        <p class="language-selector-hint">You can change language anytime in the top-right corner</p>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 点击选择语言
  modal.querySelectorAll('.language-option').forEach(btn => {
    btn.addEventListener('click', function () {
      setLanguage(this.dataset.lang);
      modal.classList.add('closing');
      setTimeout(() => modal.remove(), 300);
      // 不再 reload！setLanguage 里已经触发 languageChanged 事件
    });
  });

  setTimeout(() => modal.classList.add('show'), 50);
}

/**
 * 导航栏语言下拉按钮
 */
function createLanguageButton() {
  const button = document.createElement('button');
  button.className = 'lang-btn';
  button.id = 'language-dropdown-btn';
  button.innerHTML = `${LANGUAGE_FLAGS[currentLanguage]} ${currentLanguage}`;

  button.addEventListener('click', function (e) {
    e.stopPropagation();
    showLanguageDropdown(this);
  });

  return button;
}

/**
 * 语言下拉菜单
 */
function showLanguageDropdown(triggerBtn) {
  const existing = document.querySelector('.language-dropdown-menu');
  if (existing) { existing.remove(); return; }

  const dropdown = document.createElement('div');
  dropdown.className = 'language-dropdown-menu';
  dropdown.innerHTML = Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => `
    <button class="language-dropdown-item${code === currentLanguage ? ' active' : ''}" data-lang="${code}">
      <span class="lang-flag">${LANGUAGE_FLAGS[code]}</span>
      <span>${name}</span>
      ${code === currentLanguage ? '<span class="check-mark">✓</span>' : ''}
    </button>
  `).join('');

  document.body.appendChild(dropdown);

  const rect = triggerBtn.getBoundingClientRect();
  dropdown.style.top = (rect.bottom + 8) + 'px';
  dropdown.style.right = (window.innerWidth - rect.right) + 'px';

  dropdown.querySelectorAll('.language-dropdown-item').forEach(item => {
    item.addEventListener('click', function () {
      setLanguage(this.dataset.lang);
      dropdown.remove();
    });
  });

  setTimeout(() => {
    document.addEventListener('click', function close(e) {
      if (!dropdown.contains(e.target) && e.target !== triggerBtn) {
        dropdown.remove();
        document.removeEventListener('click', close);
      }
    });
  }, 0);

  dropdown.classList.add('show');
}

// 监听语言变更 → 重新渲染
window.addEventListener('languageChanged', function (e) {
  console.log(`✅ 语言切换到: ${e.detail.language}`);
  if (typeof window.renderPageContent === 'function') {
    window.renderPageContent();
  }
});

// 导出
window.i18n = {
  t,
  setLanguage,
  initializeI18n,
  showLanguageSelector,
  currentLanguage: () => currentLanguage,
  SUPPORTED_LANGUAGES,
  LANGUAGE_FLAGS
};
