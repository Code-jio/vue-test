// 测试烟雾效果可见性的脚本
(function() {
    'use strict';
    
    // 等待页面和引擎加载完成
    function waitForEngine() {
        return new Promise((resolve) => {
            const checkEngine = () => {
                if (window.EngineKernel && window.baseScene && window.baseScene.scene) {
                    resolve();
                } else {
                    setTimeout(checkEngine, 100);
                }
            };
            checkEngine();
        });
    }
    
    // 检查烟雾效果
    async function checkSmokeEffect() {
        await waitForEngine();
        
        console.log('🔍 开始检查烟雾效果...');
        
        // 检查烟雾相关的全局变量
        const checks = [
            { name: 'window.smokeDebug', value: window.smokeDebug },
            { name: 'window.smokeManager', value: window.smokeManager },
            { name: 'window.smokeTest', value: window.smokeTest },
            { name: 'window.updateSmoke', value: window.updateSmoke }
        ];
        
        checks.forEach(check => {
            console.log(`${check.name}: ${check.value ? '✅ 已加载' : '❌ 未找到'}`);
        });
        
        // 检查场景中的烟雾对象
        const scene = window.baseScene.scene;
        let smokeObjects = [];
        
        scene.traverse((child) => {
            if (child.type && (
                child.type.includes('Smoke') || 
                child.type.includes('Particle') || 
                child.name && child.name.includes('smoke')
            )) {
                smokeObjects.push(child);
            }
        });
        
        console.log(`🌫️ 在场景中找到 ${smokeObjects.length} 个烟雾相关对象:`, smokeObjects);
        
        // 如果找到烟雾管理器，尝试启动
        if (window.smokeManager) {
            console.log('🚀 尝试启动烟雾效果...');
            try {
                if (window.smokeDebug && window.smokeDebug.start) {
                    window.smokeDebug.start();
                    console.log('✅ 烟雾效果已启动');
                }
            } catch (error) {
                console.error('❌ 启动烟雾效果失败:', error);
            }
        }
        
        // 提供调试命令
        console.log('💡 调试命令:');
        console.log('  - window.smokeDebug: 查看烟雾调试信息');
        console.log('  - window.smokeDebug.start(): 启动烟雾');
        console.log('  - window.smokeDebug.stop(): 停止烟雾');
        console.log('  - window.smokeDebug.reset(): 重置烟雾');
    }
    
    // 当页面加载完成后执行检查
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkSmokeEffect);
    } else {
        checkSmokeEffect();
    }
    
    // 添加到全局作用域便于手动调用
    window.testSmokeVisibility = checkSmokeEffect;
    
})();