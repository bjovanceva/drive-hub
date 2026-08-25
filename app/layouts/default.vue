<script lang="ts" setup>
import AddHeader from '../components/AddHeader.vue';
import AppFooter from '../components/AppFooter.vue';
</script>

<template>
  <div class="dh-layout">
    <AddHeader />
    <main class="dh-layout__content">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>

<style scoped>
.dh-layout {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

.dh-layout__content {
  flex: 1 0 auto;
}
</style>
