import PlayerAchievement from '../models/PlayerAchievement.js';
import Achievement from '../models/Achievement.js';
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

export async function applyAchievementProgress(userId, achievementType, amount = 1) {
    try {
        const results = await PlayerAchievement.atomicAddProgress(userId, achievementType, amount);
        return { success: true, results };
    } catch (err) {
        console.error('applyAchievementProgress error:', err);
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

export async function claimAchievementReward(userId, achievementId) {
    const startResult = await PlayerAchievement.tryStartClaim(userId, achievementId);
    if (!startResult.success) {
        throw new Error(startResult.reason || '领取失败');
    }

    const achievement = startResult.achievement;
    const rewards = achievement.rewards || {};

    let rewardResult = null;
    let rewardError = null;

    try {
        rewardResult = await applyRewardsWithConcurrency(userId, rewards);
    } catch (err) {
        rewardError = err;
        console.error('成就奖励发放失败，准备回滚领取状态:', err);
    }

    if (rewardError) {
        try {
            await PlayerAchievement.rollbackClaim(userId, achievementId);
            console.log(`成就 ${achievementId} 领取状态已回滚，用户可重试`);
        } catch (rollbackErr) {
            console.error('回滚领取状态失败，可能需要手动补偿:', rollbackErr);
        }
        throw new Error(`奖励发放失败：${rewardError.message}，请稍后重试`);
    }

    try {
        const confirmResult = await PlayerAchievement.confirmClaim(userId, achievementId);
        if (!confirmResult.success && !confirmResult.alreadyClaimed) {
            console.error('确认领取状态失败，但奖励已发放。奖励已到账，请用户放心');
        }
    } catch (confirmErr) {
        console.error('确认领取状态异常，但奖励已发放。奖励已到账，请用户放心:', confirmErr);
    }

    return {
        rewards,
        rewardText: rewardResult.rewardText,
        gameData: rewardResult.gameData,
        leveled: rewardResult.leveled,
        achievement
    };
}

export async function getAchievementListWithProgress(userId) {
    return PlayerAchievement.getForUser(userId);
}
