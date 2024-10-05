<script setup lang="ts">
import { NButton, NDivider } from 'naive-ui';

</script>

<template lang="pug">
.container
  router-link(to="/record-receipt")
    NButton(type="error" size="large" block) Record Receipt

  NDivider
  router-link(to="/history")
    NButton(type="info" size="large" block) History
  router-link(to="/search")
    NButton(type="success" size="large" block) Search

  NDivider
  router-link(to="/settings")
    NButton(type="warning" size="large" block) Settings
</template>

<style scoped>
.header {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 60px;
  font-size: 20px;
  font-weight: bold;
  width: 100%;
}

.back-button {
  position: absolute;
  left: 20px;
}

.container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100%;
  padding: 20px;
  flex-grow: 1;
  min-height: calc(100vh - 100px);
}

.container>* {
  margin-bottom: 20px;
}

.label {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 20px;
  margin-left: auto;
  margin-right: auto;
}

a {
  text-decoration: none;
}
</style>