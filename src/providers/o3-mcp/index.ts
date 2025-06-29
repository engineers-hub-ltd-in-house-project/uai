/**
 * O3 MCP Provider
 * 
 * O3 Model Context Protocol との統合
 * 最新技術情報の調査・分析に特化
 */

import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';
import { SessionManager } from '../../session/SessionManager';
import { ConfigManager } from '../../config/ConfigManager';

interface O3SearchOptions {
  format?: 'text' | 'json' | 'markdown';
  maxResults?: number;
  includeContext?: boolean;
}

export class O3MCPProvider {
  private config: ConfigManager;
  private sessionManager: SessionManager;

  constructor(config: ConfigManager, sessionManager: SessionManager) {
    this.config = config;
    this.sessionManager = sessionManager;
  }

  /**
   * 技術情報を検索
   */
  async search(query: string, options: O3SearchOptions = {}): Promise<void> {
    const sessionId = await this.sessionManager.createSession('o3-mcp', process.cwd());

    try {
      // エンドポイントとAPIキーの確認
      const endpoint = this.config.get('o3.endpoint') || process.env.O3_MCP_ENDPOINT;
      const apiKey = this.config.get('o3.apiKey') || process.env.O3_MCP_API_KEY;

      if (!endpoint) {
        // O3 MCPが設定されていない場合は、シミュレーションモードで動作
        await this.simulateSearch(query, options, sessionId);
        return;
      }

      // スピナー表示
      const spinner = ora('O3 MCP で検索中...').start();

      // API呼び出し
      const response = await axios.post(
        `${endpoint}/search`,
        {
          query,
          format: options.format || 'markdown',
          maxResults: options.maxResults || 10,
          includeContext: options.includeContext !== false
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      spinner.stop();

      // 結果を表示
      await this.displayResults(response.data, options.format || 'markdown');

      // セッションに記録
      await this.sessionManager.addMessage(sessionId, 'user', query);
      await this.sessionManager.addMessage(sessionId, 'assistant', JSON.stringify(response.data));

    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        // O3 MCPが利用できない場合はシミュレーションモード
        await this.simulateSearch(query, options, sessionId);
      } else {
        console.error(chalk.red('エラー:'), error instanceof Error ? error.message : 'Unknown error');
      }
    } finally {
      await this.sessionManager.endSession(sessionId);
    }
  }

  /**
   * シミュレーション検索（O3 MCPが利用できない場合）
   */
  private async simulateSearch(query: string, options: O3SearchOptions, sessionId: string): Promise<void> {
    console.log(chalk.yellow('⚠️  O3 MCP未設定 - シミュレーションモードで実行'));
    console.log('');

    const spinner = ora('検索シミュレーション中...').start();
    
    // 検索をシミュレート
    await new Promise(resolve => setTimeout(resolve, 1500));
    spinner.stop();

    // シミュレーション結果
    const results = this.generateSimulatedResults(query);
    
    if (options.format === 'json') {
      console.log(JSON.stringify(results, null, 2));
    } else {
      console.log(chalk.green(`\n🔍 "${query}" の検索結果:\n`));
      
      for (const result of results.results) {
        console.log(chalk.blue(`📄 ${result.title}`));
        console.log(chalk.gray(`   ${result.source} - ${result.date}`));
        console.log(`   ${result.summary}`);
        console.log('');
      }

      console.log(chalk.cyan('\n💡 関連トピック:'));
      for (const topic of results.relatedTopics) {
        console.log(chalk.gray(`  • ${topic}`));
      }

      console.log(chalk.yellow('\n📝 推奨アクション:'));
      console.log(chalk.gray('  1. 公式ドキュメントを確認'));
      console.log(chalk.gray('  2. GitHubで最新の議論をチェック'));
      console.log(chalk.gray('  3. 実際にコードで試してみる'));
    }

    // セッションに記録
    await this.sessionManager.addMessage(sessionId, 'user', query);
    await this.sessionManager.addMessage(sessionId, 'assistant', JSON.stringify(results));
  }

  /**
   * シミュレーション結果を生成
   */
  private generateSimulatedResults(query: string): any {
    const lowerQuery = query.toLowerCase();
    
    // キーワードに基づいた結果を生成
    if (lowerQuery.includes('react')) {
      return {
        query,
        results: [
          {
            title: 'React 19 の新機能: Actions と use() API',
            source: 'React Blog',
            date: '2024-12-15',
            summary: 'React 19では、フォーム処理を簡素化するActionsと、非同期処理を扱うuse() APIが導入されました。'
          },
          {
            title: 'React Server Components の実践ガイド',
            source: 'Vercel Blog',
            date: '2024-12-10',
            summary: 'RSCを使用することで、サーバーサイドでのレンダリングとクライアントサイドの相互作用を最適化できます。'
          }
        ],
        relatedTopics: [
          'React Compiler',
          'Next.js 15',
          'Suspense improvements',
          'React Native New Architecture'
        ]
      };
    } else if (lowerQuery.includes('ai') || lowerQuery.includes('llm')) {
      return {
        query,
        results: [
          {
            title: 'Claude 3.5 Sonnet: 最新のコーディング能力',
            source: 'Anthropic Research',
            date: '2024-12-20',
            summary: 'Claude 3.5 Sonnetは、より高度なコード理解と生成能力を持ち、複雑なプロジェクトにも対応できます。'
          },
          {
            title: 'LLMを活用した開発ワークフローの最適化',
            source: 'GitHub Blog',
            date: '2024-12-18',
            summary: 'GitHub CopilotやClaude Codeなどのツールを組み合わせることで、開発効率を大幅に向上できます。'
          }
        ],
        relatedTopics: [
          'MCP (Model Context Protocol)',
          'AI-powered IDE extensions',
          'Prompt engineering best practices',
          'LLM fine-tuning techniques'
        ]
      };
    } else {
      return {
        query,
        results: [
          {
            title: `${query} に関する最新動向`,
            source: 'Tech News',
            date: '2024-12-25',
            summary: `${query}について、業界では新しいアプローチや手法が議論されています。`
          },
          {
            title: `${query} のベストプラクティス`,
            source: 'Developer Community',
            date: '2024-12-23',
            summary: `${query}を効果的に活用するための実践的なガイドラインが公開されました。`
          }
        ],
        relatedTopics: [
          `${query} tutorials`,
          `${query} documentation`,
          `${query} community`,
          `${query} alternatives`
        ]
      };
    }
  }

  /**
   * 結果を表示
   */
  private async displayResults(data: any, format: string): Promise<void> {
    switch (format) {
      case 'json':
        console.log(JSON.stringify(data, null, 2));
        break;
      
      case 'text':
        console.log(data.text || data);
        break;
      
      case 'markdown':
      default:
        if (typeof data === 'string') {
          console.log(data);
        } else {
          // オブジェクトの場合は整形して表示
          console.log(chalk.green('\n🔍 検索結果:\n'));
          console.log(data.content || JSON.stringify(data, null, 2));
        }
        break;
    }
  }
}