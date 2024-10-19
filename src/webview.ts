export function getWebviewContent(snippetText: string): string {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Snippet Editor</title>
            <style>
                body {
                    margin: 0;
                    padding: 10px;
                    font-family: var(--vscode-editor-font-family, 'Courier New', monospace);
                    font-size: var(--vscode-editor-font-size, 14px);
                    background-color: var(--vscode-editor-background, #1e1e1e);
                    color: var(--vscode-editor-foreground, #d4d4d4);
                }
                #editor {
                    width: 100%;
                    height: 200px;
                    background-color: var(--vscode-editor-background, #1e1e1e);
                    color: var(--vscode-editor-foreground, #d4d4d4);
                    font-family: var(--vscode-editor-font-family, 'Courier New', monospace);
                    font-size: var(--vscode-editor-font-size, 14px);
                    line-height: var(--vscode-editor-line-height, 1.5);
                    border: 1px solid var(--vscode-editorWidget-border, #3c3c3c);
                    padding: 8px;
                    box-sizing: border-box;
                    overflow: auto;
                    white-space: pre;
                }
                button {
                    background-color: var(--vscode-button-background, #0e639c);
                    color: var(--vscode-button-foreground, #ffffff);
                    border: none;
                    padding: 8px 12px;
                    font-size: 14px;
                    cursor: pointer;
                    border-radius: 2px;
                }
                button:hover {
                    background-color: var(--vscode-button-hoverBackground, #1177bb);
                }
                #output {
                    white-space: pre-wrap;
                    background-color: var(--vscode-editor-background, #1e1e1e);
                    color: var(--vscode-editor-foreground, #d4d4d4);
                    padding: 10px;
                    margin-top: 10px;
                    border: 1px solid var(--vscode-editorWidget-border, #3c3c3c);
                    font-family: var(--vscode-editor-font-family, 'Courier New', monospace);
                    font-size: var(--vscode-editor-font-size, 14px);
                }
            </style>
        </head>
        <body>
            <textarea id="editor" spellcheck="false">${snippetText}</textarea>
            <br>
            <div id="settingsContainer">
            <select id="llmProvider">
                <option value="">Select LLM Provider</option>
                <option value="llama">Llama (Groq)</option>
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
            </select>
            <input type="password" id="apiKey" placeholder="Enter API Key">
            <button id="saveSettings">Save Settings</button>
            <br>
            </div>
            <button id="runButton">Run</button>
            <button id="autoCompleteButton">AutoComplete</button>
            <div id="output">Output:</div>
            <script>
                const vscode = acquireVsCodeApi();
                const editor = document.getElementById('editor');
                const runButton = document.getElementById('runButton');
                const saveButton = document.getElementById('saveSettings');
                const output = document.getElementById('output');

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
                            editor.value = message.output
                            break;
                        case 'showOutput':
                            output.textContent = 'Output: ' + message.output;
                            break;
                    }
                });

            </script>
        </body>
        </html>
    `;
}
