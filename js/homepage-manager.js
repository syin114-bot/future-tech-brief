/**
 * =====================================
 * 首页组件管理器（大马学生社区安全版）
 * =====================================
 */

class HomepageManager {
  constructor() {
    // 加上安全保护，防止引擎没加载出来时报错
    this.rankingEngine = window.projectRankingEngine || {
      rankProjects: (data) => data,
      getRankChangeIndicator: () => ({ icon: '•', text: '保持', color: '#94a3b8' })
    };
    this.newsCache = null;
    this.toolsData = this.getStaticToolsData();
    this.projectsData = this.getStaticProjectsData();
  }

  /**
   * 初始化首页
   */
  async initialize() {
    await this.loadNews();
    this.renderTools();
    this.renderProjects();
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
      { id: 5, name: 'Bolt.new', icon: '⚡', cat: 'vibe', desc: '浏览器内全栈开发，支持 Node.js 后端，无需本地环境。', votes: 2640, rank: 5, color: '#7c3aed' }
    ];
  }

  renderTools(filter = 'all') {
    const toolsGrid = document.getElementById('tools-grid');
    if (!toolsGrid) return; // 如果 HTML 里没写这个 ID，安全退出不报错

    const filtered = filter === 'all' ? this.toolsData : this.toolsData.filter(t => t.cat.includes(filter));

    const toolsHTML = filtered.map(tool => `
      <div class="tool-card" style="background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); padding: 20px; border-radius: 12px; margin-bottom: 15px;">
        <div class="tool-info">
          <strong style="font-size: 16px; color: #00b4ff;">#${tool.rank} ${tool.name}</strong>
          <p style="color: #e8edf5; font-size: 14px; margin: 8px 0;">${tool.desc}</p>
          <span style="color: #5a7090; font-size: 12px;">👍 ${tool.votes.toLocaleString()}</span>
        </div>
      </div>
    `).join('');

    toolsGrid.innerHTML = toolsHTML;
  }

  /**
   * ============ 学生项目展示（带多语言安全池） ============
   */
  getStaticProjectsData() {
    // 读取当前用户的语言设置
    const currentLang = localStorage.getItem('lang') || 'zh-CN';

    const projects = [
      { 
        id: 'p1', emoji: '🌱', name: 'EcoTracker AI', creator: 'Ahmad R.', diff: 'intermediate', tags: ['Claude', 'SDG'],
        interaction: { votes: 142, comments: 28, shares: 15 },
        desc_pool: { 
          'zh-CN': '用 AI 追踪个人碳排放，提供针对大马社区的减排建议。', 
          'en': 'Track personal carbon footprint with AI and get localized eco-friendly tips.', 
          'ms': 'Jejak jejak karbon peribadi dengan AI dan dapatkan tips mesra alam tempatan.' 
        }
      },
      { 
        id: 'p2', emoji: '📚', name: 'Sparks AI', creator: 'Lim S.Y.', diff: 'beginner', tags: ['ChatGPT', 'PAJSK'],
        interaction: { votes: 320, comments: 84, shares: 67 },
        desc_pool: { 
          'zh-CN': '上传课本 PDF，AI 自动生成大马 KSSM/SPM 考试要点和复习题。', 
          'en': 'Upload textbook PDFs to automatically generate KSSM/SPM revision notes and quizzes.', 
          'ms': 'Muat naik PDF buku teks untuk menjana nota ulang kaji dan kuiz KSSM/SPM.' 
        }
      },
      { 
        id: 'p3', emoji: '🏥', name: 'MediBuddy', creator: 'Priya K.', diff: 'advanced', tags: ['Multilingual'],
        interaction: { votes: 98, comments: 12, shares: 8 },
        desc_pool: { 
          'zh-CN': '多语言医疗咨询 AI 原型，支持马来语、中文及淡米尔语互译。', 
          'en': 'A multilingual medical consultation AI supporting Malay, Chinese, and Tamil.', 
          'ms': 'Prototaip AI konsultasi kesihatan pelbagai bahasa, menyokong Melayu, Cina dan Tamil.' 
        }
      }
    ];

    // 动态提取语言描述，如果找不到就用英文兜底
    return projects.map(project => {
      project.desc = project.desc_pool[currentLang] || project.desc_pool['en'];
      return project;
    });
  }

  renderProjects() {
    const projectsGrid = document.getElementById('projects-grid');
    if (!projectsGrid) return; // 安全防护

    const ranked = this.rankingEngine.rankProjects(this.projectsData);

    const projectsHTML = ranked.map((project, index) => {
      const pInteraction = project.interaction || { votes: 0, comments: 0 };
      const currentLang = localStorage.getItem('lang') || 'zh-CN';
      
      // 动态转换难度标签
      const diffLabels = {
        'zh-CN': { beginner: '初级', intermediate: '中级', advanced: '高级' },
        'en': { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
        'ms': { beginner: 'Asas', intermediate: 'Sederhana', advanced: 'Lanjutan' }
      };
      const diffLabel = (diffLabels[currentLang] || diffLabels['en'])[project.diff] || 'Asas';

      return `
        <div class="project-card" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.07); border-radius: 12px; padding: 20px; margin-bottom: 15px;">
          <div style="font-size: 30px; margin-bottom: 10px;">${project.emoji}</div>
          <div style="font-weight: bold; font-size: 18px; color: #fff;">Rank #${index + 1} - ${project.name}</div>
          <div style="font-size: 12px; color: #00e5a0; margin: 4px 0;">[${diffLabel}] · Creator: ${project.creator}</div>
          <p style="color: #9ca3af; font-size: 14px; margin: 10px 0;">${project.desc}</p>
          <div style="color: #5a7090; font-size: 13px;">👍 ${pInteraction.votes}  💬 ${pInteraction.comments}</div>
        </div>
      `;
    }).join('');

    projectsGrid.innerHTML = projectsHTML;
  }

  /**
   * 加载外部新闻资讯
   */
  async loadNews() {
    const newsGrid = document.getElementById('news-grid');
    if (!newsGrid) return;

    try {
      const response = await fetch('https://futuretech-newsletter.vercel.app/news.json');
      if (!response.ok) throw new Error();
      const data = await response.json();
      const list = data.articles || [];
      
      newsGrid.innerHTML = list.slice(0, 3).map(art => `
        <div style="border-left: 3px solid #7c3aed; padding-left: 10px; margin-bottom: 15px;">
          <a href="${art.urlOriginal}" target="_blank" style="color: #e8edf5; text-decoration: none; font-weight: 500;">${art.title}</a>
          <p style="color: #5a7090; font-size: 13px; margin: 5px 0;">${art.summary}</p>
        </div>
      `).join('');
    } catch (e) {
      newsGrid.innerHTML = `<p style="color: #5a7090;">资讯暂未加载成功，请稍后再试。</p>`;
    }
  }
}

// 自动挂载与初始化
window.homepageManager = new HomepageManager();

document.addEventListener('DOMContentLoaded', () => {
  if (window.homepageManager) {
    window.homepageManager.initialize();
  }
});
