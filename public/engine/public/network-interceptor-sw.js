// Service Worker 网络请求拦截器
// 用于拦截和记录所有网络请求

const CACHE_NAME = 'network-interceptor-v1';
const LOG_PREFIX = '[SW-Network-Interceptor]';

// 安装Service Worker
self.addEventListener('install', (event) => {
    console.log(`${LOG_PREFIX} Service Worker 安装成功`);
    // 跳过等待，立即激活
    event.waitUntil(self.skipWaiting());
});

// 激活Service Worker
self.addEventListener('activate', (event) => {
    console.log(`${LOG_PREFIX} Service Worker 激活成功`);
    
    // 立即控制所有客户端（页面）
    event.waitUntil(self.clients.claim());
});

// 拦截所有网络请求
self.addEventListener('fetch', (event) => {
    const request = event.request;
    const url = request.url;
    const method = request.method;
    const headers = Object.fromEntries(request.headers.entries());
    const timestamp = new Date().toISOString();
    
    // 创建请求信息对象
    const requestInfo = {
        type: 'request',
        timestamp: timestamp,
        url: url,
        method: method,
        headers: headers,
        mode: request.mode,
        credentials: request.credentials,
        cache: request.cache,
        redirect: request.redirect,
        referrer: request.referrer,
        referrerPolicy: request.referrerPolicy
    };
    
    // 打印请求信息到控制台
    console.group(`${LOG_PREFIX} 拦截到网络请求`);
    console.log('🔗 URL:', url);
    console.groupEnd();
    
    // 发送请求信息到主线程
    self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
            client.postMessage({
                type: 'NETWORK_REQUEST',
                data: requestInfo
            });
        });
    });
    
    // 继续处理请求
    event.respondWith(
        fetch(request).then((response) => {
            const responseTimestamp = new Date().toISOString();
            
            // 创建响应信息对象
            const responseInfo = {
                type: 'response',
                timestamp: responseTimestamp,
                url: url,
                status: response.status,
                statusText: response.statusText,
                headers: Object.fromEntries(response.headers.entries()),
                ok: response.ok,
                redirected: response.redirected,
                type: response.type,
                responseTime: new Date(responseTimestamp).getTime() - new Date(timestamp).getTime()
            };
            
            // 打印响应信息到控制台
            console.group(`${LOG_PREFIX} 请求响应`);
            console.log('🔗 URL:', url);
            console.groupEnd();
            
            // 发送响应信息到主线程
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'NETWORK_RESPONSE',
                        data: responseInfo
                    });
                });
            });
            
            return response;
        }).catch((error) => {
            const errorTimestamp = new Date().toISOString();
            
            // 创建错误信息对象
            const errorInfo = {
                type: 'error',
                timestamp: errorTimestamp,
                url: url,
                method: method,
                error: error.toString(),
                errorTime: new Date(errorTimestamp).getTime() - new Date(timestamp).getTime()
            };
            
            // 打印错误信息到控制台
            console.error(`${LOG_PREFIX} 请求失败`, {
                '❌ 错误时间:': errorTimestamp,
                '🔗 URL:': url,
                '⚡ 方法:': method,
                '💥 错误信息:': error.toString()
            });
            
            // 发送错误信息到主线程
            self.clients.matchAll().then((clients) => {
                clients.forEach((client) => {
                    client.postMessage({
                        type: 'NETWORK_ERROR',
                        data: errorInfo
                    });
                });
            });
            
            throw error;
        })
    );
});

// 监听来自主线程的消息
self.addEventListener('message', (event) => {
    const { type, data } = event.data;
    
    switch (type) {
        case 'SKIP_WAITING':
            // 立即跳过等待状态，激活Service Worker
            console.log(`${LOG_PREFIX} 收到跳过等待请求，立即激活`);
            self.skipWaiting();
            break;
        case 'GET_NETWORK_STATS':
            // 可以在这里实现网络统计功能
            console.log(`${LOG_PREFIX} 收到获取网络统计的请求`);
            break;
        case 'CLEAR_NETWORK_LOGS':
            console.log(`${LOG_PREFIX} 收到清除网络日志的请求`);
            break;
        default:
            console.log(`${LOG_PREFIX} 收到未知消息:`, type, data);
    }
});

console.log(`${LOG_PREFIX} Service Worker 加载完成，开始拦截网络请求`);