<template>
  <el-menu
    :default-active="$route.path"
    class="h-full border-r-0"
    router
    background-color="#f3f4f6"
    :collapse="isCollapse"
    :collapse-transition="false"
  >
    <el-menu-item index="/">
      <el-icon><House /></el-icon>
      <template #title><span class="font-bold">首页</span></template>
    </el-menu-item>
    <el-menu-item index="/config">
      <el-icon><Plus /></el-icon>
      <template #title><span>新建方案</span></template>
    </el-menu-item>
    <el-menu-item index="/migration">
      <el-icon><Collection /></el-icon>
      <template #title><span>方案管理</span></template>
    </el-menu-item>
    <el-menu-item index="/history">
      <el-icon><Files /></el-icon>
      <template #title><span>历史记录</span></template>
    </el-menu-item>
    <el-menu-item index="/settings">
      <el-icon><Setting /></el-icon>
      <template #title><span>设置</span></template>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
defineProps<{
  isCollapse: boolean
}>()
</script>
