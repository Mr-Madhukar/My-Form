import http from "node:http";
import { logger } from "@repo/logger";
import { app as expressApplication } from "./server";

import { env } from "./env";

async function init() {
  console.log("Starting Express HTTP server initialization...");
  try {
    const server = http.createServer(expressApplication);
    const PORT: number = env.PORT ? +env.PORT : 8123;
    
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`Server successfully listening on host 0.0.0.0, port ${PORT}`);
      logger.info(`http server is running on PORT ${PORT}`);
    });
  } catch (err) {
    console.error("Fatal error during HTTP server initialization", err);
    logger.error(`Error creating http server`, { err });
    process.exit(1);
  }
}

init();
