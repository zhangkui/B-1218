const BASE = '/api';

function getHeaders() {
    const token = localStorage.getItem('farm_token');
    return { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function request(url, options = {}) {
    const res = await fetch(BASE + url, { ...options, headers: getHeaders() });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '请求失败');
    return data;
}

export const api = {
    // Auth
    register: (username, password) => request('/auth/register', { method: 'POST', body: JSON.stringify({ username, password }) }),
    login: (username, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
    getMe: () => request('/auth/me'),
    changePassword: (oldPassword, newPassword) => request('/auth/password', { method: 'PUT', body: JSON.stringify({ oldPassword, newPassword }) }),
    // Game
    getGameData: () => request('/game/data'),
    plant: (slotIndex, cropType) => request('/game/plant', { method: 'POST', body: JSON.stringify({ slotIndex, cropType }) }),
    harvest: (slotIndex) => request('/game/harvest', { method: 'POST', body: JSON.stringify({ slotIndex }) }),
    buyAnimal: (slotIndex, animalType) => request('/game/buy-animal', { method: 'POST', body: JSON.stringify({ slotIndex, animalType }) }),
    collectAnimal: (slotIndex) => request('/game/collect-animal', { method: 'POST', body: JSON.stringify({ slotIndex }) }),
    upgrade: (buildingType) => request('/game/upgrade', { method: 'POST', body: JSON.stringify({ buildingType }) }),
    sell: (resourceType, amount) => request('/game/sell', { method: 'POST', body: JSON.stringify({ resourceType, amount }) }),
    getLeaderboard: () => request('/game/leaderboard'),
    // Admin
    getUsers: () => request('/admin/users'),
    getStats: () => request('/admin/stats'),
    banUser: (id) => request(`/admin/user/${id}/ban`, { method: 'PUT' }),
    grantResource: (userId, resource, amount) => request('/admin/grant', { method: 'POST', body: JSON.stringify({ userId, resource, amount }) }),
    deleteUser: (id) => request(`/admin/user/${id}`, { method: 'DELETE' }),
    resetUser: (id) => request(`/admin/reset/${id}`, { method: 'POST' }),
    getTaskConfigs: () => request('/admin/task-configs'),
    updateTaskConfig: (taskType, data) => request(`/admin/task-config/${taskType}`, { method: 'PUT', body: JSON.stringify(data) }),
    // Tasks
    getTasks: () => request('/tasks/list'),
    claimTask: (taskType) => request(`/tasks/claim/${taskType}`, { method: 'POST' }),
    // Achievements
    getAchievements: () => request('/achievements/list'),
    claimAchievement: (achievementId) => request(`/achievements/claim/${achievementId}`, { method: 'POST' }),
    // Admin
    getAchievementConfigs: () => request('/admin/achievement-configs'),
    createAchievementConfig: (data) => request('/admin/achievement-config', { method: 'POST', body: JSON.stringify(data) }),
    updateAchievementConfig: (id, data) => request(`/admin/achievement-config/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteAchievementConfig: (id) => request(`/admin/achievement-config/${id}`, { method: 'DELETE' }),
    // Config
    getConfig: () => request('/config'),
};
