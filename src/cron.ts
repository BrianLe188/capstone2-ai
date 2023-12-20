import { CronJob } from "cron";

export const storeIntoPinecone = new CronJob(
  "* * * * * *",
  () => {},
  null,
  false
);
