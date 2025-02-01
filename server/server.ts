// 文件路径：webdb-24-proto1/server/server.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db/db';
import drugRoutes from './routes/drugRoutes';
import interactionRoutes from './routes/interactionRoutes';

dotenv.config();

const app = express();

// 放宽限制：允许所有来源的请求
app.use(cors({
  origin: '*', // 允许所有域名
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 或者直接使用 app.use(cors()); 也可（默认允许所有来源）
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
