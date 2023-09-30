import { LLMChain } from "langchain/chains";
import { SqlDatabaseChain } from "langchain/chains/sql_db";
import { BaseChatModel } from "langchain/dist/chat_models/base";
import { Namespace } from "socket.io";

const advise = (
  io: Namespace,
  {
    chainCore,
    chainTag,
  }: { chainCore: SqlDatabaseChain; chainTag: LLMChain<object, BaseChatModel> }
) => {
  io.on("connection", (socket) => {
    socket.on(
      "chat",
      ({ type, content }: { type: string; content: string }) => {
        socket.emit("chat", {});
      }
    );
  });
};

export default advise;
