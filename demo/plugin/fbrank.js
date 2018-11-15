
module.exports = function (steward) {
    const version = 1;
    const id = 'solobat';
    const name = 'Soccer Rank';
    const key = 'rank';
    const type = 'keyword';
    const icon = 'http://img1.gtimg.com/sports/pics/hv1/196/95/2276/148021321.png';
    const title = '足球积分榜查询';
    const subtitle = '积分榜，数据来自腾讯体育';
    const commands = [{
        key,
        type,
        title,
        subtitle,
        icon
    }];

    const MATCH_TYPE = {
        '英超': 8,
        '西甲': 23,
        '意甲': 21
    };

    function fetchRank(type = '英超') {
        const cid = MATCH_TYPE[type] || 8;

        return steward.axios.get('http://matchweb.sports.qq.com/team/rank', {
            params: {
                competitionId: cid,
                from: 'sporthp'
            }
        });
    }

    function dataFormat(list) {
        return list.map((item, index) => {
            return {
                icon,
                title: `${index + 1}. ${item.teamName} -- ${item.score}`,
                desc: `场次: ${item.winMatchCount}/${item.planishMatchCount}/${item.lostMatchCount} 得失球: ${item.goals}/${item.goalsConceded}/${item.goalDifference}`
            };
        });
    }

    function onInput(query, command) {
        return fetchRank(query).then(results => {
            const resp = results.data;

            if (resp.code === 0) {
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
