seajs.config({
  // 设置路径，方便跨目录调用
  alias: {
  'jquery': 'jquery'
  }
});

seajs.use('./js/popup');
