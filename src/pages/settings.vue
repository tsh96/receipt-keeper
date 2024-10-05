<script lang="ts" setup>
import LayoutWithNav from '../components/LayoutWithNav.vue';
import { useSettings } from '../composables/settings';
import { NForm, NFormItem, NInput } from 'naive-ui';


const settings = useSettings();


</script>

<template lang="pug">
LayoutWithNav(title="Settings" back-url="/")
  .container
    NForm
      NFormItem(label="Gemini Model")
        NInput(v-model:value="settings.geminiModel")
      NFormItem(label="Gemini API Key")
        NInput(v-model:value="settings.geminiApiKey")
</template>

<style scoped>
.container {
  padding: 0 20px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
}
</style>