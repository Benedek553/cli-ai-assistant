#!/usr/bin/env node
import OpenAI from 'openai';
import winston from 'winston';
import fs from 'fs';
import 'dotenv/config';
import readline from 'readline';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validate API key on startup
if (!process.env.OPENAI_API_KEY) {
  console.error('Error: OPENAI_API_KEY environment variable is not set.');
  console.error('Please set it using: export OPENAI_API_KEY="your_api_key_here"');
  process.exit(1);
}

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default model used on startup and for all requests unless changed via /model-selection
let currentModel = 'gpt-3.5-turbo';

// Create data directory for logs and temporary files
// Use user's home directory for data storage
const dataDir = path.join(os.homedir(), '.cli-ai-assistant');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.File({ filename: path.join(dataDir, 'app.log') })
  ]
});

async function previousCommand() {
  try {
    const commandFile = path.join(dataDir, 'command.txt');
    if (fs.existsSync(commandFile)) {
      const command = fs.readFileSync(commandFile, 'utf-8').trim();
      return command;
    }
    return null;
  } catch (err) {
    logger.error('Error reading previous command:', err);
    return null;
  }
}
async function previousCommandOutput() {
  try {
    const outputFile = path.join(dataDir, 'command_output.txt');
    if (fs.existsSync(outputFile)) {
      const output = fs.readFileSync(outputFile, 'utf-8').trim();
      return output;
    }
    return null;
  } catch (err) {
    logger.error('Error reading previous command output:', err);
    return null;
  }
}

function openGitHubIssues() {
  try {
    const issuesUrl = "https://github.com/Benedek553/cli-ai-assistant/issues";
    const platform = process.platform;
    let command;
    
    if (platform === 'darwin') {
      command = `open "${issuesUrl}"`;
    } else if (platform === 'win32') {
      command = `start "${issuesUrl}"`;
    } else {
      command = `xdg-open "${issuesUrl}"`;
    }
    
    exec(command, (err) => {
      if (err) {
        console.log(`Error opening GitHub issues: ${err.message}`);
        console.log(`Please visit: ${issuesUrl}`);
      } else {
        console.log('Opened GitHub issues page in your default browser.');
      }
    });
  } catch (err) {
    console.log('Error opening GitHub issues:', err.message);
  }
}

async function modelSelection() {
  process.stdout.write('Select a model:\n');
  const models = ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'];
  models.forEach((model, index) => {
    process.stdout.write(`${index + 1}. ${model}\n`);
  });
  process.stdout.write('> ');

  return new Promise((resolve) => {
    rl.once('line', (line) => {
      const selectedIndex = parseInt(line.trim(), 10) - 1;
      if (selectedIndex >= 0 && selectedIndex < models.length) {
        const chosen = models[selectedIndex];
        currentModel = chosen;
        process.stdout.write(`Model set to ${currentModel}.\n`);
        resolve(chosen);
      } else {
        process.stdout.write('Invalid selection. Defaulting to gpt-3.5-turbo.\n');
        currentModel = 'gpt-3.5-turbo';
        resolve(currentModel);
      }
    });
  });
}

async function getAIResponse(prompt, onData) {
  try {
    const lastCommand = await previousCommand();
    const lastCommandOutput = await previousCommandOutput();
    
    // Initialize OpenAI client with API key
    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    // Build the user message
    let userMessage = prompt;
    if (lastCommand && lastCommandOutput) {
      userMessage += `\n\nContext: I previously ran this command: ${lastCommand}\nOutput: ${lastCommandOutput}`;
    }
    
    const stream = await client.chat.completions.create({
      model: currentModel,
      messages: [
        {
          role: "system",
          content: "You are a helpful command line AI assistant. Provide concise and accurate answers to user queries. Please respond in English. If the user asks for code, provide only the code block without any additional text. If you are unsure about the answer, respond with 'I'm not sure about that.'"
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      stream: true
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || '';
      if (content) {
        process.stdout.write(content);
        onData(content);
        logger.info(`AI Response Chunk: ${content}`);
      }
    }
  } catch (error) {
    logger.error('Error fetching AI response:', error);
    const errorMessage = error.message || 'Unknown error';
    let userMessage = 'Error occurred while fetching the response.\n';
    
    if (errorMessage.includes('API key')) {
      userMessage += 'Please check that your OPENAI_API_KEY is valid.\n';
    } else if (errorMessage.includes('model')) {
      userMessage += `The model "${currentModel}" may not be available. Try selecting a different model with /model-selection.\n`;
    } else {
      userMessage += 'Check your internet connection and API key.\n';
    }
    
    userMessage += '\nIf the problem persists, you can report it with the /error-report command.\n';
    onData(userMessage);
  }
}

function showHelp() {
  console.log('\nAvailable commands:');
  console.log('  /help             - Show this help message');
  console.log('  /exit             - Exit the assistant');
  console.log('  /error-report     - Open GitHub issues page for bug reporting');
  console.log('  /model-selection  - Select a different AI model');
  console.log('  /version          - Show version information');
  console.log('\nJust type your question or request for AI assistance.\n');
}

async function showVersion() {
  try {
    // Try to read package.json from __dirname first (local dev)
    let packagePath = path.join(__dirname, 'package.json');
    if (!fs.existsSync(packagePath)) {
      // Fallback for global installation - try parent directories
      packagePath = path.join(__dirname, '..', 'package.json');
    }
    
    if (fs.existsSync(packagePath)) {
      const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
      console.log(`CLI AI Assistant v${packageData.version}`);
    } else {
      // If package.json not found, show a generic message
      console.log('CLI AI Assistant');
    }
  } catch (err) {
    console.log('CLI AI Assistant');
  }
}

async function startInteractive() {
  rl.question('> ', async (userInput) => {
    const input = userInput.trim();
    
    if (input === '/exit') {
      console.log('Goodbye!');
      rl.close();
      process.exit(0);
      return;
    }
    
    if (input === '/help') {
      showHelp();
      startInteractive();
      return;
    }
    
    if (input === '/version') {
      await showVersion();
      startInteractive();
      return;
    }
    
    if (input === '/error-report') {
      openGitHubIssues();
      startInteractive();
      return;
    }
    
    if (input === '/model-selection') {
      await modelSelection();
      startInteractive();
      return;
    }
    
    if (input === '') {
      startInteractive();
      return;
    }
    
    let fullResponse = '';
    await getAIResponse(input, (chunk) => {
      if (chunk && typeof chunk === 'string') {
        fullResponse += chunk;
      }
    });
    process.stdout.write('\n\n');
    startInteractive();
  });
}

async function welcomeMessage() {
  const usernamePath = path.join(dataDir, 'user.txt');
  if (fs.existsSync(usernamePath)) {
    const username = fs.readFileSync(usernamePath, 'utf-8').trim();
    const now = new Date();
    const hour = now.getHours();
    
    if (hour < 12) {
      console.log(`Good morning, ${username}!`);
      console.log(`How can I assist you today, ${username}?`);
    } else if (hour < 18) {
      console.log(`Good afternoon, ${username}!`);
      console.log(`How can I assist you today, ${username}?`);
    } else {
      console.log(`Good evening, ${username}!`);
      console.log(`How can I assist you today, ${username}?`);
    }
  } else {
    console.log('Welcome to the CLI AI Assistant!');
    console.log('Type /help to see available commands.');
  }
}

// Handle process exit signals gracefully
process.on('SIGINT', () => {
  console.log('\nGoodbye!');
  rl.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  rl.close();
  process.exit(0);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  console.error('An unexpected error occurred. Please try again.');
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  console.error('A critical error occurred. Exiting...');
  process.exit(1);
});

welcomeMessage();
startInteractive();
