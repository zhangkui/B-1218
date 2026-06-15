import gsap from 'gsap';

// 资源变化动画 - 数字跳动
export function animateNumber(el, from, to, duration = 0.6) {
    if (!el) return;
    gsap.fromTo(el, { innerText: from }, { innerText: to, duration, snap: { innerText: 1 }, ease: 'power2.out' });
}

// 元素弹入
export function animateBounceIn(el, delay = 0) {
    if (!el) return;
    gsap.fromTo(el, { scale: 0.3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.5, delay, ease: 'back.out(1.7)' });
}

// 淡入上移
export function animateFadeInUp(el, delay = 0) {
    if (!el) return;
    gsap.fromTo(el, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, delay, ease: 'power2.out' });
}

// 震动效果（失败/警告）
export function animateShake(el) {
    if (!el) return;
    gsap.fromTo(el, { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)' });
}

// 收获特效 - 向上飘动消失
export function animateHarvest(el) {
    if (!el) return;
    gsap.fromTo(el, { y: 0, opacity: 1, scale: 1 }, { y: -60, opacity: 0, scale: 1.5, duration: 1, ease: 'power2.out' });
}

// 金币飞入效果
export function animateGoldGain(container, text = '+10') {
    if (!container) return;
    const span = document.createElement('span');
    span.className = 'gold-float-text';
    span.textContent = text;
    container.appendChild(span);
    gsap.fromTo(span, { y: 0, opacity: 1, scale: 0.8 }, {
        y: -50, opacity: 0, scale: 1.3, duration: 1.2, ease: 'power2.out',
        onComplete: () => span.remove()
    });
}

// 卡片列表依次动画
export function animateStaggerIn(selector, container) {
    const els = container ? container.querySelectorAll(selector) : document.querySelectorAll(selector);
    gsap.fromTo(els, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.08, ease: 'power2.out' });
}

// 脉冲高亮
export function animatePulse(el) {
    if (!el) return;
    gsap.fromTo(el, { boxShadow: '0 0 0 0 rgba(74, 222, 128, 0.7)' }, {
        boxShadow: '0 0 0 15px rgba(74, 222, 128, 0)', duration: 0.8, ease: 'power2.out'
    });
}

// 进度条动画
export function animateProgress(el, from, to) {
    if (!el) return;
    gsap.fromTo(el, { width: `${from}%` }, { width: `${to}%`, duration: 0.8, ease: 'power2.inOut' });
}

// 页面切换
export function animatePageTransition(el) {
    if (!el) return;
    gsap.fromTo(el, { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
}
