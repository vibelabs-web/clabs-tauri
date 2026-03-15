#!/usr/bin/env node
/**
 * Gemini MCP Server (Node.js)
 *
 * Google gemini CLI를 래핑하는 MCP 서버
 * OAuth 인증 사용 (API 키 아님)
 *
 * 사전 요구사항:
 *   npm install -g @google/gemini-cli
 *   gemini  # 첫 실행 시 OAuth 인증
 */

import { spawn } from 'child_process';
import * as readline from 'readline';

// MCP Protocol constants
const JSONRPC_VERSION = '2.0';

// Available tools
const TOOLS = [
  {
    name: 'gemini_ask_question',
    description: 'Ask a development-related question to Gemini AI',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The question to ask Gemini' },
        context: { type: 'string', description: 'Optional context for the question' }
      },
      required: ['question']
    }
  },
  {
    name: 'gemini_status',
    description: 'Check Gemini MCP server status and configuration',
    inputSchema: {
      type: 'object',
      properties: {}
    }
  },
  {
    name: 'gemini_design_component',
    description: 'Design a frontend UI component using Gemini AI',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Component description' },
        framework: { type: 'string', description: 'Framework (React, Vue, Svelte)', default: 'React' },
        styling: { type: 'string', description: 'Styling (Tailwind, CSS, styled-components)', default: 'Tailwind CSS' }
      },
      required: ['description']
    }
  },
  {
    name: 'gemini_code_review',
    description: 'Get code review and suggestions from Gemini AI',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'The code to review' },
        focus_areas: { type: 'string', description: 'Focus areas for the review' }
      },
      required: ['code']
    }
  },
  {
    name: 'gemini_generate_code',
    description: 'Generate code based on a description using Gemini AI',
    inputSchema: {
      type: 'object',
      properties: {
        description: { type: 'string', description: 'Description of the code to generate' },
        language: { type: 'string', description: 'Programming language', default: 'TypeScript' }
      },
      required: ['description']
    }
  }
];

/**
 * Call gemini CLI with a prompt
 */
async function callGemini(prompt) {
  return new Promise((resolve, reject) => {
    // Windows에서는 gemini.cmd, Unix에서는 gemini
    const isWindows = process.platform === 'win32';
    const cmd = isWindows ? 'cmd' : 'gemini';
    const args = isWindows ? ['/c', 'gemini', '-p', prompt] : ['-p', prompt];

    const child = spawn(cmd, args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      shell: false
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr || `gemini exited with code ${code}`));
      }
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to run gemini CLI: ${err.message}`));
    });
  });
}

/**
 * Handle tool calls
 */
async function handleToolCall(name, args) {
  switch (name) {
    case 'gemini_ask_question': {
      const { question, context } = args;
      const prompt = context
        ? `Context: ${context}\n\nQuestion: ${question}`
        : question;
      return await callGemini(prompt);
    }

    case 'gemini_status': {
      try {
        // Check if gemini CLI is available
        const isWindows = process.platform === 'win32';
        const cmd = isWindows ? 'cmd' : 'gemini';
        const checkArgs = isWindows ? ['/c', 'gemini', '--version'] : ['--version'];

        return new Promise((resolve) => {
          const child = spawn(cmd, checkArgs, { stdio: ['pipe', 'pipe', 'pipe'] });
          let version = '';
          child.stdout.on('data', (data) => { version += data.toString(); });
          child.on('close', (code) => {
            if (code === 0) {
              resolve(`Gemini MCP Server: OK\nGemini CLI version: ${version.trim()}\nAuth: OAuth (via gemini CLI)`);
            } else {
              resolve('Gemini MCP Server: ERROR\nGemini CLI not found. Run: npm install -g @google/gemini-cli');
            }
          });
          child.on('error', () => {
            resolve('Gemini MCP Server: ERROR\nGemini CLI not found. Run: npm install -g @google/gemini-cli');
          });
        });
      } catch (e) {
        return `Gemini MCP Server: ERROR\n${e.message}`;
      }
    }

    case 'gemini_design_component': {
      const { description, framework = 'React', styling = 'Tailwind CSS' } = args;
      const prompt = `Design a ${framework} UI component with ${styling}.\n\nComponent: ${description}\n\nProvide the complete code with proper styling and best practices.`;
      return await callGemini(prompt);
    }

    case 'gemini_code_review': {
      const { code, focus_areas } = args;
      const prompt = focus_areas
        ? `Review this code, focusing on: ${focus_areas}\n\nCode:\n${code}`
        : `Review this code and provide suggestions for improvement:\n\nCode:\n${code}`;
      return await callGemini(prompt);
    }

    case 'gemini_generate_code': {
      const { description, language = 'TypeScript' } = args;
      const prompt = `Generate ${language} code for the following:\n\n${description}\n\nProvide clean, well-documented code.`;
      return await callGemini(prompt);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Send JSON-RPC response
 */
function sendResponse(id, result) {
  const response = {
    jsonrpc: JSONRPC_VERSION,
    id,
    result
  };
  console.log(JSON.stringify(response));
}

/**
 * Send JSON-RPC error
 */
function sendError(id, code, message) {
  const response = {
    jsonrpc: JSONRPC_VERSION,
    id,
    error: { code, message }
  };
  console.log(JSON.stringify(response));
}

/**
 * Handle incoming JSON-RPC request
 */
async function handleRequest(request) {
  const { id, method, params } = request;

  try {
    switch (method) {
      case 'initialize':
        sendResponse(id, {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {}
          },
          serverInfo: {
            name: 'gemini-mcp',
            version: '1.0.0'
          }
        });
        break;

      case 'notifications/initialized':
        // No response needed for notifications
        break;

      case 'tools/list':
        sendResponse(id, { tools: TOOLS });
        break;

      case 'tools/call': {
        const { name, arguments: args } = params;
        const result = await handleToolCall(name, args || {});
        sendResponse(id, {
          content: [{ type: 'text', text: result }]
        });
        break;
      }

      default:
        if (id !== undefined) {
          sendError(id, -32601, `Method not found: ${method}`);
        }
    }
  } catch (error) {
    if (id !== undefined) {
      sendError(id, -32603, error.message);
    }
  }
}

/**
 * Main entry point
 */
async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on('line', async (line) => {
    if (!line.trim()) return;

    try {
      const request = JSON.parse(line);
      await handleRequest(request);
    } catch (error) {
      sendError(null, -32700, 'Parse error');
    }
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

main();
