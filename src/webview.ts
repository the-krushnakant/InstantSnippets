export function getWebviewContent(snippetText: string): string {
    return `
    <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VS Code-like Snippet Editor</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe WPC', 'Segoe UI', 'HelveticaNeue-Light', 'Ubuntu', 'Droid Sans', sans-serif;
            font-size: 13px;
            background-color: var(--vscode-editor-background, #1e1e1e);
            color: var(--vscode-editor-foreground, #d4d4d4);
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        #editor-container {
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            padding: 10px;
        }
        #editor {
            width: 100%;
            flex-grow: 1;
            background-color: var(--vscode-editor-background, #1e1e1e);
            color: var(--vscode-editor-foreground, #d4d4d4);
            font-family: Consolas, 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            border: 1px solid var(--vscode-editorWidget-border, #3c3c3c);
            padding: 8px;
            box-sizing: border-box;
            overflow: auto;
            resize: none;
        }
        #toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 10px;
            background-color: var(--vscode-titleBar-activeBackground, #3c3c3c);
        }
        button, select, input {
            background-color: var(--vscode-button-background, #0e639c);
            color: var(--vscode-button-foreground, #ffffff);
            border: none;
            padding: 6px 10px;
            font-size: 12px;
            cursor: pointer;
            border-radius: 2px;
            margin-right: 5px;
        }
        button:hover, select:hover {
            background-color: var(--vscode-button-hoverBackground, #1177bb);
        }
        #output {
            white-space: pre-wrap;
            background-color: var(--vscode-terminal-background, #1e1e1e);
            color: var(--vscode-terminal-foreground, #d4d4d4);
            padding: 10px;
            margin-top: 10px;
            border-top: 1px solid var(--vscode-panel-border, #3c3c3c);
            font-family: Consolas, 'Courier New', monospace;
            font-size: 12px;
            flex-shrink: 0;
            height: 100px;
            overflow-y: auto;
        }
        #status-bar {
            background-color: var(--vscode-statusBar-background, #007acc);
            color: var(--vscode-statusBar-foreground, #ffffff);
            padding: 3px 10px;
            font-size: 12px;
            display: flex;
            justify-content: space-between;
        }
        #line-numbers {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 30px;
            background-color: var(--vscode-editorGutter-background, #1e1e1e);
            color: var(--vscode-editorLineNumber-foreground, #858585);
            font-family: Consolas, 'Courier New', monospace;
            font-size: 14px;
            line-height: 1.5;
            padding: 8px 5px;
            text-align: right;
            user-select: none;
        }
    </style>
</head>
<body>
    <div id="toolbar">
        <div>
            <button id="runButton">Run</button>
            <button id="autoCompleteButton">AutoComplete</button>
        </div>
        <div id="settingsContainer">
            <select id="llmProvider">
                <option value="">Select LLM Provider</option>
                <option value="llama">Llama (Groq)</option>
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
            </select>
            <input type="password" id="apiKey" placeholder="Enter API Key">
            <button id="saveSettings">Save Settings</button>
        </div>
    </div>
    <div id="editor-container">
        <div id="line-numbers"></div>
        <textarea id="editor" spellcheck="false"></textarea>
    </div>
    <div id="output">Output:</div>
    <div id="status-bar">
        <span id="cursor-position">Ln 1, Col 1</span>
        <span id="language-mode">JavaScript</span>
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        const editor = document.getElementById('editor');
        const lineNumbers = document.getElementById('line-numbers');
        const runButton = document.getElementById('runButton');
        const autoCompleteButton = document.getElementById('autoCompleteButton');
        const saveButton = document.getElementById('saveSettings');
        const output = document.getElementById('output');
        const cursorPosition = document.getElementById('cursor-position');

        function updateLineNumbers() {
            const lines = editor.value.split('\n');
            lineNumbers.innerHTML = lines.map((_, i) => (i + 1)).join('<br>');
        }

        editor.addEventListener('input', updateLineNumbers);
        editor.addEventListener('scroll', () => {
            lineNumbers.scrollTop = editor.scrollTop;
        });

        editor.addEventListener('keyup', (e) => {
            const position = editor.selectionStart;
            const lines = editor.value.substr(0, position).split('\n');
            const currentLine = lines.length;
            const currentColumn = lines[lines.length - 1].length + 1;
            cursorPosition.textContent = 'Ln ' + currentLine + ', Col' + currentColumn;
        });

        runButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'runSnippet', snippet: editor.value });
        });

        autoCompleteButton.addEventListener('click', () => {
            vscode.postMessage({ command: 'autoComplete', snippet: editor.value });
        });

        saveButton.addEventListener('click', () => {
            const llmProvider = document.getElementById('llmProvider').value;
            const apiKey = document.getElementById('apiKey').value;
            vscode.postMessage({ 
                command: 'updateSettings', 
                llmProvider, 
                apiKey 
            });
            document.getElementById('settingsContainer').style.display = 'none';
        });

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'autoComplete':
                    editor.value = message.output;
                    updateLineNumbers();
                    break;
                case 'showOutput':
                    output.textContent = 'Output: ' + message.output;
                    break;
            }
        });

        // Initialize with some content
        editor.value = snippetText;
        updateLineNumbers();
    </script>
</body>
</html>
`;
}
