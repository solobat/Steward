<template>
  <div>
    <div class="text-panel">
      <div v-html="helpInfo"></div>
    </div>
  </div>
</template>

<script>
import { helpInfo } from 'info/help'

export default {
  data() {
    return {
      helpInfo
    }
  }
};
</script>

<style>
</style>