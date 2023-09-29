import { DataSource } from "typeorm";

export const coreDB = new DataSource({
  type: "mysql",
  host: "127.0.0.1",
  port: 3306,
  username: "root",
  password: "root",
  database: "capstone2-core",
});
