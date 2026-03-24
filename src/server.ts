import { buildApp } from "./app.js";

const PORT = parseInt(process.env.PORT ?? "3000");
const HOST = process.env.HOST ?? "0.0.0.0";

const startServer = async () => {
  const app = await buildApp();

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`Server listening on port ${PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

startServer();
