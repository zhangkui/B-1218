import mongoose from 'mongoose';

const playerAchievementSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    achievementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', required: true },
    progress: { type: Number, default: 0, min: 0 },
    claimed: { type: Boolean, default: false },
    __v: { type: Number, default: 0 }
}, { timestamps: true, versionKey: '__v' });

playerAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });

playerAchievementSchema.statics.getForUser = async function (userId) {
    const Achievement = mongoose.model('Achievement');
    const achievements = await Achievement.find({ enabled: true }).sort({ sortOrder: 1 });

    const playerProgress = await this.find({ userId });
    const progressMap = {};
    playerProgress.forEach(p => { progressMap[p.achievementId.toString()] = p; });

    const GameData = mongoose.model('GameData');
    const gd = await GameData.findOne({ userId });

    return achievements.map(achievement => {
        let currentProgress = progressMap[achievement._id.toString()];
        let progress = currentProgress ? currentProgress.progress : 0;
        let claimed = currentProgress ? currentProgress.claimed : false;

        if (!currentProgress) {
            if (achievement.achievementType === 'plant') {
                progress = gd?.stats?.totalPlants || 0;
            } else if (achievement.achievementType === 'harvest') {
                progress = gd?.stats?.totalHarvests || 0;
            } else if (achievement.achievementType === 'feed_collect') {
                progress = gd?.stats?.totalAnimalCollects || 0;
            }
        }

        return {
            _id: achievement._id,
            achievementType: achievement.achievementType,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            targetCount: achievement.targetCount,
            rewards: achievement.rewards,
            progress,
            claimed,
            completed: progress >= achievement.targetCount
        };
    });
};

playerAchievementSchema.statics.atomicAddProgress = async function (userId, achievementType, amount = 1) {
    const Achievement = mongoose.model('Achievement');
    const achievements = await Achievement.find({ achievementType, enabled: true });

    const results = [];
    for (const achievement of achievements) {
        let attempt = 0;
        while (attempt < 5) {
            attempt++;

            let playerAch = await this.findOne({ userId, achievementId: achievement._id });

            if (!playerAch) {
                const GameData = mongoose.model('GameData');
                const gd = await GameData.findOne({ userId });
                let initialProgress = 0;
                if (achievementType === 'plant') {
                    initialProgress = gd?.stats?.totalPlants || 0;
                } else if (achievementType === 'harvest') {
                    initialProgress = gd?.stats?.totalHarvests || 0;
                } else if (achievementType === 'feed_collect') {
                    initialProgress = gd?.stats?.totalAnimalCollects || 0;
                }
                try {
                    playerAch = await this.create({
                        userId, achievementId: achievement._id, progress: initialProgress, claimed: false });
                } catch (e) {
                    if (e.code === 11000) {
                        playerAch = await this.findOne({ userId, achievementId: achievement._id });
                    } else {
                        throw e;
                    }
                }
            }

            if (playerAch.progress >= achievement.targetCount) {
                results.push({
                    achievementId: achievement._id, progress: playerAch.progress, completed: true, claimed: playerAch.claimed, increased: 0 });
                break;
            }

            const increased = Math.min(amount, achievement.targetCount - playerAch.progress);
            const expectedVersion = playerAch.__v;
            const newProgress = playerAch.progress + increased;
            playerAch.progress = newProgress;
            playerAch.increment();

            try {
                const saved = await playerAch.save();
                results.push({
                    achievementId: achievement._id,
                    progress: saved.progress,
                    completed: saved.progress >= achievement.targetCount,
                    claimed: saved.claimed,
                    increased
                });
                break;
            } catch (e) {
                if (e.name === 'VersionError') {
                    continue;
                }
                throw e;
            }
        }
    }

    return results;
};

playerAchievementSchema.statics.atomicClaimAchievement = async function (userId, achievementId) {
    let attempt = 0;

    while (attempt < 5) {
        attempt++;
        const Achievement = mongoose.model('Achievement');
        const achievement = await Achievement.findById(achievementId);
        if (!achievement) return { success: false, reason: '成就不存在' };
        if (!achievement.enabled) return { success: false, reason: '成就未启用' };

        const playerAch = await this.findOne({ userId, achievementId });
        if (!playerAch) return { success: false, reason: '成就进度不存在' };
        if (playerAch.claimed) return { success: false, reason: '奖励已领取' };

        if (playerAch.progress < achievement.targetCount) {
            return { success: false, reason: '成就未完成' };
        }

        playerAch.claimed = true;
        playerAch.increment();

        try {
            const saved = await playerAch.save();
            return {
                success: true,
                achievement,
                progress: saved.progress,
                claimed: true
            };
        } catch (e) {
            if (e.name === 'VersionError') {
                continue;
            }
            throw e;
        }
    }

    return { success: false, reason: '领取失败，请重试' };
};

export default mongoose.model('PlayerAchievement', playerAchievementSchema);
