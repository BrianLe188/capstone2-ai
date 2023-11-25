import { ConversationalRetrievalQAChain, LLMChain } from "langchain/chains";
import { SqlDatabaseChain } from "langchain/chains/sql_db";
import { BaseChatModel } from "langchain/chat_models/base";
import { Namespace } from "socket.io";
import { MyEventEmitter } from "../../events";
import type { FILES } from "../../utils/types";
import { vectorstore } from "../../qachain";
import { chain, initChain } from "../../pinecone";
import { OUTPUT_LANGUAGE_TRANSLATE_TO } from "../../utils/constant";
import { translate } from "../../google-translate";

const advise = (
  io: Namespace,
  {
    qachain,
  }: // advancedQA,
  {
    chainCore: SqlDatabaseChain;
    chainTag: LLMChain<object, BaseChatModel>;
    qachain?: ConversationalRetrievalQAChain | null;
    // advancedQA: RunnableSequence<
    //   {
    //     question: string;
    //   },
    //   any
    // >;
  }
) => {
  io.on("connection", (socket) => {
    console.log(`${socket.id} connect`);

    socket.on(
      "chat",
      async ({
        type,
        content,
        file,
        room,
        sender,
      }: {
        type: string;
        content: string;
        file: number;
        room: string;
        sender: string;
      }) => {
        try {
          if (content) {
            let result = "";
            if (file) {
              MyEventEmitter.emit("get_file", file.toString());
              const fileObject: FILES = await new Promise(
                (resolve, _reject) => {
                  MyEventEmitter.on("return_file", (data) => {
                    if (data) {
                      resolve(data);
                    }
                  });
                }
              );
              if (fileObject) {
                const qachainFromTargetFile = await vectorstore({
                  extension: fileObject.extension,
                  path: fileObject.path,
                });
                result = (
                  await qachainFromTargetFile?.call({
                    question: content,
                  })
                )?.text;
              }
            } else {
              if (!chain) {
                await initChain();
              }
              const response = await chain.call({
                query: content,
              });
              if (response) {
                const text = response.text;
                const [translation] = await translate.translate(
                  text,
                  OUTPUT_LANGUAGE_TRANSLATE_TO
                );
                result = translation;
              }
            }
            if (result) {
              const aiMessage = {
                content: result,
                type: "ai",
                room,
                sender: "ai",
              };
              socket.emit("receive_message", aiMessage);
              MyEventEmitter.emit("create_message", aiMessage);
            }
          }
        } catch (error) {
          console.log(error);
        }
      }
    );
  });
};

export default advise;
