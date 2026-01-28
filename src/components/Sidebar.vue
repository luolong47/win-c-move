<template>
  <el-menu
    :default-active="$route.path"
    class="h-full border-r-0"
    router
    background-color="#f3f4f6"
  >
    <el-menu-item index="/">
      <span class="font-bold text-lg px-2">🚀 迁移工具</span>
    </el-menu-item>
    <el-menu-item index="/config">
      <span>📂 迁移配置</span>
    </el-menu-item>
    <el-menu-item index="/migration">
      <span>⚡ 执行迁移</span>
    </el-menu-item>
    <el-menu-item index="/history">
      <span>📜 历史记录</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
</script>
