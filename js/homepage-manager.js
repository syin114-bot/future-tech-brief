/**
 * =====================================
 * 首页组件管理器
 * 管理所有首页模块的渲染和交互
 * =====================================
 */

class HomepageManager {
  constructor() {
    this.rankingEngine = window.projectRankingEngine;
    this.i18nEngine = window.i18nDataEngine;
    this.newsCache = null;
    this.toolsData = this.getStaticToolsData();
    this.projectsData = this.getStaticProjectsData();
  }

  /**
   * 初始化首页
   */
  async initialize() {
    await this.loadNews();
    this.renderHero();
    this.renderNews();
    this.renderTools();
    this.renderProjects();
  }

  /**
   * ============ Hero 区域 ============
   */
  renderHero() {
    const heroSection = document.getElementById('hero');
    if (!heroSection) return;

    const heroHTML = `
      <div class="hero-glow glow-blue"></div>
      <div class="hero-glow glow-purple"></div>
      <div class="hero-glow glow-green"></div>
      
      <div class="hero-badge">
        <div class="badge-dot"></div>
        <span data-i18n-key="hero.badge">2026 · 最新 AI 资讯实时更新</span>
      </div>
      
      <h1>
        <span class="line1" data-i18n-key="hero.title1">用 No-Code AI</span>
        <span class="line2" data-i18n-key="hero.title2">改变世界</span>
      </h1>
      
      <p class="hero-sub" data-i18n-key="hero.subtitle">
        展示你的 AI 创意，发现最新工具，加入马来西亚最活跃的 AI 学生社区
      </p>
      
      <div class="hero-ctas">
        <button class="btn-primary btn-lg" onclick="openModal('auth')" data-i18n-key="hero.btn_join">
          🚀 立即加入
        </button>
        <button class="btn-outline btn-lg" onclick="scrollToProjects()" data-i18n-key="hero.btn_browse">
          浏览项目
        </button>
      </div>
      
      <div class="hero-stats">
        <div class="stat"><div class="stat-num">2,400+</div><div class="stat-label" data-i18n-key="hero.stat_users">注册用户</div></div>
        <div class="stat"><div class="stat-num">840+</div><div class="stat-label" data-i18n-key="hero.stat_projects">AI 项目</div></div>
        <div class="stat"><div class="stat-num">60+</div><div class="stat-label" data-i18n-key="hero.stat_tools">AI 工具收录</div></div>
        <div class="stat"><div class="stat-num">GMT+8</div><div class="stat-label" data-i18n-key="hero.stat_time">每日 9:00 更新</div></div>
      </div>
    `;

    heroSection.innerHTML = heroHTML;
  }

  /**
   * ============ 新闻组件 ============
   */
  async loadNews() {
    try {
      const response = await fetch('https://futuretech-newsletter.vercel.app/news.json');
      if (!response.ok) throw new Error('News load failed');
      
      const data = await response.json();
      this.newsCache = data.articles || [];
    } catch (error) {
      console.error('Failed to load news:', error);
      this.newsCache = [];
    }
  }

  renderNews() {
    const newsGrid = document.getElementById('news-grid');
    if (!newsGrid || !this.newsCache) return;

    const newsHTML = this.newsCache.slice(0, 6).map(article => {
      const date = new Date(article.publishedAt).toLocaleDateString('zh-CN');
      const categoryTag = this.getCategoryTag(article.category);
      
      return `
        <a class="news-card" href="${article.urlOriginal}" target="_blank" rel="noopener">
          <div class="news-meta">
            <span class="news-tag ${categoryTag.class}">${categoryTag.label}</span>
            <span class="news-date">${date}</span>
          </div>
          <div class="news-title">${article.title}</div>
          <div class="news-desc">${article.summary}</div>
        </a>
      `;
    }).join('');

    newsGrid.innerHTML = newsHTML;
  }

  getCategoryTag(category) {
    const tagMap = {
      'AI Model': { label: 'AI 模型', class: 'tag-ai' },
      'Tool': { label: '工具', class: 'tag-tool' },
      'Malaysia': { label: '马来西亚', class: 'tag-world' },
      'Vibe Coding': { label: 'Vibe Coding', class: 'tag-coding' },
      'Research': { label: '研究', class: 'tag-ai' },
      'Design': { label: '设计', class: 'tag-tool' }
    };
    return tagMap[category] || { label: category, class: 'tag-ai' };
  }

  /**
   * ============ AI 工具排行榜 ============
   */
  getStaticToolsData() {
    return [
      { id: 1, name: 'Cursor', icon: '⚡', cat: 'vibe dev', desc: 'AI 驱动的代码编辑器，Vibe Coding 首选工具。', votes: 3842, rank: 1, color: '#1e40af' },
      { id: 2, name: 'v0 by Vercel', icon: '▲', cat: 'vibe', desc: '一句话生成完整 React 组件和网页，自动部署到 Vercel。', votes: 3210, rank: 2, color: '#000' },
      { id: 3, name: 'ChatGPT', icon: '🤖', cat: 'chat write', desc: '最广泛使用的 AI 对话工具，写作、分析、问答全能。', votes: 3100, rank: 3, color: '#10a37f' },
      { id: 4, name: 'Claude', icon: '✦', cat: 'chat write dev', desc: 'Anthropic 出品，长文档分析、编程和写作效果极佳。', votes: 2980, rank: 4, color: '#d97706' },
      { id: 5, name: 'Bolt.new', icon: '⚡', cat: 'vibe', desc: '浏览器内全栈开发，支持 Node.js 后端，无需本地环境。', votes: 2640, rank: 5, color: '#7c3aed' },
      { id: 6, name: 'Midjourney', icon: '🎨', cat: 'design', desc: 'AI 图像生成领域标杆，V7 版本画质接近真实摄影。', votes: 2510, rank: 6, color: '#0f172a' },
      { id: 7, name: 'Lovable', icon: '💜', cat: 'vibe', desc: '无代码全栈 App 构建器，支持数据库和用户认证。', votes: 2280, rank: 7, color: '#9333ea' },
      { id: 8, name: 'GitHub Copilot', icon: '🐙', cat: 'dev', desc: '代码补全神器，与 VS Code 深度集成，支持多语言。', votes: 2050, rank: 8, color: '#333' },
      { id: 9, name: 'Notion AI', icon: '📝', cat: 'write', desc: '在 Notion 内直接使用 AI 写作、总结、翻译文档。', votes: 1840, rank: 9, color: '#000' },
      { id: 10, name: 'Gamma', icon: '🎯', cat: 'design write', desc: 'AI 自动生成专业演示文稿，学生展示项目必备。', votes: 1620, rank: 10, color: '#7c3aed' }
    ];
  }

  renderTools(filter = 'all') {
    const toolsGrid = document.getElementById('tools-grid');
    if (!toolsGrid) return;

    const filtered = filter === 'all' ? this.toolsData : this.toolsData.filter(t => t.cat.includes(filter));

    const toolsHTML = filtered.map(tool => `
      <div class="tool-card">
        <div class="tool-rank">#${tool.rank}</div>
        <div class="tool-icon" style="background:${tool.color}20;">${tool.icon}</div>
        <div class="tool-info">
          <div class="tool-name">${tool.name}</div>
          <div class="tool-desc">${tool.desc}</div>
          <div class="tool-meta">
            <div class="tool-votes">👍 ${tool.votes.toLocaleString()}</div>
            <span class="tool-change up">+${Math.floor(Math.random() * 10)}%</span>
          </div>
        </div>
      </div>
    `).join('');

    toolsGrid.innerHTML = toolsHTML;
  }

  /**
   * ============ 学生项目展示 ============
   */
  getStaticProjectsData() {
    return [
      { id: 'p1', emoji: '🌱', name: 'EcoTracker AI', creator: 'Ahmad R.', desc: '用 AI 追踪个人碳排放，提供减排建议', diff: 'intermediate', tags: ['Claude', 'SDG'] },
      { id: 'p2', emoji: '📚', name: '智能复习助手', creator: 'Lim S.Y.', desc: '上传课本 PDF，AI 自动生成考试要点和练习题', diff: 'beginner', tags: ['ChatGPT', 'PDF'] },
      { id: 'p3', emoji: '🏥', name: 'MediBuddy', creator: 'Priya K.', desc: '多语言医疗咨询 AI，支持马来语和中文', diff: 'advanced', tags: ['Multilingual', 'Health'] },
      { id: 'p4', emoji: '🎨', name: 'AI 艺术学习平台', creator: 'Wei H.', desc: '用 Midjourney 和 AI 辅助学生学习数字艺术', diff: 'beginner', tags: ['Midjourney', 'Art'] },
      { id: 'p5', emoji: '💼', name: 'JobPrep AI', creator: 'Rajesh M.', desc: '模拟面试练习 + 简历优化，帮助应届生准备求职', diff: 'intermediate', tags: ['ChatGPT', 'Career'] },
      { id: 'p6', emoji: '🌾', name: 'SmartFarm Bot', creator: 'Nurul A.', desc: '农业 AI 助手，根据天气和土壤数据提供种植建议', diff: 'advanced', tags: ['Claude', 'Agriculture'] },
      { id: 'p7', emoji: '🎵', name: 'SoundWave AI', creator: 'Marcus L.', desc: 'AI 音乐生成器，自动作曲和混音', diff: 'intermediate', tags: ['Audio', 'Creative'] },
      { id: 'p8', emoji: '🚀', name: 'StartupPitch AI', creator: 'Sophie B.', desc: '帮创业者优化商业计划书和 Pitch 演讲', diff: 'beginner', tags: ['Business', 'Writing'] },
      { id: 'p9', emoji: '🔬', name: 'LabAssist', creator: 'Chen W.', desc: '科学实验数据分析 AI，自动生成报告', diff: 'advanced', tags: ['Data', 'Science'] },
      { id: 'p10', emoji: '🎬', name: 'VideoFlow', creator: 'Jordan T.', desc: 'AI 视频编辑工具，自动剪辑和配音', diff: 'intermediate', tags: ['Video', 'Automation'] },
      { id: 'p11', emoji: '🌐', name: 'LanguageBridge', creator: 'Maria G.', desc: '实时多语言翻译和文化适配 AI', diff: 'advanced', tags: ['Translation', 'NLP'] },
      { id: 'p12', emoji: '💡', name: 'IdeaLab', creator: 'David K.', desc: '创意头脑风暴 AI，帮助团队生成创新想法', diff: 'beginner', tags: ['Brainstorm', 'Creativity'] }
    ];
  }

  renderProjects() {
    const projectsGrid = document.getElementById('projects-grid');
    if (!projectsGrid) return;

    // 排序项目
    const ranked = this.rankingEngine.rankProjects(this.projectsData);
    const topProjects = ranked.slice(0, 12);

    const projectsHTML = topProjects.map((project, index) => {
      const rankChange = this.rankingEngine.getRankChangeIndicator(project.rankChange);
      const diffClass = `diff-${project.diff}`;
      const diffLabel = { beginner: '初级', intermediate: '中级', advanced: '高级' }[project.diff] || '初级';

      return `
        <div class="project-card">
          <div class="project-img">${project.emoji}</div>
          <div class="project-body">
            <div class="project-top">
              <span class="project-rank-badge">排名 #${project.rank}</span>
              <span class="project-diff ${diffClass}">${diffLabel}</span>
            </div>
            <div class="project-title">${project.name}</div>
            <div class="project-desc">${project.desc}</div>
            <div class="project-creator">
              <div class="creator-avatar">${project.creator[0]}</div>
              <div class="creator-name">${project.creator} · 2026</div>
            </div>
            <div class="project-tags">
              ${project.tags.map(tag => `<span class="ptag">${tag}</span>`).join('')}
            </div>
            <div class="project-stats">
              <button class="pstat" onclick="voteProject('${project.id}', this)" style="background:none;border:none;cursor:pointer;color:inherit;">
                👍 <span class="vote-count">${project.interaction.votes}</span>
              </button>
              <div class="pstat">💬 ${project.interaction.comments}</div>
              <div class="pstat" style="color: ${rankChange.color};">${rankChange.icon} ${rankChange.text}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    projectsGrid.innerHTML = projectsHTML;
  }

  /**
   * 投票交互
   */
  voteProject(projectId, button) {
    this.rankingEngine.vote(projectId);
    const votes = this.rankingEngine.getProjectInteraction(projectId).votes;
    button.querySelector('.vote-count').textContent = votes;
    this.renderProjects(); // 重新渲染以更新排名
  }
}

// 导出单例
window.homepageManager = new HomepageManager();

// 初始化函数
async function initializeHomepage() {
  if (window.homepageManager) {
    await window.homepageManager.initialize();
  }
}

// 工具函数
function scrollToProjects() {
  const projectsSection = document.getElementById('projects');
  if (projectsSection) {
    projectsSection.scrollIntoView({ behavior: 'smooth' });
  }
}

function voteProject(projectId, button) {
  if (window.homepageManager) {
    window.homepageManager.voteProject(projectId, button);
  }
}
