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

const vectorstore = async ({
  extension,
  path,
}: {
  extension: EFileExtension;
  path: string;
}) => {
  try {
    const blob = await fetch(`${process.env.FILE_SERVICE_HOST}/${path}`).then(
      (r) => r.blob()
    );
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
          chunkSize: 2000,
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
        const chain = ConversationalRetrievalQAChain.fromLLM(model, retriever, {
          memory: new BufferMemory({
            memoryKey: "chat_history",
            inputKey: "question",
            outputKey: "text",
            returnMessages: true,
          }),
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
