/**
 * ConfigManager
 * 
 * ~/.config/uai/ で設定を管理
 * 各AIツールのAPIキーや設定を統一的に管理
 */

import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

interface Config {
  claude?: {
    apiKey?: string;
    model?: string;
  };
  o3?: {
    endpoint?: string;
    apiKey?: string;
  };
  gemini?: {
    apiKey?: string;
    model?: string;
  };
  general?: {
    defaultTool?: string;
    theme?: string;
  };
}

export class ConfigManager {
  private configDir: string;
  private configPath: string;
  private config: Config = {};

  constructor(configDir: string) {
    this.configDir = configDir;
    this.configPath = path.join(configDir, 'config.json');
  }

  /**
   * 設定を読み込み
   */
  async load(): Promise<void> {
    try {
      await fs.mkdir(this.configDir, { recursive: true });
      
      try {
        const data = await fs.readFile(this.configPath, 'utf-8');
        this.config = JSON.parse(data);
      } catch {
        // 設定ファイルがない場合はデフォルト設定を作成
        await this.createDefaultConfig();
      }
    } catch (error) {
      console.error(chalk.red('設定の読み込みに失敗しました:'), error);
    }
  }

  /**
   * デフォルト設定を作成
   */
  private async createDefaultConfig(): Promise<void> {
    this.config = {
      claude: {
        model: 'claude-3-5-sonnet-20241022'
      },
      o3: {},
      gemini: {},
      general: {
        defaultTool: 'claude',
        theme: 'auto'
      }
    };
    await this.save();
  }

  /**
   * 設定を保存
   */
  private async save(): Promise<void> {
    try {
      await fs.writeFile(
        this.configPath,
        JSON.stringify(this.config, null, 2)
      );
    } catch (error) {
      console.error(chalk.red('設定の保存に失敗しました:'), error);
    }
  }

  /**
   * 設定値を取得
   */
  get(key: string): any {
    const keys = key.split('.');
    let value: any = this.config;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * 設定値をセット
   */
  async set(key: string, value: any): Promise<void> {
    const keys = key.split('.');
    let current: any = this.config;

    // ネストされたオブジェクトを作成
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i];
      if (!(k in current) || typeof current[k] !== 'object') {
        current[k] = {};
      }
      current = current[k];
    }

    // 値を設定
    const lastKey = keys[keys.length - 1];
    current[lastKey] = value;

    await this.save();
  }

  /**
   * 全設定を表示
   */
  async list(): Promise<void> {
    console.log(chalk.blue('⚙️  UAI 設定:\n'));
    
    // Claude設定
    console.log(chalk.yellow('Claude Code:'));
    console.log(`  API Key: ${this.maskApiKey(this.config.claude?.apiKey)}`);
    console.log(`  Model: ${this.config.claude?.model || 'claude-3-5-sonnet-20241022'}`);
    console.log('');

    // O3設定
    console.log(chalk.green('O3 MCP:'));
    console.log(`  Endpoint: ${this.config.o3?.endpoint || '(未設定)'}`);
    console.log(`  API Key: ${this.maskApiKey(this.config.o3?.apiKey)}`);
    console.log('');

    // Gemini設定
    console.log(chalk.magenta('Gemini CLI:'));
    console.log(`  API Key: ${this.maskApiKey(this.config.gemini?.apiKey)}`);
    console.log(`  Model: ${this.config.gemini?.model || '(未設定)'}`);
    console.log('');

    // 一般設定
    console.log(chalk.cyan('一般設定:'));
    console.log(`  デフォルトツール: ${this.config.general?.defaultTool || 'claude'}`);
    console.log(`  テーマ: ${this.config.general?.theme || 'auto'}`);
    console.log('');

    console.log(chalk.gray('設定場所: ' + this.configPath));
  }

  /**
   * 設定をリセット
   */
  async reset(): Promise<void> {
    await this.createDefaultConfig();
  }

  /**
   * APIキーをマスク
   */
  private maskApiKey(apiKey?: string): string {
    if (!apiKey) {
      return chalk.gray('(未設定)');
    }

    if (apiKey.length <= 8) {
      return '*'.repeat(apiKey.length);
    }

    const prefix = apiKey.substring(0, 4);
    const suffix = apiKey.substring(apiKey.length - 4);
    const masked = '*'.repeat(Math.max(apiKey.length - 8, 4));

    return `${prefix}${masked}${suffix}`;
  }

  /**
   * 環境変数から設定を読み込み
   */
  loadFromEnv(): void {
    // Claude
    if (process.env.ANTHROPIC_API_KEY) {
      if (!this.config.claude) this.config.claude = {};
      this.config.claude.apiKey = process.env.ANTHROPIC_API_KEY;
    }

    // O3 MCP
    if (process.env.O3_MCP_ENDPOINT) {
      if (!this.config.o3) this.config.o3 = {};
      this.config.o3.endpoint = process.env.O3_MCP_ENDPOINT;
    }
    if (process.env.O3_MCP_API_KEY) {
      if (!this.config.o3) this.config.o3 = {};
      this.config.o3.apiKey = process.env.O3_MCP_API_KEY;
    }

    // Gemini
    if (process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY) {
      if (!this.config.gemini) this.config.gemini = {};
      this.config.gemini.apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    }
  }
}