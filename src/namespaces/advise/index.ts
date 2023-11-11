import { LLMChain } from "langchain/chains";
import { SqlDatabaseChain } from "langchain/chains/sql_db";
import { BaseChatModel } from "langchain/chat_models/base";
import { Namespace } from "socket.io";
import { MyEventEmitter } from "../../events";
import vectorstore from "../../utils/qachain";
import type { FILES } from "../../utils/types";

const advise = (
  io: Namespace,
  {
    chainCore,
    chainTag,
  }: { chainCore: SqlDatabaseChain; chainTag: LLMChain<object, BaseChatModel> }
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
                const qachain = await vectorstore({
                  extension: fileObject.extension,
                  path: fileObject.path,
                });
                result = (
                  await qachain?.call({
                    question: content,
                  })
                )?.text;
              }
            } else {
              result = await chainCore.run(content);
            }
            if (result) {
              const senderMessage = {
                content,
                type,
                room,
                sender,
              };
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
