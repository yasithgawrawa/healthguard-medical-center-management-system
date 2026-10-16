// Expose the Express API as a serverless request handler.
import app from "../backend/src/app.js";
import { connectDatabase } from "../backend/src/shared/config/database.js";

let databaseReady;

// Reuse database initialization before forwarding the serverless request to Express.
export default async function handler(req, res) {
  databaseReady ||= connectDatabase();
  await databaseReady;
  return app(req, res);
}
