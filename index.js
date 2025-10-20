import openai from 'openai';
import winston from 'winston';
import fs from 'fs';
import 'dotenv/config';
import readline from 'readline';
import { exec } from 'child_process';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'app.log' })
  ]
});

function previousCommand() {
  const historyPath = `${process.env.HOME}/.bash_history`;
  try {
    const data = fs.readFileSync(historyPath, 'utf-8');
    const lines = data.trim().split('\n');
    return lines[lines.length - 1];
  } catch (err) {
    logger.error('Error reading .bash_history file:', err);
    return null;
  }
}

function openGitHubIssues() {
  try {
    const issuesUrl = "https://github.com/Benedek553/cli-ai-assistant/issues";
    exec(`xdg-open "${issuesUrl}"`);
    console.log('Opened GitHub issues page in your default browser.');
  } catch (err) {
    console.log('Error opening GitHub issues:', err.message);
  }
}

async function getAIResponse(prompt, onData) {
  try {
    const client = new openai();
    const stream = await client.responses.create({
      model: "gpt-5-nano",
      instructions: "You are a helpful command line AI assistant. Provide concise and accurate answers to user queries. Please respond in English.",
      input: prompt,
      stream: true
    });

    for await (const event of stream) {
      if (event && event.delta) {
        process.stdout.write(event.delta); // karakterenként írja ki
        onData(event.delta);
      }
    }
  } catch (error) {
    logger.error('Error fetching AI response:', error);
    onData('Error occurred while fetching the response.');
  }
}

async function startInteractive() {
  rl.question('> ', async (userInput) => {
    if (userInput.trim() === '/exit') {
      console.log('Exited');
      rl.close();
      process.exit(0);
      return;
    }
    if (userInput.trim() === '/error-report') {
      openGitHubIssues();
      startInteractive();
      return;
    }
    let fullResponse = '';
    await getAIResponse(userInput, (chunk) => {
      if (chunk && typeof chunk === 'string') {
        fullResponse += chunk;
      }
    });

    startInteractive();
  });
}

console.log('Hello, how can I help you?');
console.log('Please enter your question or command:');
startInteractive();
