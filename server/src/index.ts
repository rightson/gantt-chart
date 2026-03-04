import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import { setupWebSocket } from './ws/index.js';

// Run migration on startup
import './db/migrate.js';

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

// WebSocket
setupWebSocket(httpServer);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
