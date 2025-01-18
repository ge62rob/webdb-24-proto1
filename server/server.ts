// 文件路径：webdb-24-proto1/server/server.ts

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db/db';
import drugRoutes from './routes/drugRoutes';
import interactionRoutes from './routes/interactionRoutes';

dotenv.config();

const app = express();
app.use(cors());
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
