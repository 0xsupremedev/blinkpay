import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { router as authRouter } from "./routes/auth.js";
import { router as paymentsRouter } from "./routes/payments.js";
import { router as merchantsRouter } from "./routes/merchants.js";
import { router as quotesRouter } from "./routes/quotes.js";
import { router as webhooksRouter } from "./routes/webhooks.js";
import { logger } from "./utils/logger.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
	res.json({ ok: true, service: "blinkpay-backend" });
});

app.use("/auth", authRouter);
app.use("/payments", paymentsRouter);
app.use("/merchants", merchantsRouter);
app.use("/quotes", quotesRouter);
app.use("/webhooks", webhooksRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => logger.info(`BlinkPay backend listening on :${port}`));
