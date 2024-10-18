import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from '@langchain/anthropic';
import { ChatGroq } from '@langchain/groq';
import { AIMessageChunk, HumanMessage, SystemMessage } from "@langchain/core/messages";

// Define a type that encompasses all possible LLM classes
type LLMType = ChatOpenAI | ChatAnthropic | ChatGroq;


export class LLM{
    private llm: LLMType | undefined;

    constructor(){ }

    public initialize(llmChoice: string, apiKey: string): string {
        try {
            switch (llmChoice) {
                case 'openai':
                    this.llm = new ChatOpenAI({apiKey: apiKey, model: "gpt-4o",});
                    break;
                case 'anthropic':
                    this.llm = new ChatAnthropic({apiKey: apiKey, model: "claude-3.5-sonnet",});
                    break;
                case 'groq':
                    this.llm = new ChatGroq({apiKey: apiKey, model: 'llama3-8b-8192',});
                    break;
                default:
                    throw new Error("Invalid LLM choice provided.");
            }
            return "LLM initialized successfully.";
        } catch (error: unknown) {
            // Safely check the error type
            if (error instanceof Error) {
                return `Error initializing LLM: ${error.message}`;
            } else {
                return "Error initializing LLM: Unknown error occurred.";
            }
        }
    }

    public async call(snippet: string): Promise<string>{
        if (!this.llm) {
            throw new Error("LLM has not been initialized. Please call initialize() first.");
        }

        const messages =   [
            new SystemMessage("Complete the following python snippet. Only return python code, \
                format it nicely so that your response starts with ```python and ends with ```"),
            new HumanMessage("hi!" + snippet),
        ]

        const response: AIMessageChunk = await this.llm.invoke(
            messages
        );

        return response.content as string;
    }
}