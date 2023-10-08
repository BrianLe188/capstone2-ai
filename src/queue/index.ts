import { Channel, Message } from "amqplib";
import { MyEventEmitter } from "../events";

const queue = async ({ channel }: { channel: Channel }) => {
  const messageExchange = "message";
  const getFileMessageQueue = "get_file";
  const returnFileMessageQueue = "return_file_object";

  await channel.assertExchange(messageExchange, "direct");
  await channel.assertQueue(getFileMessageQueue);
  await channel.assertQueue(returnFileMessageQueue);

  MyEventEmitter.on("create_message", async (data) => {
    channel.publish(
      messageExchange,
      "write",
      Buffer.from(JSON.stringify(data))
    );
  });

  MyEventEmitter.on("get_file", async (id: string) => {
    channel.sendToQueue(getFileMessageQueue, Buffer.from(id));
  });

  channel.consume(
    returnFileMessageQueue,
    (msg) => {
      if (msg?.content) {
        MyEventEmitter.emit("return_file", JSON.parse(msg.content.toString()));
      }
      channel.ack(msg as Message);
    },
    {
      noAck: false,
    }
  );
};

export default queue;
