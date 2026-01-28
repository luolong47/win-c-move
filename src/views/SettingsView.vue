<template>
  <div class="p-6 h-full flex flex-col">
    <h2 class="text-2xl font-bold mb-4">设置</h2>
    
    <div class="flex flex-col gap-6 flex-1 overflow-auto">
        <div class="bg-white p-6 rounded shadow-sm border">
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

        <div class="bg-white p-6 rounded shadow-sm border">
            <el-form label-position="top" class="max-w-lg">
                <h3 class="font-bold text-lg mb-4 text-gray-700">Google Drive 配置</h3>
                
                <div class="flex gap-4 mt-2">
                    <el-button 
                        v-if="!config.gdrive.token"
                        type="primary" 
                        @click="authGDrive" 
                        :loading="authenticating"
                    >
                        授权 Google Drive
                    </el-button>
                    <el-button 
                        v-else
                        type="danger" 
                        @click="revokeGDrive"
                    >
                        取消授权
                    </el-button>
                </div>
                
                <div v-if="config.gdrive.token" class="mt-4 p-3 rounded text-sm bg-green-50 text-green-700 flex items-center gap-2">
                    <el-icon><CircleCheck /></el-icon>
                    已获得 Google Drive 访问授权
                </div>
                <div v-else class="mt-4 p-3 rounded text-sm bg-gray-50 text-gray-500">
                    授权后可将方案备份至 Google Drive 云端
                </div>
            </el-form>
        </div>
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
    },
    gdrive: {
        token: null as any
    }
})

const saving = ref(false)
const testing = ref(false)
const authenticating = ref(false)
const testResult = ref<{success: boolean, message: string} | null>(null)

const isConfigComplete = computed(() => {
    return config.value.webdav.url && config.value.webdav.username && config.value.webdav.password
})

onMounted(async () => {
    const saved = await window.api.getConfig()
    if (saved) {
        if (saved.webdav) config.value.webdav = { ...saved.webdav }
        if (saved.gdrive) config.value.gdrive = { ...saved.gdrive }
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

const authGDrive = async () => {
    authenticating.value = true
    try {
        const result = await window.api.gdriveAuth()
        if (result.success) {
            config.value.gdrive.token = result.token
            await saveConfig()
            alert('Google Drive 授权成功')
        } else {
            alert('授权失败: ' + result.error)
        }
    } catch (e: any) {
        alert('授权发生错误: ' + e.message)
    } finally {
        authenticating.value = false
    }
}

const revokeGDrive = async () => {
    if (!confirm('确定要取消 Google Drive 授权吗？')) return
    config.value.gdrive.token = null
    await saveConfig()
    alert('已取消授权')
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
