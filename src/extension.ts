import * as vscode from 'vscode';

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


let boardPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "Copy to Board" is now active!');

    let disposable = vscode.commands.registerCommand('extension.copyToBoard', async () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const selectedText = editor.document.getText(selection);

            if (selectedText) {
                vscode.window.showInformationMessage('Sending snippet for completion...');

                // Send the snippet to the GROQ API
                const completedSnippet = await sendToGROQAPI(selectedText);

                if (!boardPanel) {
                    boardPanel = vscode.window.createWebviewPanel(
                        'boardPanel',
                        'Board',
                        vscode.ViewColumn.Beside,
                        {}
                    );

                    boardPanel.onDidDispose(() => {
                        boardPanel = undefined;
                    }, null, context.subscriptions);
                }

                boardPanel.webview.html = getWebviewContent(completedSnippet);
                boardPanel.reveal(vscode.ViewColumn.Beside);
            } else {
                vscode.window.showInformationMessage('No text selected');
            }
        }
    });

    context.subscriptions.push(disposable);

    context.subscriptions.push(
        vscode.languages.registerCodeActionsProvider('*', new CopyToBoardActionProvider(), {
            providedCodeActionKinds: [vscode.CodeActionKind.RefactorRewrite]
        })
    );
}

class CopyToBoardActionProvider implements vscode.CodeActionProvider {
    provideCodeActions(document: vscode.TextDocument, range: vscode.Range | vscode.Selection): vscode.CodeAction[] {
        const copyToBoardAction = new vscode.CodeAction('Copy to Board', vscode.CodeActionKind.RefactorRewrite);
        copyToBoardAction.command = {
            command: 'extension.copyToBoard',
            title: 'Copy to Board',
        };
        return [copyToBoardAction];
    }
}

// Use GROQ API instead of OpenAI API
async function sendToGROQAPI(snippet: string): Promise<string> {
    try {

		const completion = await groq.chat.completions
		.create({
		  messages: [
			{
			  role: "user",
			  content: "Explain the importance of fast language models",
			},
		  ],
		  model: "llama",
		})
		.then((chatCompletion) => {
		  console.log(chatCompletion.choices[0]?.message?.content || "");
		});
	

        const response = await fetch('https://groq.api.endpoint/v1/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer YOUR_GROQ_API_KEY`,  // Use GROQ API Key
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: snippet,  // Adapt this to match GROQ API query syntax
                other_params: "value"  // Any other necessary parameters for GROQ
            })
        });

        const data = await response.json();
        return data.result || '';  // Adjust according to GROQ API response format
    } catch (error) {
        vscode.window.showErrorMessage('Failed to complete snippet using GROQ API');
        console.error(error);
        return '';
    }
}

function getWebviewContent(text: string) {
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Board</title>
    </head>
    <body>
        <pre>${escapeHtml(text)}</pre>
    </body>
    </html>`;
}

function escapeHtml(unsafe: string) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

export function deactivate() {}
