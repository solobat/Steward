<template>
  <div>
    <div class="text-panel">
      <h2>{{ extType }} v{{config.version}}</h2>
      <section class="changelog">
        <template v-for="(update, index) in changelog">
          <div :key="index" v-if="!update.ext || update.ext === extType">
            <h3 v-html="update.version"></h3>
            <p v-html="update.detail"></p>
          </div>
        </template>
      </section>
      <div style="margin-top: 12px;">
        <a
          style="margin-left: 12px;"
          :href="'http://static.oksteward.com/' + extType + '-' + config.version + '.crx'"
        >{{i18nTexts.ui.settings.actions.downloadcrx}}</a>
      </div>
    </div>
  </div>
</template>

<script>
import changelog from '@/js/info/changelog'
const extType = EXT_TYPE === 'stewardplus' ? 'Steward Plus' : 'steward';


export default {
  name: 'Update',
  props: ["config", "i18nTexts"],
  data() {
    return {
      changelog,
      extType
    }
  }
};
</script>

<style>
</style>