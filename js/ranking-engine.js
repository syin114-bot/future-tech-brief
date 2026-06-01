/**
 * =====================================
 * 项目排行榜算法引擎
 * 综合分数 = (投票数 × 10) + (评论数 × 3) + (分享数 × 5)
 * =====================================
 */

class ProjectRankingEngine {
  constructor() {
    this.storageKey = 'projectsInteractions';
    this.rankingFormula = {
      vote: 10,
      comment: 3,
      share: 5
    };
    this.loadInteractions();
  }

  /**
   * 从 localStorage 加载用户交互数据
   */
  loadInteractions() {
    this.interactions = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
  }

  /**
   * 保存交互数据到 localStorage
   */
  saveInteractions() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.interactions));
  }

  /**
   * 获取或创建项目交互数据
   */
  getProjectInteraction(projectId) {
    if (!this.interactions[projectId]) {
      this.interactions[projectId] = {
        votes: 0,
        comments: 0,
        shares: 0,
        lastUpdated: new Date().toISOString()
      };
    }
    return this.interactions[projectId];
  }

  /**
   * 投票
   */
  vote(projectId) {
    const interaction = this.getProjectInteraction(projectId);
    interaction.votes++;
    interaction.lastUpdated = new Date().toISOString();
    this.saveInteractions();
    return interaction.votes;
  }

  /**
   * 添加评论
   */
  addComment(projectId) {
    const interaction = this.getProjectInteraction(projectId);
    interaction.comments++;
    interaction.lastUpdated = new Date().toISOString();
    this.saveInteractions();
    return interaction.comments;
  }

  /**
   * 分享
   */
  share(projectId) {
    const interaction = this.getProjectInteraction(projectId);
    interaction.shares++;
    interaction.lastUpdated = new Date().toISOString();
    this.saveInteractions();
    return interaction.shares;
  }

  /**
   * 计算单个项目的综合分数
   */
  calculateScore(projectId) {
    const interaction = this.getProjectInteraction(projectId);
    return (
      interaction.votes * this.rankingFormula.vote +
      interaction.comments * this.rankingFormula.comment +
      interaction.shares * this.rankingFormula.share
    );
  }

  /**
   * 计算项目列表的排名
   */
  rankProjects(projects) {
    const ranked = projects.map(project => ({
      ...project,
      interaction: this.getProjectInteraction(project.id || project._id),
      score: this.calculateScore(project.id || project._id),
      previousRank: project.rank || 0
    }));

    // 按分数从高到低排序
    ranked.sort((a, b) => b.score - a.score);

    // 添加排名和排名变化
    ranked.forEach((project, index) => {
      project.rank = index + 1;
      project.rankChange = project.previousRank - project.rank;
    });

    return ranked;
  }

  /**
   * 获取排名变化的视觉表示
   */
  getRankChangeIndicator(rankChange) {
    if (rankChange > 0) {
      return { icon: '📈', text: `↑ ${rankChange}`, color: '#00e5a0' };
    } else if (rankChange < 0) {
      return { icon: '📉', text: `↓ ${Math.abs(rankChange)}`, color: '#f87171' };
    } else {
      return { icon: '➡️', text: '→', color: '#5a7090' };
    }
  }

  /**
   * 获取项目的完整排名信息
   */
  getProjectRankInfo(projectId, projects) {
    const ranked = this.rankProjects(projects);
    const project = ranked.find(p => (p.id || p._id) === projectId);
    return project || null;
  }

  /**
   * 重置所有交互数据（仅测试用）
   */
  reset() {
    this.interactions = {};
    this.saveInteractions();
  }

  /**
   * 导出交互数据（用于备份或分析）
   */
  exportData() {
    return {
      timestamp: new Date().toISOString(),
      data: this.interactions,
      formula: this.rankingFormula
    };
  }

  /**
   * 从备份导入交互数据
   */
  importData(backupData) {
    this.interactions = backupData.data || {};
    this.saveInteractions();
  }
}

// 导出单例
window.projectRankingEngine = new ProjectRankingEngine();
