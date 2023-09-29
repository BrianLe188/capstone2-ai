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
  io.on("connnection", (socket) => {
    socket.on("chat", ({ message }: { message: string }) => {});
  });
};

export default advise;
