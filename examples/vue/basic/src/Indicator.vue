<script setup lang="ts">
import { computed } from "vue";
import { borderRadius, border, boxShadow, margin, padding } from "./css";

const props = defineProps<{ label: string; parent: string }>();
const isActive = computed(() => props.parent === props.label);
</script>

<template>
  <div
    :style="{
      borderRadius: borderRadius + 'px',
      border,
      margin: margin + 'px',
      padding: padding * 2 + 'px',
      boxShadow,
      backgroundColor: isActive ? '#C4E8FC' : '#FFFFFF',
      fontWeight: isActive ? 'bold' : 'normal',
    }"
  >
    {{ label }}
  </div>
</template>
