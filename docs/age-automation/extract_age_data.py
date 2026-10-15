"""Rebuild demographics from the official WPP 2024 POP/F07-1 workbook.
Usage: python3 extract_age_data.py /path/to/workbook.xlsx output.json
Requires openpyxl. Download URL is retained in the output; no interpolation.
"""
import hashlib, json, sys
from pathlib import Path
import openpyxl
URL='https://population.un.org/wpp/assets/Excel%20Files/1_Indicator%20(Standard)/EXCEL_FILES/2_Population/WPP2024_POP_F07_1_DEPENDENCY_RATIOS_BOTH_SEXES.xlsx'
CODES='KOR JPN DEU ITA CHN ESP POL THA BRA USA GBR FRA SWE CAN IND IDN MEX VNM NGA SGP'.split()
names={'KOR':'South Korea','USA':'United States','VNM':'Vietnam'}
p=Path(sys.argv[1]); w=openpyxl.load_workbook(p,read_only=True,data_only=True)
out={c:{'iso':c,'rows':[]} for c in CODES}
for sheet,start,end in [('Estimates',2020,2023),('Medium variant',2024,2050)]:
 s=w[sheet];s.reset_dimensions()
 for r in s.iter_rows(min_row=18,values_only=True):
  if len(r)<22 or r[5] not in out or not isinstance(r[10],(int,float)) or not start<=r[10]<=end:continue
  c=out[r[5]];c['name']=names.get(r[5],r[2]);total,child,old=map(float,(r[11],r[16],r[21]))
  assert abs(total-child-old)<0.003
  c['rows'].append({'year':int(r[10]),'status':'estimate' if sheet=='Estimates' else 'projection','totalDependency':total,'oldDependency':old,'workingAgeShare':10000/(100+total)})
for c in out.values():
 c['rows'].sort(key=lambda x:x['year']);assert len(c['rows'])==31
result={'release':'UN WPP 2024','variant':'Medium','source':URL,'retrieved':'2026-10-15','sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'license':'CC BY 3.0 IGO','citation':'United Nations, Department of Economic and Social Affairs, Population Division (2024). World Population Prospects 2024, Online Edition.','transformation':'Working-age share (%) = 10000/(100 + total dependency ratio). Ratio inputs rounded by publisher to 0.001; derived values are approximate.','countries':list(out.values())}
Path(sys.argv[2]).write_text(json.dumps(result,indent=2)+'\n')
print(result['sha256'],len(out),'countries; 620 country-year rows')
