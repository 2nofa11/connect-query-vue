<script setup lang="ts">
import { borderRadius, border, boxShadow, margin, padding, lightBlue } from "./css";

defineProps<{ label: string }>();
</script>

<template>
  <div
    :style="{
      borderRadius: borderRadius + 'px',
      border,
      margin: margin + 'px',
      overflow: 'hidden',
      zIndex: 1,
      boxShadow,
    }"
  >
    <div :style="{ padding: padding * 2 + 'px', backgroundColor: lightBlue }">
      {{ label }}
    </div>
    <div :style="{ display: 'flex', flexWrap: 'wrap' }">
      <slot />
    </div>
  </div>
</template>
