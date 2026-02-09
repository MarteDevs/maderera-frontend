<script setup lang="ts">
import { RouterView } from 'vue-router';
import ToastContainer from './components/ui/ToastContainer.vue';
</script>

<template>
  <ToastContainer />
  <RouterView />
</template>

<style>
/* Global styles are imported in main.ts */
</style>
