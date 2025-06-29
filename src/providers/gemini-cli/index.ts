/**
 * Gemini CLI Provider
 * 
 * Gemini CLI との統合
 * ビジュアル・創造的タスクに特化
 */

import { spawn } from 'child_process';
import axios from 'axios';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { SessionManager } from '../../session/SessionManager';
import { ConfigManager } from '../../config/ConfigManager';

interface GeminiExecuteOptions {
  image?: string;
  output?: string;
  model?: string;
}

export class GeminiCLIProvider {
  private config: ConfigManager;
  private sessionManager: SessionManager;

  constructor(config: ConfigManager, sessionManager: SessionManager) {
    this.config = config;
    this.sessionManager = sessionManager;
  }

  /**
   * Geminiタスクを実行
   */
  async execute(prompt: string, options: GeminiExecuteOptions = {}): Promise<void> {
    const sessionId = await this.sessionManager.createSession('gemini-cli', process.cwd());

    try {
      // Gemini CLIがインストールされているか確認
      const geminiCLIPath = await this.findGeminiCLI();
      
      if (geminiCLIPath) {
        // ネイティブGemini CLIを使用
        await this.executeNativeGemini(prompt, options, sessionId);
      } else {
        // API版を使用（フォールバック）
        await this.executeAPIGemini(prompt, options, sessionId);
      }
    } finally {
      await this.sessionManager.endSession(sessionId);
    }
  }

  /**
   * ネイティブGemini CLI実行
   */
  private async executeNativeGemini(prompt: string, options: GeminiExecuteOptions, sessionId: string): Promise<void> {
    console.log(chalk.magenta('🎨 Gemini CLI 実行中...'));

    const args: string[] = [];

    // Gemini CLIのオプションに合わせて調整
    if (options.model) {
      args.push('--model', options.model);
    }
    
    // プロンプトは後で追加
    args.push('--prompt', prompt);

    // Gemini CLIを実行（YOLO modeで自動承認）
    const geminiProcess = spawn('gemini', [...args, '--yolo'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        GOOGLE_API_KEY: this.config.get('gemini.apiKey') || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY
      }
    });

    let output = '';
    let errorOutput = '';

    // 出力を収集
    geminiProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text);
    });

    geminiProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    // 標準入力にプロンプトを送信（Gemini CLIは標準入力も受け付ける）
    geminiProcess.stdin.write(prompt + '\n');
    geminiProcess.stdin.end();

    // プロセス終了を待つ
    await new Promise<void>((resolve, reject) => {
      geminiProcess.on('exit', async (code) => {
        if (code === 0 || (code === null && output.length > 0)) {
          // セッションに記録
          await this.sessionManager.addMessage(sessionId, 'user', prompt);
          await this.sessionManager.addMessage(sessionId, 'assistant', output.trim());
          
          console.log(chalk.green('\n✅ Gemini CLI 実行完了'));
          
          if (options.output) {
            await fs.writeFile(options.output, output.trim());
            console.log(chalk.gray(`📁 出力: ${options.output}`));
          }
          
          resolve();
        } else if (errorOutput.includes('Unknown argument')) {
          // Gemini CLIのオプションエラーの場合
          console.error(chalk.red('エラー: Gemini CLIの引数が正しくありません'));
          console.log(chalk.yellow('API版にフォールバックします...'));
          this.executeAPIGemini(prompt, options, sessionId).then(resolve).catch(reject);
        } else {
          console.error(chalk.red('エラー:'), errorOutput || `Exit code: ${code}`);
          reject(new Error(`Gemini CLI exited with code ${code}`));
        }
      });

      geminiProcess.on('error', (error) => {
        console.error(chalk.red('エラー:'), error.message);
        console.log(chalk.yellow('API版にフォールバックします...'));
        this.executeAPIGemini(prompt, options, sessionId).then(resolve).catch(reject);
      });
      
      // タイムアウト処理
      const timeout = setTimeout(() => {
        geminiProcess.kill();
        console.log(chalk.yellow('\nGemini CLIがタイムアウトしました'));
        console.log(chalk.yellow('API版にフォールバックします...'));
        this.executeAPIGemini(prompt, options, sessionId).then(resolve).catch(reject);
      }, 30000);
      
      // プロセス終了時にタイムアウトをクリア
      geminiProcess.on('exit', () => clearTimeout(timeout));
    });
  }

  /**
   * API版Gemini実行
   */
  private async executeAPIGemini(prompt: string, options: GeminiExecuteOptions, sessionId: string): Promise<void> {
    console.log(chalk.yellow('⚠️  Gemini CLI未インストール - API版で実行'));

    const apiKey = this.config.get('gemini.apiKey') || process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
      // APIキーがない場合はシミュレーション
      await this.simulateGemini(prompt, options, sessionId);
      return;
    }

    const spinner = ora('Gemini API 実行中...').start();

    try {
      // Gemini APIを呼び出し
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent',
        {
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json'
          },
          params: {
            key: apiKey
          }
        }
      );

      spinner.stop();

      // 結果を表示
      const result = response.data.candidates[0].content.parts[0].text;
      console.log(chalk.green('\n🤖 Gemini:'));
      console.log(result);

      // 出力ファイルが指定されている場合
      if (options.output) {
        await fs.writeFile(options.output, result);
        console.log(chalk.gray(`\n📁 結果を保存: ${options.output}`));
      }

      // セッションに記録
      await this.sessionManager.addMessage(sessionId, 'user', prompt);
      await this.sessionManager.addMessage(sessionId, 'assistant', result);

    } catch (error) {
      spinner.stop();
      if (axios.isAxiosError(error) && error.response?.status === 403) {
        // APIキーが無効な場合はシミュレーション
        await this.simulateGemini(prompt, options, sessionId);
      } else {
        console.error(chalk.red('エラー:'), error instanceof Error ? error.message : 'Unknown error');
      }
    }
  }

  /**
   * Geminiシミュレーション
   */
  private async simulateGemini(prompt: string, options: GeminiExecuteOptions, sessionId: string): Promise<void> {
    console.log(chalk.yellow('⚠️  Gemini API未設定 - シミュレーションモードで実行'));
    console.log('');

    const spinner = ora('生成シミュレーション中...').start();
    
    // 生成をシミュレート
    await new Promise(resolve => setTimeout(resolve, 2000));
    spinner.stop();

    const lowerPrompt = prompt.toLowerCase();
    let result = '';

    // プロンプトに基づいた結果を生成
    if (lowerPrompt.includes('画像') || lowerPrompt.includes('image')) {
      result = `🎨 画像生成タスク: "${prompt}"

シミュレーション結果:
- 画像サイズ: 1024x1024
- スタイル: フォトリアリスティック
- 主要要素: ${this.extractKeywords(prompt).join(', ')}

実際の画像生成には以下が必要です:
1. Gemini API キーの設定
2. 画像生成対応モデルの使用
3. 適切なプロンプトエンジニアリング`;
    } else if (lowerPrompt.includes('ui') || lowerPrompt.includes('デザイン')) {
      result = `🎨 UIデザイン提案: "${prompt}"

デザイン要素:
- カラーパレット: モダンで落ち着いた色調
- タイポグラフィ: Sans-serif、読みやすさを重視
- レイアウト: レスポンシブグリッドシステム
- インタラクション: スムーズなトランジション

推奨フレームワーク:
- React + Tailwind CSS
- Vue.js + Vuetify
- Svelte + Material UI`;
    } else {
      result = `📝 タスク: "${prompt}"

シミュレーション応答:
${prompt}に関する創造的な解決策を提供します。

主なポイント:
1. ユーザーエクスペリエンスの向上
2. ビジュアル要素の最適化
3. パフォーマンスとアクセシビリティのバランス

実装の推奨事項:
- モダンなWeb技術の活用
- プログレッシブエンハンスメント
- モバイルファーストアプローチ`;
    }

    console.log(chalk.green('\n🤖 Gemini (シミュレーション):'));
    console.log(result);

    if (options.output) {
      await fs.writeFile(options.output, result);
      console.log(chalk.gray(`\n📁 結果を保存: ${options.output}`));
    }

    // セッションに記録
    await this.sessionManager.addMessage(sessionId, 'user', prompt);
    await this.sessionManager.addMessage(sessionId, 'assistant', result);

    console.log(chalk.cyan('\n💡 ヒント:'));
    console.log(chalk.gray('  実際のGemini機能を使用するには:'));
    console.log(chalk.gray('  1. Google AI Studio でAPIキーを取得'));
    console.log(chalk.gray('  2. uai config --set gemini.apiKey=<your-api-key>'));
    console.log(chalk.gray('  3. または Gemini CLI をインストール'));
  }

  /**
   * Gemini CLIを探す
   */
  private async findGeminiCLI(): Promise<string | null> {
    try {
      const paths = [
        '/usr/local/bin/gemini',
        '/usr/bin/gemini',
        path.join(process.env.HOME || '', '.local', 'bin', 'gemini'),
        path.join(process.env.HOME || '', 'bin', 'gemini')
      ];

      for (const geminiPath of paths) {
        try {
          await fs.access(geminiPath, fs.constants.X_OK);
          return geminiPath;
        } catch {
          // 次のパスを試す
        }
      }

      // whichコマンドで探す
      const { execSync } = require('child_process');
      try {
        const result = execSync('which gemini', { encoding: 'utf-8' }).trim();
        if (result) return result;
      } catch {
        // whichが失敗した場合
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * プロンプトからキーワードを抽出
   */
  private extractKeywords(prompt: string): string[] {
    // 簡単なキーワード抽出（実際にはより高度な処理が必要）
    const words = prompt.split(/\s+/);
    const stopWords = ['を', 'の', 'は', 'が', 'で', 'と', 'に', 'a', 'the', 'is', 'are', 'for', 'of', 'and'];
    
    return words
      .filter(word => word.length > 2 && !stopWords.includes(word.toLowerCase()))
      .slice(0, 5);
  }
}