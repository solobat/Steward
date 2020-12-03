<template>
  <div ref="editor" class="json-editor"></div>
</template>

<script>
import { JSONEditor } from '@json-editor/json-editor';

export default {
  name: 'JsonEditor',

  props: {
    schema: {
      type: Object,
    },
    value: {
      type: Object,
    },
  },

  data() {
    return {};
  },

  mounted() {
    this.editor = new JSONEditor(this.$refs.editor, {
      schema: this.schema,
      disable_collapse: true,
      disable_edit_json: true,
      disable_properties: true,
      theme: 'tailwind',
      startval: this.value,
    });
    this.editor.on('change', () => {
      this.$emit('input', this.editor.getValue());
    });
  },

  beforeDestroy() {
    this.editor.destroy();
  },
};
</script>
