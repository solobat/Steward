<template>
    <div class="clock">
        <div class="time">{{ time }}</div>
        <div class="date">{{ date }}</div>
    </div>    
</template>
<script>
import dayjs from 'dayjs'

export default {
    name: 'clock',
    data() {
        return {
            time: dayjs().format('HH:mm'),
            date: dayjs().format('YYYY-MM-DD')
        };
    },

    created() {
        setInterval(() => {
            this.count();
        }, 1000);
    },

    methods: {
        count() {
            this.time = dayjs().format('HH:mm');
            this.date = dayjs().format('YYYY-MM-DD');
        }
    }
} 
</script>
<style lang="scss">
    .clock {
        position: relative;

        &:hover {
            .date {
                opacity: 1;
            }
        }

        .time {
            font-size: 80px;
            color: #fff;
            font-weight: 100;
        }

        .date {
            position: absolute;
            bottom: -10px;
            right: 0.4em;
            text-align: right;
            font-size: 20px;
            color: #fff;
            font-weight: 100;
            opacity: 0;
            transition: all .2s;
        }
    }
</style>

