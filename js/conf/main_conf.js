/**
 * @file seajs config
 * @author tomasy
 * @email solopea@gmail.com
 */

seajs.config({
    // 设置路径，方便跨目录调用
    alias: {
        'jquery': 'jquery'

    }

});

seajs.use('/js/main/main');
