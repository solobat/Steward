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
      type: [Object, Array],
    },
    layout: {
      type: String
    }
  },

  data() {
    return {};
  },

  watch: {
    schema() {
      this.refreshEditor();
    }
  },

  methods: {
    initEditor() {
      this.editor = new JSONEditor(this.$refs.editor, {
        schema: this.schema,
        disable_collapse: true,
        disable_edit_json: true,
        disable_properties: true,
        theme: 'bootstrap4',
        startval: this.value,
        object_layout: this.layout || 'normal',
        remove_button_labels: true,
        iconlib: 'spectre'
      });
      this.editor.on('change', () => {
        this.$emit('input', this.editor.getValue());
      });
    },
    destroyEditor() {
      this.editor.destroy();
    },
    refreshEditor() {
      this.destroyEditor();
      this.initEditor();
    }
  },

  mounted() {
    this.initEditor();
  },

  beforeDestroy() {
    this.destroyEditor();
  },
};
</script>
