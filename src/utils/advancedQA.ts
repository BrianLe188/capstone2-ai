import { ChatOpenAI } from "langchain/chat_models/openai";
import { HNSWLib } from "langchain/vectorstores/hnswlib";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { BufferMemory } from "langchain/memory";
import * as fs from "fs";
import { RunnableBranch, RunnableSequence } from "langchain/schema/runnable";
import { PromptTemplate } from "langchain/prompts";
import { StringOutputParser } from "langchain/schema/output_parser";
import { LLMChain } from "langchain/chains";
import { formatDocumentsAsString } from "langchain/util/document";
import path from "path";

export const run = async () => {
  /* Initialize the LLM to use to answer the question */
  const model = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_KEY,
    modelName: "gpt-3.5-turbo",
  });
  /* Load in the file we want to do question answering over */
  const text = fs.readFileSync(path.join(__dirname, "report.txt"), "utf8");
  /* Split the text into chunks */
  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
  const docs = await textSplitter.createDocuments([text]);
  /* Create the vectorstore */
  const vectorStore = await HNSWLib.fromDocuments(
    docs,
    new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_KEY,
    })
  );
  const retriever = vectorStore.asRetriever();

  const serializeChatHistory = (chatHistory: string | Array<string>) => {
    if (Array.isArray(chatHistory)) {
      return chatHistory.join("\n");
    }
    return chatHistory;
  };

  const memory = new BufferMemory({
    memoryKey: "chatHistory",
  });

  /**
   * Create a prompt template for generating an answer based on context and
   * a question.
   *
   * Chat history will be an empty string if it's the first question.
   *
   * inputVariables: ["chatHistory", "context", "question"]
   */
  const questionPrompt = PromptTemplate.fromTemplate(
    `Bạn là một trợ lý AI hữu ích. Và bạn là một trợ lý viết lách hữu ích được phát triển bởi Capstone2-Admission. Capstone2-Admission là một nền tảng viết AI cho hệ thống tuyển sinh.
    Sử dụng các phần ngữ cảnh sau đây để trả lời câu hỏi ở cuối.
    - Mục tiêu của bạn là Trả lời các câu hỏi dựa trên thông tin được cung cấp trong nguồn.
    Nếu bạn không biết câu trả lời, chỉ cần nói rằng bạn không biết. KHÔNG cố gắng bịa ra một câu trả lời. Nếu câu hỏi không liên quan đến ngữ cảnh, hãy trả lời một cách lịch sự rằng bạn chỉ trả lời những câu hỏi liên quan đến ngữ cảnh.
    ----------------
CHAT HISTORY: {chatHistory}
----------------
CONTEXT: {context}
----------------
QUESTION: {question}
----------------
    Câu trả lời hữu ích trong markdown:`
  );

  /**
   * Creates a prompt template for __generating a question__ to then ask an LLM
   * based on previous chat history, context and the question.
   *
   * inputVariables: ["chatHistory", "question"]
   */
  const questionGeneratorTemplate =
    PromptTemplate.fromTemplate(`Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.
----------------
CHAT HISTORY: {chatHistory}
----------------
FOLLOWUP QUESTION: {question}
----------------
Standalone question:`);

  const handleProcessQuery = async (input: {
    question: string;
    context: string;
    chatHistory?: string | Array<string>;
  }) => {
    const chain = new LLMChain({
      llm: model,
      prompt: questionPrompt,
      outputParser: new StringOutputParser(),
    });

    const { text } = await chain.call({
      ...input,
      chatHistory: serializeChatHistory(input.chatHistory ?? ""),
    });

    await memory.saveContext(
      {
        human: input.question,
      },
      {
        ai: text,
      }
    );

    return text;
  };

  const answerQuestionChain = RunnableSequence.from([
    {
      question: (input: {
        question: string;
        chatHistory?: string | Array<string>;
      }) => input.question,
    },
    {
      question: (previousStepResult: {
        question: string;
        chatHistory?: string | Array<string>;
      }) => previousStepResult.question,
      chatHistory: (previousStepResult: {
        question: string;
        chatHistory?: string | Array<string>;
      }) => serializeChatHistory(previousStepResult.chatHistory ?? ""),
      context: async (previousStepResult: {
        question: string;
        chatHistory?: string | Array<string>;
      }) => {
        // Fetch relevant docs and serialize to a string.
        const relevantDocs = await retriever.getRelevantDocuments(
          previousStepResult.question
        );
        const serialized = formatDocumentsAsString(relevantDocs);
        return serialized;
      },
    },
    handleProcessQuery,
  ]);

  const generateQuestionChain = RunnableSequence.from([
    {
      question: (input: {
        question: string;
        chatHistory: string | Array<string>;
      }) => input.question,
      chatHistory: async () => {
        const memoryResult = await memory.loadMemoryVariables({});
        return serializeChatHistory(memoryResult.chatHistory ?? "");
      },
    },
    questionGeneratorTemplate,
    model,
    // Take the result of the above model call, and pass it through to the
    // next RunnableSequence chain which will answer the question
    {
      question: (previousStepResult: { text: string }) =>
        previousStepResult.text,
    },
    answerQuestionChain,
  ]);

  const branch = RunnableBranch.from([
    [
      async () => {
        const memoryResult = await memory.loadMemoryVariables({});
        const isChatHistoryPresent = !memoryResult.chatHistory.length;

        return isChatHistoryPresent;
      },
      answerQuestionChain,
    ],
    [
      async () => {
        const memoryResult = await memory.loadMemoryVariables({});
        const isChatHistoryPresent =
          !!memoryResult.chatHistory && memoryResult.chatHistory.length;

        return isChatHistoryPresent;
      },
      generateQuestionChain,
    ],
    answerQuestionChain,
  ]);

  const fullChain = RunnableSequence.from([
    {
      question: (input: { question: string }) => input.question,
    },
    branch,
  ]);

  return fullChain;

  // const resultOne = await fullChain.invoke({
  //   question: "What did the president say about Justice Breyer?",
  // });

  // console.log({ resultOne });
};
