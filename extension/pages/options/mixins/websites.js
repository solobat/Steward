import websiteHelper from '../../../js/helper/websites'
import util from '../../../js/common/util'

export default {
    data() {
        return {
            websiteSearchText: '',
            websites: [],
            currentWebsite: null,
            activeFieldsName: ['meta'],
            newPath: {
                title: '',
                urlPattern: '',
                editable: false
            },
            newAnchor: {
                title: '',
                selector: '',
                editable: false
            },
            websiteFormRuels: {
                title: [
                    { type: 'string', required: true, trigger: 'change' }
                ],
                host: [
                    { type: 'string', required: true, trigger: 'change' }
                ]
            }
        };
    },

    computed: {
        filteredWebsites() {
            const text = this.websiteSearchText.toLowerCase();

            return this.websites.filter(website => {
                return website.title.toLowerCase().indexOf(text) > -1;
            });
        }
    },

    created() {
        websiteHelper.init().then((resp = []) => {
            this.websites = resp;
        });
    },

    methods: {
        handleWebsiteClick(website) {
            const data = JSON.parse(JSON.stringify(website));

            if (!data.anchors) {
                data.anchors = [];
            }

            ['anchors', 'paths'].forEach(key => {
                data[key].forEach(item => {
                    item.editable = false;
                });
            });

            this.currentWebsite = data;
        },

        resetCurrentWebsite() {
            this.currentWebsite = {
                title: 'New Website',
                host: '',
                icon: '',
                paths: [],
                navs: 'nav a',
                disabled: false,
                outlineScope: '',
                anchors: []
            };
        },

        handleNewWebsiteClick() {
            this.resetCurrentWebsite();
        },

        validateNewPath() {
            if (!this.newPath.title || !this.newPath.urlPattern) {
                return 'Title and URL Pattern is required!';
            } else {
                let msg;

                this.currentWebsite.paths.forEach(path => {
                    if (path.title === this.newPath.title) {
                        msg = 'Title is repeated!';
                    } else if (path.urlPattern === this.newPath.urlPattern) {
                        msg = 'URL Pattern is repeated!';
                    }
                });

                return msg;
            }
        },

        handleNewPathAddClick() {
            const msg = this.validateNewPath();

            if (msg) {
                this.$message(msg);
            } else {
                this.currentWebsite.paths.push(this.newPath);
                this.newPath = {
                    title: '',
                    urlPattern: '',
                    editable: false
                };
            }
        },

        handleNewPathDeleteClick(index) {
            this.currentWebsite.paths.splice(index, 1);
        },

        validateNewAnchor() {
            if (!this.newAnchor.title || !this.newAnchor.selector) {
                return 'Title and Selector is required!';
            } else {
                let msg;

                this.currentWebsite.anchors.forEach(anchor => {
                    if (anchor.title === this.newAnchor.title) {
                        msg = 'Title is repeated!';
                    } else if (anchor.selector === this.newAnchor.selector) {
                        msg = 'Selector is repeated!';
                    }
                });

                return msg;
            }
        },

        handleNewAnchorAddClick() {
            const msg = this.validateNewAnchor();

            if (msg) {
                this.$message(msg);
            } else {
                this.currentWebsite.anchors.push(this.newAnchor);
                this.newAnchor = {
                    title: '',
                    selector: '',
                    editable: false
                };
            }
        },

        handleNewAnchorDeleteClick(index) {
            this.currentWebsite.anchors.splice(index, 1);
        },

        handleWebsiteBeforeSave() {
            const website = JSON.parse(JSON.stringify(this.currentWebsite));

            ['paths', 'anchors'].forEach(key => {
                website[key].forEach(item => {
                    Reflect.deleteProperty(item, 'editable');
                });
            });

            return website;
        },

        submitWebsite() {
            const data = this.handleWebsiteBeforeSave();
            const website = websiteHelper.save(data);

            this.afterWebsiteSubmit(website.toJSON());
            this.$message(chrome.i18n.getMessage('save_ok'));
        },

        refreshWebsites() {
            this.websites = websiteHelper.getWebsiteList();
        },

        afterWebsiteSubmit(website) {
            this.refreshWebsites();
            this.currentWebsite = website;
        },

        handleWebsiteSubmit() {
            this.$refs.websiteForm.validate(valid => {
                if (!valid) {
                    this.$message.error(chrome.i18n.getMessage('check_form'));
                } else {
                    this.submitWebsite();
                }
            });
        },

        handleWebsiteDelete(id) {
            this.$confirm(util.getTextMsg('confirm_delete_tpl', 'settings_notion_website'), 'Prompt', {
                confirmButtonText: 'Delete',
                cancelButtonText: 'Cancel',
                type: 'warning'
            }).then(() => {
                this.$message(chrome.i18n.getMessage('delete_ok'));
                websiteHelper.remove(id);
                this.refreshWebsites();
                this.currentWebsite = null;
            }).catch(() => {

            });
        }
    }
}