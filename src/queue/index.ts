import { Channel } from "amqplib";
import { MyEventEmitter } from "../events";

const queue = async ({ channel }: { channel: Channel }) => {
  const messageExchange = "message";

  await channel.assertExchange(messageExchange, "direct");

  MyEventEmitter.on("create_message", (data) => {
    channel.publish(
      messageExchange,
      "write",
      Buffer.from(JSON.stringify(data))
    );
  });
};

export default queue;
