import app from "./app.js";
import { connectDatabase } from "./shared/config/database.js";
import { env } from "./shared/config/env.js";

await connectDatabase();

app.listen(env.PORT, () => {
  console.log(`Health Guard API running on port ${env.PORT}`);
});
