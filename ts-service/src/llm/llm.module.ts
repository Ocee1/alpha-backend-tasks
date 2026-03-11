import { Module } from '@nestjs/common';

import { FakeSummarizationProvider } from './fake-summarization.provider';
import { SUMMARIZATION_PROVIDER } from './summarization-provider.interface';
import { GeminiSummarizationProvider } from './gemini.provider';

@Module({
  imports: [],
  providers: [
    FakeSummarizationProvider,
    GeminiSummarizationProvider,
    {
      provide: SUMMARIZATION_PROVIDER,
      useClass: GeminiSummarizationProvider, // Always use real one here
    },
  ],
  exports: [SUMMARIZATION_PROVIDER],
})
export class LlmModule {}
