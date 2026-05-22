import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import passport from "passport";
import { configureGooglePassport } from "./auth/googleStrategy.js";
import { config } from "./config.js";
import { adminRoutes } from "./routes/adminRoutes.js";
import { authRoutes } from "./routes/authRoutes.js";
import { podRoutes } from "./routes/podRoutes.js";
import { userRoutes } from "./routes/userRoutes.js";

const app = express();

configureGooglePassport();

const allowedOrigins = [
    'http://localhost:5173',           // Local frontend
    'https://gabbyoh2.github.io',      // Your GitHub Pages frontend
];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log('Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
}));

app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());
app.use(passport.initialize());
app.use("/api/auth", authRoutes);

app.get("/api/health", (_request, response) => {
  response.status(200).json({ status: "ok" });
});

app.use("/api/users", userRoutes);
app.use("/api/pods", podRoutes);
app.use("/api/admin", adminRoutes);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({ message: "Unexpected server error." });
});

export { app };
