/**
 * SessionManager
 * 
 * ~/.ai-sessions/ でグローバルなセッション管理
 * 全てのAIツールの会話履歴を統一的に管理
 */

import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import chalk from 'chalk';

interface Session {
  id: string;
  tool: string;
  projectPath: string;
  startTime: Date;
  endTime?: Date;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
}

export class SessionManager {
  private sessionDir: string;
  private currentSessions: Map<string, Session> = new Map();

  constructor(sessionDir: string) {
    this.sessionDir = sessionDir;
    this.initializeSessionDir();
  }

  /**
   * セッションディレクトリの初期化
   */
  private async initializeSessionDir(): Promise<void> {
    try {
      await fs.mkdir(this.sessionDir, { recursive: true });
    } catch (error) {
      console.error(chalk.red('セッションディレクトリの作成に失敗しました:'), error);
    }
  }

  /**
   * 新しいセッションを作成
   */
  async createSession(tool: string, projectPath: string): Promise<string> {
    const sessionId = randomUUID();
    const session: Session = {
      id: sessionId,
      tool,
      projectPath,
      startTime: new Date(),
      messages: []
    };

    this.currentSessions.set(sessionId, session);
    await this.saveSession(session);

    return sessionId;
  }

  /**
   * セッションにメッセージを追加
   */
  async addMessage(sessionId: string, role: 'user' | 'assistant' | 'system', content: string): Promise<void> {
    const session = this.currentSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.messages.push({
      role,
      content,
      timestamp: new Date()
    });

    await this.saveSession(session);
  }

  /**
   * セッションを終了
   */
  async endSession(sessionId: string): Promise<void> {
    const session = this.currentSessions.get(sessionId);
    if (!session) {
      return;
    }

    session.endTime = new Date();
    await this.saveSession(session);
    this.currentSessions.delete(sessionId);
  }

  /**
   * セッションの統計を取得
   */
  async getSessionStats(sessionId: string): Promise<{
    messageCount: number;
    duration: string;
  }> {
    const session = await this.loadSession(sessionId);
    if (!session) {
      return { messageCount: 0, duration: '0分0秒' };
    }

    const messageCount = session.messages.length;
    const startTime = new Date(session.startTime);
    const endTime = session.endTime ? new Date(session.endTime) : new Date();
    const durationMs = endTime.getTime() - startTime.getTime();
    
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);
    const duration = `${minutes}分${seconds}秒`;

    return { messageCount, duration };
  }

  /**
   * セッション一覧を表示
   */
  async listSessions(): Promise<void> {
    try {
      const files = await fs.readdir(this.sessionDir);
      const sessionFiles = files.filter(f => f.endsWith('.json'));

      if (sessionFiles.length === 0) {
        console.log(chalk.gray('セッションがありません'));
        return;
      }

      console.log(chalk.blue('📋 セッション一覧:\n'));

      const sessions: Session[] = [];
      for (const file of sessionFiles) {
        const session = await this.loadSession(path.basename(file, '.json'));
        if (session) {
          sessions.push(session);
        }
      }

      // 日付でソート（新しい順）
      sessions.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      );

      // グループ化して表示
      const groupedByDate = this.groupByDate(sessions);

      for (const [date, dateSessions] of Object.entries(groupedByDate)) {
        console.log(chalk.yellow(`📅 ${date}`));
        
        for (const session of dateSessions) {
          const startTime = new Date(session.startTime);
          const timeStr = startTime.toLocaleTimeString('ja-JP', { 
            hour: '2-digit', 
            minute: '2-digit' 
          });
          
          const toolIcon = this.getToolIcon(session.tool);
          const messageCount = session.messages.length;
          const projectName = path.basename(session.projectPath);

          console.log(
            chalk.gray(`  ${timeStr} `) +
            `${toolIcon} ${chalk.cyan(session.tool)} ` +
            chalk.gray(`(${messageCount}メッセージ) `) +
            chalk.blue(`📁 ${projectName}`)
          );
        }
        console.log('');
      }

    } catch (error) {
      console.error(chalk.red('セッション一覧の取得に失敗しました:'), error);
    }
  }

  /**
   * セッション詳細を表示
   */
  async showSession(sessionId: string): Promise<void> {
    try {
      const session = await this.loadSession(sessionId);
      if (!session) {
        console.log(chalk.red('セッションが見つかりません'));
        return;
      }

      const startTime = new Date(session.startTime);
      const endTime = session.endTime ? new Date(session.endTime) : null;

      console.log(chalk.blue('\n📊 セッション詳細:'));
      console.log(chalk.gray('─'.repeat(50)));
      console.log(`ID: ${session.id}`);
      console.log(`ツール: ${this.getToolIcon(session.tool)} ${session.tool}`);
      console.log(`プロジェクト: ${session.projectPath}`);
      console.log(`開始時刻: ${startTime.toLocaleString('ja-JP')}`);
      if (endTime) {
        console.log(`終了時刻: ${endTime.toLocaleString('ja-JP')}`);
      }
      console.log(chalk.gray('─'.repeat(50)));
      console.log('\n📝 会話履歴:\n');

      for (const msg of session.messages) {
        const timestamp = new Date(msg.timestamp);
        const timeStr = timestamp.toLocaleTimeString('ja-JP', { 
          hour: '2-digit', 
          minute: '2-digit',
          second: '2-digit'
        });

        if (msg.role === 'user') {
          console.log(chalk.blue(`[${timeStr}] 👤 User:`));
          console.log(chalk.white(msg.content));
        } else if (msg.role === 'assistant') {
          console.log(chalk.green(`[${timeStr}] 🤖 Assistant:`));
          console.log(chalk.gray(msg.content));
        }
        console.log('');
      }

    } catch (error) {
      console.error(chalk.red('セッション詳細の取得に失敗しました:'), error);
    }
  }

  /**
   * 全セッションをクリア
   */
  async clearSessions(): Promise<void> {
    try {
      const files = await fs.readdir(this.sessionDir);
      const sessionFiles = files.filter(f => f.endsWith('.json'));

      for (const file of sessionFiles) {
        await fs.unlink(path.join(this.sessionDir, file));
      }

      console.log(chalk.green('✅ 全セッションをクリアしました'));
    } catch (error) {
      console.error(chalk.red('セッションのクリアに失敗しました:'), error);
    }
  }

  /**
   * セッションを保存
   */
  private async saveSession(session: Session): Promise<void> {
    try {
      const filePath = path.join(this.sessionDir, `${session.id}.json`);
      await fs.writeFile(filePath, JSON.stringify(session, null, 2));
    } catch (error) {
      console.error(chalk.red('セッションの保存に失敗しました:'), error);
    }
  }

  /**
   * セッションを読み込み
   */
  private async loadSession(sessionId: string): Promise<Session | null> {
    try {
      const filePath = path.join(this.sessionDir, `${sessionId}.json`);
      const data = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(data) as Session;
    } catch {
      return null;
    }
  }

  /**
   * 日付でグループ化
   */
  private groupByDate(sessions: Session[]): Record<string, Session[]> {
    const grouped: Record<string, Session[]> = {};

    for (const session of sessions) {
      const date = new Date(session.startTime).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'short'
      });

      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(session);
    }

    return grouped;
  }

  /**
   * ツールアイコンを取得
   */
  private getToolIcon(tool: string): string {
    const icons: Record<string, string> = {
      'claude-code': '🤖',
      'o3-mcp': '🔍',
      'gemini-cli': '🎨'
    };
    return icons[tool] || '🔧';
  }
}