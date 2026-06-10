/**
 * =====================================
 * 首页内容动态渲染系统
 * =====================================
 * 根据当前语言动态更新页面所有文本
 */

function renderPageContent() {
  const { t } = window.i18n;
  
  // ── 导航栏 ──
  updateNavigation();
  
  // ── Hero 区域 ──
  updateHeroSection();
  
  // ── 新闻区域 ──
  updateNewsSection();
  
  // ── 工具排行区域 ──
  updateToolsSection();
  
  // ── Vibe Coding 区域 ──
  updateVibeSection();
  
  // ── 项目展示区域 ──
  updateProjectsSection();
  
  // ── 分享区域 ──
  updateShareSection();
}

function updateNavigation() {
  const { t } = window.i18n;
  
  // 更新导航链接（如果存在）
  const navLinks = document.querySelectorAll('.nav-links a');
  if (navLinks.length > 0) {
    navLinks[0].textContent = t('nav.home');
    navLinks[1].textContent = t('nav.news');
    navLinks[2].textContent = t('nav.tools');
    navLinks[3].textContent = t('nav.vibe');
    navLinks[4].textContent = t('nav.projects');
  }
  
  // 更新"立即加入"按钮
  const joinBtn = document.querySelector('.nav-actions .btn-primary');
  if (joinBtn) {
    joinBtn.textContent = t('nav.join');
  }
}

function updateHeroSection() {
  const { t } = window.i18n;
  
  // Hero Badge
  const heroBadge = document.querySelector('.hero-badge');
  if (heroBadge) {
    heroBadge.innerHTML = `<div class="badge-dot"></div>${t('hero.badge')}`;
  }
  
  // Hero Title
  const heroTitle = document.querySelector('.hero h1');
  if (heroTitle) {
    heroTitle.innerHTML = `
      <span class="line1">${t('hero.title_line1')}</span>
      <span class="line2">${t('hero.title_line2')}</span>
    `;
  }
  
  // Hero Subtitle
  const heroSub = document.querySelector('.hero-sub');
  if (heroSub) {
    heroSub.textContent = t('hero.subtitle');
  }
  
  // Hero CTAs
  const heroCtas = document.querySelectorAll('.hero-ctas button');
  if (heroCtas.length >= 2) {
    heroCtas[0].textContent = t('hero.cta_primary');
    heroCtas[1].textContent = t('hero.cta_secondary');
  }
  
  // Hero Stats
  const statLabels = document.querySelectorAll('.stat-label');
  if (statLabels.length >= 4) {
    statLabels[0].textContent = t('hero.stat_users');
    statLabels[1].textContent = t('hero.stat_projects');
    statLabels[2].textContent = t('hero.stat_tools');
    statLabels[3].textContent = t('hero.stat_update');
  }
}

function updateNewsSection() {
  const { t } = window.i18n;
  
  // Section Header
  const newsTag = document.querySelector('#news .section-tag');
  if (newsTag) {
    newsTag.textContent = t('news.section_tag');
  }
  
  const newsTitle = document.querySelector('#news .section-title');
  if (newsTitle) {
    newsTitle.innerHTML = `${t('news.section_title').split(' ')[0]} <span>${t('news.section_title').split(' ').slice(1).join(' ')}</span>`;
  }
}

function updateToolsSection() {
  const { t } = window.i18n;
  
  // Section Header
  const toolsTag = document.querySelector('#tools .section-tag');
  if (toolsTag) {
    toolsTag.textContent = t('tools.section_tag');
  }
  
  const toolsTitle = document.querySelector('#tools .section-title');
  if (toolsTitle) {
    const titleText = t('tools.section_title');
    const parts = titleText.split(' ');
    toolsTitle.innerHTML = `${parts.slice(0, -2).join(' ')} <span>${parts.slice(-2).join(' ')}</span>`;
  }
  
  // Tabs
  const tabs = document.querySelectorAll('.tools-tabs .tab-btn');
  if (tabs.length >= 6) {
    tabs[0].textContent = t('tools.tab_all');
    tabs[1].textContent = t('tools.tab_vibe');
    tabs[2].textContent = t('tools.tab_design');
    tabs[3].textContent = t('tools.tab_writing');
    tabs[4].textContent = t('tools.tab_dev');
    tabs[5].textContent = t('tools.tab_chat');
  }
  
  // Tool Cards
  const toolNames = ['cursor', 'v0', 'chatgpt', 'claude', 'bolt', 'midjourney', 'lovable', 'copilot', 'notion', 'gamma', 'dalle', 'replit'];
  const toolCards = document.querySelectorAll('.tool-card');
  
  toolCards.forEach((card, index) => {
    if (index < toolNames.length) {
      const toolKey = toolNames[index];
      const nameEl = card.querySelector('.tool-name');
      const descEl = card.querySelector('.tool-desc');
      
      if (nameEl) nameEl.textContent = t(`tools.tools_list.${toolKey}.name`);
      if (descEl) descEl.textContent = t(`tools.tools_list.${toolKey}.desc`);
    }
  });
}

function updateVibeSection() {
  const { t } = window.i18n;
  
  // Section Header
  const vibeTag = document.querySelector('#vibe .section-tag');
  if (vibeTag) {
    vibeTag.textContent = t('vibe.section_tag');
  }
  
  const vibeTitle = document.querySelector('#vibe .section-title');
  if (vibeTitle) {
    const titleText = t('vibe.section_title');
    const parts = titleText.split(' ');
    vibeTitle.innerHTML = `${parts.slice(0, -2).join(' ')} <span>${parts.slice(-2).join(' ')}</span>`;
  }
  
  const vibeIntro = document.querySelector('.vibe-intro');
  if (vibeIntro) {
    vibeIntro.textContent = t('vibe.intro');
  }
  
  // Vibe Cards
  const vibeCards = document.querySelectorAll('.vibe-card');
  const cardKeys = ['website', 'chatbot', 'design', 'data'];
  
  vibeCards.forEach((card, index) => {
    if (index < cardKeys.length) {
      const cardKey = cardKeys[index];
      
      const nameEl = card.querySelector('.vibe-name');
      const descEl = card.querySelector('.vibe-desc');
      const steps = card.querySelectorAll('.step-text');
      
      if (nameEl) nameEl.textContent = t(`vibe.cards.${cardKey}.name`);
      if (descEl) descEl.textContent = t(`vibe.cards.${cardKey}.desc`);
      
      if (steps.length >= 3) {
        steps[0].innerHTML = `<strong>${t(`vibe.cards.${cardKey}.step1`).split('——')[0]}</strong>——${t(`vibe.cards.${cardKey}.step1`).split('——')[1]}`;
        steps[1].innerHTML = `<strong>${t(`vibe.cards.${cardKey}.step2`).split('——')[0]}</strong>——${t(`vibe.cards.${cardKey}.step2`).split('——')[1]}`;
        steps[2].innerHTML = `<strong>${t(`vibe.cards.${cardKey}.step3`).split('——')[0]}</strong>——${t(`vibe.cards.${cardKey}.step3`).split('——')[1]}`;
      }
    }
  });
}

function updateProjectsSection() {
  const { t } = window.i18n;
  
  // Section Header
  const projectsTag = document.querySelector('#projects .section-tag');
  if (projectsTag) {
    projectsTag.textContent = t('projects.section_tag');
  }
  
  const projectsTitle = document.querySelector('#projects .section-title');
  if (projectsTitle) {
    const titleText = t('projects.section_title');
    const parts = titleText.split(' ');
    projectsTitle.innerHTML = `${parts[0]} <span>${parts.slice(1).join(' ')}</span>`;
  }
  
  const uploadBtn = document.querySelector('#projects .btn-primary');
  if (uploadBtn) {
    uploadBtn.textContent = t('projects.upload_btn');
  }
  
  // Project Cards
  const rankBadges = document.querySelectorAll('.project-rank-badge');
  rankBadges.forEach((badge) => {
    const rankNum = badge.textContent.match(/#\d+/)[0];
    badge.textContent = `${t('projects.rank_badge')} ${rankNum}`;
  });
  
  const projectTags = document.querySelectorAll('.project-tags .ptag');
  projectTags.forEach((tag) => {
    tag.textContent = t('projects.personal_project');
  });
}

function updateShareSection() {
  const { t } = window.i18n;
  
  const shareSection = document.querySelector('.share-section');
  if (!shareSection) return;
  
  const titleEl = shareSection.querySelector('h2');
  if (titleEl) {
    titleEl.innerHTML = `${t('share.title').split('永久免费订阅')[0] || t('share.title').split('永久免費訂閱')[0] || t('share.title').split('Lifetime Free Subscription')[0] || t('share.title').split('Langganan Percuma Seumur Hidup')[0]}<span class="text-gradient">${t('share.title').includes('永久免费订阅') ? '永久免费订阅' : t('share.title').includes('永久免費訂閱') ? '永久免費訂閱' : t('share.title').includes('Lifetime Free Subscription') ? 'Lifetime Free Subscription' : 'Langganan Percuma Seumur Hidup'}</span>`;
  }
  
  const subtitleEl = shareSection.querySelector('p');
  if (subtitleEl) {
    subtitleEl.textContent = t('share.subtitle');
  }
  
  const benefits = shareSection.querySelectorAll('.benefit');
  if (benefits.length >= 3) {
    benefits[0].querySelector('.benefit-title').textContent = t('share.benefit1_title');
    benefits[0].querySelector('.benefit-desc').textContent = t('share.benefit1_desc');
    
    benefits[1].querySelector('.benefit-title').textContent = t('share.benefit2_title');
    benefits[1].querySelector('.benefit-desc').textContent = t('share.benefit2_desc');
    
    benefits[2].querySelector('.benefit-title').textContent = t('share.benefit3_title');
    benefits[2].querySelector('.benefit-desc').textContent = t('share.benefit3_desc');
  }
  
  const shareButtons = shareSection.querySelectorAll('.share-btn');
  if (shareButtons.length >= 3) {
    shareButtons[0].textContent = t('share.btn_whatsapp');
    shareButtons[1].textContent = t('share.btn_facebook');
    shareButtons[2].textContent = t('share.btn_copy');
  }
  
  const laterBtn = shareSection.querySelector('.later-btn');
  if (laterBtn) {
    laterBtn.textContent = t('share.btn_later');
  }
}

// 导出函数
window.renderPageContent = renderPageContent;
