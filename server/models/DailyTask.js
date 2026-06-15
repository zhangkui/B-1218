import mongoose from 'mongoose';

function getDateKey(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

const userTaskProgressSchema = new mongoose.Schema({
    taskType: {
        type: String,
        enum: ['login', 'plant', 'harvest', 'feed_collect'],
        required: true
    },
    progress: { type: Number, default: 0, min: 0 },
    claimed: { type: Boolean, default: false }
}, { _id: true });

const dailyTaskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dateKey: { type: String, required: true },
    tasks: [userTaskProgressSchema],
    __v: { type: Number, default: 0 }
}, { timestamps: true, versionKey: '__v' });

dailyTaskSchema.index({ userId: 1, dateKey: 1 }, { unique: true });

dailyTaskSchema.statics.getForUser = async function (userId, date = new Date()) {
    const dateKey = getDateKey(date);
    let daily = await this.findOne({ userId, dateKey });
    if (!daily) {
        const DailyTaskConfig = mongoose.model('DailyTaskConfig');
        const configs = await DailyTaskConfig.find({ enabled: true });
        const tasks = configs.map(c => ({
            taskType: c.taskType,
            progress: 0,
            claimed: false
        }));
        try {
            daily = await this.create({ userId, dateKey, tasks });
        } catch (e) {
            if (e.code === 11000) {
                daily = await this.findOne({ userId, dateKey });
            } else {
                throw e;
            }
        }
    }
    if (daily) {
        const DailyTaskConfig = mongoose.model('DailyTaskConfig');
        const configs = await DailyTaskConfig.find({ enabled: true });
        const existingTypes = daily.tasks.map(t => t.taskType);
        const missing = configs.filter(c => !existingTypes.includes(c.taskType));
        if (missing.length > 0) {
            missing.forEach(c => daily.tasks.push({ taskType: c.taskType, progress: 0, claimed: false }));
            await daily.save();
        }
    }
    return daily;
};

dailyTaskSchema.statics.atomicAddProgress = async function (userId, taskType, amount = 1, targetCount) {
    const dateKey = getDateKey();
    const cap = targetCount || Number.MAX_SAFE_INTEGER;
    let attempt = 0;

    while (attempt < 5) {
        attempt++;
        const daily = await this.findOne({ userId, dateKey });
        if (!daily) {
            await this.getForUser(userId);
            continue;
        }
        let task = daily.tasks.find(t => t.taskType === taskType);
        if (!task) {
            await this.getForUser(userId);
            continue;
        }
        if (task.progress >= cap) {
            return { progress: task.progress, completed: true, claimed: task.claimed, increased: 0 };
        }

        const increased = Math.min(amount, cap - task.progress);
        const expectedVersion = daily.__v;
        const newProgress = task.progress + increased;
        task.progress = newProgress;
        daily.increment();

        try {
            const saved = await daily.save();
            const t = saved.tasks.find(x => x.taskType === taskType);
            return {
                progress: t ? t.progress : newProgress,
                completed: t ? t.progress >= cap : newProgress >= cap,
                claimed: t ? t.claimed : false,
                increased
            };
        } catch (e) {
            if (e.name === 'VersionError') {
                continue;
            }
            throw e;
        }
    }

    const daily = await this.findOne({ userId, dateKey });
    const task = daily?.tasks.find(t => t.taskType === taskType);
    return {
        progress: task?.progress || 0,
        completed: task ? task.progress >= cap : false,
        claimed: task?.claimed || false,
        increased: 0
    };
};

dailyTaskSchema.statics.atomicClaimTask = async function (userId, taskType, targetCount) {
    const dateKey = getDateKey();
    let attempt = 0;

    while (attempt < 5) {
        attempt++;
        const daily = await this.findOne({ userId, dateKey });
        if (!daily) return { success: false, reason: '今日任务记录不存在' };

        const task = daily.tasks.find(t => t.taskType === taskType);
        if (!task) return { success: false, reason: '任务不存在' };
        if (task.claimed) return { success: false, reason: '奖励已领取' };
        if (task.progress < targetCount) return { success: false, reason: '任务未完成' };

        task.claimed = true;
        daily.increment();

        try {
            const saved = await daily.save();
            const t = saved.tasks.find(x => x.taskType === taskType);
            return {
                success: true,
                progress: t ? t.progress : targetCount,
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

dailyTaskSchema.methods.getProgressMap = function () {
    const map = {};
    this.tasks.forEach(t => { map[t.taskType] = t; });
    return map;
};

export default mongoose.model('DailyTask', dailyTaskSchema);
export { getDateKey };
