import mongoose from 'mongoose';

const dailyTaskConfigSchema = new mongoose.Schema({
    taskType: {
        type: String,
        enum: ['login', 'plant', 'harvest', 'feed_collect'],
        required: true,
        unique: true
    },
    name: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, default: '📋' },
    targetCount: { type: Number, default: 1, min: 1 },
    rewards: {
        gold: { type: Number, default: 0, min: 0 },
        diamond: { type: Number, default: 0, min: 0 },
        exp: { type: Number, default: 0, min: 0 },
        energy: { type: Number, default: 0, min: 0 }
    },
    enabled: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

dailyTaskConfigSchema.statics.initializeDefaults = async function () {
    const defaults = [
        {
            taskType: 'login',
            name: '每日登录',
            description: '每日登录一次即可领取奖励',
            icon: '🎁',
            targetCount: 1,
            rewards: { gold: 50, diamond: 2, exp: 10, energy: 20 },
            sortOrder: 1
        },
        {
            taskType: 'plant',
            name: '勤劳播种',
            description: '今日种植指定次数的作物',
            icon: '🌱',
            targetCount: 5,
            rewards: { gold: 100, diamond: 3, exp: 20, energy: 0 },
            sortOrder: 2
        },
        {
            taskType: 'harvest',
            name: '丰收喜悦',
            description: '今日收获指定次数的作物',
            icon: '🌾',
            targetCount: 5,
            rewards: { gold: 150, diamond: 5, exp: 30, energy: 0 },
            sortOrder: 3
        },
        {
            taskType: 'feed_collect',
            name: '牧场能手',
            description: '今日完成指定次数的动物产品收取',
            icon: '🐄',
            targetCount: 3,
            rewards: { gold: 120, diamond: 4, exp: 25, energy: 0 },
            sortOrder: 4
        }
    ];
    for (const def of defaults) {
        const exists = await this.findOne({ taskType: def.taskType });
        if (!exists) await this.create(def);
    }
};

export default mongoose.model('DailyTaskConfig', dailyTaskConfigSchema);
