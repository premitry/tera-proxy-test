const fs = require('fs');

async function fetchSharelist(surl) {
  const headers = {
    'Cookie': `ndus=${process.env.NDUS}`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.1024tera.com/',
    'Accept': 'application/json, text/plain, */*',
  };
  
  // 1. Get share page → jsToken
  const pageResp = await fetch(`https://www.1024tera.com/wap/share/filelist?surl=${surl}`, { headers, redirect: 'follow' });
  const html = await pageResp.text();
  const tokenMatch = html.match(/fn%28%22([^%]+)%22%29/) || html.match(/fn\("([^"]+)"\)/);
  const token = tokenMatch ? tokenMatch[1] : '';
  
  // 2. Get share/list
  const apiUrl = `https://1024tera.com/share/list?app_id=250528&web=1&channel=dubox&clienttype=0&jsToken=${encodeURIComponent(token)}&page=1&num=5&by=name&order=asc&shorturl=${surl}&root=1`;
  const listResp = await fetch(apiUrl, { headers });
  const listData = await listResp.json();
  
  // 3. Get shorturlinfo (test dlink extraction)
  let shortInfo = null;
  if (listData.list && listData.list[0]) {
    const fsid = listData.list[0].fs_id;
    const siUrl = `https://1024tera.com/api/shorturlinfo?app_id=250528&client_type=2&surl=${surl}&fsid=${fsid}&jsToken=${encodeURIComponent(token)}`;
    const siResp = await fetch(siUrl, { headers });
    shortInfo = await siResp.json();
  }
  
  return {
    jsToken_len: token.length,
    list_errno: listData.errno,
    list_count: listData.list ? listData.list.length : 0,
    first_dlink_len: listData.list && listData.list[0] ? (listData.list[0].dlink || '').length : 0,
    shorturlinfo_errno: shortInfo ? shortInfo.errno : null,
    shorturlinfo_dlink_len: shortInfo && shortInfo.list && shortInfo.list[0] ? (shortInfo.list[0].dlink || '').length : 0,
  };
}

(async () => {
  try {
    const result = await fetchSharelist('wi2mzCJt6wQ70kkRrjHZ3A');
    fs.writeFileSync('result.json', JSON.stringify(result, null, 2));
    console.log(JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
})();
