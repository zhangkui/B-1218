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
    try {
        const config = await DailyTaskConfig.findOne({ taskType, enabled: true });
        if (!config) return { success: false, reason: '任务未启用' };
        const result = await DailyTask.atomicAddProgress(userId, taskType, amount, config.targetCount);
        return { success: true, ...result, config };
    } catch (err) {
        console.error('applyTaskProgress error:', err);
        return { success: false, reason: err.message };
    }
}

async function applyRewardsWithConcurrency(userId, rewards) {
    let attempt = 0;
    while (attempt < 5) {
        attempt++;
        const gd = await GameData.findOne({ userId });
        if (!gd) throw new Error('游戏数据不存在');

        const rewardText = [];
        let gold = 0, diamond = 0, energy = 0, exp = 0;

        if (rewards.gold) {
            gold = rewards.gold;
            gd.resources.gold += gold;
            rewardText.push(`+${gold}金币`);
        }
        if (rewards.diamond) {
            diamond = rewards.diamond;
            gd.resources.diamond += diamond;
            rewardText.push(`+${diamond}钻石`);
        }
        if (rewards.energy) {
            energy = Math.min(rewards.energy, GAME_CONFIG.energy.max - gd.resources.energy);
            if (energy > 0) {
                gd.resources.energy += energy;
                rewardText.push(`+${energy}体力`);
            }
        }
        if (rewards.exp) {
            exp = rewards.exp;
            gd.experience += exp;
            rewardText.push(`+${exp}经验`);
        }

        const leveled = checkLevelUp(gd);
        gd.increment();

        try {
            const saved = await gd.save();
            return { gameData: saved, rewardText: rewardText.join(' '), leveled };
        } catch (e) {
            if (e.name === 'VersionError') {
                continue;
            }
            throw e;
        }
    }
    throw new Error('奖励发放失败，请重试');
}

export async function claimTaskReward(userId, taskType) {
    const config = await DailyTaskConfig.findOne({ taskType, enabled: true });
    if (!config) throw new Error('任务配置不存在');

    const claimResult = await DailyTask.atomicClaimTask(userId, taskType, config.targetCount);
    if (!claimResult.success) {
        throw new Error(claimResult.reason || '领取失败');
    }

    const rewards = config.rewards || {};
    const rewardResult = await applyRewardsWithConcurrency(userId, rewards);

    return {
        rewards,
        rewardText: rewardResult.rewardText,
        gameData: rewardResult.gameData,
        leveled: rewardResult.leveled,
        config
    };
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
