/**
 * Claude Code Provider
 * 
 * Claude Code との統合を提供
 * - インタラクティブセッション（本来のClaude Code体験）
 * - ヘッドレス単発実行
 */

import { Anthropic } from '@anthropic-ai/sdk';
import { spawn } from 'child_process';
import * as readline from 'readline';
import chalk from 'chalk';
import ora from 'ora';
import { SessionManager } from '../../session/SessionManager';
import { ConfigManager } from '../../config/ConfigManager';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';

export class ClaudeCodeProvider {
  private config: ConfigManager;
  private sessionManager: SessionManager;
  private anthropic?: Anthropic;

  constructor(config: ConfigManager, sessionManager: SessionManager) {
    this.config = config;
    this.sessionManager = sessionManager;
  }

  /**
   * インタラクティブセッションを開始
   * 本来のClaude Code体験を完全に再現
   */
  async startInteractiveSession(projectPath: string): Promise<void> {
    const sessionId = await this.sessionManager.createSession('claude-code', projectPath);

    // Claude CLIがインストールされているか確認
    const claudeCLIPath = await this.findClaudeCLI();
    console.log(chalk.gray(`Claude CLI パス: ${claudeCLIPath || '見つかりません'}`));
    
    if (claudeCLIPath) {
      // ネイティブClaude CLIを使用（最高の体験）
      await this.startNativeClaudeSession(projectPath, sessionId);
    } else {
      // SDK版インタラクティブセッション（フォールバック）
      await this.startSDKInteractiveSession(projectPath, sessionId);
    }
  }

  /**
   * ネイティブClaude CLIセッション（完全なセッション記録付き）
   */
  private async startNativeClaudeSession(projectPath: string, sessionId: string): Promise<void> {
    console.log(chalk.cyan('🚀 Claude Code ネイティブセッション開始...'));
    console.log(chalk.gray('💬 exit と入力して終了'));
    console.log(chalk.gray('📝 セッション記録: 完全版'));
    console.log('');

    const pty = require('node-pty');
    
    // PTY (擬似端末) を使用してClaude CLIを起動
    let claudeProcess: any;
    try {
      claudeProcess = pty.spawn('claude', [], {
        name: 'xterm-color',
        cols: process.stdout.columns || 80,
        rows: process.stdout.rows || 24,
        cwd: projectPath,
        env: process.env
      });
    } catch (error) {
      console.log(chalk.yellow('node-ptyが利用できません。パイプモードで起動します...'));
      await this.startNativeClaudeSessionWithPipe(projectPath, sessionId);
      return;
    }

    let sessionContent = '';
    let currentLine = '';
    let isUserInput = false;

    // Claude CLIの出力を処理
    claudeProcess.on('data', (data: string) => {
      process.stdout.write(data);
      sessionContent += data;
      currentLine += data;
      
      // 改行を検出してメッセージを分析
      if (data.includes('\n')) {
        const lines = currentLine.split('\n');
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          
          // ユーザー入力のプロンプトを検出
          if (line.startsWith('>') || line.endsWith('>')) {
            isUserInput = true;
          }
        }
        currentLine = lines[lines.length - 1];
      }
    });

    // ユーザー入力を処理
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    let userInput = '';
    process.stdin.on('data', (key: string) => {
      // Ctrl+C
      if (key === '\u0003') {
        claudeProcess.kill();
        return;
      }
      
      // 入力をClaude CLIに転送
      claudeProcess.write(key);
      
      // エンターキーで入力確定
      if (key === '\r' || key === '\n') {
        if (userInput.trim() && isUserInput) {
          // ユーザー入力を記録
          this.sessionManager.addMessage(sessionId, 'user', userInput.trim()).catch(() => {});
          isUserInput = false;
        }
        userInput = '';
      } else if (key.charCodeAt(0) === 127) { // バックスペース
        userInput = userInput.slice(0, -1);
      } else if (key.charCodeAt(0) >= 32) { // 印字可能文字
        userInput += key;
      }
    });

    // ウィンドウサイズ変更に対応
    process.stdout.on('resize', () => {
      claudeProcess.resize(
        process.stdout.columns || 80,
        process.stdout.rows || 24
      );
    });

    // プロセス終了時の処理
    claudeProcess.on('exit', async () => {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
      
      // セッション全体のログを記録
      await this.sessionManager.addMessage(sessionId, 'system', 
        `=== セッション完全ログ ===\n${sessionContent}`);
      
      await this.sessionManager.endSession(sessionId);
      
      // セッション統計
      const stats = await this.sessionManager.getSessionStats(sessionId);
      console.log(chalk.blue('\n📊 セッション統計:'));
      console.log(chalk.gray(`  - 実行時間: ${stats.duration}`));
      console.log(chalk.gray(`  - メッセージ数: ${stats.messageCount}`));
      console.log(chalk.gray(`  - セッションID: ${sessionId}`));
      console.log(chalk.green(`  - 📝 完全なセッションログが記録されました`));
      
      console.log(chalk.yellow('\n👋 Claude Code セッション終了'));
      
      // 他ツールの提案
      this.suggestNextActions();
      
      process.exit(0);
    });
  }

  /**
   * ネイティブClaude CLIセッション（パイプモード）
   */
  private async startNativeClaudeSessionWithPipe(projectPath: string, sessionId: string): Promise<void> {
    console.log(chalk.cyan('📝 パイプモードでセッション記録を行います'));
    
    const claudeProcess = spawn('claude', [], {
      cwd: projectPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env
    });

    let fullOutput = '';
    let currentUserInput = '';
    let waitingForInput = false;

    // 標準出力を処理
    claudeProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      fullOutput += output;
      
      // プロンプトを検出
      if (output.includes('>') && output.trim().endsWith('>')) {
        waitingForInput = true;
      }
    });

    // 標準エラー出力を処理
    claudeProcess.stderr.on('data', (data) => {
      process.stderr.write(data);
      fullOutput += data.toString();
    });

    // 標準入力を設定
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }
    process.stdin.resume();
    
    process.stdin.on('data', (data) => {
      const key = data.toString();
      
      // Ctrl+C
      if (key === '\u0003') {
        claudeProcess.kill();
        process.exit();
      }
      
      // Claude CLIに転送
      claudeProcess.stdin.write(key);
      
      // ユーザー入力を追跡
      if (key === '\r' || key === '\n') {
        if (currentUserInput.trim() && waitingForInput) {
          this.sessionManager.addMessage(sessionId, 'user', currentUserInput.trim()).catch(() => {});
          waitingForInput = false;
        }
        currentUserInput = '';
      } else if (key.charCodeAt(0) === 127) { // バックスペース
        currentUserInput = currentUserInput.slice(0, -1);
        process.stdout.write('\b \b'); // 画面上でバックスペースを表示
      } else if (key.charCodeAt(0) >= 32) {
        currentUserInput += key;
        process.stdout.write(key); // エコーバック
      }
    });

    // プロセス終了時
    claudeProcess.on('exit', async () => {
      if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
      }
      process.stdin.pause();
      
      // 完全なログを保存
      await this.sessionManager.addMessage(sessionId, 'system', 
        `=== セッション完全ログ ===\n${fullOutput}`);
      
      await this.sessionManager.endSession(sessionId);
      
      const stats = await this.sessionManager.getSessionStats(sessionId);
      console.log(chalk.blue('\n📊 セッション統計:'));
      console.log(chalk.gray(`  - 実行時間: ${stats.duration}`));
      console.log(chalk.gray(`  - メッセージ数: ${stats.messageCount}`));
      console.log(chalk.green(`  - 📝 セッションログが記録されました`));
      
      console.log(chalk.yellow('\n👋 Claude Code セッション終了'));
      this.suggestNextActions();
      
      process.exit(0);
    });
  }

  /**
   * SDK版インタラクティブセッション
   */
  private async startSDKInteractiveSession(projectPath: string, sessionId: string): Promise<void> {
    console.log(chalk.cyan('💬 メッセージを入力してください (exit で終了)'));
    console.log('');

    // APIキーの確認
    const apiKey = this.config.get('claude.apiKey') || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error(chalk.red('エラー: Claude APIキーが設定されていません'));
      console.log(chalk.yellow('設定方法: uai config --set claude.apiKey=<your-api-key>'));
      return;
    }

    this.anthropic = new Anthropic({ apiKey });

    // readlineインターフェースの設定
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.blue('> ')
    });

    // 会話履歴
    const messages: Array<{ role: 'user' | 'assistant', content: string }> = [];

    // プロンプト表示
    rl.prompt();

    // 入力処理
    rl.on('line', async (input) => {
      const trimmedInput = input.trim();

      // 終了コマンド
      if (trimmedInput.toLowerCase() === 'exit') {
        rl.close();
        return;
      }

      // 空入力は無視
      if (!trimmedInput) {
        rl.prompt();
        return;
      }

      try {
        // ユーザーメッセージを追加
        messages.push({ role: 'user', content: trimmedInput });

        // スピナー表示
        const spinner = ora('Claude Code 処理中...').start();

        // Claude APIを呼び出し（ストリーミング）
        const response = await this.anthropic!.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          messages: messages,
          max_tokens: 4096,
          stream: true,
          system: `You are Claude Code, an AI assistant helping with coding tasks in the project at ${projectPath}.
          Current working directory: ${projectPath}
          Provide helpful, concise responses focused on the task at hand.`
        });

        spinner.stop();
        console.log(''); // 改行

        // ストリーミングレスポンスの処理
        let assistantMessage = '';
        process.stdout.write(chalk.green('🤖 '));

        for await (const chunk of response) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            const text = chunk.delta.text;
            assistantMessage += text;
            process.stdout.write(text);
          }
        }

        console.log('\n'); // 改行

        // アシスタントメッセージを履歴に追加
        messages.push({ role: 'assistant', content: assistantMessage });

        // セッションに記録
        await this.sessionManager.addMessage(sessionId, 'user', trimmedInput);
        await this.sessionManager.addMessage(sessionId, 'assistant', assistantMessage);

      } catch (error) {
        console.error(chalk.red('\nエラー:'), error instanceof Error ? error.message : 'Unknown error');
      }

      // 次のプロンプト
      rl.prompt();
    });

    // Ctrl+C処理
    rl.on('SIGINT', () => {
      console.log(chalk.yellow('\n\n👋 中断されました'));
      rl.close();
    });

    // セッション終了処理
    rl.on('close', async () => {
      await this.sessionManager.endSession(sessionId);
      
      // セッション統計
      const stats = await this.sessionManager.getSessionStats(sessionId);
      console.log(chalk.blue('\n📊 セッション統計:'));
      console.log(chalk.gray(`  - メッセージ数: ${stats.messageCount}`));
      console.log(chalk.gray(`  - 実行時間: ${stats.duration}`));
      
      console.log(chalk.yellow('\n👋 セッション終了'));
      
      // 他ツールの提案
      this.suggestNextActions();
      
      process.exit(0);
    });
  }

  /**
   * 単発実行（ヘッドレスモード）
   */
  async executePrompt(prompt: string, projectPath: string): Promise<void> {
    const sessionId = await this.sessionManager.createSession('claude-code', projectPath);

    try {
      // APIキーの確認
      const apiKey = this.config.get('claude.apiKey') || process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('Claude APIキーが設定されていません');
      }

      this.anthropic = new Anthropic({ apiKey });

      // スピナー表示
      const spinner = ora('Claude Code 実行中...').start();

      // Claude APIを呼び出し
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096,
        system: `You are Claude Code, an AI assistant helping with coding tasks in the project at ${projectPath}.
        Current working directory: ${projectPath}
        Provide a focused, actionable response.`
      });

      spinner.stop();

      // レスポンス表示
      console.log(chalk.green('\n🤖 Claude Code:'));
      console.log(response.content[0].type === 'text' ? response.content[0].text : '');

      // セッションに記録
      await this.sessionManager.addMessage(sessionId, 'user', prompt);
      await this.sessionManager.addMessage(sessionId, 'assistant', 
        response.content[0].type === 'text' ? response.content[0].text : '');

    } catch (error) {
      console.error(chalk.red('エラー:'), error instanceof Error ? error.message : 'Unknown error');
    } finally {
      await this.sessionManager.endSession(sessionId);
    }
  }

  /**
   * Claude CLIを探す
   */
  private async findClaudeCLI(): Promise<string | null> {
    try {
      // 一般的なインストール場所をチェック
      const paths = [
        '/usr/local/bin/claude',
        '/usr/bin/claude',
        path.join(os.homedir(), '.local', 'bin', 'claude'),
        path.join(os.homedir(), 'bin', 'claude')
      ];

      for (const claudePath of paths) {
        try {
          await fs.access(claudePath, fs.constants.X_OK);
          return claudePath;
        } catch {
          // 次のパスを試す
        }
      }

      // whichコマンドで探す
      try {
        const { execSync } = require('child_process');
        const result = execSync('which claude', { encoding: 'utf-8' }).trim();
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
   * 次のアクション提案
   */
  private suggestNextActions(): void {
    console.log(chalk.cyan('\n💡 次のアクション提案:'));
    console.log(chalk.gray('  🔍 最新技術動向の調査'));
    console.log(chalk.gray('    → uai o3 "調査したいトピック"'));
    console.log(chalk.gray('  🎨 UI/UXの改善提案'));
    console.log(chalk.gray('    → uai gemini "改善したいUI"'));
    console.log(chalk.gray('  📊 セッション履歴の確認'));
    console.log(chalk.gray('    → uai sessions --list'));
  }
}