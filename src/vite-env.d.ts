/// <reference types="vite/client" />

interface Window {
    ipcRenderer: import('electron').IpcRenderer
    api: {
        selectDirectory: () => Promise<string | null>
        checkSpace: (path: string) => Promise<boolean>
        getConfig: () => Promise<any>
        saveConfig: (config: any) => Promise<boolean>
        startMigration: (params: { source: string, targetParent: string }) => Promise<{ success: boolean; error?: string; skipped?: boolean; message?: string }>
        isAdmin: () => Promise<boolean>
        scanDirectoryStats: (params?: { dirPath?: string, query?: string }) => Promise<Array<{ name: string; path: string; size: number }>>
        getPlans: () => Promise<any[]>
        addPlan: (plan: any) => Promise<boolean>
        deletePlan: (id: string) => Promise<boolean>
        updatePlan: (plan: any) => Promise<boolean>
        getHistory: () => Promise<any[]>
        addHistory: (log: any) => Promise<boolean>
        deleteHistory: (id: string) => Promise<boolean>
        exportPlans: () => Promise<boolean>
        importPlans: () => Promise<{ success: boolean; count?: number; error?: string; cancelled?: boolean }>
    }
}

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}
