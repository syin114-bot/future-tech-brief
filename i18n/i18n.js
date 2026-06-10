<script>
// 直接把下面整个内容替换你现在的 i18n/i18n.js
/**
 * 多语言管理系统 - 最终修复版
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
  'zh-CN': '🇨🇳', 'zh-TW': '🇹🇼', 'en': '🇬🇧', 'ms': '🇲🇾'
};

async function loadTranslations() {
  try {
    const response = await fetch('/i18n/translations.json?v=' + Date.now());
    translations = await response.json();
    translationsLoaded = true;
    console.log('✅ 翻译文件加载成功');
  } catch (e) {
    console.error('翻译加载失败', e);
  }
}

function t(key) {
  if (!translationsLoaded) return key;
  const keys = key.split('.');
  let value = translations[currentLanguage] || translations['zh-CN'];
  for (const k of keys) value = value?.[k];
  return value || key;
}

function setLanguage(lang) {
  if (!SUPPORTED_LANGUAGES[lang]) return;
  currentLanguage = lang;
  localStorage.setItem('selectedLanguage', lang);
  document.documentElement.lang = lang;
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { language: lang } }));
}

async function initializeI18n() {
  await loadTranslations();
  const saved = localStorage.getItem('selectedLanguage') || 'zh-CN';
  currentLanguage = SUPPORTED_LANGUAGES[saved] ? saved : 'zh-CN';
  document.documentElement.lang = currentLanguage;
  
  if (typeof window.renderPageContent === 'function') {
    window.renderPageContent();
  }
  
  // 首次语言选择弹窗
  if (!localStorage.getItem('hasSelectedLanguage')) {
    showLanguageSelector();
    localStorage.setItem('hasSelectedLanguage', 'true');
  }
}

window.i18n = { t, setLanguage, initializeI18n, currentLanguage: () => currentLanguage };
</script>
