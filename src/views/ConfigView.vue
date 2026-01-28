<template>
  <div class="p-6 h-full flex flex-col">
    <div class="flex justify-between items-center mb-4">
        <h2 class="text-2xl font-bold">创建迁移方案</h2>
        <div class="flex gap-2">
            <el-button @click="loadTree" :loading="loading" icon="Refresh">刷新目录</el-button>
        </div>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        <!-- Left: Configuration & Tree -->
        <div class="lg:col-span-1 flex flex-col gap-4 overflow-hidden">
            <!-- Config Form -->
            <div class="bg-white p-4 rounded shadow-sm border">
                <el-form label-position="top">
                    <el-form-item label="方案名称 (Solution Name)">
                        <el-input v-model="solutionName" placeholder="例如: Backup2024" />
                    </el-form-item>
                    <el-form-item label="目标基准目录 (Target Base)">
                        <div class="flex w-full gap-2">
                            <el-input v-model="targetBase" placeholder="例如: D:\CData" readonly />
                            <el-button @click="selectTargetBase">选择</el-button>
                        </div>
                    </el-form-item>
                    <el-form-item>
                         <el-input v-model="searchQuery" placeholder="筛选文件夹..." clearable prefix-icon="Search" />
                    </el-form-item>
                </el-form>
            </div>

            <!-- Tree View -->
            <div class="bg-white p-2 rounded shadow-sm border flex-1 overflow-auto flex flex-col">
                <div class="text-sm text-gray-500 mb-2 px-2">请勾选需要迁移的文件夹:</div>
                <div class="flex-1 overflow-auto" v-loading="loading">
                    <!-- Lazy Tree (Default) -->
                    <el-tree
                        v-if="!hasSearch"
                        ref="treeRef"
                        lazy
                        :load="loadNode"
                        show-checkbox
                        check-strictly
                        node-key="id"
                        :default-checked-keys="selectedKeys"
                        @check="handleCheck"
                    >
                        <template #default="{ node }">
                            <span class="flex items-center gap-1">
                                <i class="text-yellow-500">📁</i> {{ node.label }}
                            </span>
                        </template>
                    </el-tree>

                    <!-- Search Result Tree (Filtered) -->
                    <el-tree
                        v-else
                        ref="treeRef"
                        :data="searchTreeData"
                        show-checkbox
                        check-strictly
                        default-expand-all
                        node-key="id"
                        :default-checked-keys="selectedKeys"
                        @check="handleCheck"
                    >
                        <template #default="{ node }">
                            <span class="flex items-center gap-1">
                                <i class="text-yellow-500">🔍</i> {{ node.label }}
                                <span class="text-xs text-gray-400 ml-2">{{ node.data.fullPath }}</span>
                            </span>
                        </template>
                    </el-tree>
                </div>
            </div>
        </div>

        <!-- Right: Preview & Actions -->
        <div class="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
             <!-- Preview List -->
             <div class="bg-white p-4 rounded shadow-sm border flex-1 overflow-hidden flex flex-col">
                <h3 class="font-bold mb-3 flex justify-between">
                    <span>迁移预览 ({{ selectedNodes.length }} 项)</span>
                    <span class="text-xs font-normal text-gray-500">将保留完整目录结构</span>
                </h3>
                
                <div class="flex-1 overflow-auto border rounded bg-gray-50 p-2">
                    <el-table :data="previewList" style="width: 100%" size="small" :empty-text="previewEmptyText">
                        <el-table-column prop="source" label="源目录 (Source)" show-overflow-tooltip min-width="150" />
                        <el-table-column label="❌" width="30" align="center">
                             <template #default>➡️</template>
                        </el-table-column>
                        <el-table-column prop="target" label="映射目标目录 (Target)" show-overflow-tooltip min-width="200">
                             <template #default="{ row }">
                                 <span class="text-blue-600 font-mono text-xs">{{ row.target }}</span>
                             </template>
                        </el-table-column>
                    </el-table>
                </div>
             </div>

             <!-- Actions -->
             <div class="flex justify-end bg-white p-4 rounded shadow-sm border">
                 <div class="flex items-center gap-4">
                     <div class="text-right text-sm text-gray-500" v-if="!canSubmit">
                         <p v-if="!solutionName">请输入方案名称</p>
                         <p v-if="!targetBase">请选择目标目录</p>
                         <p v-if="selectedNodes.length === 0">请至少勾选一个文件夹</p>
                     </div>
                     <el-button type="primary" size="large" :disabled="!canSubmit" @click="submitPlan">
                         完成 ({{ selectedNodes.length }})
                     </el-button>
                 </div>
             </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElTree } from 'element-plus'

const router = useRouter()

// Data
const solutionName = ref('')
const targetBase = ref('')
const searchQuery = ref('')
const loading = ref(false)
const treeRef = ref<InstanceType<typeof ElTree>>()

// Use Map for persistence: FullPath -> TreeNode
const selectedNodeMap = ref(new Map<string, TreeNode>())

// New Search Data
const searchTreeData = ref<TreeNode[]>([])

// Interfaces
interface TreeNode {
  label: string
  fullPath: string
  children?: TreeNode[]
  id: string
  leaf?: boolean
}

interface MappingPreview {
    source: string
    target: string
}

// Computeds
const selectedNodes = computed(() => Array.from(selectedNodeMap.value.values()))
const selectedKeys = computed(() => Array.from(selectedNodeMap.value.keys()))

const previewEmptyText = computed(() => {
    if (!solutionName.value) return '请输入方案名称以预览映射路径'
    if (!targetBase.value) return '请选择目标基准目录以预览映射路径'
    if (selectedNodeMap.value.size === 0) return '请在左侧勾选文件'
    return '无数据'
})

const canSubmit = computed(() => {
    return solutionName.value.trim() && targetBase.value && selectedNodeMap.value.size > 0
})

const previewList = computed<MappingPreview[]>(() => {
    if (!solutionName.value || !targetBase.value) return []
    
    // Sort for display consistency
    return selectedNodes.value.sort((a,b) => a.fullPath.localeCompare(b.fullPath)).map(node => {
        return {
            source: node.fullPath,
            target: calculateTarget(node.fullPath)
        }
    })
})

const hasSearch = computed(() => searchQuery.value.trim().length > 0)

// Methods

const calculateTarget = (sourcePath: string): string => {
    // Remove drive letter "C:" completely
    const noDrive = sourcePath.replace(/^[a-zA-Z]:/, '')
    
    // Ensure leading slash
    const relEnd = noDrive.startsWith('\\') ? noDrive : ('\\' + noDrive)
    
    let base = targetBase.value
    if (base.endsWith('\\')) base = base.slice(0, -1)
    
    return `${base}\\${solutionName.value}${relEnd}`
}

const selectTargetBase = async () => {
    const path = await window.api.selectDirectory()
    if (path) targetBase.value = path
}

// Lazy Load Logic (Default)
const loadNode = async (node: any, resolve: (data: TreeNode[]) => void) => {
    if (hasSearch.value) return resolve([]) // Should not happen if v-if works
    
    // Level 0: Root C:
    if (node.level === 0) {
       const results = await window.api.scanDirectoryStats({ dirPath: 'C:\\' })
       return resolve(results.map((i: any) => ({
           label: i.name,
           fullPath: i.path,
           id: i.path,
           leaf: false 
       })))
    }
    
    if (node.data.fullPath) {
        const results = await window.api.scanDirectoryStats({ dirPath: node.data.fullPath })
        resolve(results.map((i: any) => ({
           label: i.name,
           fullPath: i.path,
           id: i.path,
           leaf: false
       })))
    } else {
        resolve([])
    }
}

// Search Logic
let searchTimeout: any
watch(searchQuery, (val) => {
    // If empty, clear search data to revert to lazy view
    if (!val) {
        searchTreeData.value = []
        return
    }
    
    // Debounce backend search
    clearTimeout(searchTimeout)
    searchTimeout = setTimeout(() => {
        performSearch()
    }, 600)
})

const performSearch = async () => {
    loading.value = true
    try {
        const results = await window.api.scanDirectoryStats({ query: searchQuery.value })
        searchTreeData.value = buildTree(results)
    } finally {
        loading.value = false
    }
}

// Re-introduce buildTree for search results (Flat list -> Tree)
const buildTree = (items: Array<{name: string, path: string}>) => {
    const tree: TreeNode[] = []
    items.sort((a, b) => a.path.localeCompare(b.path))
    
    for (const item of items) {
        const normalizedPath = item.path.replace(/\//g, '\\')
        const parts = normalizedPath.split('\\').filter(p => p) 
        
        let currentLevel = tree
        let currentFullPath = ''
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i]
            if (i === 0) {
                 if (normalizedPath.startsWith(part + '\\')) {
                     currentFullPath = part + '\\' 
                 } else {
                     currentFullPath = part
                 }
            } else {
                 currentFullPath = currentFullPath.endsWith('\\') ? (currentFullPath + part) : (currentFullPath + '\\' + part)
            }

            let existingNode = currentLevel.find(n => n.label === part)
            if (!existingNode) {
                existingNode = {
                    label: part,
                    fullPath: currentFullPath,
                    children: [],
                    id: currentFullPath,
                    leaf: false
                }
                currentLevel.push(existingNode)
            }
            if (existingNode.children) {
                 currentLevel = existingNode.children
            }
        }
    }
    return tree
}

// Selection Logic (Persistent)
// Node: The node data that was checked/unchecked
// State: boolean checked state, or object { checkedNodes, checkedKeys, halfCheckedNodes, halfCheckedKeys }
const handleCheck = (data: TreeNode, state: any) => {
    // Current Checked Keys in the TREE
    const treeCheckedKeys = new Set(state.checkedKeys)
    
    // Determine if 'data' was checked or unchecked
    const isChecked = treeCheckedKeys.has(data.id)
    
    if (isChecked) {
        // ADD to persistent map
        // Also check if any parent is already in the map?
        // With check-strictly, parents are independent.
        // We just add what the user clicked.
        // BUT: If user clicked a node, we should add it.
        // wait, 'handleCheck' fires for the node clicked. 
        // NOTE: Element Plus 'check' event emits (data, { checkedNodes, checkedKeys... })
        
        selectedNodeMap.value.set(data.id, data)
        
        // Strategy: 
        // Since we use check-strictly, we don't have implicit parent/child checking.
        // So we strictly respect the user's click.
        // However, if user selects a folder, do they expect all subfolders?
        // In previous implementation (atomic moves), YES.
        // Moving "AppData" moves everything inside.
        // So validation: If I select "AppData", I don't need to select "Roaming" inside it.
        // Cleanup: Remove any descendants from map if ancestor is added?
        // Cleanup: Remove any ancestors from map if child is added? (No, that's impossible with single click usually)
        
        // Let's implement "Optimize Selection" logic:
        // When adding X, remove any Y where Y is descendant of X.
        removeDescendants(data.fullPath)
        
    } else {
        // REMOVE from persistent map
        selectedNodeMap.value.delete(data.id)
    }
}

const removeDescendants = (parentPath: string) => {
    for (const [key, node] of selectedNodeMap.value.entries()) {
        if (node.fullPath !== parentPath && node.fullPath.startsWith(parentPath)) {
            selectedNodeMap.value.delete(key)
        }
    }
}

const submitPlan = async () => {
    // Construct Plan Object
    const plan = {
        id: Date.now().toString(),
        name: solutionName.value || '未命名方案',
        base: targetBase.value,
        createdAt: Date.now(),
        items: previewList.value
    }
    
    // Save to persistent store
    await window.api.addPlan(plan)
    
    router.push({ 
        path: '/migration'
    })
}

// Placeholder
const loadTree = () => {
    // If in search mode, refresh search
    if (hasSearch.value) performSearch()
}

onMounted(() => {
    // loadTree() // Lazy tree auto loads
})
</script>
