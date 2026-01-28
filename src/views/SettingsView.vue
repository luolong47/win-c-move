<template>
  <div class="p-6 h-full flex flex-col">
    <h2 class="text-2xl font-bold mb-4">设置</h2>
    
    <div class="bg-white p-6 rounded shadow-sm border flex-1">
        <el-form label-position="top" class="max-w-lg">
            <h3 class="font-bold text-lg mb-4 text-gray-700">WebDAV 配置</h3>
            
            <el-form-item label="服务器地址">
                <el-input v-model="config.webdav.url" placeholder="https://dav.example.com" />
            </el-form-item>
            
            <el-form-item label="用户名">
                <el-input v-model="config.webdav.username" placeholder="user" />
            </el-form-item>
            
            <el-form-item label="密码">
                <el-input v-model="config.webdav.password" type="password" show-password placeholder="password" />
            </el-form-item>

            <div class="flex gap-4 mt-6">
                <el-button type="primary" @click="saveConfig" :loading="saving">保存配置</el-button>
                <el-button type="success" @click="testConnection" :loading="testing" :disabled="!isConfigComplete">测试连接</el-button>
            </div>
            
            <div v-if="testResult" :class="`mt-4 p-3 rounded text-sm ${testResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`">
                {{ testResult.message }}
            </div>
        </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'

const config = ref({
    webdav: {
        url: '',
        username: '',
        password: ''
    }
})

const saving = ref(false)
const testing = ref(false)
const testResult = ref<{success: boolean, message: string} | null>(null)

const isConfigComplete = computed(() => {
    return config.value.webdav.url && config.value.webdav.username && config.value.webdav.password
})

onMounted(async () => {
    const saved = await window.api.getConfig()
    if (saved && saved.webdav) {
        config.value.webdav = { ...saved.webdav }
    }
})

const saveConfig = async () => {
    saving.value = true
    try {
        await window.api.saveConfig(JSON.parse(JSON.stringify(config.value)))
        alert('配置已保存')
    } catch (e) {
        alert('保存失败')
    } finally {
        saving.value = false
    }
}

const testConnection = async () => {
    testing.value = true
    testResult.value = null
    try {
        // We pass the config explicitly to test without saving first if desired, 
        // OR we just use the API that uses saved config.
        // Better UX: Send current form values to test.
        const result = await window.api.webdavCheckConnection(JSON.parse(JSON.stringify(config.value.webdav)))
        testResult.value = result
    } catch (e: any) {
        testResult.value = { success: false, message: e.message }
    } finally {
        testing.value = false
    }
}
</script>
