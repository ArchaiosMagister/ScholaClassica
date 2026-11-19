LOTS={
1:[32,33],
2:[50,56,70,71,72,78,83],
3:[97,98,117,130,131,132,136,137,138,140],
4:[146,192,194,196,206,209,214,216,217,221,238,239,243,244,246,249,251,252,253,255],
5:[266,267,270,273,278,283,284,285,289,290,291,301,305,307,308,313,315,316,322,341],
6:[420,433,449,452,455,458,489,503,508,509,514,517,548],
7:[570,581,575,576,577,582,583,585,608],
8:[747,810,796,802,823,825,830,855,862,864],
9:[865,920],
10:[1038,1039,1040,1041,1044,1048,1050]
}
assert len([r for rows in LOTS.values() for r in rows])==100
if __name__=='__main__':
 import json,unicodedata,collections
 source={w['row']:w for w in json.load(open('/mnt/data/evolution_source_analysis.json'))}
 existing=json.load(open('/mnt/data/evolucion-fonetica/data/pilot.json'))['words']
 norm=lambda t: ''.join(x for x in unicodedata.normalize('NFD',t.lower()) if unicodedata.category(x)!='Mn')
 forms={norm(w['latin']) for w in existing}
 for lot,rows in LOTS.items():
  print('\n',lot,len(rows))
  for r in rows:
   w=source[r];print(f'{r}: {w["latin"]} > {w["spanish"]} / {w["rules"]} [{w["lot"]["class"]}]', '**DUPLICATE**' if norm(w['latin']) in forms else '')
   assert w['lot']['batch']==lot
   assert w['lot']['class']=='PATRIMONIAL'
   assert norm(w['latin']) not in forms
