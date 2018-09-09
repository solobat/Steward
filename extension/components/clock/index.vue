<template>
    <div class="clock">
        {{ now }}
    </div>    
</template>
<script>
import dayjs from 'dayjs'

export default {
    name: 'clock',
    data() {
        return {
            now: dayjs().format('HH:mm')
        };
    },

    created() {
        setInterval(() => {
            this.count();
        }, 1000);
    },

    methods: {
        count() {
            this.now = dayjs().format('HH:mm');
        }
    }
} 
</script>
<style lang="scss">
    .clock {
        font-size: 80px;
        color: #fff;
        font-weight: 100;
    }
</style>

