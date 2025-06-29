/**
 * Utility functions and helpers
 */

export function parseArguments(args: string[]): Map<string, string | boolean> {
  const parsed = new Map<string, string | boolean>();
  
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = args[i + 1];
      
      if (nextArg && !nextArg.startsWith('--')) {
        parsed.set(key, nextArg);
        i++;
      } else {
        parsed.set(key, true);
      }
    } else if (arg.startsWith('-')) {
      const key = arg.slice(1);
      parsed.set(key, true);
    }
  }
  
  return parsed;
}

export function formatMessage(role: string, content: string): string {
  return `[${role.toUpperCase()}]: ${content}`;
}