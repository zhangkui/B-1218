import DailyTask from '../models/DailyTask.js';
import DailyTaskConfig from '../models/DailyTaskConfig.js';
import GameData from '../models/GameData.js';
import { GAME_CONFIG } from '../config.js';

function checkLevelUp(gd) {
    let leveled = false;
    while (gd.level < GAME_CONFIG.maxLevel && gd.experience >= gd.level * GAME_CONFIG.expPerLevel) {
        gd.experience -= gd.level * GAME_CONFIG.expPerLevel;
        gd.level += 1; leveled = true;
    }
    return leveled;
}

export async function applyTaskProgress(userId, taskType, amount = 1) {
    const daily = await DailyTask.getForUser(userId);
    const result = await daily.addProgress(taskType, amount);
    await daily.save();
    return { daily, progressResult: result };
}

export async function claimTaskReward(userId, taskType) {
    const daily = await DailyTask.getForUser(userId);
    const task = daily.tasks.find(t => t.taskType === taskType);
    if (!task) throw new Error('任务不存在');
    if (task.claimed) throw new Error('奖励已领取');

    const config = await DailyTaskConfig.findOne({ taskType, enabled: true });
    if (!config) throw new Error('任务配置不存在');
    if (task.progress < config.targetCount) throw new Error('任务未完成');

    const gd = await GameData.findOne({ userId });
    if (!gd) throw new Error('游戏数据不存在');

    const rewards = config.rewards || {};
    let rewardText = [];
    if (rewards.gold) { gd.resources.gold += rewards.gold; rewardText.push(`+${rewards.gold}金币`); }
    if (rewards.diamond) { gd.resources.diamond += rewards.diamond; rewardText.push(`+${rewards.diamond}钻石`); }
    if (rewards.energy) {
        gd.resources.energy = Math.min(gd.resources.energy + rewards.energy, GAME_CONFIG.energy.max);
        rewardText.push(`+${rewards.energy}体力`);
    }
    if (rewards.exp) { gd.experience += rewards.exp; rewardText.push(`+${rewards.exp}经验`); }

    const leveled = checkLevelUp(gd);
    task.claimed = true;

    await Promise.all([daily.save(), gd.save()]);
    return { rewards, rewardText: rewardText.join(' '), gameData: gd, leveled, config };
}

export async function getTaskListWithProgress(userId) {
    const [daily, configs] = await Promise.all([
        DailyTask.getForUser(userId),
        DailyTaskConfig.find({ enabled: true }).sort({ sortOrder: 1 })
    ]);
    const progressMap = daily.getProgressMap();
    return configs.map(config => {
        const p = progressMap[config.taskType] || { progress: 0, claimed: false };
        return {
            taskType: config.taskType,
            name: config.name,
            description: config.description,
            icon: config.icon,
            targetCount: config.targetCount,
            rewards: config.rewards,
            progress: p.progress,
            claimed: p.claimed,
            completed: p.progress >= config.targetCount
        };
    });
}
