<script setup lang="ts">
import { useId } from "vue";
import { border, borderRadius, boxShadow, lightBlue, margin, padding, white } from "./css";

defineProps<{ datum: string; label: string }>();
const id = useId();
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
    <label
      :id="id"
      :style="{ padding: padding * 2 + 'px', backgroundColor: lightBlue, display: 'block' }"
    >
      {{ label }}
    </label>
    <div :aria-labelledby="id" :style="{ padding: padding * 2 + 'px', backgroundColor: white }">
      {{ datum }}
    </div>
  </div>
</template>
