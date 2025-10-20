# CLI AI Assistant

A simple command-line AI assistant using OpenAI's API.

## Features

- Ask questions and get answers from OpenAI models directly in your terminal
- Keeps a log of interactions
- Supports error reporting via GitHub issues
- Reads environment variables from `.env`

## Installation

1. Clone this repository:
   ```sh
   git clone https://github.com/Benedek553/cli-ai-assistant.git
   cd cli-ai-assistant
   ```

2. Install dependencies and make scripts executable:
   ```sh
   ./install.sh
   ```

3. Set up your `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Usage

Start the assistant with:

```sh
cli-ai-assistant
```

or

```sh
./run.sh
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
