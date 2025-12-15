import 'dotenv/config';
import { type Server } from "node:http";
import type { Express } from "express";
import runApp from "./app";

// Simple setup function that doesn't do anything extra
// The static file serving is already handled in app.ts
export async function setupDev(_app: Express, _server: Server) {
  // No additional setup needed for development
  // Static files are served via express.static in app.ts
}

(async () => {
  await runApp(setupDev);
})();


