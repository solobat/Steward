import { componentHelper } from '../../../js/helper/componentHelper'
import util from '../../../js/common/util'
import MonacoEditor from 'vue-monaco'
import { autoFormat } from '../../../js/helper/editorHelper'

export default {
    data() {
        return {
            componentSearchText: '',
            components: [],
            currentComponent: null,
            componentTabIndex: 0,
            currentComponentSource: '',
            componentCmOptions: {
                tabSize: 2,
                styleActiveLine: true,
                autoCloseBrackets: true,
                styleSelectedText: true,
                matchBrackets: true,
                foldGutter: true,
                gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
                mode: 'application/json',
                theme: 'monokai',
                lineNumbers: true,
                line: true,
                extraKeys: {
                    "F7": autoFormat
                }
            },
            activeFieldsName: ['meta'],
            componentFormRuels: {
            }
        };
    },

    computed: {
        filteredComponents() {
            const text = this.componentSearchText.toLowerCase();

            console.log("TCL: filteredComponents -> this.components", this.components)
            return this.components.filter(component => {
                return component.meta.title.toLowerCase().indexOf(text) > -1;
            });
        }
    },

    created() {
        this.initComponents()
    },

    methods: {
        initComponents() {
            componentHelper.init().then((resp = []) => {
                this.components = resp.map(oldComponent => {
                    const newComponent = this.remoteComponents.find(item => item.id === oldComponent.id)
                    if (newComponent) {
                        oldComponent.hasNewVersion = componentHelper.hasNewVersion(oldComponent, newComponent)
                    }
                    return oldComponent
                });
            });
        },
        handleComponentClick(component) {
            const data = JSON.parse(JSON.stringify(component));

            this.currentComponent = data;
            if (this.componentTabIndex === 1) {
                this.updateCurrentSource();
            }
        },

        updateCurrentSource() {
          const data = JSON.parse(JSON.stringify(this.currentComponent || {}))

          this.currentComponentSource = JSON.stringify(data);
        },

        onComponentEditorDidMount(editor) {
            autoFormat(editor);
        },

        handleComponentTabClick(tab) {
            const idx = Number(tab.index)

            if (idx === 1) {
                this.updateCurrentSource();
            }
            this.componentTabIndex = idx
        },

        handleComponentBeforeSave() {
            const component = JSON.parse(JSON.stringify(this.currentComponent));

            return component;
        },

        submitComponent() {
            const data = this.handleComponentBeforeSave();

            return componentHelper.save(data).then(component => {
                this.afterComponentSubmit(component.toJSON());
                this.$message(chrome.i18n.getMessage('save_ok'));
            });
        },

        refreshComponents() {
            this.components = componentHelper.getComponentList();
        },

        afterComponentSubmit(component) {
            this.refreshComponents();
            this.currentComponent = component;
            this.updateCurrentSource();
            if (this.componentTabIndex === 1) {
                autoFormat(this.$refs.componentEditor.getEditor())
            }
        },

        handleComponentSubmit() {
            this.$refs.componentForm.validate(valid => {
                if (!valid) {
                    this.$message.error(chrome.i18n.getMessage('check_form'));
                } else {
                    this.submitComponent();
                }
            });
        },

        async updateComponent() {
            const current = this.currentComponent
            const newComponent = this.remoteComponents.find(item => item.id === current.id)

            const res = await componentHelper.updateToNewVersion(current, newComponent)

            this.currentComponent = res
            this.initComponents()
            this.updateCurrentSource()
            this.$message.success('Updated')
        },

        handleComponentCodeSubmit() {
            try {
                this.currentComponent = JSON.parse(this.currentComponentSource);
                this.submitComponent();
            } catch (error) {
                console.error(error);
            }
        }
    },

    components: {
        MonacoEditor
    }
}