<template>
  <div class="p-8">
    <h1 class="text-3xl font-bold mb-6 text-gray-800">欢迎使用 C盘迁移助手</h1>
    <div class="bg-white p-6 rounded shadow-sm border">
        <p class="mb-4 text-gray-600 leading-relaxed">
            本工具旨在帮助 Windows 用户安全地将 C 盘（系统盘）中的大型应用数据文件夹迁移到其他磁盘，
            并通过创建<b>符号链接 (Symbolic Link)</b> 保持系统和应用的正常运行。
        </p>
        <el-alert
            title="需要管理员权限"
            type="warning"
            description="创建符号链接需要管理员权限。如果未以管理员身份运行，迁移可能会失败。"
            show-icon
            class="mb-6"
        />
        <div class="flex gap-4">
            <el-button type="primary" size="large" @click="$router.push('/config')">创建新迁移方案</el-button>
            <el-button size="large" @click="checkAdmin">检查权限</el-button>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'

const checkAdmin = async () => {
    const isAdmin = await window.api.isAdmin()
    if (isAdmin) {
        ElMessage.success('当前已拥有管理员权限')
    } else {
        ElMessage.error('当前未拥有管理员权限，请右键选择“以管理员身份运行”')
    }
}
</script>
