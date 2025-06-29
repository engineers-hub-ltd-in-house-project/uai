#!/usr/bin/env node
/**
 * UAI CLI - Unified AI Interface
 * 
 * 統合AIインターフェース - Claude Code, O3 MCP, Gemini CLIを統合
 */

import { program } from 'commander';
import chalk from 'chalk';
import { ClaudeCodeProvider } from './providers/claude-code';
import { O3MCPProvider } from './providers/o3-mcp';
import { GeminiCLIProvider } from './providers/gemini-cli';
import { SessionManager } from './session/SessionManager';
import { ConfigManager } from './config/ConfigManager';
import path from 'path';
import os from 'os';

// バージョン情報
const VERSION = '1.0.0';

// グローバル設定
const SESSION_DIR = path.join(os.homedir(), '.ai-sessions');
const CONFIG_DIR = path.join(os.homedir(), '.config', 'uai');

async function main() {
  // 設定マネージャーの初期化
  const configManager = new ConfigManager(CONFIG_DIR);
  await configManager.load();

  // セッションマネージャーの初期化
  const sessionManager = new SessionManager(SESSION_DIR);

  // プログラムの設定
  program
    .name('uai')
    .description('統合AIインターフェース - 複数のAIツールを統一的に使用')
    .version(VERSION);

  // Claude Code コマンド
  program
    .command('claude [prompt...]')
    .description('Claude Code を実行（プロンプトなしでインタラクティブセッション）')
    .option('-p, --project <path>', 'プロジェクトパス', process.cwd())
    .option('--no-interactive', 'インタラクティブモードを無効化')
    .action(async (promptParts, options) => {
      const provider = new ClaudeCodeProvider(configManager, sessionManager);
      const prompt = promptParts?.join(' ');

      if (!prompt && options.interactive !== false) {
        // インタラクティブセッション開始
        console.log(chalk.blue('🎯 Claude Code インタラクティブセッション開始'));
        console.log(chalk.gray(`📁 プロジェクト: ${options.project}`));
        await provider.startInteractiveSession(options.project);
      } else if (prompt) {
        // 単発実行（ヘッドレスモード）
        console.log(chalk.blue('🤖 Claude Code 実行中...'));
        await provider.executePrompt(prompt, options.project);
      } else {
        console.error(chalk.red('エラー: プロンプトを指定するか、インタラクティブモードを使用してください'));
        process.exit(1);
      }
    });

  // O3 MCP コマンド
  program
    .command('o3 <prompt...>')
    .description('O3 MCP で最新技術情報を調査')
    .option('-f, --format <format>', '出力形式 (text/json/markdown)', 'markdown')
    .action(async (promptParts, options) => {
      const provider = new O3MCPProvider(configManager, sessionManager);
      const prompt = promptParts.join(' ');

      console.log(chalk.green('🔍 O3 MCP 調査中...'));
      await provider.search(prompt, options);
    });

  // Gemini CLI コマンド
  program
    .command('gemini <prompt...>')
    .description('Gemini CLI でビジュアル/創造的タスクを実行')
    .option('-i, --image <path>', '画像入力パス')
    .option('-o, --output <path>', '出力パス')
    .action(async (promptParts, options) => {
      const provider = new GeminiCLIProvider(configManager, sessionManager);
      const prompt = promptParts.join(' ');

      console.log(chalk.magenta('🎨 Gemini CLI 実行中...'));
      await provider.execute(prompt, options);
    });

  // セッション管理コマンド
  program
    .command('sessions')
    .description('セッション履歴を管理')
    .option('-l, --list', 'セッション一覧を表示')
    .option('-s, --show <id>', 'セッション詳細を表示')
    .option('-c, --clear', '全セッションをクリア')
    .action(async (options) => {
      if (options.list) {
        await sessionManager.listSessions();
      } else if (options.show) {
        await sessionManager.showSession(options.show);
      } else if (options.clear) {
        await sessionManager.clearSessions();
      } else {
        program.outputHelp();
      }
    });

  // 設定コマンド
  program
    .command('config')
    .description('UAI設定を管理')
    .option('-s, --set <key=value>', '設定値をセット')
    .option('-g, --get <key>', '設定値を取得')
    .option('-l, --list', '全設定を表示')
    .option('-r, --reset', '設定をリセット')
    .action(async (options) => {
      if (options.set) {
        const [key, ...valueParts] = options.set.split('=');
        const value = valueParts.join('=');
        await configManager.set(key, value);
        console.log(chalk.green(`✅ 設定を更新: ${key} = ${value}`));
      } else if (options.get) {
        const value = configManager.get(options.get);
        console.log(value || chalk.gray('(未設定)'));
      } else if (options.list) {
        await configManager.list();
      } else if (options.reset) {
        await configManager.reset();
        console.log(chalk.green('✅ 設定をリセットしました'));
      } else {
        program.outputHelp();
      }
    });

  // ヘルプメッセージのカスタマイズ
  program.on('--help', () => {
    console.log('');
    console.log('使用例:');
    console.log('');
    console.log('  # Claude Code インタラクティブセッション');
    console.log('  $ uai claude');
    console.log('');
    console.log('  # Claude Code 単発実行');
    console.log('  $ uai claude "Reactコンポーネントを作成"');
    console.log('');
    console.log('  # O3 MCP で技術調査');
    console.log('  $ uai o3 "React 19の新機能"');
    console.log('');
    console.log('  # Gemini CLI で画像生成');
    console.log('  $ uai gemini "美しい夕焼けの風景" -o sunset.png');
    console.log('');
  });

  // エラーハンドリング
  process.on('SIGINT', () => {
    console.log('\n' + chalk.yellow('👋 中断されました'));
    process.exit(0);
  });

  // コマンド実行
  await program.parseAsync(process.argv);

  // コマンドが指定されていない場合
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }
}

// メイン関数の実行
main().catch((error) => {
  console.error(chalk.red('エラー:'), error.message);
  process.exit(1);
});