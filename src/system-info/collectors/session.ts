import type { SessionInfo } from '../types';

export async function collectSessionInfo(context: any): Promise<SessionInfo> {
  return {
    id: context.sessionID || 'unknown',
    pid: process.pid,
    workingDirectory: process.cwd(),
    command: process.argv.join(' '),
    terminal: detectTerminal()
  };
}

function detectTerminal(): string | null {
  // Check if running in TTY
  if (process.stdout.isTTY) {
    return process.env['TERM'] || 'tty';
  }
  
  // Check for specific terminal env vars
  if (process.env['KITTY_WINDOW_ID']) return 'kitty';
  if (process.env['TERM_PROGRAM']) return process.env['TERM_PROGRAM'];
  
  return null;
}
