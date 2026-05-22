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

console.log('=== Starting app initialization ===');

configureGooglePassport();

const allowedOrigins = [
    'http://localhost:5173',
    'https://gabbyoh2.github.io',
    'https://gabbyoh2.github.io/AI-Career-Pods',
];

app.get('/', (req, res) => {
    res.json({ message: 'AI Career Pods API is running', endpoints: ['/api/health', '/api/auth', '/api/pods'] });
});

// 1. Basic routes FIRST (no middleware blocking)
app.get('/ping', (req, res) => {
    console.log('Ping endpoint was called!');
    res.json({ status: 'pong' });
});

// 2. CORS and middleware
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin) return callback(null, true);

        // Check if origin matches any allowed pattern
        const isAllowed = allowedOrigins.some(allowed =>
            origin === allowed || origin.startsWith(allowed)
        );

        if (isAllowed) {
            callback(null, true);
        } else {
            console.log('Blocked origin:', origin);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

app.use(express.json({ limit: "15mb" }));
app.use(cookieParser());
app.use(passport.initialize());

// 3. Debug middleware (log only, don't block)
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// 4. YOUR ACTUAL ROUTES - These MUST come before the catch-all
console.log('Mounting auth routes...');
app.use("/api/auth", authRoutes);
console.log('✅ Auth routes mounted');

// DEBUG: List all registered auth routes
if (authRoutes.stack) {
    const routes = authRoutes.stack
        .filter(r => r.route)
        .map(r => r.route.path);
    console.log('📋 Auth routes registered:', routes);
} else {
    console.log('⚠️ No routes found in authRoutes');
}

console.log('Mounting health route...');
app.get("/api/health", (_request, response) => {
    console.log('❗ Health endpoint was called!');
    response.status(200).json({ status: "ok" });
});
console.log('✅ Health route mounted');

console.log('Mounting user routes...');
app.use("/api/users", userRoutes);
console.log('✅ User routes mounted');
if (userRoutes.stack) {
    const routes = userRoutes.stack.filter(r => r.route).map(r => r.route.path);
    console.log('📋 User routes registered:', routes);
}

console.log('Mounting pod routes...');
app.use("/api/pods", podRoutes);
console.log('✅ Pod routes mounted');
if (podRoutes.stack) {
    const routes = podRoutes.stack.filter(r => r.route).map(r => r.route.path);
    console.log('📋 Pod routes registered:', routes);
}

console.log('Mounting admin routes...');
app.use("/api/admin", adminRoutes);
console.log('✅ Admin routes mounted');

// 5. CATCH-ALL - Only AFTER all routes (404 for anything not matched)
app.use('*', (req, res) => {
    console.log(`[CATCH-ALL] ${req.method} ${req.originalUrl}`);
    res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

// 6. Error handler (last)
app.use((error, _request, response, _next) => {
    console.error('Error handler:', error);
    response.status(500).json({ message: "Unexpected server error." });
});

console.log('=== App initialization complete ===');

export { app };