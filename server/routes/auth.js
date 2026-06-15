import { Router } from 'express';
import User from '../models/User.js';
import GameData from '../models/GameData.js';
import { auth, generateToken } from '../middleware.js';
import { applyTaskProgress } from '../services/taskService.js';

const router = Router();

// 注册
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
        if (username.length < 2 || username.length > 20) return res.status(400).json({ error: '用户名长度需在2-20个字符之间' });
        if (password.length < 6) return res.status(400).json({ error: '密码长度至少6个字符' });
        if (await User.findOne({ username })) return res.status(400).json({ error: '用户名已存在' });
        const user = await new User({ username, password }).save();
        await GameData.createForUser(user._id);
        res.status(201).json({ token: generateToken(user._id), user: { id: user._id, username: user.username, role: user.role } });
    } catch (err) { console.error(err); res.status(500).json({ error: '注册失败' }); }
});

// 登录
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ error: '用户名和密码不能为空' });
        const user = await User.findOne({ username });
        if (!user || !(await user.comparePassword(password))) return res.status(401).json({ error: '用户名或密码错误' });
        if (user.isBanned) return res.status(403).json({ error: '账号已被封禁' });
        user.lastLogin = new Date(); user.isOnline = true; await user.save();
        try {
            await applyTaskProgress(user._id, 'login', 1);
        } catch (taskErr) {
            console.error('登录任务进度更新失败:', taskErr);
        }
        res.json({ token: generateToken(user._id), user: { id: user._id, username: user.username, role: user.role } });
    } catch (err) { console.error(err); res.status(500).json({ error: '登录失败' }); }
});

// 当前用户信息
router.get('/me', auth, (req, res) => {
    res.json({ user: { id: req.user._id, username: req.user.username, role: req.user.role } });
});

// 修改密码
router.put('/password', auth, async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) return res.status(400).json({ error: '请填写旧密码和新密码' });
        if (newPassword.length < 6) return res.status(400).json({ error: '新密码长度至少6个字符' });
        if (!(await req.user.comparePassword(oldPassword))) return res.status(401).json({ error: '旧密码不正确' });
        req.user.password = newPassword; await req.user.save();
        res.json({ message: '密码修改成功' });
    } catch (err) { res.status(500).json({ error: '修改密码失败' }); }
});

export default router;
