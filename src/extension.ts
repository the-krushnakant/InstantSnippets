import * as vscode from 'vscode';
import { getWebviewContent } from './webview';
import { runPythonSnippet, autoComplete } from './utils';


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
                        case 'updateSettings':
                            const config = vscode.workspace.getConfiguration('instantSnippets');
                            config.update('llmProvider', message.llmProvider, vscode.ConfigurationTarget.Global);
                            config.update('apiKey', message.apiKey, vscode.ConfigurationTarget.Global);
                            vscode.window.showInformationMessage('Settings updated successfully');
                            return;
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



export function deactivate() {}
