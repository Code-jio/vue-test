// 检查model文件夹下所有的以.gltf/glb结尾的文件，收集它们的文件路径并输出成json文件

const fs = require('fs');
const path = require('path');

/**
 * 扫描指定目录下的3D模型文件（.gltf/.glb）
 * @param {string} modelDir - 模型文件夹路径
 * @return {Array<string>} 符合条件的文件路径列表
 */
function scanModelFiles(modelDir) {
    const modelFiles = [];
    
    try {
        // 检查目录是否存在
        if (!fs.existsSync(modelDir)) {
            console.warn(`警告: 目录 ${modelDir} 不存在`);
            return modelFiles;
        }
        
        // 读取目录内容
        const files = fs.readdirSync(modelDir);
        
        // 筛选3D模型文件
        for (const file of files) {
            const filePath = path.join(modelDir, file);
            const stat = fs.statSync(filePath);
            
            // 只处理文件，跳过子目录
            if (stat.isFile()) {
                const ext = path.extname(file).toLowerCase();
                if (ext === '.gltf' || ext === '.glb') {
                    // 保存相对路径（相对于public目录）
                    const relativePath = path.join('model', file);
                    modelFiles.push(relativePath);
                }
            }
        }
        
        return modelFiles;
        
    } catch (error) {
        console.error(`扫描目录时发生错误: ${error.message}`);
        return modelFiles;
    }
}

/**
 * 将文件路径列表输出为JSON文件
 * @param {Array<string>} filePaths - 文件路径列表
 * @param {string} outputFile - 输出文件路径
 */
function saveToJson(filePaths, outputFile) {
    try {
        const data = {
            totalCount: filePaths.length,
            files: filePaths,
            scanTime: new Date().toISOString()
        };
        
        fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf8');
        console.log(`✓ 已保存 ${filePaths.length} 个模型文件路径到 ${outputFile}`);
        
    } catch (error) {
        console.error(`保存文件时发生错误: ${error.message}`);
    }
}

// 主程序执行
function main() {
    const modelDir = path.join(__dirname, 'test');
    const outputFile = path.join(__dirname, 'model-files.json');
    
    console.log('开始扫描模型文件...');
    console.log(`扫描目录: ${modelDir}`);
    
    const modelFiles = scanModelFiles(modelDir);
    
    if (modelFiles.length === 0) {
        console.log('未找到任何 .gltf 或 .glb 文件');
    } else {
        console.log(`找到 ${modelFiles.length} 个模型文件:`);
        modelFiles.forEach(file => console.log(`  - ${file}`));
        
        saveToJson(modelFiles, outputFile);
    }
}

// 执行主程序
if (require.main === module) {
    main();
}
