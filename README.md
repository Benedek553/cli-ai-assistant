# CLI AI Assistant

A simple command-line AI assistant using OpenAI's API.

## Features

- Ask questions and get answers from OpenAI models directly in your terminal
- Keeps a log of interactions
- Supports error reporting via GitHub issues
- Multi model support
- Command running without leaving interface
- Last command and the output passed to AI

## Installation

### Install with NPM

1. Check you are use the latest version of Node
   * If not download the latest version
2. Download the `cli-ai-assistant` package

```bash
npm install -g cli-ai-assistant
```

3. Add .env file

```bash
export OPENAI_API_KEY=yourapikeyhere
```
*If you don't have OpenAI API key, check this [Benedek553/openai-api-free](https://github.com/Benedek553/openai-api-free)*

### Install manually

1. Clone the repo

```bash
git clone https://github.com/Benedek553/cli-ai-assistant.git
cd cli-ai-assistant
```

2. Create a run.sh script, like this:

```sh
#!/bin/bash

node /usr/local/lib/node_modules/cli-ai-assistant/index.js
```
3. Add to /usr/local/bin
4. Export API key
```bash
export OPENAI_API_KEY=yourapikeyhere
```
*If you don't have OpenAI API key, check this [Benedek553/openai-api-free](https://github.com/Benedek553/openai-api-free)*
## Usage

After a global install the `cli-ai-assistant` command will be available.
Then start the assistant with:

```sh
cli-ai-assistant
```

You will see:

```
Hello, how can I help you?
Please enter your question or command:
>
```

Type your question and press Enter.

### Commands

- `/exit` — Exit the assistant
- `/error-report` — Open the GitHub issues page for bug reporting

## Logging

All interactions are logged to `app.log` in the project directory.

## License

This project is licensed under the [Apache License 2.0](LICENSE).

## Contributing

Feel free to open issues or submit pull requests on [GitHub](https://github.com/Benedek553/cli-ai-assistant).
