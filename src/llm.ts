export class LLM {
    private apiKey: string | undefined;

    constructor() { }

    public initialize(llmChoice: string, apiKey: string): string {
        try {
            switch (llmChoice) {
                case 'groq':
                    this.apiKey = apiKey;
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
        if (!this.apiKey) {
            throw new Error("LLM has not been initialized. Please call initialize() first.");
        }

        const messages = [
            {
                role: "system",
                content: "Complete the following python snippet. Only return python code, format it nicely so that your response starts with ```python and ends with ```"
            },
            {
                role: "user",
                content: "hi!" + snippet
            }
        ];

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
            throw new Error(`Groq API request failed with status ${response.status}`);
        }

        const data = await response.json() as any;
        return data.choices[0].message.content;
    }
}
