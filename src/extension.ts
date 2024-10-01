import * as vscode from 'vscode';

let boardPanel: vscode.WebviewPanel | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Extension "Copy to Board" is now active!');

    let disposable = vscode.commands.registerCommand('extension.copyToBoard', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            const text = editor.document.getText(selection);

            if (text) {
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

                boardPanel.webview.html = getWebviewContent(text);
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