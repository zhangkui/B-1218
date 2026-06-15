import { Router } from 'express';
import { auth } from '../middleware.js';
import { getAchievementListWithProgress, claimAchievementReward } from '../services/achievementService.js';

const router = Router();

router.get('/list', auth, async (req, res) => {
    try {
        const achievements = await getAchievementListWithProgress(req.user._id);
        res.json({ achievements });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '获取成就列表失败' });
    }
});

router.post('/claim/:achievementId', auth, async (req, res) => {
    try {
        const { achievementId } = req.params;
        if (!achievementId || achievementId.length !== 24) {
            return res.status(400).json({ error: '无效成就ID' });
        }
        const result = await claimAchievementReward(req.user._id, achievementId);
        res.json({
            message: `领取成功：${result.rewardText}`,
            rewards: result.rewards,
            gameData: result.gameData,
            leveled: result.leveled,
            achievement: result.achievement
        });
    } catch (err) {
        res.status(400).json({ error: err.message || '领取失败' });
    }
});

export default router;
