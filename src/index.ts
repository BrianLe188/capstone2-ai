import dotenv from "dotenv";
dotenv.config();
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import advise from "./namespaces/advise";
import { SqlDatabase } from "langchain/sql_db";
import { coreDB } from "./data-source";
import { OpenAI } from "langchain/llms/openai";
import { SqlDatabaseChain } from "langchain/chains/sql_db";
import { FunctionParameters } from "langchain/output_parsers";
import { LANGUAGE_TAGS, TOPIC_TAGS } from "./utils/constant";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { createTaggingChain } from "langchain/chains";
import amqp from "amqplib";
import queue from "./queue";

const app = express();
const server = createServer(app);
const io = new Server(server);

async function main() {
  try {
    const amqpConnection = await amqp.connect("amqp://127.0.0.1");
    const channel = await amqpConnection.createChannel();

    const core = await SqlDatabase.fromDataSourceParams({
      appDataSource: coreDB,
    });

    const chainCore = new SqlDatabaseChain({
      llm: new OpenAI({
        temperature: 0,
        openAIApiKey: process.env.OPENAI_KEY,
        streaming: true,
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

    queue({ channel });
    advise(io.of("/advise"), { chainCore, chainTag });

    server.listen(process.env.AI_PORT, () => {
      console.log(
        `AI service is running on ${process.env.AI_HOST}:${process.env.AI_PORT}`
      );
    });
  } catch (error) {
    console.log(error);
    setInterval(() => {
      main();
    }, 1000);
  }
}

main();
