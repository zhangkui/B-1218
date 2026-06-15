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
    progress: { type: Number, default: 0 },
    claimed: { type: Boolean, default: false }
}, { _id: false });

const dailyTaskSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    dateKey: { type: String, required: true },
    tasks: [userTaskProgressSchema]
}, { timestamps: true });

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
        daily = await this.create({ userId, dateKey, tasks });
    }
    return daily;
};

dailyTaskSchema.methods.addProgress = function (taskType, amount = 1) {
    const DailyTaskConfig = mongoose.model('DailyTaskConfig');
    let task = this.tasks.find(t => t.taskType === taskType);
    if (!task) {
        task = { taskType, progress: 0, claimed: false };
        this.tasks.push(task);
    }
    return DailyTaskConfig.findOne({ taskType, enabled: true }).then(config => {
        if (!config) return { task, increased: 0, completed: false };
        const before = task.progress;
        task.progress = Math.min(task.progress + amount, config.targetCount);
        const increased = task.progress - before;
        const completed = task.progress >= config.targetCount;
        return { task, increased, completed, config };
    });
};

dailyTaskSchema.methods.getProgressMap = function () {
    const map = {};
    this.tasks.forEach(t => { map[t.taskType] = t; });
    return map;
};

export default mongoose.model('DailyTask', dailyTaskSchema);
export { getDateKey };
