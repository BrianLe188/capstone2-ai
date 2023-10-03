import { LLMChain } from "langchain/chains";
import { SqlDatabaseChain } from "langchain/chains/sql_db";
import { BaseChatModel } from "langchain/chat_models/base";
import { Namespace } from "socket.io";
import { MyEventEmitter } from "../../events";

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
      async ({ type, content }: { type: string; content: string }) => {
        try {
          if (content) {
            const tagsOfHumanInput: any = await chainTag.run(content);
            MyEventEmitter.emit("create_message", {
              content,
              type,
              topics: Object.keys(tagsOfHumanInput).map(
                (item) => tagsOfHumanInput[item]
              ),
            });
            const res = await chainCore.run(content);
            if (res) {
              socket.emit("receive_message", { content: res });
              const tags: any = await chainTag.run(res);
              MyEventEmitter.emit("create_message", {
                content: res,
                type: "ai",
                topics: Object.keys(tags).map((item) => tags[item]),
              });
            }
          }
        } catch (error) {}
      }
    );
  });
};

export default advise;
