<script setup lang="ts">
import { padding } from "./css";
</script>

<template>
  <div
    :style="{
      maxWidth: '800px',
      padding: padding * 2 + 'px',
      margin: '0 auto',
    }"
  >
    <slot />
  </div>
</template>
