#!/usr/bin/env python3
import csv
import io
import re
import unicodedata
import zlib
from datetime import date
from pathlib import Path

import requests

WEALTHMETER_ROOT = Path(__file__).resolve().parents[1]
DATA_LAB_PATH = WEALTHMETER_ROOT / 'data-lab.html'

# Keep this list aligned with Wealth Explorer/Atlas core coverage.
TARGET_ISO3 = [
    'ARE', 'ARG', 'AUS', 'AUT', 'BEL', 'BGD', 'BRA', 'CAN', 'CHE', 'CHL',
    'CHN', 'COL', 'CZE', 'DEU', 'DNK', 'EGY', 'ESP', 'FIN', 'FRA', 'GBR',
    'GRC', 'IDN', 'IND', 'IRL', 'ISR', 'ITA', 'JPN', 'KEN', 'KOR', 'MAR',
    'MEX', 'MYS', 'NGA', 'NLD', 'NOR', 'PAK', 'PER', 'PHL', 'POL', 'PRT',
    'RUS', 'SAU', 'SGP', 'SWE', 'THA', 'TUR', 'UKR', 'USA', 'VNM', 'ZAF'
]
TARGET_ISO3_SET = set(TARGET_ISO3)

WB_INDICATORS = {
    'NY.GDP.PCAP.PP.CD': {
        'dim': 'GDP',
        'label': 'GDP per capita, PPP (current international $)',
        'ref_prefix': 'WB-GDPPCP',
        'source': 'World Bank Open Data (NY.GDP.PCAP.PP.CD)',
        'formatter': lambda v: f"${v:,.0f}",
    },
    'NE.CON.PRVT.PC.KD': {
        'dim': 'Spending',
        'label': 'household final consumption per capita (constant 2015 US$)',
        'ref_prefix': 'WB-CONS',
        'source': 'World Bank Open Data (NE.CON.PRVT.PC.KD)',
        'formatter': lambda v: f"${v:,.0f}",
    },
    'SP.POP.TOTL': {
        'dim': 'Demographics',
        'label': 'total population',
        'ref_prefix': 'WB-POPT',
        'source': 'World Bank Open Data (SP.POP.TOTL)',
        'formatter': lambda v: f"{int(round(v)):,}",
    },
    'SP.DYN.LE00.IN': {
        'dim': 'Longevity',
        'label': 'life expectancy at birth',
        'ref_prefix': 'WB-LIFE',
        'source': 'World Bank Open Data (SP.DYN.LE00.IN)',
        'formatter': lambda v: f"{v:.1f} years",
    },
}

WID_VARIABLES = [
    {
        'query': 'sptinc_p99p100',
        'series': 'sptinc_p99p100_992_j',
        'dim': 'Inequality',
        'label': 'top 1% share of pre-tax national income',
        'ref_prefix': 'WID-TOP1INC',
        'source': 'World Inequality Database (sptinc_p99p100_992_j)',
    },
    {
        'query': 'sptinc_p90p100',
        'series': 'sptinc_p90p100_992_j',
        'dim': 'Inequality',
        'label': 'top 10% share of pre-tax national income',
        'ref_prefix': 'WID-TOP10INC',
        'source': 'World Inequality Database (sptinc_p90p100_992_j)',
    },
    {
        'query': 'sptinc_p0p50',
        'series': 'sptinc_p0p50_992_j',
        'dim': 'Inequality',
        'label': 'bottom 50% share of pre-tax national income',
        'ref_prefix': 'WID-BOT50INC',
        'source': 'World Inequality Database (sptinc_p0p50_992_j)',
    },
    {
        'query': 'shweal_p99p100',
        'series': 'shweal_p99p100_992_j',
        'dim': 'Wealth',
        'label': 'top 1% share of personal wealth',
        'ref_prefix': 'WID-TOP1WEALTH',
        'source': 'World Inequality Database (shweal_p99p100_992_j)',
    },
    {
        'query': 'shweal_p90p100',
        'series': 'shweal_p90p100_992_j',
        'dim': 'Wealth',
        'label': 'top 10% share of personal wealth',
        'ref_prefix': 'WID-TOP10WEALTH',
        'source': 'World Inequality Database (shweal_p90p100_992_j)',
    },
]

WID_API_KEY = 'rYFByOB0ioaPATwHtllMI71zLOZSK0Ic5veQonJP'
WID_HEADERS = {'x-api-key': WID_API_KEY}


def clean_country_name(name: str) -> str:
    if not name:
        return name
    replacements = {
        'Egypt, Arab Rep.': 'Egypt',
        'Korea, Rep.': 'South Korea',
        'Russian Federation': 'Russia',
        'Turkiye': 'Turkey',
    }
    name = replacements.get(name, name)
    name = name.replace('’', "'").replace('‘', "'")
    name = unicodedata.normalize('NFKD', name).encode('ascii', 'ignore').decode('ascii')
    return name


def normalize_key(name: str) -> str:
    return re.sub(r'[^a-z0-9]', '', (name or '').lower())


def escape_js_str(s: str) -> str:
    return s.replace('\\', '\\\\').replace("'", "\\'")


def make_ref_slug(country_name: str) -> str:
    token = re.sub(r'[^A-Z0-9]', '', country_name.upper())
    stem = token[:8] or 'COUNTRY'
    checksum = zlib.adler32(country_name.encode('utf-8')) % 10000
    return f'{stem}{checksum:04d}'


def fetch_json(url: str, *, headers=None, timeout=45):
    r = requests.get(url, headers=headers, timeout=timeout)
    r.raise_for_status()
    if not r.text:
        return None
    return r.json()


def dedupe_year_points(points):
    by_year = {}
    for year_i, value in points:
        by_year[year_i] = value
    return sorted(by_year.items(), key=lambda x: x[0])


def pct_change(start, end):
    if start is None or end is None or start == 0:
        return None
    return ((end - start) / start) * 100.0


def latest_point(points):
    return points[-1] if points else None


def earliest_point(points):
    return points[0] if points else None


def value_for_year(points, year_i):
    for y, v in points:
        if y == year_i:
            return v
    return None


def get_wb_country_meta():
    url = 'https://api.worldbank.org/v2/country?format=json&per_page=400'
    payload = fetch_json(url)
    countries = {}
    iso2_to_iso3 = {}
    for row in payload[1]:
        iso3 = row.get('id')
        if row.get('region', {}).get('id') == 'NA':
            continue
        if not iso3 or len(iso3) != 3:
            continue
        countries[iso3] = clean_country_name(row.get('name') or iso3)
        iso2 = row.get('iso2Code')
        if iso2 and len(iso2) == 2:
            iso2_to_iso3[iso2] = iso3
    return countries, iso2_to_iso3


def get_world_bank_series(indicator, min_year=2020):
    code_str = ';'.join(TARGET_ISO3)
    url = f'https://api.worldbank.org/v2/country/{code_str}/indicator/{indicator}?format=json&per_page=20000'
    payload = fetch_json(url)
    by_country = {}
    if not payload or len(payload) < 2:
        return by_country

    for row in payload[1]:
        value = row.get('value')
        iso3 = row.get('countryiso3code')
        year = row.get('date')
        if value is None or not iso3 or iso3 not in TARGET_ISO3_SET:
            continue
        if not year or not year.isdigit():
            continue

        year_i = int(year)
        if year_i < min_year:
            continue
        by_country.setdefault(iso3, []).append((year_i, float(value)))

    for iso3 in list(by_country.keys()):
        by_country[iso3] = dedupe_year_points(by_country[iso3])

    return by_country


def get_world_bank_entries_from_series(wb_countries, wb_series_by_indicator):
    entries = []
    for indicator, meta in WB_INDICATORS.items():
        by_country = wb_series_by_indicator.get(indicator, {})
        for iso3 in TARGET_ISO3:
            country_name = wb_countries.get(iso3, iso3)
            points = by_country.get(iso3, [])[-3:]
            for year_i, value in points:
                entries.append({
                    'dim': meta['dim'],
                    'text': (
                        f"In <span class='fact-val'>{country_name}</span>, {meta['label']} was "
                        f"<span class='fact-val'>{meta['formatter'](value)}</span> in {year_i}."
                    ),
                    'ref': f"{meta['ref_prefix']}-{iso3}-{year_i}",
                    'source': meta['source'],
                })
    return entries


def get_wid_country_map():
    front = fetch_json('https://wid.world/www-site/generated-files/api/cache/front.json?v=07122017')
    country_map = {}
    for row in front.get('countries', []):
        a2 = row.get('a2')
        short_name = row.get('s')
        if not a2 or not short_name:
            continue
        country_map[a2] = short_name
    return country_map


def pick_latest_value(values, min_year=2018):
    valid = [
        v for v in values
        if isinstance(v.get('y'), int)
        and isinstance(v.get('v'), (int, float))
        and v['y'] >= min_year
    ]
    if not valid:
        return None
    return max(valid, key=lambda item: item['y'])


def get_wid_latest(iso2_to_iso3):
    country_names = get_wid_country_map()
    latest_by_query = {}

    for var in WID_VARIABLES:
        url = (
            'https://d3t2nddjdn2vht.cloudfront.net/prod/cousins-variables'
            f"?countries=all&variables={var['query']}&currency=eu&exchange=p&base=k&base_year=2015&conversion=none&decomposition=false"
        )
        payload = fetch_json(url, headers=WID_HEADERS)
        records = payload.get(var['series'], [])

        by_iso3 = {}
        for item in records:
            if not isinstance(item, dict):
                continue
            cc = next(iter(item.keys()), None)
            if not cc:
                continue

            iso3 = iso2_to_iso3.get(cc)
            if iso3 not in TARGET_ISO3_SET:
                continue

            block = item.get(cc, {})
            latest = pick_latest_value(block.get('values', []), min_year=2018)
            if not latest:
                continue

            value = latest['v']
            if value is None or value < 0 or value > 1:
                continue

            by_iso3[iso3] = {
                'country': clean_country_name(country_names.get(cc, cc)),
                'year': latest['y'],
                'value': float(value),
            }

        latest_by_query[var['query']] = by_iso3

    return latest_by_query


def get_wid_entries_from_latest(wid_latest):
    entries = []
    by_query = {v['query']: v for v in WID_VARIABLES}

    for query, rows in wid_latest.items():
        meta = by_query[query]
        for iso3 in TARGET_ISO3:
            rec = rows.get(iso3)
            if not rec:
                continue
            pct = rec['value'] * 100
            entries.append({
                'dim': meta['dim'],
                'text': (
                    f"In <span class='fact-val'>{rec['country']}</span>, WID estimates the {meta['label']} "
                    f"at <span class='fact-val'>{pct:.1f}%</span> in {rec['year']}."
                ),
                'ref': f"{meta['ref_prefix']}-{iso3}-{rec['year']}",
                'source': meta['source'],
            })

    return entries


def get_census_metrics(wb_countries):
    # Pull all ages for both sexes in a single year, then aggregate transparently.
    url = 'https://api.census.gov/data/timeseries/idb/1year?get=NAME,POP,AGE,YR&YR=2024&SEX=0'
    rows = fetch_json(url)
    if not rows or len(rows) <= 1:
        return {}

    header = rows[0]
    idx_name = header.index('NAME')
    idx_pop = header.index('POP')
    idx_age = header.index('AGE')
    idx_year = header.index('YR')

    stats = {}
    for row in rows[1:]:
        try:
            name = clean_country_name(row[idx_name])
            pop = float(row[idx_pop])
            age = int(row[idx_age])
            year_i = int(row[idx_year])
        except Exception:
            continue

        bucket = stats.setdefault(name, {'total': 0.0, 'age65': 0.0, 'year': year_i})
        bucket['total'] += pop
        if age >= 65:
            bucket['age65'] += pop

    preferred_names = set(wb_countries.values())
    preferred = []
    fallback = []
    for name, metric in stats.items():
        if metric['total'] <= 0:
            continue
        record = (name, metric)
        if name in preferred_names:
            preferred.append(record)
        else:
            fallback.append(record)

    preferred.sort(key=lambda x: x[0])
    fallback.sort(key=lambda x: x[1]['total'], reverse=True)
    selected = preferred + fallback[:70]

    out = {}
    for name, metric in selected:
        total = int(round(metric['total']))
        share = (metric['age65'] / metric['total']) * 100 if metric['total'] > 0 else 0
        out[name] = {
            'total': total,
            'age65_share': share,
            'year': metric['year'],
        }

    return out


def get_census_entries_from_metrics(census_metrics):
    entries = []
    today = date.today().isoformat()
    source = f'U.S. Census Bureau International Data Base (IDB 1-year, accessed {today})'

    for name in sorted(census_metrics.keys()):
        metric = census_metrics[name]
        year_i = metric['year']
        slug = make_ref_slug(name)

        entries.append({
            'dim': 'Demographics',
            'text': (
                f"In <span class='fact-val'>{name}</span>, summing U.S. Census IDB POP across ages 0-100+ "
                f"gives <span class='fact-val'>{metric['total']:,}</span> in {year_i}."
            ),
            'ref': f"USC-IDBPOP-{slug}-{year_i}",
            'source': source,
        })
        entries.append({
            'dim': 'Longevity',
            'text': (
                f"In <span class='fact-val'>{name}</span>, ages 65+ account for "
                f"<span class='fact-val'>{metric['age65_share']:.1f}%</span> of summed IDB POP counts in {year_i}."
            ),
            'ref': f"USC-IDB65SH-{slug}-{year_i}",
            'source': source,
        })

    return entries


def get_oecd_points():
    url = 'https://raw.githubusercontent.com/OECD/EO-Outlook_chart_1/master/data/EO107_INTERNET_2.tsv'
    text = requests.get(url, timeout=45).text
    reader = csv.DictReader(io.StringIO(text), delimiter='\t')
    loc_key = reader.fieldnames[0]

    keep_times = {'2020-Q2', '2021-Q4'}
    points = {}

    for row in reader:
        variable = row.get('VARIABLE', '').strip()
        time_key = row.get('TIME', '').strip()
        iso3 = row.get(loc_key, '').replace('"', '').strip()
        country = clean_country_name(row.get('Country', '').strip())
        value = row.get('Value', '').strip()

        if iso3 not in TARGET_ISO3_SET:
            continue
        if variable not in {'UNR', 'GDPV_ANNPCT'}:
            continue
        if time_key not in keep_times:
            continue
        if not value:
            continue

        try:
            num = float(value)
        except ValueError:
            continue

        bucket = points.setdefault(iso3, {'country': country, 'UNR': {}, 'GDPV_ANNPCT': {}})
        bucket[variable][time_key] = num

    return points


def get_oecd_entries_from_points(oecd_points):
    entries = []
    for iso3 in TARGET_ISO3:
        rec = oecd_points.get(iso3)
        if not rec:
            continue

        country = rec['country']
        for quarter, num in sorted(rec['UNR'].items()):
            entries.append({
                'dim': 'Labor Market',
                'text': (
                    f"In <span class='fact-val'>{country}</span>, OECD Economic Outlook data shows an unemployment "
                    f"rate of <span class='fact-val'>{num:.1f}%</span> in {quarter}."
                ),
                'ref': f"OECD-UNR-{iso3}-{quarter.replace('-', '')}",
                'source': 'OECD Economic Outlook dataset (EO107_INTERNET_2.tsv)',
            })

        for quarter, num in sorted(rec['GDPV_ANNPCT'].items()):
            entries.append({
                'dim': 'Growth',
                'text': (
                    f"In <span class='fact-val'>{country}</span>, OECD Economic Outlook reports annualized real GDP growth "
                    f"of <span class='fact-val'>{num:.1f}%</span> in {quarter}."
                ),
                'ref': f"OECD-GDPG-{iso3}-{quarter.replace('-', '')}",
                'source': 'OECD Economic Outlook dataset (EO107_INTERNET_2.tsv)',
            })

    return entries


def get_derived_insight_entries(wb_countries, wb_series_by_indicator, wid_latest, census_metrics, oecd_points):
    insights = []

    gdp = wb_series_by_indicator.get('NY.GDP.PCAP.PP.CD', {})
    cons = wb_series_by_indicator.get('NE.CON.PRVT.PC.KD', {})
    life = wb_series_by_indicator.get('SP.DYN.LE00.IN', {})

    # 1) World Bank derivatives: trend and structural ratios.
    for iso3 in TARGET_ISO3:
        country = wb_countries.get(iso3, iso3)
        gdp_points = gdp.get(iso3, [])
        cons_points = cons.get(iso3, [])
        life_points = life.get(iso3, [])

        gdp_first = earliest_point(gdp_points)
        gdp_last = latest_point(gdp_points)
        if gdp_first and gdp_last and gdp_first[0] != gdp_last[0]:
            change = pct_change(gdp_first[1], gdp_last[1])
            direction = 'increased' if change is not None and change >= 0 else 'decreased'
            insights.append({
                'dim': 'Insight',
                'text': (
                    f"In <span class='fact-val'>{country}</span>, GDP per capita PPP {direction} by "
                    f"<span class='fact-val'>{abs(change):.1f}%</span> from {gdp_first[0]} to {gdp_last[0]} "
                    f"(from <span class='fact-val'>${gdp_first[1]:,.0f}</span> to <span class='fact-val'>${gdp_last[1]:,.0f}</span>)."
                ),
                'ref': f"INS-WB-GDPTREND-{iso3}-{gdp_last[0]}",
                'source': 'Derived from World Bank Open Data (NY.GDP.PCAP.PP.CD)',
            })

        if gdp_points and cons_points:
            gdp_map = {y: v for y, v in gdp_points}
            cons_map = {y: v for y, v in cons_points}
            common_years = sorted(set(gdp_map.keys()) & set(cons_map.keys()))
            if common_years:
                y = common_years[-1]
                if gdp_map[y] > 0:
                    ratio = (cons_map[y] / gdp_map[y]) * 100
                    insights.append({
                        'dim': 'Insight',
                        'text': (
                            f"In <span class='fact-val'>{country}</span>, household consumption per capita equaled "
                            f"<span class='fact-val'>{ratio:.1f}%</span> of GDP per capita PPP in {y}."
                        ),
                        'ref': f"INS-WB-CONSRATIO-{iso3}-{y}",
                        'source': 'Derived from World Bank Open Data (NE.CON.PRVT.PC.KD + NY.GDP.PCAP.PP.CD)',
                    })

        if life_points and gdp_points:
            life_map = {y: v for y, v in life_points}
            gdp_map = {y: v for y, v in gdp_points}
            common_years = sorted(set(life_map.keys()) & set(gdp_map.keys()))
            if len(common_years) >= 2:
                y0, y1 = common_years[0], common_years[-1]
                life_delta = life_map[y1] - life_map[y0]
                gdp_delta = pct_change(gdp_map[y0], gdp_map[y1])
                insights.append({
                    'dim': 'Insight',
                    'text': (
                        f"In <span class='fact-val'>{country}</span>, life expectancy changed by "
                        f"<span class='fact-val'>{life_delta:+.1f}</span> years while GDP per capita PPP changed "
                        f"<span class='fact-val'>{gdp_delta:+.1f}%</span> between {y0} and {y1}."
                    ),
                    'ref': f"INS-WB-LIFEGDP-{iso3}-{y1}",
                    'source': 'Derived from World Bank Open Data (SP.DYN.LE00.IN + NY.GDP.PCAP.PP.CD)',
                })

    # 2) WID derivatives: concentration structure and wealth-income concentration gap.
    top1_inc = wid_latest.get('sptinc_p99p100', {})
    top10_inc = wid_latest.get('sptinc_p90p100', {})
    bot50_inc = wid_latest.get('sptinc_p0p50', {})
    top1_wealth = wid_latest.get('shweal_p99p100', {})
    top10_wealth = wid_latest.get('shweal_p90p100', {})

    for iso3 in TARGET_ISO3:
        country = wb_countries.get(iso3, iso3)
        i1 = top1_inc.get(iso3)
        i10 = top10_inc.get(iso3)
        b50 = bot50_inc.get(iso3)
        w1 = top1_wealth.get(iso3)
        w10 = top10_wealth.get(iso3)

        if i1 and i10 and i1['year'] == i10['year'] and i10['value'] > 0:
            ratio = (i1['value'] / i10['value']) * 100
            y = i1['year']
            insights.append({
                'dim': 'Insight',
                'text': (
                    f"In <span class='fact-val'>{country}</span>, the top 1% captured "
                    f"<span class='fact-val'>{ratio:.1f}%</span> of all income flowing to the top 10% in {y}."
                ),
                'ref': f"INS-WID-TOP1OF10INC-{iso3}-{y}",
                'source': 'Derived from World Inequality Database (sptinc_p99p100 + sptinc_p90p100)',
            })

        if w1 and w10 and w1['year'] == w10['year'] and w10['value'] > 0:
            ratio = (w1['value'] / w10['value']) * 100
            y = w1['year']
            insights.append({
                'dim': 'Insight',
                'text': (
                    f"In <span class='fact-val'>{country}</span>, the top 1% held "
                    f"<span class='fact-val'>{ratio:.1f}%</span> of all wealth owned by the top 10% in {y}."
                ),
                'ref': f"INS-WID-TOP1OF10WEALTH-{iso3}-{y}",
                'source': 'Derived from World Inequality Database (shweal_p99p100 + shweal_p90p100)',
            })

        if i1 and w1:
            gap_pp = (w1['value'] - i1['value']) * 100
            if i1['year'] == w1['year']:
                y_tag = str(i1['year'])
                year_text = f"in {i1['year']}"
            else:
                y_tag = f"{i1['year']}-{w1['year']}"
                year_text = f"using latest income ({i1['year']}) and wealth ({w1['year']}) estimates"

            insights.append({
                'dim': 'Insight',
                'text': (
                    f"In <span class='fact-val'>{country}</span>, top 1% wealth share was "
                    f"<span class='fact-val'>{gap_pp:+.1f} pp</span> versus top 1% income share ({year_text})."
                ),
                'ref': f"INS-WID-WEALTHVINC-{iso3}-{y_tag}",
                'source': 'Derived from World Inequality Database (shweal_p99p100 + sptinc_p99p100)',
            })

        if i10 and b50 and i10['year'] == b50['year'] and b50['value'] > 0:
            multiple = i10['value'] / b50['value']
            y = i10['year']
            insights.append({
                'dim': 'Insight',
                'text': (
                    f"In <span class='fact-val'>{country}</span>, the top 10% income share was "
                    f"<span class='fact-val'>{multiple:.2f}x</span> the bottom 50% share in {y}."
                ),
                'ref': f"INS-WID-T10VSB50-{iso3}-{y}",
                'source': 'Derived from World Inequality Database (sptinc_p90p100 + sptinc_p0p50)',
            })

    # 3) OECD derivatives: post-shock change between 2020-Q2 and 2021-Q4.
    for iso3 in TARGET_ISO3:
        rec = oecd_points.get(iso3)
        if not rec:
            continue

        country = rec['country']
        unr = rec.get('UNR', {})
        gdpg = rec.get('GDPV_ANNPCT', {})

        if '2020-Q2' in unr and '2021-Q4' in unr:
            delta = unr['2021-Q4'] - unr['2020-Q2']
            direction = 'fell' if delta < 0 else 'rose'
            insights.append({
                'dim': 'Insight',
                'text': (
                    f"In <span class='fact-val'>{country}</span>, OECD unemployment {direction} by "
                    f"<span class='fact-val'>{abs(delta):.1f} percentage points</span> from 2020-Q2 to 2021-Q4."
                ),
                'ref': f"INS-OECD-UNRDELTA-{iso3}-2021Q4",
                'source': 'Derived from OECD Economic Outlook dataset (EO107_INTERNET_2.tsv)',
            })

        if '2020-Q2' in gdpg and '2021-Q4' in gdpg:
            delta = gdpg['2021-Q4'] - gdpg['2020-Q2']
            insights.append({
                'dim': 'Insight',
                'text': (
                    f"In <span class='fact-val'>{country}</span>, annualized real GDP growth swung "
                    f"<span class='fact-val'>{delta:+.1f} pp</span> between 2020-Q2 and 2021-Q4."
                ),
                'ref': f"INS-OECD-GDPSWING-{iso3}-2021Q4",
                'source': 'Derived from OECD Economic Outlook dataset (EO107_INTERNET_2.tsv)',
            })

    # 4) Cross-source structure: aging share (Census) + longevity/economic context (WB).
    wb_name_to_iso3 = {normalize_key(v): k for k, v in wb_countries.items()}
    aliases = {
        'unitedstates': 'USA',
        'vietnam': 'VNM',
        'czechrepublic': 'CZE',
        'southkorea': 'KOR',
        'russia': 'RUS',
        'turkey': 'TUR',
    }

    for census_country, metric in census_metrics.items():
        key = normalize_key(census_country)
        iso3 = wb_name_to_iso3.get(key) or aliases.get(key)
        if iso3 not in TARGET_ISO3_SET:
            continue

        country = wb_countries.get(iso3, census_country)
        life_last = latest_point(life.get(iso3, []))
        gdp_last = latest_point(gdp.get(iso3, []))
        if not life_last or not gdp_last:
            continue

        insights.append({
            'dim': 'Insight',
            'text': (
                f"In <span class='fact-val'>{country}</span>, ages 65+ are "
                f"<span class='fact-val'>{metric['age65_share']:.1f}%</span> of population (Census {metric['year']}), "
                f"while WB reports life expectancy at <span class='fact-val'>{life_last[1]:.1f} years</span> "
                f"({life_last[0]}) and GDP per capita PPP at <span class='fact-val'>${gdp_last[1]:,.0f}</span> ({gdp_last[0]})."
            ),
            'ref': f"INS-CROSS-AGINGGDP-{iso3}-{metric['year']}",
            'source': 'Derived from U.S. Census IDB + World Bank Open Data',
        })

    return insights


def dedupe_entries(entries):
    out = []
    seen = set()
    for e in entries:
        key = (e['ref'], e['text'])
        if key in seen:
            continue
        seen.add(key)
        out.append(e)
    return out


def render_js_array(var_name, entries):
    lines = [f'    const {var_name} = [']
    for e in entries:
        dim = escape_js_str(e['dim'])
        text = escape_js_str(e['text'])
        ref = escape_js_str(e['ref'])
        source = escape_js_str(e['source'])
        lines.append(
            f"        {{ dim: '{dim}', text: '{text}', ref: '{ref}', source: '{source}' }},"
        )
    lines.append('    ];')
    return '\n'.join(lines)


def update_data_lab(raw_entries, insight_entries):
    html = DATA_LAB_PATH.read_text(encoding='utf-8')
    replacement = (
        render_js_array('database', raw_entries)
        + '\n\n'
        + render_js_array('insightDatabase', insight_entries)
    )

    html_new, n = re.subn(
        r"\s*const database = \[.*?\n\s*\];(?:\n\n\s*const insightDatabase = \[.*?\n\s*\];)?(?:\n\n\s*const dataPool = database.concat\(insightDatabase\);)?",
        '\n' + replacement,
        html,
        count=1,
        flags=re.S,
    )
    if n != 1:
        raise RuntimeError('Failed to locate const database block in data-lab.html')

    html_new = html_new.replace(
        'DATABASE: 1000+ VERIFIED GLOBAL WEALTH FACTOIDS // REAL-DATA NODES (WORLD BANK API)',
        'DATABASE: 1000+ VERIFIED GLOBAL WEALTH FACTOIDS // MULTI-SOURCE REAL-DATA NODES (WB + WID + OECD + CENSUS)',
    )
    html_new = html_new.replace(
        'Categories: Healthcare, Longevity, Spending, Mobility, Indicators',
        'Categories: GDP, Spending, Demographics, Longevity, Inequality, Wealth, Labor Market, Growth, Insight',
    )
    html_new = html_new.replace(
        'Categories: GDP, Spending, Demographics, Longevity, Inequality, Wealth, Labor Market, Growth',
        'Categories: GDP, Spending, Demographics, Longevity, Inequality, Wealth, Labor Market, Growth, Insight',
    )

    DATA_LAB_PATH.write_text(html_new, encoding='utf-8')


def main():
    wb_countries, iso2_to_iso3 = get_wb_country_meta()

    wb_series_by_indicator = {
        indicator: get_world_bank_series(indicator, min_year=2020)
        for indicator in WB_INDICATORS
    }

    wid_latest = get_wid_latest(iso2_to_iso3)
    census_metrics = get_census_metrics(wb_countries)
    oecd_points = get_oecd_points()

    raw_entries = []
    raw_entries.extend(get_world_bank_entries_from_series(wb_countries, wb_series_by_indicator))
    raw_entries.extend(get_wid_entries_from_latest(wid_latest))
    raw_entries.extend(get_census_entries_from_metrics(census_metrics))
    raw_entries.extend(get_oecd_entries_from_points(oecd_points))

    insight_entries = get_derived_insight_entries(
        wb_countries,
        wb_series_by_indicator,
        wid_latest,
        census_metrics,
        oecd_points,
    )

    raw_entries = dedupe_entries(raw_entries)
    insight_entries = dedupe_entries(insight_entries)

    # Deterministic ordering for reviewability; UI randomness is handled at runtime.
    raw_entries.sort(key=lambda e: (e['dim'], e['ref']))
    insight_entries.sort(key=lambda e: (e['dim'], e['ref']))

    update_data_lab(raw_entries, insight_entries)

    total_entries = len(raw_entries) + len(insight_entries)
    print(f'Generated {total_entries} entries in {DATA_LAB_PATH}')
    print(f'  base rows:    {len(raw_entries)}')
    print(f'  insight rows: {len(insight_entries)}')

    by_source = {}
    for e in raw_entries + insight_entries:
        by_source[e['source']] = by_source.get(e['source'], 0) + 1

    print('Source counts:')
    for source, count in sorted(by_source.items(), key=lambda x: x[0]):
        print(f'  {count:>4}  {source}')


if __name__ == '__main__':
    main()
