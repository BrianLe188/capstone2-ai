import { EFileExtension } from "./utils/enums";
import vectorstore from "./utils/qachain";

const qachain = async () => {
  const vector = await vectorstore({
    extension: EFileExtension.TXT,
  });
  return vector;
};

export default qachain;
