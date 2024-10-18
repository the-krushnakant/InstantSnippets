import * as vscode from 'vscode';
import { exec } from 'child_process';
import { join } from 'path';
import * as os from 'os';
import { writeFileSync } from 'fs';
import {LLM} from './llm'


export function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('instantSnippets.openSnippet', (option: number) => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const text = editor.document.getText(selection);

            const panel = vscode.window.createWebviewPanel(
                'snippetEditor',
                'Snippet Editor',
                vscode.ViewColumn.Beside,
                {
                    enableScripts: true,
                    retainContextWhenHidden: true
                }
            );

            let snippetText = text;

            panel.webview.html = getWebviewContent(snippetText);

            panel.webview.onDidReceiveMessage(
                async (message) => {
                    switch (message.command) {
                        case 'runSnippet':
                            try {
                                const result = await runPythonSnippet(message.snippet);
                                panel.webview.postMessage({ command: 'showOutput', output: result });
                            } catch (error) {
                                panel.webview.postMessage({ command: 'showOutput', output: `Error: ${error}` });
                            }
                            return;
                        case 'autoComplete':
                            try {
                                const result = await autoComplete(message.snippet);
                                panel.webview.postMessage({ command: 'autoComplete', output: result });
                            } catch (error) {
                                panel.webview.postMessage({ command: 'autoComplete', output: `Error: ${error}` });
                            }
                            return;
                    }
                },
                undefined,
                context.subscriptions
            );

            // Handle the options here
            if (option === 2) {
                // Option 2: Immediately run the snippet
                panel.webview.postMessage({ command: 'runSnippet', snippet: snippetText });
            } else if (option === 3) {
                // Option 3: Autocomplete, then run
                autoComplete(snippetText).then((completedSnippet) => {
                    panel.webview.postMessage({ command: 'autoComplete', output: completedSnippet });
                    // Wait for the autocomplete to finish before running
                    panel.webview.onDidReceiveMessage(
                        (message) => {
                            if (message.command === 'autoComplete') {
                                // Now run the completed snippet
                                panel.webview.postMessage({ command: 'runSnippet', snippet: completedSnippet });
                            }
                        }
                    );
                });
            }
        }
    });

    context.subscriptions.push(disposable);

    const menuItems = [
        { id: 'instantSnippets.openInEditor', title: 'Open snippet in editor', option: 1 },
        { id: 'instantSnippets.openAndRun', title: 'Open in editor and run snippet', option: 2 },
        { id: 'instantSnippets.openImportAndRun', title: 'Open in editor, add \'import os\' and run snippet', option: 3 }
    ];

    menuItems.forEach(item => {
        const command = vscode.commands.registerCommand(item.id, () => {
            vscode.commands.executeCommand('instantSnippets.openSnippet', item.option);
        });
        context.subscriptions.push(command);
    });
}

function getWebviewContent(snippetText: string): string {
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
            <button id="runButton">Run</button>
            <button id="autoCompleteButton">AutiComplete</button>
            <div id="output">Output:</div>
            <script>
                const vscode = acquireVsCodeApi();
                const editor = document.getElementById('editor');
                const runButton = document.getElementById('runButton');
                const output = document.getElementById('output');

                runButton.addEventListener('click', () => {
                    vscode.postMessage({ command: 'runSnippet', snippet: editor.value });
                });

                autoCompleteButton.addEventListener('click', () => {
                    vscode.postMessage({ command: 'autoComplete', snippet: editor.value });
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

async function runPythonSnippet(snippetText: string): Promise<string> {
    console.log("Starting runPythonSnippet function");
    return new Promise((resolve, reject) => {
        const tempDir = os.tmpdir();
        const tempScript = join(tempDir, 'temp_script.py');

        console.log(`Temporary script path: ${tempScript}`);

        try {
            writeFileSync(tempScript, snippetText);
            console.log("Temporary script file written successfully");
        } catch (error) {
            console.error(`Error writing temporary script: ${error}`);
            reject(`Failed to write temporary script: ${error}`);
            return;
        }

        console.log("Executing Python script...");
        exec(`python "${tempScript}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Execution error: ${error.message}`);
                reject(`Execution error: ${error.message}`);
            } else if (stderr) {
                console.error(`Script error: ${stderr}`);
                reject(`Script error: ${stderr}`);
            } else {
                console.log(`Script output: ${stdout.trim()}`);
                resolve(stdout.trim());
            }
        });
    });
}


// async function autoComplete(snippetText: string): Promise<string> {
//     console.log("Starting autoComplete function");
//     return new Promise((resolve, reject) => {
//         // send to a language model selected by the user (add that option in the webview panel)
//         // use vs code Language Model API
//         // ask the llm in the prompt to autocomplete
//         // and return the text
//     });   
// }

async function autoComplete(snippetText: string): Promise<string> {
    console.log("Starting autoComplete function");
    return new Promise(async (resolve, reject) => {
        try {
            let my_llm = new LLM();
            my_llm.initialize("groq", "API_KEY");
            let completedText = await my_llm.call(snippetText)
            console.log(`Completed Text: ${completedText}`)
            completedText = completedText.replace("```python", "").replace("```", "")
            console.log(`Replaced Text: ${completedText}`)

            resolve(completedText);
        } catch (error) {
            if (error instanceof vscode.LanguageModelError) {
                console.error(`Language Model Error: ${error.message}, Code: ${error.code}`);
            }
            reject(error);
        }
    });   
}


export function deactivate() {}
