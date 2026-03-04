import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import taskRoutes from './routes/tasks.js';
import { setupWebSocket } from './ws/index.js';

// Run migration on startup
await import('./db/migrate.js');

const app = Fastify({ logger: true });

await app.register(cors);

// Routes
app.register(authRoutes, { prefix: '/api/auth' });
app.register(projectRoutes, { prefix: '/api/projects' });
app.register(taskRoutes, { prefix: '/api/tasks' });

// Health check
app.get('/api/health', async () => {
  return { status: 'ok' };
});

const PORT = Number(process.env.PORT) || 3001;

// Setup WebSocket on the underlying Node HTTP server before listening
await app.ready();
setupWebSocket(app.server);

await app.listen({ port: PORT, host: '0.0.0.0' });
console.log(`Server running on http://localhost:${PORT}`);
