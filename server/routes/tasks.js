import { Router } from 'express';
import { auth } from '../middleware.js';
import DailyTaskConfig from '../models/DailyTaskConfig.js';
import { getTaskListWithProgress, claimTaskReward } from '../services/taskService.js';

const router = Router();

router.get('/list', auth, async (req, res) => {
    try {
        const tasks = await getTaskListWithProgress(req.user._id);
        res.json({ tasks });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: '获取任务列表失败' });
    }
});

router.post('/claim/:taskType', auth, async (req, res) => {
    try {
        const { taskType } = req.params;
        const validTypes = ['login', 'plant', 'harvest', 'feed_collect'];
        if (!validTypes.includes(taskType)) {
            return res.status(400).json({ error: '无效任务类型' });
        }
        const result = await claimTaskReward(req.user._id, taskType);
        res.json({
            message: `领取成功：${result.rewardText}`,
            rewards: result.rewards,
            gameData: result.gameData,
            leveled: result.leveled,
            config: result.config
        });
    } catch (err) {
        res.status(400).json({ error: err.message || '领取失败' });
    }
});

export default router;
