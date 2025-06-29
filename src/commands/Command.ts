/**
 * Base command handler for CLI
 */

import { parseArguments } from '../utils';

export class Command {
  async run(args: string[]): Promise<void> {
    if (args.length === 0) {
      this.showHelp();
      return;
    }
    
    const command = args[0];
    const commandArgs = args.slice(1);
    
    switch (command) {
      case 'help':
      case '--help':
      case '-h':
        this.showHelp();
        break;
      
      case 'version':
      case '--version':
      case '-v':
        this.showVersion();
        break;
      
      case 'chat':
        await this.handleChat(commandArgs);
        break;
      
      case 'config':
        await this.handleConfig(commandArgs);
        break;
      
      default:
        console.error(`Unknown command: ${command}`);
        this.showHelp();
        process.exit(1);
    }
  }
  
  private showHelp(): void {
    console.log(`
UAI - Unified AI Interface

Usage: uai <command> [options]

Commands:
  chat      Start an interactive chat session
  config    Manage configuration
  help      Show this help message
  version   Show version information

Options:
  --provider <name>    Specify AI provider
  --model <name>       Specify model to use
  --help, -h          Show help for a command

Examples:
  uai chat
  uai chat --provider openai --model gpt-4
  uai config set defaultProvider openai
`);
  }
  
  private showVersion(): void {
    const packageJson = require('../../package.json');
    console.log(`UAI version ${packageJson.version}`);
  }
  
  private async handleChat(args: string[]): Promise<void> {
    const options = parseArguments(args);
    console.log('Starting chat session...');
    console.log('Options:', Object.fromEntries(options));
    // TODO: Implement chat functionality
  }
  
  private async handleConfig(args: string[]): Promise<void> {
    if (args.length === 0) {
      console.log('Config commands: get, set, list');
      return;
    }
    
    const subCommand = args[0];
    switch (subCommand) {
      case 'get':
        console.log('Getting config...');
        // TODO: Implement config get
        break;
      
      case 'set':
        console.log('Setting config...');
        // TODO: Implement config set
        break;
      
      case 'list':
        console.log('Listing config...');
        // TODO: Implement config list
        break;
      
      default:
        console.error(`Unknown config command: ${subCommand}`);
    }
  }
}