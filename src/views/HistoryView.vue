<template>
  <div class="p-6 h-full flex flex-col">
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">历史记录</h2>
        <el-button icon="Refresh" circle @click="loadHistory" />
    </div>

    <div class="bg-white p-6 rounded shadow-sm border flex-1 overflow-hidden flex flex-col">
        <div class="mb-4">
            <el-input 
                v-model="searchQuery" 
                placeholder="搜索方案名称或结果..." 
                prefix-icon="Search" 
                clearable 
            />
        </div>
        <el-table :data="filteredLogs" style="width: 100%" class="flex-1" empty-text="暂无历史记录">
            <el-table-column label="执行时间" width="180">
                <template #default="{ row }">
                    {{ new Date(row.timestamp).toLocaleString() }}
                </template>
            </el-table-column>
            <el-table-column prop="planName" label="方案名称" show-overflow-tooltip />
            <el-table-column label="结果" width="120">
                <template #default="{ row }">
                     <el-tag :type="row.errors > 0 ? 'warning' : 'success'">{{ row.result }}</el-tag>
                     <span class="text-xs text-gray-400 ml-1">({{ row.errors }} errors)</span>
                </template>
            </el-table-column>
             <el-table-column label="操作" width="150" align="right">
                <template #default="{ row }">
                     <el-button type="text" @click="viewLog(row)">查看</el-button>
                     <el-button type="text" class="text-red-500" @click="deleteLog(row.id)">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
    </div>
    
    <!-- Detail Dialog -->
    <el-dialog v-model="viewDialogVisible" title="记录详情" width="50%">
        <div v-if="currentLog">
            <p><strong>方案:</strong> {{ currentLog.planName }}</p>
            <p><strong>时间:</strong> {{ new Date(currentLog.timestamp).toLocaleString() }}</p>
            <p><strong>概览:</strong> 共 {{ currentLog.total }} 项，{{ currentLog.errors }} 错误</p>
            
            <div v-if="currentLog.errorLog && currentLog.errorLog.length > 0" class="mt-4">
                <h4 class="font-bold text-red-600 mb-2">错误日志:</h4>
                <div class="bg-gray-100 p-2 rounded text-xs text-red-500 max-h-48 overflow-auto font-mono">
                    <div v-for="(line, i) in currentLog.errorLog" :key="i" class="border-b border-gray-200 last:border-0">
                        {{ line }}
                    </div>
                </div>
            </div>
            <div v-else class="mt-4 text-green-600">
                ✔ 无错误记录
            </div>
        </div>
        <template #footer>
            <el-button @click="viewDialogVisible = false">关闭</el-button>
        </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const logs = ref<any[]>([])
const searchQuery = ref('')
const viewDialogVisible = ref(false)
const currentLog = ref<any>(null)

const filteredLogs = computed(() => {
    if (!searchQuery.value) return logs.value
    const lower = searchQuery.value.toLowerCase()
    return logs.value.filter(l => 
        l.planName.toLowerCase().includes(lower) || 
        l.result.toLowerCase().includes(lower)
    )
})

const loadHistory = async () => {
    logs.value = await window.api.getHistory()
}

const deleteLog = async (id: string) => {
    if(!confirm('确定要删除这条记录吗？')) return
    await window.api.deleteHistory(id)
    await loadHistory()
}

const viewLog = (row: any) => {
    currentLog.value = row
    viewDialogVisible.value = true
}

onMounted(() => {
    loadHistory()
})
</script>
