import jwt from 'jsonwebtoken';
import User from './models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_farm_jwt_secret_2024_secure';

export const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ error: '请先登录' });
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ error: '用户不存在' });
        if (user.isBanned) return res.status(403).json({ error: '账号已被封禁' });
        req.user = user;
        next();
    } catch { res.status(401).json({ error: '认证失败，请重新登录' }); }
};

export const adminAuth = async (req, res, next) => {
    await auth(req, res, () => {
        if (req.user?.role !== 'admin') return res.status(403).json({ error: '需要管理员权限' });
        next();
    });
};

export const generateToken = (userId) => jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
