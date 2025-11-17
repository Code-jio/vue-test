// Service Worker 注册脚本
// 独立于Vue项目，直接在HTML中注册

(function() {
    'use strict';
    
    const LOG_PREFIX = '[SW-Register]';
    
    // 检查浏览器是否支持Service Worker
    if (!('serviceWorker' in navigator)) {
        console.warn(`${LOG_PREFIX} 当前浏览器不支持Service Worker`);
        return;
    }
    
    // Service Worker文件路径
    const SW_URL = '/network-interceptor-sw.js';
    const SW_SCOPE = '/';
    
    // 注册Service Worker
    async function registerServiceWorker() {
        try {
            console.log(`${LOG_PREFIX} 开始注册Service Worker...`);
            
            const registration = await navigator.serviceWorker.register(SW_URL, {
                scope: SW_SCOPE,
                updateViaCache: 'none' // 禁用缓存，确保每次都是最新版本
            });
            
            console.log(`${LOG_PREFIX} Service Worker 注册成功`, registration);
            
            // 监听Service Worker状态变化
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log(`${LOG_PREFIX} 发现新的Service Worker版本`);
                
                newWorker.addEventListener('statechange', () => {
                    console.log(`${LOG_PREFIX} Service Worker 状态变化:`, newWorker.state);
                    
                    if (newWorker.state === 'activated') {
                        console.log(`${LOG_PREFIX} Service Worker 已激活，开始控制页面`);
                        
                        // 发送消息让Service Worker立即激活
                        if (navigator.serviceWorker.controller) {
                            navigator.serviceWorker.controller.postMessage({
                                type: 'SKIP_WAITING'
                            });
                        }
                    }
                });
            });
            
            // 监听Service Worker控制状态
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log(`${LOG_PREFIX} Service Worker 已控制页面`);
            });
            
            // 监听来自Service Worker的消息
            navigator.serviceWorker.addEventListener('message', (event) => {
                const { type, data } = event.data;
                
                switch (type) {
                    case 'NETWORK_REQUEST':
                        console.group(`${LOG_PREFIX} 拦截到网络请求`);
                        console.log('🔗 URL:', data.url);
                        console.log('⚡ 方法:', data.method);
                        console.log('⏰ 时间:', data.timestamp);
                        console.groupEnd();
                        break;
                    case 'NETWORK_RESPONSE':
                        console.group(`${LOG_PREFIX} 网络请求响应`);
                        console.log('🔗 URL:', data.url);
                        console.log('📊 状态:', data.status);
                        console.log('⏱️ 响应时间:', data.responseTime + 'ms');
                        console.groupEnd();
                        break;
                    case 'NETWORK_ERROR':
                        console.error(`${LOG_PREFIX} 网络请求失败`, {
                            '🔗 URL:': data.url,
                            '⚡ 方法:': data.method,
                            '💥 错误:': data.error
                        });
                        break;
                    default:
                        console.log(`${LOG_PREFIX} 收到未知消息:`, type, data);
                }
            });
            
            return registration;
            
        } catch (error) {
            console.error(`${LOG_PREFIX} Service Worker 注册失败:`, error);
            throw error;
        }
    }
    
    // 检查Service Worker是否已经注册
    async function checkServiceWorkerStatus() {
        try {
            const registrations = await navigator.serviceWorker.getRegistrations();
            const existingRegistration = registrations.find(reg => 
                reg.active && reg.active.scriptURL.includes('network-interceptor-sw')
            );
            
            if (existingRegistration) {
                console.log(`${LOG_PREFIX} Service Worker 已存在，状态:`, existingRegistration.active.state);
                return existingRegistration;
            }
            
            console.log(`${LOG_PREFIX} 未找到已注册的Service Worker`);
            return null;
            
        } catch (error) {
            console.error(`${LOG_PREFIX} 检查Service Worker状态失败:`, error);
            return null;
        }
    }
    
    // 页面加载完成后注册Service Worker
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', async () => {
            console.log(`${LOG_PREFIX} DOM加载完成，开始注册Service Worker`);
            
            // 先检查是否已注册
            const existingRegistration = await checkServiceWorkerStatus();
            
            if (!existingRegistration) {
                // 如果没有注册，则进行注册
                await registerServiceWorker();
            } else {
                console.log(`${LOG_PREFIX} 使用已存在的Service Worker`);
            }
        });
    } else {
        // 如果DOM已经加载完成，直接注册
        (async () => {
            console.log(`${LOG_PREFIX} DOM已加载完成，开始注册Service Worker`);
            await registerServiceWorker();
        })();
    }
    
    // 提供全局函数供调试使用
    window.swDebug = {
        register: registerServiceWorker,
        checkStatus: checkServiceWorkerStatus,
        unregister: async () => {
            const registrations = await navigator.serviceWorker.getRegistrations();
            for (const registration of registrations) {
                await registration.unregister();
                console.log(`${LOG_PREFIX} 已注销Service Worker`);
            }
        }
    };
    
    console.log(`${LOG_PREFIX} 注册脚本加载完成`);
    
})();