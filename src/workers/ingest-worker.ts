import { IngestionJob } from '../lib/types/subtitle';

export class IngestionWorker {
  async processJob(job: IngestionJob): Promise<void> {
    // TODO: Process async background ingestion (parse, chunk, embed, upsert to vector store)
  }
}
