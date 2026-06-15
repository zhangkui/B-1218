import mongoose from 'mongoose';

const CLAIM_STATUS = {
    PENDING: 'pending',
    CLAIMING: 'claiming',
    CLAIMED: 'claimed'
};

const CLAIM_TIMEOUT_MS = 5 * 60 * 1000;

const playerAchievementSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    achievementId: { type: mongoose.Schema.Types.ObjectId, ref: 'Achievement', required: true },
    progress: { type: Number, default: 0, min: 0 },
    claimStatus: {
        type: String,
        enum: Object.values(CLAIM_STATUS),
        default: CLAIM_STATUS.PENDING
    },
    claimStartedAt: { type: Date, default: null },
    __v: { type: Number, default: 0 }
}, { timestamps: true, versionKey: '__v' });

playerAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
playerAchievementSchema.index({ claimStatus: 1, claimStartedAt: 1 });

playerAchievementSchema.statics.CLAIM_STATUS = CLAIM_STATUS;

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
        let claimStatus = currentProgress ? currentProgress.claimStatus : CLAIM_STATUS.PENDING;

        if (!currentProgress) {
            if (achievement.achievementType === 'plant') {
                progress = gd?.stats?.totalPlants || 0;
            } else if (achievement.achievementType === 'harvest') {
                progress = gd?.stats?.totalHarvests || 0;
            } else if (achievement.achievementType === 'feed_collect') {
                progress = gd?.stats?.totalAnimalCollects || 0;
            }
        }

        const completed = progress >= achievement.targetCount;
        const canClaim = completed && claimStatus === CLAIM_STATUS.PENDING;
        const isClaiming = claimStatus === CLAIM_STATUS.CLAIMING;
        const isClaimed = claimStatus === CLAIM_STATUS.CLAIMED;

        return {
            _id: achievement._id,
            achievementType: achievement.achievementType,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            targetCount: achievement.targetCount,
            rewards: achievement.rewards,
            progress,
            claimStatus,
            claimed: isClaimed,
            isClaiming,
            canClaim,
            completed
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
                        userId,
                        achievementId: achievement._id,
                        progress: initialProgress,
                        claimStatus: CLAIM_STATUS.PENDING
                    });
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
                    achievementId: achievement._id,
                    progress: playerAch.progress,
                    completed: true,
                    claimStatus: playerAch.claimStatus,
                    claimed: playerAch.claimStatus === CLAIM_STATUS.CLAIMED,
                    increased: 0
                });
                break;
            }

            const increased = Math.min(amount, achievement.targetCount - playerAch.progress);
            const newProgress = playerAch.progress + increased;
            playerAch.progress = newProgress;
            playerAch.increment();

            try {
                const saved = await playerAch.save();
                results.push({
                    achievementId: achievement._id,
                    progress: saved.progress,
                    completed: saved.progress >= achievement.targetCount,
                    claimStatus: saved.claimStatus,
                    claimed: saved.claimStatus === CLAIM_STATUS.CLAIMED,
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

playerAchievementSchema.statics.tryStartClaim = async function (userId, achievementId) {
    let attempt = 0;
    while (attempt < 5) {
        attempt++;
        const Achievement = mongoose.model('Achievement');
        const achievement = await Achievement.findById(achievementId);
        if (!achievement) return { success: false, reason: '成就不存在' };
        if (!achievement.enabled) return { success: false, reason: '成就未启用' };

        let playerAch = await this.findOne({ userId, achievementId });
        if (!playerAch) {
            return { success: false, reason: '成就进度不存在' };
        }

        if (playerAch.claimStatus === CLAIM_STATUS.CLAIMED) {
            return { success: false, reason: '奖励已领取' };
        }

        if (playerAch.progress < achievement.targetCount) {
            return { success: false, reason: '成就未完成' };
        }

        if (playerAch.claimStatus === CLAIM_STATUS.CLAIMING) {
            const now = new Date();
            const startedAt = playerAch.claimStartedAt;
            if (startedAt && (now - startedAt) < CLAIM_TIMEOUT_MS) {
                return { success: false, reason: '奖励正在发放中，请稍后再试' };
            }
        }

        playerAch.claimStatus = CLAIM_STATUS.CLAIMING;
        playerAch.claimStartedAt = new Date();
        playerAch.increment();

        try {
            const saved = await playerAch.save();
            return {
                success: true,
                achievement,
                playerAch: saved
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

playerAchievementSchema.statics.confirmClaim = async function (userId, achievementId) {
    let attempt = 0;
    while (attempt < 5) {
        attempt++;
        const playerAch = await this.findOne({ userId, achievementId });
        if (!playerAch) {
            return { success: false, reason: '成就进度不存在' };
        }

        if (playerAch.claimStatus === CLAIM_STATUS.CLAIMED) {
            return { success: true, alreadyClaimed: true };
        }

        if (playerAch.claimStatus !== CLAIM_STATUS.CLAIMING) {
            return { success: false, reason: '领取状态异常，请重试' };
        }

        playerAch.claimStatus = CLAIM_STATUS.CLAIMED;
        playerAch.claimStartedAt = null;
        playerAch.increment();

        try {
            await playerAch.save();
            return { success: true };
        } catch (e) {
            if (e.name === 'VersionError') {
                continue;
            }
            throw e;
        }
    }
    return { success: false, reason: '确认领取失败，请重试' };
};

playerAchievementSchema.statics.rollbackClaim = async function (userId, achievementId) {
    let attempt = 0;
    while (attempt < 5) {
        attempt++;
        const playerAch = await this.findOne({ userId, achievementId });
        if (!playerAch) return;

        if (playerAch.claimStatus !== CLAIM_STATUS.CLAIMING) {
            return;
        }

        playerAch.claimStatus = CLAIM_STATUS.PENDING;
        playerAch.claimStartedAt = null;
        playerAch.increment();

        try {
            await playerAch.save();
            return;
        } catch (e) {
            if (e.name === 'VersionError') {
                continue;
            }
            throw e;
        }
    }
};

export default mongoose.model('PlayerAchievement', playerAchievementSchema);
export { CLAIM_STATUS, CLAIM_TIMEOUT_MS };
