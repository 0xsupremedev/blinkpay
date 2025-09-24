import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import dotenv from "dotenv";
import { z } from "zod";
import { router as authRouter } from "./routes/auth";
import { router as paymentsRouter } from "./routes/payments";
import { router as merchantsRouter } from "./routes/merchants";
import { router as quotesRouter } from "./routes/quotes";
import { router as webhooksRouter } from "./routes/webhooks";
import { router as dashboardRouter } from "./routes/dashboard";
import crypto from "crypto";

dotenv.config();

const EnvSchema = z.object({
	PORT: z.string().optional(),
	ALLOWED_ORIGINS: z.string().optional(),
	BLINKPAY_PROGRAM_ID: z.string().optional(),
	NEXT_PUBLIC_BACKEND_URL: z.string().optional(),
	WEBHOOK_SECRET: z.string().optional(),
});
const env = EnvSchema.parse(process.env);

const app = express();
const origins = (env.ALLOWED_ORIGINS || "http://localhost:3000").split(",");
app.use(cors({ origin: (origin, cb) => {
	if (!origin) return cb(null, true);
	if (origins.includes(origin)) return cb(null, true);
	return cb(new Error("CORS not allowed"));
}}));

app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(rateLimit({ windowMs: 60_000, max: 120 }));
app.use(pinoHttp({
	genReqId: (req) => (req.headers["x-request-id"] as string) || crypto.randomUUID(),
	customLogLevel: (_req, res, err) => err || res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info",
}));

app.get("/health", (_req, res) => {
	res.json({ ok: true, service: "blinkpay-backend-ts" });
});

app.use("/auth", authRouter);
app.use("/payments", paymentsRouter);
app.use("/merchants", merchantsRouter);
app.use("/quotes", quotesRouter);
app.use("/webhooks", webhooksRouter);
app.use("/dashboard", dashboardRouter);

const port = Number(env.PORT || 4000);
app.listen(port, () => console.log(`[INFO] BlinkPay backend TS listening on :${port}`));
