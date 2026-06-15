import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/auth.js';
import gameRoutes from './routes/game.js';
import adminRoutes from './routes/admin.js';
import taskRoutes from './routes/tasks.js';
import achievementRoutes from './routes/achievements.js';
import { setupSocket } from './socket/handler.js';
import User from './models/User.js';
import GameData from './models/GameData.js';
import DailyTaskConfig from './models/DailyTaskConfig.js';
import Achievement from './models/Achievement.js';
import PlayerAchievement from './models/PlayerAchievement.js';
import { GAME_CONFIG } from './config.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const PORT = process.env.PORT || 1218;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/your_farm';

app.use(cors());
app.use(express.json());

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/achievements', achievementRoutes);

// 游戏配置
app.get('/api/config', (req, res) => res.json({ config: GAME_CONFIG }));

// 静态文件（生产环境）
app.use(express.static(join(__dirname, '..', 'dist')));
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
        res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
    }
});

// Socket.IO
setupSocket(io);

// 初始化管理员账号
async function initAdmin() {
    const existing = await User.findOne({ username: GAME_CONFIG.admin.username });
    if (!existing) {
        const admin = new User({ username: GAME_CONFIG.admin.username, password: GAME_CONFIG.admin.password, role: 'admin' });
        await admin.save();
        await GameData.createForUser(admin._id);
        console.log('✅ 管理员账号已创建: admin / admin123');
    }
}

async function initTasks() {
    await DailyTaskConfig.initializeDefaults();
    console.log('✅ 日常任务配置初始化完成');
}

async function initAchievements() {
    await Achievement.initializeDefaults();
    console.log('✅ 成就配置初始化完成');
}

async function startAchievementCompensation() {
    const CLAIM_TIMEOUT_MS = 5 * 60 * 1000;
    const CHECK_INTERVAL_MS = 60 * 1000;

    setInterval(async () => {
        try {
            const now = new Date();
            const timeoutThreshold = new Date(now.getTime() - CLAIM_TIMEOUT_MS);
            const result = await PlayerAchievement.updateMany(
                {
                    claimStatus: 'claiming',
                    claimStartedAt: { $lt: timeoutThreshold }
                },
                {
                    $set: { claimStatus: 'pending', claimStartedAt: null }
                }
            );
            if (result.modifiedCount > 0) {
                console.log(`🔄 成就补偿：已回滚 ${result.modifiedCount} 条超时领取记录`);
            }
        } catch (err) {
            console.error('❌ 成就补偿任务执行失败:', err);
        }
    }, CHECK_INTERVAL_MS);

    console.log('✅ 成就补偿定时任务已启动');
}

// 启动
mongoose.connect(MONGODB_URI).then(async () => {
    console.log('✅ MongoDB 连接成功');
    await initAdmin();
    await initTasks();
    await initAchievements();
    startAchievementCompensation();
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`🌾 你的农场服务器运行在 http://0.0.0.0:${PORT}`);
    });
}).catch(err => { console.error('❌ MongoDB 连接失败:', err); process.exit(1); });
