import { Router } from 'express';
import User from '../models/User.js';
import GameData from '../models/GameData.js';
import { adminAuth } from '../middleware.js';

const router = Router();

// 获取所有用户
router.get('/users', adminAuth, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        const usersWithData = await Promise.all(users.map(async u => {
            const gd = await GameData.findOne({ userId: u._id });
            return { ...u.toObject(), gameData: gd ? { level: gd.level, gold: gd.resources.gold, totalGoldEarned: gd.stats.totalGoldEarned } : null };
        }));
        res.json({ users: usersWithData });
    } catch (err) { res.status(500).json({ error: '获取用户列表失败' }); }
});

// 系统统计
router.get('/stats', adminAuth, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const onlineUsers = await User.countDocuments({ isOnline: true });
        const allGameData = await GameData.find();
        const avgLevel = allGameData.length ? (allGameData.reduce((s, g) => s + g.level, 0) / allGameData.length).toFixed(1) : 0;
        const totalGold = allGameData.reduce((s, g) => s + g.resources.gold, 0);
        res.json({ stats: { totalUsers, onlineUsers, avgLevel, totalGold } });
    } catch (err) { res.status(500).json({ error: '获取统计失败' }); }
});

// 封禁/解封用户
router.put('/user/:id/ban', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: '用户不存在' });
        if (user.role === 'admin') return res.status(400).json({ error: '不能封禁管理员' });
        user.isBanned = !user.isBanned; await user.save();
        res.json({ message: user.isBanned ? '已封禁' : '已解封', user });
    } catch (err) { res.status(500).json({ error: '操作失败' }); }
});

// 赠送资源
router.post('/grant', adminAuth, async (req, res) => {
    try {
        const { userId, resource, amount } = req.body;
        const gd = await GameData.findOne({ userId });
        if (!gd) return res.status(404).json({ error: '游戏数据不存在' });
        if (!gd.resources.hasOwnProperty(resource)) return res.status(400).json({ error: '无效资源类型' });
        gd.resources[resource] += Number(amount) || 0; await gd.save();
        res.json({ message: '赠送成功', gameData: gd });
    } catch (err) { res.status(500).json({ error: '赠送失败' }); }
});

// 删除用户
router.delete('/user/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: '用户不存在' });
        if (user.role === 'admin') return res.status(400).json({ error: '不能删除管理员' });
        await GameData.deleteOne({ userId: user._id });
        await User.deleteOne({ _id: user._id });
        res.json({ message: '用户已删除' });
    } catch (err) { res.status(500).json({ error: '删除失败' }); }
});

// 重置用户数据
router.post('/reset/:id', adminAuth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: '用户不存在' });
        await GameData.deleteOne({ userId: user._id });
        const gd = await GameData.createForUser(user._id);
        res.json({ message: '数据已重置', gameData: gd });
    } catch (err) { res.status(500).json({ error: '重置失败' }); }
});

export default router;
