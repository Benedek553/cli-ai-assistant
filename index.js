#!/usr/import { OpenAI } from 'openai';import{ OpenAI }openai from 'openai';
import winston from 'winston';
import fs from 'fs';
import 'dotenv/config';
import readline from 'readline';
import { exec } from 'child_process';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Default model used on startup and for all requests unless changed via /model-selection
let currentModel = 'gpt-5-nano';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.File({ filename: 'app.log' })
  ]
});

async function previousCommand() {
  try {
    if (fs.existsSync('command.txt')) {
      const command = fs.readFileSync('command.txt', 'utf-8').trim();
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
    if (fs.existsSync('command_output.txt')) {
      const output = fs.readFileSync('command_output.txt', 'utf-8').trim();
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
    exec(`xdg-open "${issuesUrl}"`);
    console.log('Opened GitHub issues page in your default browser.');
  } catch (err) {
    console.log('Error opening GitHub issues:', err.message);
  }
}

async function modelSelection() {
  process.stdout.write('Select a model:\n');
  const models = ['gpt-5', 'gpt-4o', 'gpt-5-nano'];
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
        process.stdout.write('Invalid selection. Defaulting to gpt-5-nano.\n');
        currentModel = 'gpt-5-nano';
        resolve(currentModel);
      }
    });
  });
}

async function getAIResponse(prompt, onData) {
  try {
    const lastCommand = await previousCommand();
    const lastCommandOutput = await previousCommandOutput();
    const client = new openai();
    // Use the currentModel (default is gpt-5-nano) — do not prompt on every request
    const model = currentModel;
    const stream = await client.responses.create({
      model: model,
      instructions: "You are a helpful command line AI assistant. Provide concise and accurate answers to user queries. Please respond in English. If the user asks for code, provide only the code block without any additional text. If you are unsure about the answer, respond with 'I'm not sure about that.'",
      input: `${prompt}, I runned this command previously: ${lastCommand}, and this is the output of the command: ${lastCommandOutput}`,
      stream: true
    });

    for await (const event of stream) {
      if (event && event.delta) {
        process.stdout.write(event.delta);
        onData(event.delta);
        logger.info(`AI Response Chunk: ${event.delta}`);
      }
    }
  } catch (error) {
    logger.error('Error fetching AI response:', error);
    onData('Error occurred while fetching the response. Check your internet connection and you added an API key. If you not added an API key, please add with export `OPENAI_API_KEY="your_api_key_here` command. \n \n If the problem persists, you can report it with the /error-report command.\n');
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
    if (userInput.trim() === '/model-selection') {
      modelSelection();
      startInteractive();
      return;
    }
    if (userInput.trim() === '/bash') {
      const command = process.stdin.read();
      await runCommand(command);
      startInteractive();
      return;
    }
    let fullResponse = '';
    await getAIResponse(userInput, (chunk) => {
      if (chunk && typeof chunk === 'string') {
        fullResponse += chunk;
      }
    });
    process.stdout.write('\n \n');
    startInteractive();
  });
}

async function runCommand() {
  try {
    rl.question('Enter a command > ', async (userInput) => {
      exec(userInput, (error, stdout, stderr) => {
        if (error) {
          console.error(`Error: ${error.message}`);
          fs.writeFileSync('command.txt', userInput);
          fs.writeFileSync('command_output.txt', error.message);
          console.log("\n");
          startInteractive();
          return;
        }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
        fs.writeFileSync('command.txt', userInput);
        fs.writeFileSync('command_output.txt', stderr);
        console.log("\n");
        startInteractive();
        return;
      }
      console.log(`Stdout: \n ${stdout}`);
      fs.writeFileSync('command.txt', userInput);
      fs.writeFileSync('command_output.txt', stdout);
      console.log("\n")
      startInteractive();
      return;
    });
  });
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
  startInteractive();
}


async function welcomeMessage() {
  const usernamePath = './user.txt';
  if (fs.existsSync(usernamePath)) {
    const username = fs.readFileSync(usernamePath, 'utf-8').trim();
    const time = new Date().toLocaleTimeString();
    if (time < '08:00:00') {
      console.log(`Good morning, ${username}!`);
      console.log(`How can I assist you today, ${username}?`);
    } else if (time < '18:00:00') {
      console.log(`Good afternoon, ${username}!`);
      console.log(`How can I assist you today, ${username}?`);
    } else {
      console.log(`Good evening, ${username}!`);
      console.log(`How can I assist you today, ${username}?`);
  }
  } else {
    console.log('Welcome to the CLI AI Assistant!');
  }

}
welcomeMessage();
startInteractive();
