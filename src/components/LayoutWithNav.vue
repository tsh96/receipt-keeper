<script setup lang="ts">
import { NButton } from 'naive-ui';
import { defineProps } from 'vue';

defineProps<{
  title: string;
  backUrl?: string;
}>();

</script>

<template lang="pug">
.header
  .header__back(v-if="backUrl")
    router-link(:to="backUrl")
      NButton(text) 
        .back-text ← Back
  .header__title {{ title }}
.body
  slot
</template>

<style scoped>
.header {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0 20px;
  min-height: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.header__back {
  left: 20px;
}

.back-text {
  font-weight: bold;
  font-size: 20px;
}

.header__title {
  flex-grow: 1;
  font-size: 20px;
  font-weight: bold;
  text-align: center;
}

.body {
  flex-grow: 1;
  overflow: hidden;
}
</style>
