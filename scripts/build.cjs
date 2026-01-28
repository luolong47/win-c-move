const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const startTime = Date.now();

function runCommand(command, name) {
    return new Promise((resolve, reject) => {
        console.log(`[${name}] Starting...`);
        // Use shell option to support commands on Windows
        const child = spawn(command, {
            stdio: 'inherit',
            shell: true
        });

        child.on('close', (code) => {
            if (code === 0) {
                console.log(`[${name}] Completed.`);
                resolve();
            } else {
                reject(new Error(`[${name}] failed with code ${code}`));
            }
        });

        child.on('error', (err) => {
            reject(new Error(`[${name}] failed to start: ${err.message}`));
        });
    });
}

async function build() {
    try {
        console.log('🚀 Starting optimized build process...');

        // 1. Clean & Update Version (Sequential)
        console.log('Cleaning output directory...');
        try {
            if (fs.existsSync('output')) {
                fs.rmSync('output', { recursive: true, force: true });
            }
            fs.mkdirSync('output');
        } catch (e) {
            console.log('Warning cleaning output:', e.message);
        }

        console.log('Updating version...');
        await runCommand('node scripts/update-version.cjs', 'Update Version');

        // 2. Parallel Tasks: Type Check & Vite Build
        // utilize low CPU usage by running these in parallel
        console.log('\n⚡ Running Type Check and Vite Build in parallel...');
        await Promise.all([
            runCommand('vue-tsc', 'Type Check'),
            runCommand('vite build', 'Vite Bundle')
        ]);

        // 3. Electron Builder (Sequential - needs dist from previous step)
        console.log('\n📦 Packaging with Electron Builder...');
        await runCommand('electron-builder --win', 'Electron Builder');

        // 4. Cleanup
        // 4. Cleanup
        console.log('Cleaning up unpacked files and builder logs...');
        try {
            const cleanupPaths = [
                'output/win-unpacked',
                'output/builder-debug.yml',
                'output/builder-effective-config.yaml',
                'output/.icon-ico'
            ];

            cleanupPaths.forEach(p => {
                if (fs.existsSync(p)) {
                    fs.rmSync(p, { recursive: true, force: true });
                }
            });
        } catch (e) {
            console.log('Warning during cleanup:', e.message);
        }

        const endTime = Date.now();
        const duration = (endTime - startTime) / 1000;
        console.log(`\n---------------------------------------------------`);
        console.log(`✅ Build completed successfully in ${duration.toFixed(2)}s!`);
        console.log(`---------------------------------------------------`);

    } catch (error) {
        console.error(`\n❌ Build failed: ${error.message}`);
        process.exit(1);
    }
}

build();
