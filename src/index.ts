import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import advise from "./namespaces/advise";
import { SqlDatabase } from "langchain/sql_db";
import { SqlDatabaseChain } from "langchain/chains/sql_db";
import { coreDB } from "./data-source";
import { OpenAI } from "langchain/llms/openai";
import { ChatOpenAI } from "langchain/chat_models/openai";
import type { FunctionParameters } from "langchain/output_parsers";
import { createTaggingChain } from "langchain/chains";
import { LANGUAGE_TAGS, TOPIC_TAGS } from "./utils/constant";

const app = express();
const server = createServer(app);
const io = new Server(server);

async function main() {
  try {
    const core = await SqlDatabase.fromDataSourceParams({
      appDataSource: coreDB,
    });
    const chainCore = new SqlDatabaseChain({
      llm: new OpenAI({
        temperature: 0,
        openAIApiKey: process.env.OPENAI_KEY,
      }),
      database: core,
    });

    const schema: FunctionParameters = {
      type: "object",
      properties: {
        topics: {
          type: "string",
          enum: TOPIC_TAGS,
        },
        languages: { type: "string", enum: LANGUAGE_TAGS },
      },
      required: ["topics"],
    };
    const chatModel = new ChatOpenAI({
      modelName: "gpt-4-0613",
      temperature: 0,
      openAIApiKey: process.env.OPENAI_KEY,
    });
    const chainTag = createTaggingChain(schema, chatModel);

    advise(io.of("/advise"), { chainCore, chainTag });

    server.listen(process.env.AI_PORT, () => {
      console.log(
        `AI service is running on ${process.env.AI_HOST}:${process.env.AI_PORT}`
      );
    });
  } catch (error) {
    console.log(error);
  }
}

main();
