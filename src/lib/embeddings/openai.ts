import { OpenAI } from "openai";

export async function getEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text.replace(/\n/g, " "),
    encoding_format: "float",
  });

  return response.data[0].embedding;
}
