import crypto from 'node:crypto';

const [,,widget,partner,campaign,origin,expiresAt]=process.argv;
const secret=process.env.WIDGET_SIGNING_SECRET;
if(!secret||!widget||!partner||!campaign||!origin||!expiresAt){console.error('Usage: WIDGET_SIGNING_SECRET=... node scripts/issue_widget_distribution.mjs <widget> <partner> <campaign> <https-origin> <ISO-expiry>');process.exit(2);}
if(!['wealth-rank','health-wealth-runway'].includes(widget)||!/^https:\/\//.test(origin)||!Number.isFinite(Date.parse(expiresAt))){console.error('Invalid widget, origin, or expiry.');process.exit(2);}
const distributionId=`wd_${crypto.randomUUID()}`;
const claims={distributionId,partner,campaign,widget,expiresAt:Date.parse(expiresAt)};
const payload=Buffer.from(JSON.stringify(claims)).toString('base64url');
const signature=crypto.createHmac('sha256',secret).update(payload).digest('base64url');
const token=`${payload}.${signature}`;
const site=widget==='wealth-rank'?'wealthmeter':'lifemeter';
const script=widget==='wealth-rank'?'https://wealthmeter.xyz/embed/wealth-rank.js':'https://lifemeter.xyz/embed/health-wealth-runway.js';
const now=new Date().toISOString();
const quote=value=>`'${String(value).replace(/'/g,"''")}'`;
const values=[distributionId,site,widget,partner,campaign,JSON.stringify([origin]),'active',now,new Date(expiresAt).toISOString(),now,now].map(quote).join(', ');
console.log(JSON.stringify({distributionId,token,sql:`INSERT INTO widget_distributions (distribution_id, site, widget, partner, campaign, allowed_origins, status, starts_at, expires_at, created_at, updated_at) VALUES (${values});`,embed:`<script async src="${script}" data-token="${token}"></script>`},null,2));
