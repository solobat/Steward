
module.exports = function (steward) {
    const version = 1;
    const id = 'solobat';
    const name = 'Epl Competitions';
    const key = 'epl';
    const type = 'keyword';
    const icon = 'http://staticsports.pplive.cn/2018/interim/app/pc_league/static/v_20180905135831/images/yc_logo.png';
    const title = '英超赛事查询';
    const subtitle = '英超最近比赛查询，按 Enter 键打开相应的比赛页面，数据来自 PPTV';
    const commands = [{
        key,
        type,
        title,
        subtitle,
        icon
    }];

    function fetchMatchList(startDate) {
      return steward.axios.get('http://sportlive.suning.com/slsp-web/lms/all/list/matchList.do', {
        params: {
          pageIndex: 1,
          timeSort: 1,
          version: 1,
          competitionId: 5,
          startDate
        }
      });
    }

    const dateRegexp = /\d{8}/;
    const MATCH_STATUS = {
      0: '未开始',
      1: '比赛中',
      2: '已结束'
    };

    function dataFormat(list) {
      const dates = Object.keys(list).sort().slice(0, 3);

      return dates.reduce((arr, date) => {
          return arr.concat(list[date]); 
      }, []).map(item => {
        const matchInfo = item.matchInfo;
           const home = matchInfo.homeTeam;
        const away = matchInfo.guestTeam;

        return {
          key: 'url',
          icon,
          url: `http://sports.pptv.com/sportslive?sectionid=${item.sectionInfo.id}&matchid=${matchInfo.matchId}`,
          universal: true,
            title: `${home.title} ${home.score || 0} : ${away.score || 0} ${away.title}`,
          desc: `${matchInfo.matchDatetime} ${item.cataTitle}${matchInfo.stageName} ${matchInfo.roundName} ${MATCH_STATUS[matchInfo.status]}`
        };
      });
    }

    function onInput(query, command) {
      let startDate;

        if (dateRegexp.test(query)) {
             startDate = query;    
      } else {
        startDate = steward.dayjs().add(-2, 'day').format('YYYYMMDD');
      }

      return fetchMatchList(startDate).then(results => {
        const resp = results.data;

        if (resp.retCode == 0) {
            return dataFormat(resp.data.list); 
        } else {
          return steward.util.getDefaultResult(command);
        }
      }).catch(results => {
        return steward.util.getDefaultResult(command);
      });
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