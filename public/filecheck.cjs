// 检查指定文件夹下所有的以.gltf/glb结尾的文件，收集它们的文件路径并输出成json文件

const fs = require('fs');
const path = require('path');

/**
 * 扫描指定目录下的3D模型文件（.gltf/.glb）
 * @param {string} modelDir - 模型文件夹路径
 * @param {string} inputDir - 用户输入的原始目录路径（用于生成相对路径）
 * @return {Array<string>} 符合条件的文件路径列表
 */
function scanModelFiles(modelDir, inputDir = 'model') {
    const modelFiles = [];
    
    try {
        // 检查目录是否存在
        if (!fs.existsSync(modelDir)) {
            console.warn(`⚠️  警告: 目录 ${modelDir} 不存在`);
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
                    const relativePath = path.join(inputDir, file);
                    modelFiles.push(relativePath);
                }
            }
        }
        
        return modelFiles;
        
    } catch (error) {
        console.error(`❌ 扫描目录时发生错误: ${error.message}`);
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
        console.log(`💾 已保存 ${filePaths.length} 个模型文件路径到 ${path.basename(outputFile)}`);
        
    } catch (error) {
        console.error(`保存文件时发生错误: ${error.message}`);
    }
}

/**
 * 获取扫描目录路径
 * @return {string} 目录路径
 */
function getScanDirectory() {
    // 首先检查命令行参数
    const args = process.argv.slice(2);
    if (args.length > 0) {
        return args[0];
    }
    
    // 如果没有命令行参数，提示用户输入
    console.log('请提供要扫描的目录路径：');
    console.log('使用方法: node filecheck.cjs <目录路径>');
    console.log('');
    console.log('示例:');
    console.log('  node filecheck.cjs model          # 扫描当前目录下的model文件夹');
    console.log('  node filecheck.cjs ./test         # 扫描当前目录下的test文件夹');
    console.log('  node filecheck.cjs /path/to/models # 扫描绝对路径');
    console.log('');
    
    return null;
}

/**
 * 解析目录路径
 * @param {string} inputPath - 用户输入的路径
 * @return {string} 完整的目录路径
 */
function resolveScanPath(inputPath) {
    // 如果是绝对路径，直接使用
    if (path.isAbsolute(inputPath)) {
        return inputPath;
    }
    
    // 如果是相对路径，相对于当前脚本所在目录
    return path.join(__dirname, inputPath);
}

// 主程序执行
function main() {
    console.log('🔍 3D模型文件扫描工具');
    console.log('====================');
    
    // 获取扫描目录
    const inputDir = getScanDirectory();
    if (!inputDir) {
        console.error('❌ 错误: 未指定扫描目录');
        process.exit(1);
    }
    
    // 解析完整路径
    const modelDir = resolveScanPath(inputDir);
    const outputFile = path.join(__dirname, 'model-files.json');
    
    console.log(`📂 扫描目录: ${modelDir}`);
    console.log(`📄 输出文件: ${outputFile}`);
    console.log('');
    
    const modelFiles = scanModelFiles(modelDir, inputDir);
    
    if (modelFiles.length === 0) {
        console.log('⚠️  未找到任何 .gltf 或 .glb 文件');
    } else {
        console.log(`✅ 找到 ${modelFiles.length} 个模型文件:`);
        modelFiles.forEach(file => console.log(`  📦 ${file}`));
        console.log('');
        
        saveToJson(modelFiles, outputFile);
    }
}

// 执行主程序
if (require.main === module) {
    main();
}
