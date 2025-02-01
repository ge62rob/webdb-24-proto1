import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db/db';
import drugRoutes from './routes/drugRoutes';
import interactionRoutes from './routes/interactionRoutes';

dotenv.config();

const app = express();

// 定义允许的远程来源列表（针对 GitHub Pages 部分）
const allowedOrigins = [
  "https://ShuchengYang.github.io",
  "https://ShuchengYang.github.io/drug_info_system"
];

app.use(cors({
  origin: (origin, callback) => {
    // 如果请求没有 origin（例如 curl、Postman），可选择允许
    if (!origin) {
      return callback(null, true);
    }
    // 如果请求来自本地（localhost 或 127.0.0.1），允许
    if (origin.startsWith("http://localhost") || origin.startsWith("http://127.0.0.1")) {
      return callback(null, true);
    }
    // 如果请求的 origin 恰好等于我们允许的 GitHub Pages 域名之一，则允许
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // 否则拒绝
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());

// 测试数据库连接
app.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(`PostgreSQL connected: ${result.rows[0].now}`);
  } catch (error) {
    console.error('Error connecting to database:', error);
    res.status(500).send('Database connection error');
  }
});

// 挂载路由
app.use('/api/drugs', drugRoutes);
app.use('/api/interactions', interactionRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
