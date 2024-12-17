export function getWebviewContent(snippetText: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Snippet Editor</title>
    <style>
        body {
            margin: 0;
            padding: 0;
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            font-family: var(--vscode-editor-font-family, "Segoe WPC", "Segoe UI", sans-serif);
        }
        .toolbar {
            padding: 8px;
            background-color: var(--vscode-editor-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            display: flex;
            justify-content: space-between;
        }
        .toolbar-group {
            display: flex;
            gap: 8px;
        }
        button {
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 4px 12px;
            cursor: pointer;
            border-radius: 2px;
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        select, input {
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 4px 8px;
            border-radius: 2px;
        }

        #editor {
            width: 100%;  /* Full width of its container */
            background-color: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            border: none;
            padding: 8px;
            font-family: var(--vscode-editor-font-family, monospace);
            font-size: 14px;
            line-height: 1.5;
            outline: none;
            overflow: auto; /* Allow scrolling if content overflows */
            resize: vertical;
        }

        #output {
            width: 100%;  /* Same as editor */
            padding: 8px;
            background-color: var(--vscode-editor-background); /* Same background as editor */
            color: var(--vscode-editor-foreground);  /* Same text color as editor */
            font-family: var(--vscode-editor-font-family, monospace);
            font-size: 14px;
            line-height: 1.5;
            border-top: 1px solid var(--vscode-panel-border);
            white-space: pre-wrap; /* Wrap text like the editor */
            overflow: auto; /* Allow scrolling if content overflows */
            outline: none;
            resize: vertical;
        }

    </style>
</head>
<body>
    <div class="toolbar">
        <div class="toolbar-group">
            <button id="runBtn">Run</button>
            <button id="autoCompleteBtn">AutoComplete</button>
        </div>
        <div class="toolbar-group">
            <select id="llmProvider">
                <option value="">Select LLM Provider</option>
                <option value="llama">Llama (Groq)</option>
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
            </select>
            <input type="password" id="apiKey" placeholder="Enter API Key">
            <button id="saveBtn">Save Settings</button>
        </div>
    </div>
    <textarea id="editor" spellcheck="false">${snippetText}</textarea>
    
    <br>
    Output: <textarea id="output" spellcheck="false"></textarea>
    <br>

    <script>
        const vscode = acquireVsCodeApi();
        const editor = document.getElementById('editor');
        const runBtn = document.getElementById('runBtn');
        const autoCompleteBtn = document.getElementById('autoCompleteBtn');
        const saveBtn = document.getElementById('saveBtn');
        const output = document.getElementById('output');

        runBtn.addEventListener('click', () => {
            vscode.postMessage({
                command: 'runSnippet',
                snippet: editor.value
            });
        });

        autoCompleteBtn.addEventListener('click', () => {
            vscode.postMessage({
                command: 'autoComplete',
                snippet: editor.value
            });
        });

        saveBtn.addEventListener('click', () => {
            const llmProvider = document.getElementById('llmProvider').value;
            const apiKey = document.getElementById('apiKey').value;
            vscode.postMessage({
                command: 'updateSettings',
                llmProvider,
                apiKey
            });
        });

        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.command) {
                case 'autoComplete':
                    editor.value = message.output;
                    break;
                case 'showOutput':
                    output.value = message.output;
                    break;
            }
        });
    </script>
</body>
</html>`;
}