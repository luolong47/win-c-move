<template>
  <div class="flex h-screen w-screen overflow-hidden text-gray-700 font-sans select-none">
    <!-- Sidebar Container -->
    <div 
      class="h-full border-r bg-gray-50 flex-shrink-0 relative flex flex-col"
      :class="{ 'transition-all duration-300 ease-in-out': !isResizing }"
      :style="{ width: isCollapse ? '64px' : `${sidebarWidth}px` }"
    >
      <div class="flex-1 overflow-hidden">
        <Sidebar :is-collapse="isCollapse" />
      </div>

      <!-- Collapse Toggle Button at Bottom -->
       <div 
        class="h-12 border-t flex items-center justify-center cursor-pointer hover:bg-gray-100 text-gray-400 transition-colors"
        @click="toggleCollapse"
        title="收起/展开菜单"
      >
        <el-icon :size="20">
          <Expand v-if="isCollapse" />
          <Fold v-else />
        </el-icon>
      </div>

      <!-- Resize Handle -->
      <div 
        v-if="!isCollapse"
        class="absolute top-0 -right-1 w-2 h-full cursor-col-resize hover:bg-blue-400 opacity-0 hover:opacity-100 transition-opacity z-10"
        @mousedown="startResizing"
      ></div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 h-full overflow-auto bg-gray-50 select-text">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import Sidebar from './components/Sidebar.vue'

const isCollapse = ref(localStorage.getItem('sidebar-collapsed') === 'true')
const sidebarWidth = ref(parseInt(localStorage.getItem('sidebar-width') || '256'))
const isResizing = ref(false)

const startResizing = () => {
  isResizing.value = true
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', stopResizing)
  document.body.style.cursor = 'col-resize'
}

const handleMouseMove = (e: MouseEvent) => {
  const newWidth = e.clientX
  if (newWidth > 64 && newWidth < 600) {
    sidebarWidth.value = newWidth
    localStorage.setItem('sidebar-width', newWidth.toString())
  }
}

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
  localStorage.setItem('sidebar-collapsed', isCollapse.value.toString())
}

const stopResizing = () => {
  isResizing.value = false
  document.removeEventListener('mousemove', handleMouseMove)
  document.removeEventListener('mouseup', stopResizing)
  document.body.style.cursor = ''
}

// Cleanup just in case
onUnmounted(() => {
  stopResizing()
})
</script>

<style>
/* Ensure smooth transition for sidebar width but not while resizing */
.transition-all {
  transition-property: all;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 300ms;
}
</style>
