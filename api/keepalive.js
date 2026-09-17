/**
 * /api/keepalive —— 防止 Supabase 免费版因「7 天无活动」被自动暂停
 *
 * 原理：Supabase 判定“活动”看的是【真实到达数据库的请求】，
 *       所以这里不是 ping 域名，而是用 anon key 真查一次表。
 *       （RLS 下匿名查询返回空数组 [] 也算一次真实查询。）
 *
 * 部署：本文件放在 web/api/keepalive.js，Vercel 会自动识别为 Serverless Function；
 *       定时由 web/vercel.json 里的 crons 配置触发（每天一次）。
 *
 * 需要的环境变量（Vercel → Project → Settings → Environment Variables）：
 *   SUPABASE_URL  或 VITE_SUPABASE_URL
 *   SUPABASE_KEY  或 SUPABASE_ANON_KEY 或 VITE_SUPABASE_ANON_KEY
 * 只用 anon public key，绝不要用 service_role！
 */

// 数据库里真实存在的表（见 supabase_setup.sql）。换任何一张表都可以。
const TABLE = 'projects'

function pickEnv(...names) {
  for (const n of names) {
    const v = process.env[n]
    if (v && String(v).trim()) return String(v).trim()
  }
  return ''
}

export default async function handler(req, res) {
  // 保活请求本身绝不能被缓存，否则等于没请求
  res.setHeader('Cache-Control', 'no-store, max-age=0')

  const url = pickEnv('SUPABASE_URL', 'VITE_SUPABASE_URL').replace(/\/+$/, '')
  const key = pickEnv('SUPABASE_KEY', 'SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY')

  if (!url || !key) {
    return res.status(500).json({
      ok: false,
      error: '缺少环境变量：需要 SUPABASE_URL 与 SUPABASE_KEY（或带 VITE_ 前缀的同名变量）',
    })
  }

  const at = new Date().toISOString()
  const started = Date.now()

  try {
    const r = await fetch(`${url}/rest/v1/${TABLE}?select=id&limit=1`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    })
    const body = (await r.text()).slice(0, 200)
    const ok = r.status >= 200 && r.status < 300

    return res.status(ok ? 200 : 502).json({
      ok,
      at,
      ms: Date.now() - started,
      table: TABLE,
      status: r.status,
      hint: ok
        ? '项目处于活动状态，7 天暂停计时器已重置'
        : '能连上但返回非 2xx：多半是 anon key 填错，请核对 Vercel 环境变量',
      sample: body,
    })
  } catch (e) {
    // Node 把底层 DNS 错误包在 e.cause 里，单独取出方便排查
    const cause = (e && e.cause) || {}
    return res.status(502).json({
      ok: false,
      at,
      ms: Date.now() - started,
      error: String((e && e.message) || e),
      code: cause.code || undefined,
      cause: cause.message || undefined,
      hint: '连不上 Supabase（DNS 都解析不了）——项目很可能正处于「已暂停」状态，需先去后台手动恢复',
    })
  }
}
