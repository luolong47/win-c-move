<template>
  <div class="flex h-screen w-screen overflow-hidden text-gray-700 font-sans">
    <div class="w-64 h-full border-r bg-gray-50 flex-shrink-0">
      <Sidebar />
    </div>
    <div class="flex-1 h-full overflow-auto bg-gray-50">
      <router-view />
    </div>
  </div>
</template>

<script setup lang="ts">
import Sidebar from './components/Sidebar.vue'
</script>
