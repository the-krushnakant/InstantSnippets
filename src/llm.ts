export class LLM {
    private apiKey: string | undefined;
    private apiUrl: string | undefined;

    constructor() { }

    public initialize(llmChoice: string, apiKey: string): string {
        try {
            this.apiKey = apiKey;
            switch (llmChoice) {
                case 'llama':
                    this.apiUrl = "https://api.groq.com/openai/v1/chat/completions";
                    break;
                case 'openai':
                    this.apiUrl = 'https://api.openai.com/v1/chat/completions' ;
                    break;
                case 'anthropic':
                    this.apiUrl = 'https://api.anthropic.com/v1/messages';
                    break;
                default:
                    throw new Error("Invalid LLM choice provided.");
            }
            return "LLM initialized successfully.";
        } catch (error: unknown) {
            if (error instanceof Error) {
                return `Error initializing LLM: ${error.message}`;
            } else {
                return "Error initializing LLM: Unknown error occurred.";
            }
        }
    }

    public async call(snippet: string): Promise<string> {
        if (!this.apiKey || !this.apiUrl) {
            throw new Error("LLM has not been initialized. Please call initialize() first.");
        }

        const messages = [
            {
                role: "system",
                content: [
                    "Autocomplete the following code snippet. Only return python code.",
                    "Do not add any code of your own unless its necessary to run",
                    "Format your output nicely in markdown so that your response starts with ```python and ends with ```",
                ].join(' \n')
            },
            {
                role: "user",
                content: snippet
            }
        ];

        const response = await fetch(this.apiUrl, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${this.apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: messages
            })
        });

        if (!response.ok) {
            throw new Error(`API request failed with status ${response.status}`);
        }

        const data = await response.json() as any;
        return data.choices[0].message.content;
    }
}
