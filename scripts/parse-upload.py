"""Deterministic DOCX importer for the supplied Frank format. No network or AI calls.

Reads the explicit sample audit manifest; never edits source documents. Tables, run
superscripts and embedded images are preserved. Refuses incomplete question/key maps.
"""
from pathlib import Path
from zipfile import ZipFile
import xml.etree.ElementTree as E
import hashlib, html, json, re, sys, unicodedata, posixpath

NS={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
    'a':'http://schemas.openxmlformats.org/drawingml/2006/main',
    'r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
    'v':'urn:schemas-microsoft-com:vml'}
W='{'+NS['w']+'}'
def sha(b): return hashlib.sha256(b).hexdigest()
def normalize(s): return unicodedata.normalize('NFC',s)
# Private upload parser. Input paths are supplied by the server, never by document contents.
config=json.loads(Path(sys.argv[2]).read_text())
out=Path(sys.argv[3]);out.mkdir(parents=True,exist_ok=True)
storage=out/'media';storage.mkdir(parents=True,exist_ok=True)
manifest={'sources':[{'path':sys.argv[1]}]}
topics={'micro':{1:'Khan hiếm và chi phí cơ hội',2:'Lợi thế so sánh và thương mại',3:'Cung, cầu và cân bằng',4:'Độ co giãn',5:'Cầu, lợi ích và thặng dư'},
        'macro':{1:'Khan hiếm và chi phí cơ hội',2:'Lợi thế so sánh và thương mại',3:'Cung, cầu và cân bằng',4:'Các vấn đề kinh tế vĩ mô',5:'GDP và đo lường sản lượng'}}
sources=[];questions=[];media={};issues=[]
for info in manifest['sources']:
 p=Path(info['path']); filehash=sha(p.read_bytes()); sid='src-'+filehash[:20]
 subject=config['subject']
 chapter=config['chapter']
 with ZipFile(p) as z:
  entries=z.infolist()
  if len(entries)>2000 or sum(i.file_size for i in entries)>80*1024*1024: raise ValueError('DOCX exceeds unpacked limit')
  if any(i.flag_bits & 1 or i.filename.startswith('/') or '..' in i.filename.split('/') for i in entries): raise ValueError('Unsafe ZIP entry')
  if any(i.file_size>30*1024*1024 for i in entries): raise ValueError('DOCX part too large')
  document=z.read('word/document.xml')
  if b'<!DOCTYPE' in document.upper() or b'<!ENTITY' in document.upper(): raise ValueError('Unsupported XML entities')
  if b'<m:oMath' in document: raise ValueError('OMML requires a dedicated parser; source kept for review')
  root=E.fromstring(document); body=root.find(W+'body')
  if any(n.tag.endswith('}oMath') or n.tag.endswith('}oMathPara') for n in root.iter()): raise ValueError('OMML unsupported')
  rels={}
  for r in E.fromstring(z.read('word/_rels/document.xml.rels')):
   if r.get('TargetMode')!='External': rels[r.get('Id')]=posixpath.normpath('word/'+r.get('Target',''))
  def render(node):
   tag=node.tag.split('}')[-1]
   if tag=='r':
    txt=''; raw='';ids=[]
    for child in node:
     t=child.tag.split('}')[-1]
     if t=='t': txt+=html.escape(normalize(child.text or '')); raw+=normalize(child.text or '')
     elif t in ('tab','br','cr'):txt+=' ';raw+=' '
     elif t in ('drawing','pict','object'):
      before=len(ids); referenced=False
      for n in child.iter():
       rid=n.get('{'+NS['r']+'}embed') or n.get('{'+NS['r']+'}id')
       if rid: referenced=True
       target=rels.get(rid,'')
       if target.startswith('word/media/') and target in z.namelist():
        b=z.read(target);mid=sha(b); ext=Path(target).suffix.lower();mime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'}.get(ext)
        if not mime: raise ValueError('Unsupported embedded image: '+target)
        name=mid+ext;(storage/name).write_bytes(b)
        media[mid]={'id':mid,'relativePath':name,'mime':mime}
        txt+='<img src="/api/media/'+mid+'" alt="Hình trong câu hỏi" loading="lazy" />';ids.append(mid)
      if referenced and len(ids)==before:raise ValueError('Missing or unsupported embedded object')
    pr=node.find(W+'rPr')
    if pr is not None:
     vert=pr.find(W+'vertAlign')
     if vert is not None:
      val=vert.get(W+'val');mark='sup' if val=='superscript' else 'sub'
      txt='<'+mark+'>'+txt+'</'+mark+'>'
      if val=='superscript':raw=raw.translate(str.maketrans('0123456789+-','⁰¹²³⁴⁵⁶⁷⁸⁹⁺⁻'))
     if pr.find(W+'b') is not None and pr.find(W+'b').get(W+'val') not in ('false','0'):txt='<strong>'+txt+'</strong>'
     if pr.find(W+'i') is not None and pr.find(W+'i').get(W+'val') not in ('false','0'):txt='<em>'+txt+'</em>'
    return txt,raw,ids
   if tag in ('pPr','tblPr','trPr','tcPr','sectPr'):return '','',[]
   parts=[render(c) for c in node];txt=''.join(x[0] for x in parts);raw=''.join(x[1] for x in parts);ids=sum((x[2] for x in parts),[])
   wrap={'p':('p',''),'tbl':('table',''),'tr':('tr',''),'tc':('td','')}.get(tag)
   if wrap:txt='<'+wrap[0]+'>'+txt+'</'+wrap[0]+'>';raw+='\n'
   return txt,raw,ids
  blocks=[render(c) for c in body if c.tag in (W+'p',W+'tbl')]
  keyidx=next(i for i,b in enumerate(blocks) if 'Answer Key' in b[1])
  keys={};explanations={};current=None
  for h,t,ids in blocks[keyidx+1:]:
   m=re.fullmatch(r'\s*(\d+)\)\s*([A-E])\s*',t)
   if m:
    current=int(m[1]);
    if current in keys:raise ValueError('Duplicate answer key')
    keys[current]=m[2];explanations[current]=[]
   elif current:explanations[current].append((h,t,ids))
  groups=[];cur=None;expected=1
  for h,t,ids in blocks[:keyidx]:
   if expected==1 and '1)' in t:
    t='1)'+t.split('1)',1)[1];h=re.sub(r'^.*?1\)', '<p>1)',h,flags=re.S)
   m=re.match(r'^\s*(\d+)\)',t)
   if m and int(m[1])==expected:
    if cur:groups.append(cur)
    cur={'number':expected,'stem':[],'optionBlocks':[]};expected+=1
    t=re.sub(r'^\s*\d+\)\s*','',t);h=re.sub(r'(<p>(?:<[^>]+>)*)\s*\d+\)\s*',r'\1',h,count=1)
    cur['stem'].append((h,t,ids))
   elif cur:
    if re.match(r'^\s*[A-E]\)',t):cur['optionBlocks'].append((h,t,ids))
    elif t.strip() or ids:cur['stem'].append((h,t,ids))
  if cur:groups.append(cur)
  if sorted(keys)!=list(range(1,len(groups)+1)):raise ValueError(f'{p.name}: question/key mismatch {len(groups)}/{len(keys)}')
  for g in groups:
   n=g['number'];opts=[]
   for h,t,ids in g['optionBlocks']:
    split=re.split(r'(?<![A-Za-z(])([A-E])\)\s{2,}',t.strip())
    htmlsplit=re.split(r'(?<![A-Za-z(])([A-E])\)\s{2,}',h)
    if ids:raise ValueError('Image inside option requires dedicated importer')
    if len(htmlsplit)!=len(split):raise ValueError(f'{p.name} q{n}: formatted choice boundary mismatch')
    for j in range(1,len(split),2):opts.append({'id':split[j],'text':split[j+1].strip(),'html':re.sub(r'</?p>', '',htmlsplit[j+1]).strip()})
   if len(opts)!=4 or [o['id'] for o in opts]!=list('ABCD'):raise ValueError(f'{p.name} q{n}: malformed choices')
   if any(not o['text'] for o in opts):raise ValueError('Empty choice')
   stem='\n'.join(b[1].strip() for b in g['stem']).strip(); ex=explanations[n]
   qid=f'{sid}-q{n}'; mids=sorted(set(sum((b[2] for b in g['stem']),[])))
   fingerprint=stem+'|'+json.dumps(sorted(o['text'] for o in opts),ensure_ascii=False)+'|'+','.join(mids)
   family=sha(re.sub(r'\s+',' ',fingerprint).encode())
   questions.append({'id':qid,'number':n,'html':''.join(b[0] for b in g['stem']), 'text':stem,'options':opts,'answer':keys[n],
     'explanation':'\n'.join(b[1].strip() for b in ex).strip(),'explanationHtml':''.join(b[0] for b in ex),
     'solutionMediaIds':sorted(set(sum((b[2] for b in ex),[]))), 'sourceId':sid,'sourceTitle':config['title'],
     'topic':config['topic'],'chapter':chapter,'familyKey':family,'mediaIds':mids,'difficulty':'unrated'})
   if chapter==3 and n==195 and (('90' in questions[-1]['explanation'] and '110' in stem and '30' in stem) or ('55' in questions[-1]['explanation'] and '75' in stem)):
    issues.append({'id':qid+'-explanation','sourceId':sid,'questionId':qid,'kind':'source_explanation_arithmetic','detail':'Lời giải nguồn có bước biến đổi số học không nhất quán; đáp án cuối khớp phương trình. Giữ nguyên nguồn, chờ admin xử lý.'})
  sources.append({'id':sid,'title':config['title'], 'subject':subject,'language':config['language'],'chapter':chapter,'topic':config['topic'],
    'fileHash':filehash,'questionCount':len(groups),'metadata':{'filename':config['filename'],'format':'frank-docx','version':1,'chapterMapping':'source-based, pending academic review'}})
payload={'sources':sources,'questions':questions,'media':list(media.values()),'issues':issues}
(out/'frank.json').write_text(json.dumps(payload,ensure_ascii=False))
print(json.dumps({'sources':len(sources),'questions':len(questions),'media':len(media),'issues':len(issues),'output':str(out/'frank.json')}))
