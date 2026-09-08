import app from "../backend/src/app.js";
import { connectDatabase } from "../backend/src/shared/config/database.js";

let databaseReady;

export default async function handler(req, res) {
  databaseReady ||= connectDatabase();
  await databaseReady;
  return app(req, res);
}
