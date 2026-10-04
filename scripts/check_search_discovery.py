#!/usr/bin/env python3
"""Prevent omission of indexable reader pages from the canonical sitemap."""
from pathlib import Path
import re,sys,xml.etree.ElementTree as ET
from urllib.parse import urlparse
ROOT=Path(__file__).resolve().parent.parent
urls={e.text for e in ET.parse(ROOT/'sitemap.xml').getroot().iter() if e.tag.endswith('loc')}
domains={urlparse(url).netloc for url in urls}
assert len(domains)==1, 'Sitemap contains mixed domains'
DOMAIN=next(iter(domains))
missing=[]
for page in ROOT.rglob('*.html'):
 relative=page.relative_to(ROOT)
 if len(relative.parts)>1 and relative.parts[0] not in ('stories','features','partners'):continue
 if page.name=='wealth-brief.html':continue # Query-based individual brief template.
 body=page.read_text(errors='replace')
 c=re.search(r'<link[^>]*rel=[\"\']canonical[\"\'][^>]*href=[\"\']([^\"\']+)',body,re.I)
 r=re.search(r'<meta[^>]*name=[\"\']robots[\"\'][^>]*content=[\"\']([^\"\']+)',body,re.I)
 if c and urlparse(c[1]).netloc==DOMAIN and (not r or 'noindex' not in r[1].lower()) and c[1] not in urls:missing.append(str(relative)+': '+c[1])
if missing:
 print('Indexable pages missing from sitemap:\n'+'\n'.join(missing));sys.exit(1)
print(f'Search discovery coverage passed: {len(urls)} canonical URLs.')
