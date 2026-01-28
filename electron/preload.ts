import { ipcRenderer, contextBridge } from 'electron'

contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

contextBridge.exposeInMainWorld('api', {
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  checkSpace: (path: string) => ipcRenderer.invoke('check-space', path),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config: any) => ipcRenderer.invoke('save-config', config),
  startMigration: (params: { source: string, targetParent: string }) => ipcRenderer.invoke('start-migration', params),
  isAdmin: () => ipcRenderer.invoke('is-admin'),
  scanDirectoryStats: (params?: { dirPath?: string, query?: string }) => ipcRenderer.invoke('scan-directory-stats', params),
  getPlans: () => ipcRenderer.invoke('get-plans'),
  addPlan: (plan: any) => ipcRenderer.invoke('add-plan', plan),
  deletePlan: (id: string) => ipcRenderer.invoke('delete-plan', id),
  updatePlan: (plan: any) => ipcRenderer.invoke('update-plan', plan),
  getHistory: () => ipcRenderer.invoke('get-history'),
  addHistory: (log: any) => ipcRenderer.invoke('add-history', log),
  deleteHistory: (id: string) => ipcRenderer.invoke('delete-history', id),
  exportPlans: () => ipcRenderer.invoke('export-plans'),
  importPlans: () => ipcRenderer.invoke('import-plans'),
  webdavCheckConnection: (config: any) => ipcRenderer.invoke('webdav-check-connection', config),
  webdavListPlans: () => ipcRenderer.invoke('webdav-list-plans'),
  webdavExportPlans: () => ipcRenderer.invoke('webdav-export-plans'),
  webdavImportPlan: (filename: string) => ipcRenderer.invoke('webdav-import-plan', filename),
  gdriveAuth: (config?: any) => ipcRenderer.invoke('gdrive-auth', config),
  gdriveListPlans: () => ipcRenderer.invoke('gdrive-list-plans'),
  gdriveExportPlans: () => ipcRenderer.invoke('gdrive-export-plans'),
  gdriveImportPlan: (fileId: string) => ipcRenderer.invoke('gdrive-import-plan', fileId)
})
