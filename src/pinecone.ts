import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { PineconeStore } from "langchain/vectorstores/pinecone";
import { OpenAI } from "langchain/llms/openai";
import { VectorDBQAChain } from "langchain/chains";
import { Document } from "langchain/document";

const config = {
  apiKey: process.env.PINECONE_API_KEY as string,
  environment: process.env.PINECONE_ENVIRONMENT as string,
  index: process.env.PINECONE_INDEX as string,
};

const pinecone = new Pinecone({
  apiKey: config.apiKey,
  environment: config.environment,
});
const pineconeIndex = pinecone.Index(config.index);
export let chain: VectorDBQAChain;
const model = new OpenAI({
  temperature: 0,
  openAIApiKey: process.env.OPENAI_KEY,
  modelName: "gpt-3.5-turbo",
});
const openai = new OpenAIEmbeddings({
  openAIApiKey: process.env.OPENAI_KEY,
});

export const storeDocs = async (docs: Document<Record<string, any>>[]) => {
  await PineconeStore.fromDocuments(docs, openai, {
    pineconeIndex,
    maxConcurrency: 5,
  });
  const vectorStore = await PineconeStore.fromExistingIndex(openai, {
    pineconeIndex,
  });
  chain = VectorDBQAChain.fromLLM(model, vectorStore, {
    k: 1,
    returnSourceDocuments: false,
  });
};

export const deleteDocs = async () => {
  await pineconeIndex.deleteAll();
};
