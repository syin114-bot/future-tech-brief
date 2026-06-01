/**
 * =====================================
 * 多语言数据映射引擎
 * 优雅地管理 UI 文本、API 数据的多语言转换
 * =====================================
 */

class I18nDataEngine {
  constructor() {
    this.currentLang = window.i18n?.currentLanguage?.() || 'zh-CN';
    this.translations = window.i18n?.t ? window.i18n.t.bind(window.i18n) : this.fallbackT;
    
    // 监听语言变更
    window.addEventListener('languageChanged', (e) => {
      this.currentLang = e.detail.language;
      this.onLanguageChange?.();
    });
  }

  /**
   * 备选翻译函数（当 i18n 不可用时）
   */
  fallbackT(key) {
    return key;
  }

  /**
   * 将英文 API 数据转换为多语言
   * 用法: engine.translateData('news', newsItem, 'zh-CN')
   */
  translateData(dataType, data, lang = this.currentLang) {
    const mappings = this.getDataMappings(dataType);
    const translated = { ...data };

    Object.entries(mappings).forEach(([key, translationKey]) => {
      if (translationKey && data[key]) {
        // 如果是简单字符串，直接翻译
        if (typeof data[key] === 'string') {
          translated[key] = this.translations(translationKey);
        }
        // 如果是对象或数组，递归处理
        else if (typeof data[key] === 'object') {
          translated[key] = this.translateNestedData(data[key], translationKey);
        }
      }
    });

    return translated;
  }

  /**
   * 递归处理嵌套数据
   */
  translateNestedData(nestedData, baseKey) {
    if (Array.isArray(nestedData)) {
      return nestedData.map((item, index) => {
        if (typeof item === 'string') {
          return this.translations(`${baseKey}[${index}]`);
        }
        return item;
      });
    }

    if (typeof nestedData === 'object') {
      const result = {};
      Object.entries(nestedData).forEach(([key, value]) => {
        if (typeof value === 'string') {
          result[key] = this.translations(`${baseKey}.${key}`);
        } else {
          result[key] = value;
        }
      });
      return result;
    }

    return nestedData;
  }

  /**
   * 定义各类型数据的翻译映射关系
   */
  getDataMappings(dataType) {
    const mappings = {
      // 新闻数据映射
      'news': {
        'category': 'news_categories.{category}',
        'source': 'news_sources.{source}'
      },

      // AI 工具数据映射
      'tool': {
        'cat': 'tools_categories.{category}',
        'desc': 'tools_descriptions.{toolName}'
      },

      // 学生项目映射
      'project': {
        'name': 'projects_names.{id}',
        'desc': 'projects_descriptions.{id}',
        'tags': 'projects_tags.{id}',
        'difficulty': 'projects_difficulty.{level}'
      },

      // 按钮文本映射
      'button': {
        'text': 'buttons.{buttonId}'
      }
    };

    return mappings[dataType] || {};
  }

  /**
   * 批量转换列表数据
   * 用法: engine.translateList('news', newsList)
   */
  translateList(dataType, list) {
    return list.map(item => this.translateData(dataType, item, this.currentLang));
  }

  /**
   * 替换字符串中的占位符
   * 用法: engine.interpolate('Hello {name}', { name: 'Alice' })
   */
  interpolate(template, variables = {}) {
    return template.replace(/{(\w+)}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  /**
   * 获取分类标签的本地化显示
   */
  getCategoryLabel(category, type = 'news') {
    const categoryMaps = {
      news: {
        'AI Model': 'news.category_ai',
        'Tool': 'news.category_tool',
        'Malaysia': 'news.category_world',
        'Vibe Coding': 'news.category_coding',
        'Research': 'news.category_research',
        'Design': 'news.category_design'
      },
      tools: {
        'vibe': 'tools.tab_vibecoding',
        'design': 'tools.tab_design',
        'write': 'tools.tab_write',
        'dev': 'tools.tab_dev',
        'chat': 'tools.tab_chat'
      },
      projects: {
        'beginner': 'projects.difficulty_beginner',
        'intermediate': 'projects.difficulty_intermediate',
        'advanced': 'projects.difficulty_advanced'
      }
    };

    const map = categoryMaps[type] || {};
    return this.translations(map[category] || category);
  }

  /**
   * 动态加载外部 JSON 数据并转换
   */
  async loadAndTranslateRemote(url, dataType) {
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      // 假设 API 返回数组或对象
      if (Array.isArray(data)) {
        return this.translateList(dataType, data);
      } else if (data.articles) {
        return this.translateList(dataType, data.articles);
      }
      
      return this.translateData(dataType, data);
    } catch (error) {
      console.error(`Failed to load and translate from ${url}:`, error);
      return null;
    }
  }

  /**
   * 设置语言变更回调
   */
  onLanguageChange(callback) {
    this.onLanguageChangeCallback = callback;
  }
}

// 导出单例
window.i18nDataEngine = new I18nDataEngine();
