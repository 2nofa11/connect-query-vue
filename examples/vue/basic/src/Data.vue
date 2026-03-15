<script setup lang="ts">
import { borderRadius, border, boxShadow, margin } from "./css";
</script>

<template>
  <div
    :style="{
      borderRadius: borderRadius + 'px',
      border,
      margin: margin + 'px',
      boxShadow,
    }"
  >
    <slot />
  </div>
</template>
