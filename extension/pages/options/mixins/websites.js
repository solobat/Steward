import websiteHelper from '../../../js/helper/websites'

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

            data.paths.forEach(path => {
                path.editable = false;
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
                outlineScope: ''
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

        handleWebsiteBeforeSave() {
            const website = JSON.parse(JSON.stringify(this.currentWebsite));

            website.paths.forEach(path => {
                Reflect.deleteProperty(path, 'editable');
            });

            return website;
        },

        submitWebsite() {
            const data = this.handleWebsiteBeforeSave();
            const website = websiteHelper.save(data);

            this.afterWebsiteSubmit(website.toJSON());
            this.$message('Save successfully!');
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
                    this.$message.error('Please check the form');
                } else {
                    this.submitWebsite();
                }
            });
        },

        handleWebsiteDelete(id) {
            this.$confirm('This operation will permanently delete the website, whether to continue?', 'Prompt', {
                confirmButtonText: 'Delete',
                cancelButtonText: 'Cancel',
                type: 'warning'
            }).then(() => {
                this.$message('Delete successfully!');
                websiteHelper.remove(id);
                this.refreshWebsites();
                this.currentWebsite = null;
            }).catch(() => {

            });
        }
    }
}