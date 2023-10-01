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
        const res = await chainCore.run(content, {
          callbacks: [
            {
              handleLLMNewToken(token: string) {
                socket.emit("receive_message", { content: token });
              },
            },
          ],
        });
        if (res) {
          MyEventEmitter.emit("create_message", { content: res });
        }
      }
    );
  });
};

export default advise;
