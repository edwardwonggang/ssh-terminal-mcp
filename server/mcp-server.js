/**
 * MCP (Model Context Protocol) Server
 * 提供终端命令执行和内容获取功能
 */
export class MCPServer {
  constructor(sshSessions) {
    this.sshSessions = sshSessions;
    this.tools = this.defineTools();
  }

  defineTools() {
    return [
      {
        name: 'execute_command',
        description: 'Execute a command in the SSH terminal session',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'The SSH session ID'
            },
            command: {
              type: 'string',
              description: 'The command to execute'
            },
            timeout: {
              type: 'number',
              description: 'Command timeout in milliseconds (default: 30000)',
              default: 30000
            }
          },
          required: ['sessionId', 'command']
        }
      },
      {
        name: 'get_terminal_content',
        description: 'Get the recent terminal output content',
        inputSchema: {
          type: 'object',
          properties: {
            sessionId: {
              type: 'string',
              description: 'The SSH session ID'
            },
            lines: {
              type: 'number',
              description: 'Number of lines to retrieve (default: 100)',
              default: 100
            }
          },
          required: ['sessionId']
        }
      },
      {
        name: 'list_sessions',
        description: 'List all active SSH sessions',
        inputSchema: {
          type: 'object',
          properties: {}
        }
      }
    ];
  }

  async executeCommand(sessionId, command, timeout = 30000) {
    const session = this.sshSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const manager = session.manager || session;
    if (!manager.isConnected()) {
      throw new Error(`Session ${sessionId} is not connected`);
    }

    try {
      const result = await manager.executeCommand(command, timeout);
      return {
        success: true,
        sessionId,
        command,
        exitCode: result.exitCode,
        output: result.output,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        sessionId,
        command,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async getTerminalContent(sessionId, lines = 100) {
    const session = this.sshSessions.get(sessionId);
    
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    const manager = session.manager || session;
    try {
      const content = manager.getBufferContent(lines);
      return {
        success: true,
        sessionId,
        lines,
        content,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        sessionId,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  listSessions() {
    const sessions = Array.from(this.sshSessions.keys()).map(sessionId => {
      const session = this.sshSessions.get(sessionId);
      const manager = session.manager || session;
      return {
        sessionId,
        type: session.type,
        connected: manager.isConnected()
      };
    });

    return {
      success: true,
      sessions,
      count: sessions.length,
      timestamp: new Date().toISOString()
    };
  }

  getTools() {
    return this.tools;
  }
}