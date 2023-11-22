import { Channel, Message } from "amqplib";
import { MyEventEmitter } from "../events";
import { read, utils } from "xlsx";
import path from "path";
import fs from "fs";
import { ConversationalRetrievalQAChain } from "langchain/chains";
import axios from "axios";

const queue = async ({
  channel,
  qachain,
}: {
  channel: Channel;
  qachain?: ConversationalRetrievalQAChain | null;
}) => {
  const fileExchange = "file";
  const uploadfileQueue = "upload_file";
  const messageExchange = "message";
  const getFileMessageQueue = "get_file";
  const returnFileMessageQueue = "return_file_object";
  const aiQueue = "ai_queue";
  const returnMessage = "return_message_queue";
  const generateSourceFromReportQueue = "generate_source_from_report_queue";

  await channel.assertExchange(messageExchange, "direct");
  await channel.assertExchange(fileExchange, "direct");
  await channel.bindQueue(uploadfileQueue, fileExchange, "qa");

  await channel.assertQueue(uploadfileQueue);
  await channel.assertQueue(getFileMessageQueue);
  await channel.assertQueue(returnFileMessageQueue);
  await channel.assertQueue(aiQueue);
  await channel.assertQueue(returnMessage);
  await channel.assertQueue(generateSourceFromReportQueue);

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
    generateSourceFromReportQueue,
    async () => {
      try {
        const [rules, statistics] = await Promise.all([
          await axios
            .get("http://localhost:1111/rules")
            .then((data) => data.data),
          await axios
            .get("http://localhost:1111/statistics")
            .then((data) => data.data),
        ]).then((data) => data);
        const reportfilePath = path.join(__dirname, "../report.txt");
        fs.appendFileSync(
          reportfilePath,
          `\nĐây là những thông tin và quy định của trường, hãy dùng nó để đưa ra câu trả lời cho câu hỏi của sinh viên:\n`
        );
        for (const rule of rules) {
          const template = `\n----------------------------\n${rule.name}\n${rule.content}`;
          fs.appendFileSync(reportfilePath, template);
          console.log(`append rule ${rule.id}`);
        }
        fs.appendFileSync(
          reportfilePath,
          `\nĐây là những thông tin thống kê về của mỗi chuyên ngành, bao gồm: tên, học phí, điểm chuẩn, tỉ lệ chọi, số đơn đã đăng ký, số đơn bị từ chối và những chứng chỉ cần có để tốt nghiệp. Hãy dùng những thông tin này để trả lời cho những câu hỏi của sinh viên:\n`
        );
        for (const s of statistics) {
          const template = `\n- Ngành ${s.majorName} có học phí ${s.tuition}, điểm chuẩn ${s.cutoffPoint}, số chỉ tiêu ${s.admissionCriteria}, số đơn đã đăng ký ${s.numberOfApplicationsApplied}, số đơn được chấp nhận (đơn trúng tuyển) ${s.numberOfRejectedApplicationsApplied}, số đơn bị từ chối ${s.numberOfRejectedApplicationsApplied}, tỉ lệ chọi ${s.acceptanceRate} và những chứng chỉ cần có để tốt nghiệp là ${s.graduationRequirements}\n`;
          fs.appendFileSync(reportfilePath, template);
          console.log(`append rule ${s.id}`);
        }
      } catch (error) {
        console.log(error);
      }
    },
    {
      noAck: true,
    }
  );

  channel.consume(
    uploadfileQueue,
    async (msg) => {
      if (msg?.fields.routingKey === "qa") {
        const buffer = msg.content;
        const data = new Uint8Array(buffer);
        const workbook = read(data, { type: "buffer" });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const jsonData: { question: string; answer: string }[] =
          utils.sheet_to_json(sheet);

        const reportfilePath = path.join(__dirname, "../report.txt");
        fs.appendFileSync(
          reportfilePath,
          `Đây là bộ câu hỏi mẫu đã được hỏi và trả lời trước đây, dựa vào đó để tạo ra những câu trả lời thích hợp cho từng câu hỏi của sinh viên:`
        );
        Promise.all(
          jsonData.map(async (item, index) => {
            try {
              const template = `
${index}:
- question: ${item.question} 
- answer: ${item.answer}`;
              fs.appendFileSync(reportfilePath, template);
              console.log(`append question and answer ${index}`);
            } catch (error) {
              console.log(error);
            }
          })
        );
      }
    },
    {
      noAck: true,
    }
  );

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

  channel.consume(
    aiQueue,
    async (msg) => {
      try {
        if (msg?.content) {
          const data = JSON.parse(msg.content.toString());
          const { message, sender_psid } = data;
          const result = (
            await qachain?.call({
              question: message,
            })
          )?.text;
          if (result) {
            channel.sendToQueue(
              returnMessage,
              Buffer.from(JSON.stringify({ result, sender_psid }))
            );
          }
        }
      } catch (error) {
      } finally {
        channel.ack(msg as Message);
      }
    },
    {
      noAck: false,
    }
  );
};

export default queue;
