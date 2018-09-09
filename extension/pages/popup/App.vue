<template>
    <div class="container">
        <application v-show="visible" mode="popup" :in-content="false" />
    </div>
</template>
<script>
import application from '../../components/application/index.vue'
import * as Core from '../../js/main/main.js'
import * as Wallpaper from '../../js/main/wallpaper.js'
import util from '../../js/common/util'
import keyboardJS from 'keyboardjs'

export default {
    name: 'App',
    data() {
        return {
            wallpaper: {
                isNew: true
            },
            visible: true
        };
    },
    components: {
        application
    },

    created() {
        this.bindEvents();
    },

    methods: {
        bindEvents() {
            
        }
    }
}
</script>

<style lang="scss">
@import '../../scss/main.scss';
@import '../../scss/themes/popup/classical.scss';

body {
    margin: 0;
    padding: 0;

    -webkit-user-select: none;
    max-height: 450px;
}

img {
    vertical-align: top;
}
a {
    text-decoration: none;
}

* {
    box-sizing: border-box;
}

.content-page {
    .main {
        margin: 10px;
        box-shadow: 0 2px 10px 0 rgba(0,0,0,0.12), 0 0 10px 0 rgba(0,0,0,.04);
    }

    ::-webkit-scrollbar-track-piece {
        background-color: transparent;
    }
    
    ::-webkit-scrollbar-thumb {
        background-color: #666;

        &:hover {
            background-color: #000;
        }
    }
}

.content-page .cmdbox-drop {
    border-bottom: 0;
}

</style>

