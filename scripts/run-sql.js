const fs = require('fs');
const https = require('https');

const sqlFile = process.argv[2];
if (!sqlFile) { console.error('Usage: node run-sql.js <file.sql>'); process.exit(1); }

const sql = fs.readFileSync(sqlFile, 'utf8');
const data = JSON.stringify({ query: sql });

const req = https.request({
  hostname: 'api.supabase.com',
  path: `/v1/projects/${process.env.SUPABASE_PROJECT_REF || '<YOUR_PROJECT_REF>'}/database/query`,
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${process.env.SUPABASE_PAT || '<YOUR_SUPABASE_PAT>'}`,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
}, (res) => {
  let body = '';
  res.on('data', (d) => body += d);
  res.on('end', () => {
    console.log(body);
    process.exit(res.statusCode >= 200 && res.statusCode < 300 ? 0 : 1);
  });
});
req.on('error', (e) => { console.error(e); process.exit(1); });
req.write(data);
req.end();
