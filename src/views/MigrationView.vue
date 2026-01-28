<template>
  <div class="p-6 h-full flex flex-col">
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">{{ viewMode === 'list' ? '方案管理' : '执行迁移' }}</h2>
        <el-button v-if="viewMode === 'execute'" @click="viewMode = 'list'" :disabled="isMigrating">返回列表</el-button>
    </div>

    <!-- Mode: Plan List -->
    <div v-if="viewMode === 'list'" class="bg-white p-6 rounded shadow-sm border flex-1 flex flex-col">
        <div class="mb-4 flex gap-4">
            <el-input 
                v-model="searchQuery" 
                placeholder="搜索方案名称..." 
                prefix-icon="Search" 
                clearable 
                class="flex-1"
            />
            <el-dropdown>
                <el-button type="primary">
                导出方案 <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item @click="handleExportLocal">导出到本地 (Local)</el-dropdown-item>
                        <el-dropdown-item @click="handleExportWebDAV">导出到 WebDAV</el-dropdown-item>
                        <el-dropdown-item @click="handleExportGDrive">导出到 Google Drive</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
            
            <el-dropdown>
                <el-button>
                导入方案 <el-icon class="el-icon--right"><arrow-down /></el-icon>
                </el-button>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item @click="handleImportLocal">从本地导入 (Local)</el-dropdown-item>
                        <el-dropdown-item @click="handleImportWebDAV">从 WebDAV 导入</el-dropdown-item>
                        <el-dropdown-item @click="handleImportGDrive">从 Google Drive 导入</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
        <div class="flex-1 overflow-auto">
            <el-table :data="filteredPlans" style="width: 100%" empty-text="暂无保存的方案，请新建方案">
                <el-table-column prop="name" label="方案名称" />
                <el-table-column prop="base" label="目标基准" show-overflow-tooltip />
                <el-table-column label="包含目录数" width="120" align="center">
                    <template #default="{ row }">{{ row.items.length }}</template>
                </el-table-column>
                <el-table-column label="迁移状态" width="120" align="center">
                     <template #default="{ row }">
                         <el-tag v-if="row.lastRun" type="success">已执行</el-tag>
                         <el-tag v-else type="info">未执行</el-tag>
                     </template>
                </el-table-column>
                <el-table-column label="创建时间" width="180">
                    <template #default="{ row }">
                        {{ new Date(row.createdAt).toLocaleString() }}
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="280" align="right">
                    <template #default="{ row }">
                        <el-button type="info" size="small" @click="openView(row)">查看</el-button>
                        <el-button type="warning" size="small" @click="editPlanName(row)">编辑</el-button>
                        <el-button type="danger" size="small" @click="deletePlan(row.id)">删除</el-button>
                        <el-button type="primary" size="small" @click="selectPlan(row)">执行</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>
        <div class="mt-4 flex justify-end">
            <el-button @click="router.push('/')">返回首页</el-button>
        </div>
    </div>

    <!-- Mode: Execution -->
    <div v-else class="bg-white p-6 rounded shadow-sm border flex-1 flex flex-col">
        <!-- Status Header -->
        <div class="mb-6">
             <div class="flex items-center gap-4 mb-2">
                <span class="text-sm font-bold text-gray-500">方案: {{ currentPlanName }}</span>
                <el-tag :type="statusType" size="large">{{ statusText }}</el-tag>
             </div>
             
             <!-- Progress Bar -->
             <div v-if="isMigrating || isDone" class="mb-2">
                 <div class="flex justify-between text-sm mb-1">
                     <span>进度: {{ completedCount }} / {{ totalCount }}</span>
                     <span>{{ percentage }}%</span>
                 </div>
                 <el-progress :percentage="percentage" :status="isDone ? 'success' : ''" :stroke-width="18" striped striped-flow />
             </div>

             <!-- Current Action -->
             <div v-if="isMigrating && currentItem" class="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                 正在处理: {{ currentItem.source }}
             </div>
        </div>

        <!-- Task List -->
        <div class="flex-1 overflow-auto border rounded mb-4">
            <el-table :data="tasks" style="width: 100%" size="small">
                <el-table-column prop="source" label="源目录" show-overflow-tooltip />
                <el-table-column prop="target" label="目标目录" show-overflow-tooltip />
                <el-table-column label="状态" width="100" align="center">
                    <template #default="{ row }">
                        <span v-if="row.status === 'pending'" class="text-gray-400">等待中</span>
                        <span v-else-if="row.status === 'processing'" class="text-blue-500 font-bold flex items-center justify-center gap-1">
                            <el-icon class="is-loading"><Loading /></el-icon> 处理中
                        </span>
                        <span v-else-if="row.status === 'done'" class="text-green-500 flex items-center justify-center gap-1">
                            <el-icon><CircleCheck /></el-icon> 完成
                        </span>
                        <span v-else-if="row.status === 'skipped'" class="text-yellow-600 font-bold flex items-center justify-center gap-1">
                            <el-icon><VideoPlay /></el-icon> 跳过
                        </span>
                        <span v-else-if="row.status === 'error'" class="text-red-500 flex items-center justify-center gap-1">
                            <el-icon><CircleClose /></el-icon> 失败
                        </span>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <!-- Error Summary -->
        <div v-if="hasErrors" class="bg-red-50 text-red-600 p-3 rounded mb-4 text-sm max-h-32 overflow-auto">
            <p class="font-bold mb-1">错误详情:</p>
            <div v-for="(err, idx) in errors" :key="idx" class="mb-1 border-b border-red-100 pb-1">
                {{ err }}
            </div>
        </div>

        <!-- Actions -->
        <div class="flex justify-end gap-4 mt-auto">
            <el-button @click="viewMode = 'list'" :disabled="isMigrating">返回列表</el-button>
            <el-button 
                v-if="!isDone"
                type="primary" 
                size="large" 
                @click="startBatch" 
                :disabled="isMigrating || tasks.length === 0"
            >
                开始批量迁移
            </el-button>
        </div>
    </div>
    
    <!-- View Dialog -->
    <el-dialog
        v-model="viewDialogVisible"
        title="方案详情"
        width="60%"
    >
        <div class="max-h-96 overflow-auto border rounded">
            <el-table :data="viewPlanItems" style="width: 100%" size="small">
                <el-table-column prop="source" label="源目录" show-overflow-tooltip />
                <el-table-column prop="target" label="目标目录" show-overflow-tooltip />
            </el-table>
        </div>
        <template #footer>
            <div class="flex justify-end">
                <el-button @click="viewDialogVisible = false">关闭</el-button>
            </div>
        </template>
    </el-dialog>

    <!-- WebDAV Import Dialog -->
    <el-dialog v-model="importWebDAVDialogVisible" title="WebDAV 导入" width="500px">
        <div v-loading="loadingWebDAV" class="max-h-96 overflow-auto">
             <el-table :data="webdavFiles" empty-text="未找到备份文件">
                 <el-table-column prop="basename" label="文件名" />
                 <el-table-column label="操作" width="100" align="right">
                     <template #default="{ row }">
                         <el-button link type="primary" @click="doImportWebDAV(row.filename)">导入</el-button>
                     </template>
                 </el-table-column>
             </el-table>
        </div>
    </el-dialog>

    <!-- Google Drive Import Dialog -->
    <el-dialog v-model="importGDriveDialogVisible" title="Google Drive 导入" width="500px">
        <div v-loading="loadingGDrive" class="max-h-96 overflow-auto">
             <el-table :data="gdriveFiles" empty-text="未找到备份文件">
                 <el-table-column prop="name" label="文件名" />
                 <el-table-column label="操作" width="100" align="right">
                     <template #default="{ row }">
                         <el-button link type="primary" @click="doImportGDrive(row.id)">导入</el-button>
                     </template>
                 </el-table-column>
             </el-table>
        </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'

const router = useRouter()

// View Mode
const viewMode = ref<'list' | 'execute'>('list')
const savedPlans = ref<any[]>([])
const activePlan = ref<any>(null)
const searchQuery = ref('')

// View Dialog
const viewDialogVisible = ref(false)
const viewPlanItems = ref<any[]>([])

// Import WebDAV Dialog
const importWebDAVDialogVisible = ref(false)
const webdavFiles = ref<WebDAVFile[]>([])
const loadingWebDAV = ref(false)

// Import GDrive Dialog
const importGDriveDialogVisible = ref(false)
const gdriveFiles = ref<any[]>([])
const loadingGDrive = ref(false)

// Execution Data
const currentPlanName = ref('')
const tasks = ref<MigrationTask[]>([])
const isMigrating = ref(false)
const isDone = ref(false)
const errors = ref<string[]>([])

// Interfaces
interface MigrationTask {
    source: string
    target: string // Full target path
    status: 'pending' | 'processing' | 'done' | 'error' | 'skipped'
    error?: string
}

interface WebDAVFile {
    filename: string
    basename: string
    lastmod: string
    size: number
}

// Computeds
const filteredPlans = computed(() => {
    if (!searchQuery.value) return savedPlans.value
    const lower = searchQuery.value.toLowerCase()
    return savedPlans.value.filter(p => p.name.toLowerCase().includes(lower))
})

const totalCount = computed(() => tasks.value.length)
const completedCount = computed(() => tasks.value.filter(t => t.status === 'done' || t.status === 'error' || t.status === 'skipped').length)
const percentage = computed(() => totalCount.value === 0 ? 0 : Math.round((completedCount.value / totalCount.value) * 100))
const currentItem = computed(() => tasks.value.find(t => t.status === 'processing'))
const hasErrors = computed(() => errors.value.length > 0)

const statusText = computed(() => {
    if (isMigrating.value) return '正在批量迁移...'
    if (isDone.value) return hasErrors.value ? '已完成 (有错误)' : '全部完成'
    return '准备就绪'
})

const statusType = computed(() => {
    if (isMigrating.value) return 'primary'
    if (isDone.value) return hasErrors.value ? 'warning' : 'success'
    return 'info'
})

// Initialization
onMounted(() => {
    loadPlans()
})

// Auto Refresh
watch(viewMode, (val) => {
    if (val === 'list') {
        loadPlans()
    }
})

const loadPlans = async () => {
    savedPlans.value = await window.api.getPlans()
}



const handleExportLocal = async () => {
     const success = await window.api.exportPlans()
     if (success) alert('导出成功！')
}

const handleExportWebDAV = async () => {
    const res = await window.api.webdavExportPlans()
    if (res.success) alert('WebDAV 导出成功！')
    else alert('导出失败: ' + res.error)
}

const handleExportGDrive = async () => {
    const res = await window.api.gdriveExportPlans()
    if (res.success) alert('Google Drive 导出成功！')
    else alert('导出失败: ' + res.error)
}

const handleImportLocal = async () => {
    const result = await window.api.importPlans()
    if (result.success) {
        alert(`成功导入 ${result.count} 个方案！`)
        loadPlans()
    } else if (result.error) {
        alert(`导入失败: ${result.error}`)
    }
}

const handleImportWebDAV = async () => {
    importWebDAVDialogVisible.value = true
    loadWebDAVFiles()
}

const handleImportGDrive = async () => {
    importGDriveDialogVisible.value = true
    loadGDriveFiles()
}

const loadWebDAVFiles = async () => {
    loadingWebDAV.value = true
    try {
        const files = await window.api.webdavListPlans()
        webdavFiles.value = files
    } catch(e) {
        alert('加载 WebDAV 文件失败')
    } finally {
        loadingWebDAV.value = false
    }
}

const loadGDriveFiles = async () => {
    loadingGDrive.value = true
    try {
        const files = await window.api.gdriveListPlans()
        gdriveFiles.value = files
    } catch(e) {
        alert('加载 Google Drive 文件失败')
    } finally {
        loadingGDrive.value = false
    }
}

const doImportWebDAV = async (filename: string) => {
    const result = await window.api.webdavImportPlan(filename)
    if (result.success) {
        alert(`成功导入 ${result.count} 个方案！`)
        importWebDAVDialogVisible.value = false
        loadPlans()
    } else {
        alert(`导入失败: ${result.error}`)
    }
}

const doImportGDrive = async (fileId: string) => {
    const result = await window.api.gdriveImportPlan(fileId)
    if (result.success) {
        alert(`成功导入 ${result.count} 个方案！`)
        importGDriveDialogVisible.value = false
        loadPlans()
    } else {
        alert(`导入失败: ${result.error}`)
    }
}

const editPlanName = (plan: any) => {
    ElMessageBox.prompt('请输入新的方案名称', '修改名称', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValue: plan.name,
        inputPattern: /\S+/,
        inputErrorMessage: '名称不能为空'
    }).then(async ({ value }) => {
        if (value && value !== plan.name) {
            plan.name = value
            await window.api.updatePlan(JSON.parse(JSON.stringify(plan)))
            ElMessage.success('名称已修改')
            await loadPlans()
        }
    }).catch(() => {})
}

const deletePlan = async (id: string) => {
    if (!confirm('确定要删除此方案吗？')) return
    await window.api.deletePlan(id)
    await loadPlans()
}

const selectPlan = (plan: any) => {
    activePlan.value = plan
    currentPlanName.value = plan.name
    tasks.value = plan.items.map((item: any) => ({
        source: item.source,
        target: item.target,
        status: 'pending'
    }))
    isMigrating.value = false
    isDone.value = false
    errors.value = []
    viewMode.value = 'execute'
}

const openView = (plan: any) => {
    viewPlanItems.value = plan.items
    viewDialogVisible.value = true
}

// Main Logic
const startBatch = async () => {
    if (tasks.value.length === 0) return
    isMigrating.value = true
    isDone.value = false
    errors.value = []

    // Process sequentially
    for (const task of tasks.value) {
        task.status = 'processing'
        
        // Pass parent directory to handler
        const targetParentDir = task.target.substring(0, task.target.lastIndexOf('\\'))
        
        try {
            const result = await window.api.startMigration({
                source: task.source,
                targetParent: targetParentDir
            })
            
            if (result.success) {
                if (result.skipped) {
                    task.status = 'skipped'
                } else {
                    task.status = 'done'
                }
            } else {
                task.status = 'error'
                task.error = result.error
                errors.value.push(`[${task.source}] ${result.error}`)
            }
        } catch (e: any) {
            task.status = 'error'
            task.error = e.message
            errors.value.push(`[${task.source}] ${e.message}`)
        }
    }
    
    isMigrating.value = false
    isDone.value = true
    
    // Save to History
    await window.api.addHistory({
        id: Date.now().toString(),
        planName: currentPlanName.value,
        timestamp: Date.now(),
        result: hasErrors.value ? 'Partial Success' : 'Success',
        total: totalCount.value,
        errors: errors.value.length,
        errorLog: errors.value // Save detailed errors
    })
    
    // Update Plan Last Run
    if (activePlan.value) {
        activePlan.value.lastRun = Date.now()
        await window.api.updatePlan(JSON.parse(JSON.stringify(activePlan.value)))
    }
}
</script>
