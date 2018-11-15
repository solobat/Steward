
module.exports = function(steward) {
    const version = 1;
    const id = 'solobat';
    const name = 'IP Search';
    const key = 'ip';
    const type = 'keyword';
    const icon = 'http://static.oksteward.com/ip.png';
    const title = '查询 ip';
    const subtitle = '输入 ipv4 地址，查询 ip 所在地点及运营商';
    const commands = [{
        key,
        type,
        title,
        subtitle,
        icon
    }];

    const APP_KEY = 'xxx';
    const ipRegexp = /\b((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(\.|$)){4}\b/;

    function searchIp(ip) {
      const url = `http://apis.juhe.cn/ip/ip2addr?ip=${ip}&key=${APP_KEY}`;

        return steward.axios.get(url);
    }

    function dataFormat(data) {
        return [{
             key,
        icon,
        title: `${data.area} -- ${data.location}`,
        desc: '按 Enter 复制到剪贴板'
      }];
    }

    function onInput(query, command) {
          const str = query.trim();

          if (str && ipRegexp.test(str)) {
            return searchIp(str).then(results => {
              const resp = results.data;

                if (resp.resultcode == 200) {
                  return dataFormat(resp.result); 
              } else {
                return [];
              }
            }).catch(results => {
                return steward.util.getDefaultResult(command);
            });
        } else {
               return steward.util.getDefaultResult(command); 
        }
    }

    function onEnter(item, command, query, { shiftKey }, list) {
        steward.util.copyToClipboard(item.title, true);
    }

    return {
        id,
        version,
        name,
        category: 'other',
        icon,
        title,
        commands,
        onInput,
        onEnter
    };
}