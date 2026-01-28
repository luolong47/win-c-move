/// <reference types="vite/client" />
declare const __APP_VERSION__: string;

interface Window {
    ipcRenderer: import('electron').IpcRenderer
    api: {
        selectDirectory: () => Promise<string | null>
        checkSpace: (path: string) => Promise<boolean>
        getConfig: () => Promise<any>
        saveConfig: (config: any) => Promise<boolean>
        startMigration: (params: { source: string, targetParent: string }) => Promise<{ success: boolean; error?: string; skipped?: boolean; message?: string }>
        isAdmin: () => Promise<boolean>
        scanDirectoryStats: (params?: { dirPath?: string, query?: string }) => Promise<Array<{ name: string; path: string; size: number; isSymbolicLink?: boolean }>>
        getPlans: () => Promise<any[]>
        addPlan: (plan: any) => Promise<boolean>
        deletePlan: (id: string) => Promise<boolean>
        updatePlan: (plan: any) => Promise<boolean>
        getHistory: () => Promise<any[]>
        addHistory: (log: any) => Promise<boolean>
        deleteHistory: (id: string) => Promise<boolean>
        exportPlans: () => Promise<boolean>
        exportPlans: () => Promise<boolean>
        importPlans: () => Promise<{ success: boolean; count?: number; error?: string; cancelled?: boolean }>
        webdavCheckConnection: (config: any) => Promise<{ success: boolean, message: string }>
        webdavListPlans: () => Promise<Array<{ filename: string, basename: string, lastmod: string, size: number }>>
        webdavExportPlans: () => Promise<{ success: boolean, error?: string }>
        webdavImportPlan: (filename: string) => Promise<{ success: boolean, count?: number, error?: string }>
    }
}

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}
