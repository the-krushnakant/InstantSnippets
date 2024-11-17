import * as vscode from 'vscode';
import { exec } from 'child_process';
import { join } from 'path';
import * as os from 'os';
import { unlink, writeFileSync } from 'fs';
import {LLM} from './llm'

export function areSettingsConfigured(): boolean {
    const { llmProvider, apiKey } = getSettings();
    console.log(`Found llmProvider: ${llmProvider}, apiKey: ${apiKey}`)
    return llmProvider !== '' && apiKey !== '';
}

export function getSettings(): { llmProvider: string; apiKey: string } {
    const config = vscode.workspace.getConfiguration('yourExtension');
    return {
      llmProvider: config.get('llmProvider') as string,
      apiKey: config.get('apiKey') as string
    };
}


export async function runPythonSnippet(snippetText: string): Promise<string> {
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
            unlink(tempScript, (unlinkError) => {
                if (unlinkError) {
                    console.error(`Error deleting temporary script: ${unlinkError}`);
                } else {
                    console.log("Temporary script file deleted successfully");
                }
            });
            
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

export async function autoComplete(snippetText: string): Promise<string> {
    console.log("Starting autoComplete function");
    vscode.window.showInformationMessage("Autocompleting snippet")
    if (!areSettingsConfigured()) {
        vscode.window.showErrorMessage('Please configure LLM provider and API key in settings');
        return snippetText;
    }
    return new Promise(async (resolve, reject) => {
        try {
            let my_llm = new LLM();
            const {llmProvider, apiKey} = getSettings();
            console.log(`Found llmProvider: ${llmProvider}, apiKey: ${apiKey}`)
            my_llm.initialize(llmProvider, apiKey);
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
