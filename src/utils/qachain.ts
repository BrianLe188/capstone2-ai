import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { DocxLoader } from "langchain/document_loaders/fs/docx";
import { PDFLoader } from "langchain/document_loaders/fs/pdf";
import { CSVLoader } from "langchain/document_loaders/fs/csv";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { EFileExtension } from "./enums";
import { FaissStore } from "langchain/vectorstores/faiss";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import { join } from "path";
import { PromptTemplate } from "langchain/prompts";

const PROMPT = `You are a helpful AI assistant. And you are a helpful writing assistant developed by Capstone2-Admission. Capstone2-Admission is an AI writing platform to admission system. 
Use the following pieces of context to answer the question at the end. 
- Your goal is to Answer the questions based on the information given in the source.
If you don't know the answer, just say you don't know. DO NOT try to make up an answer. If the question is not related to the context, politely respond that you are tuned to only answer questions that are related to the context.{context} 
Question: {question} 
Helpful answer in markdown:`;

const PROMPT_VN = `Bạn là một trợ lý AI hữu ích. Và bạn là một trợ lý viết lách hữu ích được phát triển bởi Capstone2-Admission. Capstone2-Admission là một nền tảng viết AI cho hệ thống tuyển sinh.
Sử dụng các phần ngữ cảnh sau đây để trả lời câu hỏi ở cuối.
- Mục tiêu của bạn là Trả lời các câu hỏi dựa trên thông tin được cung cấp trong nguồn.
Nếu bạn không biết câu trả lời, chỉ cần nói rằng bạn không biết. KHÔNG cố gắng bịa ra một câu trả lời. Nếu câu hỏi không liên quan đến ngữ cảnh, hãy trả lời một cách lịch sự rằng bạn chỉ trả lời những câu hỏi liên quan đến ngữ cảnh.
---------------------------------
context: {context}
---------------------------------
question: {question}
---------------------------------
Câu trả lời hữu ích trong markdown:`;

const vectorstore = async ({
  extension,
  path,
}: {
  extension: EFileExtension;
  path?: string;
}) => {
  try {
    let blob;
    if (path) {
      blob = await fetch(`${process.env.FILE_SERVICE_HOST}/${path}`).then((r) =>
        r.blob()
      );
    } else {
      blob = join(__dirname, "report.txt");
    }
    let loader;
    if (blob) {
      switch (extension) {
        case EFileExtension.DOCX: {
          loader = new DocxLoader(blob);
          break;
        }
        case EFileExtension.PDF: {
          loader = new PDFLoader(blob);
          break;
        }
        case EFileExtension.TXT: {
          loader = new TextLoader(blob);
          break;
        }
        case EFileExtension.XLSX: {
          loader = new CSVLoader(blob);
          break;
        }
      }
      if (loader) {
        const raw = await loader.load();
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 200,
        });
        const texts = await splitter.splitDocuments(raw);
        const embeddings = new OpenAIEmbeddings({
          openAIApiKey: process.env.OPENAI_KEY,
        });
        const vectorstore = await FaissStore.fromDocuments(texts, embeddings);
        const retriever = vectorstore.asRetriever();
        const model = new ChatOpenAI({
          openAIApiKey: process.env.OPENAI_KEY,
          modelName: "gpt-3.5-turbo",
        });
        const questionPrompt = PromptTemplate.fromTemplate(PROMPT_VN);
        const chain = ConversationalRetrievalQAChain.fromLLM(model, retriever, {
          memory: new BufferMemory({
            memoryKey: "chat_history",
            inputKey: "question",
            outputKey: "text",
            returnMessages: true,
          }),
          qaTemplate: PROMPT_VN,
        });
        return chain;
      }
    }
    return null;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export default vectorstore;
