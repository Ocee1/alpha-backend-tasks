import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Schema, Type } from '@google/genai';
import {
  SummarizationProvider,
  CandidateSummaryInput,
  CandidateSummaryResult,
} from './summarization-provider.interface';

@Injectable()
export class GeminiSummarizationProvider implements SummarizationProvider {
  private readonly logger = new Logger(GeminiSummarizationProvider.name);
  private readonly ai: GoogleGenAI;

  constructor(private configService: ConfigService) {
    
    // retrieves the API key dynamically from .env
    this.ai = new GoogleGenAI({});
  }

  async generateCandidateSummary(
    input: CandidateSummaryInput,
  ): Promise<CandidateSummaryResult> {
    try {
      // combine the documents/prompts passed from the worker
      const promptText = input.documents.join('\n\n');

      // define the exact JSON structure we need returned
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: promptText,
        config: {
          // force the model to return strict JSON
          responseMimeType: 'application/json',
          temperature: 0.2, 
          responseSchema: {
            type: 'OBJECT',
            properties: {
              score: { 
                type: 'INTEGER', 
                description: 'A score from 0 to 100 representing candidate fit based on the documents.' 
              },
              strengths: { 
                type: 'ARRAY', 
                items: { type: 'STRING' },
                description: 'A list of 3-5 key strengths.'
              },
              concerns: { 
                type: 'ARRAY', 
                items: { type: 'STRING' },
                description: 'A list of 1-3 potential concerns or areas for growth.'
              },
              summary: { 
                type: 'STRING',
                description: "A cohesive 2-3 paragraph summary of the candidate's profile."
              },
              recommendedDecision: { 
                type: 'STRING',
                description: 'Must be one of: advance, reject, or hold.'
              },
            },
            required: ['score', 'strengths', 'concerns', 'summary', 'recommendedDecision'],
          },
        },
      });

      const responseText = response.text;

      if (!responseText) {
        throw new Error('LLM returned an empty response.');
      }

      // Parse  JSON response
      const parsedResult: CandidateSummaryResult = JSON.parse(responseText);

      return parsedResult;

    } catch (error) {
      this.logger.error(`Failed to generate summary via Gemini: ${(error as Error).message}`);
      throw new InternalServerErrorException('Failed to generate candidate summary');
    }
  }
}