import { ipcMain, dialog, BrowserWindow, app } from 'electron'
import fs from 'fs-extra'
import path from 'path'
import Store from 'electron-store'
import { execSync } from 'child_process'
import { createClient, AuthType } from 'webdav'


// Initialize info
const store = new Store({
    defaults: {
        solution: {
            name: "默认方案",
            plans: []
        },
        plans: [], // List of saved plans
        history: {
            last_run: 0,
            logs: []
        }
    }
})

export function registerHandlers(win: BrowserWindow) {
    // Select Directory
    ipcMain.handle('select-directory', async () => {
        const result = await dialog.showOpenDialog(win, {
            properties: ['openDirectory']
        })
        return result.canceled ? null : result.filePaths[0]
    })

    // Get Drive Stats (Simple check)
    ipcMain.handle('check-space', async (_, targetPath) => {
        return fs.existsSync(targetPath)
    })

    // Plan Management
    ipcMain.handle('get-plans', () => {
        return store.get('plans', [])
    })

    ipcMain.handle('add-plan', (_, plan) => {
        const plans = store.get('plans', []) as any[]
        plans.push(plan)
        store.set('plans', plans)
        return true
    })

    ipcMain.handle('delete-plan', (_, id) => {
        const plans = store.get('plans', []) as any[]
        const newPlans = plans.filter(p => p.id !== id)
        store.set('plans', newPlans)
        return true
    })

    ipcMain.handle('update-plan', (_, updatedPlan) => {
        const plans = store.get('plans', []) as any[]
        const index = plans.findIndex(p => p.id === updatedPlan.id)
        if (index !== -1) {
            plans[index] = updatedPlan
            store.set('plans', plans)
        }
        return true
    })

    // Import/Export
    ipcMain.handle('export-plans', async () => {
        const { filePath } = await dialog.showSaveDialog(win, {
            title: '导出方案',
            defaultPath: 'migration_plans_backup.json',
            filters: [{ name: 'JSON', extensions: ['json'] }]
        })

        if (filePath) {
            const plans = store.get('plans', []) as any[]
            // Sanitize plans: remove lastRun and other runtime states if any
            const sanitizedPlans = plans.map(p => {
                const { lastRun, ...rest } = p
                return rest
            })
            await fs.writeJson(filePath, sanitizedPlans, { spaces: 2 })
            return true
        }
        return false
    })

    ipcMain.handle('import-plans', async () => {
        const { filePaths } = await dialog.showOpenDialog(win, {
            title: '导入方案',
            filters: [{ name: 'JSON', extensions: ['json'] }],
            properties: ['openFile']
        })

        if (filePaths && filePaths.length > 0) {
            try {
                const importedPlans = await fs.readJson(filePaths[0]) as any[]
                if (!Array.isArray(importedPlans)) return { success: false, error: "Invalid format" }

                const currentPlans = store.get('plans', []) as any[]
                let count = 0

                importedPlans.forEach(plan => {
                    // Assign new ID to avoid conflicts
                    plan.id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
                    plan.name = plan.name + " (Imported)"
                    currentPlans.push(plan)
                    count++
                })

                store.set('plans', currentPlans)
                return { success: true, count }
            } catch (e: any) {
                return { success: false, error: e.message }
            }
        }
        return { success: false, cancelled: true }
    })

    // History

    // History
    ipcMain.handle('get-history', () => {
        return store.get('history.logs', [])
    })

    ipcMain.handle('add-history', (_, log) => {
        const logs = store.get('history.logs', []) as any[]
        logs.unshift(log) // Add to beginning
        // Limit history to 50
        if (logs.length > 50) logs.pop()
        store.set('history.logs', logs)
        return true
    })

    ipcMain.handle('delete-history', (_, id) => {
        const logs = store.get('history.logs', []) as any[]
        const newLogs = logs.filter(l => l.id !== id)
        store.set('history.logs', newLogs)
        return true
    })

    // Save/Load Config (Legacy/Global settings)
    ipcMain.handle('get-config', () => {
        return store.store
    })

    ipcMain.handle('save-config', (_, config) => {
        store.set(config)
        return true
    })

    // WebDAV Helper
    const getWebDavClient = (config: any) => {
        if (!config || !config.url) throw new Error("WebDAV Config Missing")
        return createClient(config.url, {
            username: config.username,
            password: config.password,
            authType: AuthType.Password
        })
    }

    // WebDAV Handlers
    ipcMain.handle('webdav-check-connection', async (_, config) => {
        try {
            const client = getWebDavClient(config)
            await client.getDirectoryContents('/')
            return { success: true, message: '连接成功' }
        } catch (e: any) {
            return { success: false, message: '连接失败: ' + e.message }
        }
    })

    ipcMain.handle('webdav-list-plans', async () => {
        try {
            const config = store.get('webdav') as any
            const client = getWebDavClient(config)

            // Ensure backup dir exists
            if (await client.exists('/MigrationBackups') === false) {
                await client.createDirectory('/MigrationBackups')
            }

            const items = await client.getDirectoryContents('/MigrationBackups') as any[]
            return items.filter(i => i.filename.endsWith('.json')).map(i => ({
                filename: i.filename,
                basename: path.basename(i.filename),
                lastmod: i.lastmod,
                size: i.size
            }))
        } catch (e: any) {
            console.error(e)
            return []
        }
    })

    ipcMain.handle('webdav-export-plans', async () => {
        try {
            const config = store.get('webdav') as any
            const client = getWebDavClient(config)

            if (await client.exists('/MigrationBackups') === false) {
                await client.createDirectory('/MigrationBackups')
            }

            const plans = store.get('plans', []) as any[]
            const sanitizedPlans = plans.map(p => {
                const { lastRun, ...rest } = p
                return rest
            })

            const fileName = `migration_plans_backup_${Date.now()}.json`
            const content = JSON.stringify(sanitizedPlans, null, 2)

            await client.putFileContents(`/MigrationBackups/${fileName}`, content)
            return { success: true }
        } catch (e: any) {
            return { success: false, error: e.message }
        }
    })

    ipcMain.handle('webdav-import-plan', async (_, filename) => {
        try {
            const config = store.get('webdav') as any
            const client = getWebDavClient(config)

            const content = await client.getFileContents(filename, { format: 'text' })
            const importedPlans = JSON.parse(content as string)

            if (!Array.isArray(importedPlans)) return { success: false, error: "Invalid format" }

            const currentPlans = store.get('plans', []) as any[]
            let count = 0

            importedPlans.forEach(plan => {
                plan.id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
                plan.name = plan.name + " (WebDAV)"
                currentPlans.push(plan)
                count++
            })

            store.set('plans', currentPlans)
            return { success: true, count }
        } catch (e: any) {
            return { success: false, error: e.message }
        }
    })

    // Migration Logic
    // Migration Logic
    ipcMain.handle('start-migration', async (_, { source, targetParent }) => {
        try {
            if (!fs.existsSync(source)) throw new Error("Source path does not exist")

            // Check if already a link
            const stats = await fs.lstat(source)
            if (stats.isSymbolicLink()) {
                return { success: true, skipped: true, message: "Source is already a symbolic link" }
            }

            // Ensure target parent exists (recursive create)
            await fs.ensureDir(targetParent)

            const folderName = path.basename(source)
            const targetPath = path.join(targetParent, folderName)

            // 1. Move
            // Use fs-extra move. Note: moving across devices might require copy+delete, fs-move handles this?
            // fs-extra move handles cross-device moves.
            await fs.move(source, targetPath, { overwrite: false })

            // 2. Link
            // User requested Symbolic Link (Soft Link) -> 'dir'
            // 'junction' is safer for folders on Windows but 'dir' is requested.
            // Admin rights required.
            await fs.symlink(targetPath, source, 'dir')

            return { success: true }
        } catch (error: any) {
            return { success: false, error: error.message }
        }
    })

    // Check Admin
    ipcMain.handle('is-admin', () => {
        try {
            execSync('net session', { stdio: 'ignore' });
            return true;
        } catch (e) {
            return false;
        }
    })

    // Scan Directory Stats
    // Scan Directory Stats (Recursive Search)
    ipcMain.handle('scan-directory-stats', async (_, { dirPath, query } = {}) => {
        try {
            if (!dirPath) dirPath = app.getPath('home')
            if (!fs.existsSync(dirPath)) return []

            const results: { name: string, path: string, size: number }[] = []

            // Helper for recursive search
            const searchRecursive = async (currentPath: string, depth: number) => {
                if (depth > 5) return // Max depth limit

                try {
                    const items = await fs.readdir(currentPath, { withFileTypes: true })

                    for (const item of items) {
                        // Match logic
                        let isSymbolicLink = item.isSymbolicLink()
                        const fullPath = path.join(currentPath, item.name)

                        if (!item.isDirectory() && !isSymbolicLink) continue

                        // If symbolic link, verify it points to a directory
                        if (isSymbolicLink) {
                            try {
                                const stats = await fs.stat(fullPath)
                                if (!stats.isDirectory()) continue
                            } catch (e) {
                                continue // Broken link or access denied
                            }
                        }

                        // Skip system folders always
                        if (['$Recycle.Bin', 'System Volume Information', 'Recovery', 'Config.Msi'].includes(item.name)) continue

                        // Skip heavy dev folders in sub-directories
                        if (['node_modules', '.git'].includes(item.name) && depth > 0) continue

                        let isMatch = false
                        if (query) {
                            if (item.name.toLowerCase().includes(query.toLowerCase())) {
                                isMatch = true
                            }
                        } else {
                            // If no query, only return top level (depth 0)
                            if (depth === 0) isMatch = true
                        }

                        if (isMatch) {
                            results.push({
                                name: item.name,
                                path: fullPath,
                                size: 0,
                                isSymbolicLink: isSymbolicLink
                            } as any)
                        }

                        // Continue recursion if we are searching (query exists)
                        // If no query, we only want top level, so don't recurse
                        if (query) {
                            // Avoid infinite recursion loops with symlinks if necessary
                            // For now, allow one level or basic traversal. 
                            // Note: recursive search might get stuck in loops if we follow symlinks blindly.
                            // But keeping logical simple for now as depth is limited strictly to 5.
                            await searchRecursive(fullPath, depth + 1)
                        }
                    }
                } catch (e) {
                    // Ignore access errors
                }
            }

            await searchRecursive(dirPath, 0)
            return results
        } catch (e) {
            return []
        }
    })
}
