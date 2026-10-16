// Connect to MongoDB before starting the Express HTTP server.
import app from "./app.js";
import { connectDatabase } from "./shared/config/database.js";
import { env } from "./shared/config/env.js";

// Finish database initialization before accepting HTTP requests.
await connectDatabase();

app.listen(env.PORT, () => {
  console.log(`Health Guard API running on port ${env.PORT}`);
});
