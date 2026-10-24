'use strict';
(function installAtlas(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let chapters=[],active=false,initialized=false;
  const T={chapter:1,view:'quests',entry:null,filter:'전체',group:'전체',historyAll:false};
  const chapterOf=n=>chapters.find(c=>c.id===n);
  const activeChapter=()=>chapterOf(T.chapter);
  const charList=()=>typeof DATA!=='undefined'&&DATA?.characters?DATA.characters:[];
  const eventsAll=()=>typeof DATA!=='undefined'&&DATA?.events?DATA.events:[];
  const peopleFor=c=>charList().filter(p=>(p.atlasChapters||[]).includes(c.id));
  const historyFor=c=>eventsAll().filter(e=>e.atlas===c.id);
  const label=c=>'ATLAS '+c.number;
  function chapterEntries(c){
    return [
      {id:'atl'+c.id+'-background',title:'배경',en:'Historical Background',kind:'배경',area:label(c)+' · 역사와 인물',chapters:c.background||[],cast:[],special:true},
      ...(c.events||[]),
      {id:'atl'+c.id+'-conclusion',title:'정리',en:'Narrative Conclusions',kind:'정리',area:label(c)+' · 흐름과 연결',chapters:c.conclusion||[],cast:[],special:true}
    ];
  }
  function setAtlasHash(){
    const p=new URLSearchParams({atlas:String(T.chapter),view:T.view});
    if(T.entry&&T.view==='quests')p.set('id',T.entry);
    history.replaceState({},'', '#'+p.toString());
  }
  function navRender(){
    const n=$('atlasnav'); if(!n)return;
    n.innerHTML=chapters.map(c=>'<button class="act-link '+(active&&c.id===T.chapter?'active':'')+'" data-atlas="'+c.id+'"><span class="roman">'+esc(c.number)+'</span><span style="min-width:0"><span class="actname">'+esc(c.title)+'</span><span class="actsub">'+(c.events?.length||0)+'개의 사건 기록</span></span><span class="tag-new">수록</span></button>').join('');
  }
  function activate(n,view='quests',entry=null,writeHash=true){
    const c=chapterOf(n);if(!c)return;
    active=true;
    T.chapter=n;
    T.view=['quests','people','history'].includes(view)?view:'quests';
    T.entry=entry&&chapterEntries(c).some(x=>x.id===entry)?entry:chapterEntries(c)[0].id;
    T.filter='전체';T.group='전체';T.historyAll=false;
    renderAtlas();
    if(writeHash)setAtlasHash();
    const content=document.querySelector('.content');
    if(content)content.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
    $('sidebar')?.classList.remove('open');
  }
  function renderAtlas(){
    const c=activeChapter();if(!c)return;
    navRender();
    $('actnav')?.querySelectorAll('.act-link').forEach(b=>b.classList.remove('active'));
    $('topCrumb').textContent=label(c)+' · '+c.title;
    $('hero').innerHTML='<div class="eyebrow">RECORD '+esc(c.number)+' / ATLAS ARCHIVE</div>'+
       '<h1 class="serif"><em>'+esc(c.number)+'</em>'+esc(c.title)+'</h1>'+
       '<p class="subtitle">'+esc(c.tagline)+'<br><span style="color:#8fa5ad">'+esc(c.overview)+'</span></p>'+
       '<div class="herobottom"><span class="hero-pill">⌁ '+esc(c.location)+'</span>'+
       '<span class="hero-pill">주요 사건 <b>'+c.events.length+'</b></span>'+
       '<span class="hero-pill">연관 인물 <b>'+peopleFor(c).length+'</b></span>'+
       '<span class="hero-pill">역사 기록 <b>'+historyFor(c).length+'</b></span></div>';
    const tabs=[['quests','주요 사건',c.events.length],['people','주요 인물',peopleFor(c).length],['history','역사 연대표',historyFor(c).length]];
    $('tabs').innerHTML=tabs.map(([id,title,count])=>'<button class="tab '+(T.view===id?'active':'')+'" data-atlas-tab="'+id+'" aria-selected="'+(T.view===id)+'">'+title+'<span class="num">'+count+'</span></button>').join('');
    if(T.view==='quests')renderEntries();else if(T.view==='people')renderPeople();else renderHistory();
  }
  function visibleEntries(){
    const entries=chapterEntries(activeChapter());
    return T.filter==='전체'?entries:entries.filter(e=>e.special||e.kind===T.filter);
  }
  function renderEntries(){
    const c=activeChapter(),items=c.events,shown=visibleEntries();
    if(!shown.some(x=>x.id===T.entry))T.entry=shown[0]?.id||null;
    const filters=['전체',...new Set(items.map(e=>e.kind))];
    $('panel').innerHTML='<div class="sectionhead"><div><h2>아틀라스 사건 연대기</h2>'+
       '<p>배경부터 발견과 대결, 정리까지. 기록을 선택해 이어지는 긴 이야기를 읽어보세요.</p></div>'+
       '<div class="minitag">'+items.length+' EVENTS · 2 ARTICLES</div></div>'+
       '<div class="quest-layout"><div class="quest-index"><div class="index-top"><strong>사건 목록</strong><div class="filter-row">'+
       filters.map(f=>'<button class="chip '+(T.filter===f?'on':'')+'" data-atlas-filter="'+esc(f)+'">'+esc(f)+'</button>').join('')+
       '</div></div><div class="quest-items">'+shown.map(e=>
         '<button class="q-index-btn '+(e.id===T.entry?'active':'')+' '+(e.special?'q-bookend':'')+'" data-atlas-entry="'+esc(e.id)+'" aria-current="'+(e.id===T.entry)+'">'+
         '<span class="q-index-number">'+(e.special?(e.kind==='배경'?'◈':'◆'):String(items.indexOf(e)+1).padStart(2,'0'))+'</span>'+
         '<span><span class="q-index-name">'+esc(e.title)+'</span><span class="q-index-place">'+esc(e.special?e.area:e.kind+' · '+e.area.split('·')[0])+'</span></span></button>'
       ).join('')+'</div></div><div id="questDetail"></div></div>';
    renderEntryDetail(shown.find(e=>e.id===T.entry),shown);
  }
  function sections(list){
    return (list||[]).map(x=>'<section class="story-section"><h3 class="subheading"><span class="marker"></span>'+esc(x.heading)+'</h3>'+
       (x.paragraphs||[]).map(p=>'<p class="story">'+esc(p)+'</p>').join('')+'</section>').join('');
  }
  function renderEntryDetail(entry,shown){
    const node=$('questDetail');if(!node)return;
    if(!entry){node.innerHTML='<div class="empty">선택할 기록이 없습니다.</div>';return;}
    const ix=shown.findIndex(e=>e.id===entry.id),c=activeChapter();
    const subtitle=entry.special?label(c)+' · '+(entry.kind==='배경'?'역사적 배경':'사건의 흐름과 의미'):entry.en;
    const prev=ix>0?shown[ix-1]:null,next=ix<shown.length-1?shown[ix+1]:null;
    node.innerHTML='<article class="quest-detail"><div class="detail-inner"><div class="q-serial"><span>'+
      (entry.special?'CHAPTER':'EVENT')+' '+String(ix+1).padStart(2,'0')+' / '+String(shown.length).padStart(2,'0')+
      '</span><span style="flex:1;border-top:1px solid var(--edge)"></span>'+label(c)+'</div>'+
      '<h2 class="q-detail-title serif">'+esc(entry.title)+'</h2><div class="q-en mono">'+esc(subtitle)+'</div>'+
      '<div class="q-meta"><span class="kind '+esc(entry.kind)+'">'+esc(entry.kind)+(entry.special?' 기록':' 사건')+'</span>'+
      '<span class="area-label">⌁ '+esc(entry.area)+'</span></div>'+sections(entry.chapters)+
      (!entry.special?'<div class="detail-aside"><div class="mini-cap">등장인물 · 누르면 인물 기록으로 이동</div>'+
        '<div class="person-chips">'+(entry.cast||[]).filter(id=>charList().some(c=>c.id===id)).map(id=>
          '<button class="person-chip" data-person="'+esc(id)+'">'+esc(charList().find(c=>c.id===id)?.name)+' ↗</button>'
        ).join('')+'</div>'+
        (entry.note?'<p class="q-item"><b>관련 기록</b> · '+esc(entry.note)+'</p>':'')+'</div>':'')+
      '</div><div class="detail-bottom">'+
      '<button class="navprev" '+(prev?'data-atlas-entry="'+esc(prev.id)+'"':'disabled')+'>← '+esc(prev?.title||'첫 기록')+'</button>'+
      (!entry.special?'<a class="source-link" href="'+esc(entry.source||'#')+'" target="_blank" rel="noopener noreferrer">Wiki ↗</a>':'<span class="reading-indicator">ARCHIVE</span>')+
      '<button class="navnext" '+(next?'data-atlas-entry="'+esc(next.id)+'"':'disabled')+'>'+esc(next?.title||'마지막 기록')+' →</button></div></article>';
    document.querySelectorAll('.q-index-btn').forEach(b=>{const on=b.dataset.atlasEntry===entry.id;b.classList.toggle('active',on);b.setAttribute('aria-current',String(on));});
  }
  function selectEntry(id,scroll=false){
    const shown=visibleEntries(),e=shown.find(x=>x.id===id);if(!e)return;
    T.entry=id;renderEntryDetail(e,shown);setAtlasHash();
    if(scroll){const d=$('questDetail');d?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});}
  }
  function renderPeople(){
    const people=peopleFor(activeChapter());
    const groups=['전체',...new Set(people.map(p=>p.personType.split(' · ')[0]))];
    const matches=T.group==='전체'?people:people.filter(p=>p.personType.startsWith(T.group));
    $('panel').innerHTML='<div class="sectionhead"><div><h2>인물 도감</h2><p>아틀라스에 남은 사람과 존재의 행적을 살펴보세요. 선택하면 기존 기록과 같은 인물 상세창을 엽니다.</p></div>'+
    '<span class="minitag">'+people.length+' FIGURES</span></div><div class="groupfilters">'+
    groups.map(g=>'<button class="chip '+(T.group===g?'on':'')+'" data-atlas-group="'+esc(g)+'">'+esc(g)+'</button>').join('')+
    '</div><div class="cards">'+matches.map(c=>
      '<button class="charcard" data-person="'+esc(c.id)+'"><div class="char-top"><span class="avatar">'+esc(c.name[0])+'</span>'+
      '<span class="smallpill">'+esc(c.personType)+'</span></div><div><h3>'+esc(c.name)+'</h3><div class="english mono">'+esc(c.en)+'</div></div>'+
      '<div class="char-affil">'+esc(c.affiliation)+'</div><p class="summary">'+esc(c.summary)+'</p><span class="readmore">인물 기록 열기 ↗</span></button>'
    ).join('')+'</div>';
  }
  function renderHistory(){
    const events=historyFor(activeChapter());
    const labelAll=T.historyAll?'아틀라스의 기록':'현재 챕터';
    $('panel').innerHTML='<div class="sectionhead"><div><h2>역사 기록</h2><p>연구와 봉인, 전쟁의 순서를 따라 아틀라스 사건을 읽어보세요.</p></div><span class="minitag">'+events.length+' EVENTS</span></div>'+
      '<div class="timeline"><div class="timeline-head"><span class="minitag">'+esc(labelAll)+'</span></div><div class="timeline-list">'+
      events.map(e=>'<article class="event"><small>'+esc(label(activeChapter())+' · '+e.period)+'</small><h3>'+esc(e.title)+'</h3><p>'+esc(e.desc)+'</p>'+
        '<div class="event-foot">'+(e.people||[]).map(id=>{
          const p=charList().find(c=>c.id===id);
          return p?'<button data-person="'+esc(id)+'">◌ '+esc(p.name)+'</button>':'';
        }).join('')+(e.quest?'<button data-atlas-jump="'+esc(e.quest)+'">관련 사건 ↗</button>':'')+'</div></article>'
      ).join('')+'</div></div>';
  }
  function atlasSearch(term){
    if(!chapters.length||!initialized)return;
    const input=String(term||'').trim().toLocaleLowerCase(),results=[];
    for(const c of chapters){
      const matchesText=(...s)=>s.join(' ').toLocaleLowerCase().includes(input);
      for(const e of c.events||[]){
        if(input&&!matchesText(e.title,e.en,e.area,...e.chapters.flatMap(ch=>[ch.heading,...ch.paragraphs])))continue;
        results.push({chapter:c.id,type:'event',id:e.id,title:e.title,sub:label(c)+' · 주요 사건'});
        if(!input&&results.length>=2)break;
      }
      for(const p of peopleFor(c)){
        if(input&&!matchesText(p.name,p.en,p.summary,p.history,...(p.atlasChronicles||[]).flatMap(x=>x.paragraphs||[])))continue;
        results.push({chapter:c.id,type:'person',id:p.id,title:p.name,sub:label(c)+' · 주요 인물'});
        if(!input&&results.length>=4)break;
      }
    }
    const node=$('searchResults');if(!node||!results.length)return;
    if(!node.querySelector('button'))node.innerHTML='';
    node.insertAdjacentHTML('beforeend',results.slice(0,input?18:4).map(x=>
      '<button class="result" data-atlas-search="'+esc(x.type)+'" data-atlas-search-id="'+esc(x.id)+'" data-atlas-search-chapter="'+x.chapter+'">'+
      '<span class="rtype">'+(x.type==='event'?'사건':'인물')+'</span><span><b>'+esc(x.title)+'</b><small>'+esc(x.sub)+'</small></span></button>'
    ).join(''));
  }
  function exportChapter(){
    const data=JSON.stringify(activeChapter(),null,2),url=URL.createObjectURL(new Blob([data],{type:'application/json;charset=utf-8'}));
    const a=document.createElement('a');a.href=url;a.download='atlas-chapter-'+String(T.chapter).padStart(2,'0')+'-export.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),2000);
  }
  document.addEventListener('click',e=>{
    const atlasButton=e.target.closest('[data-atlas]');
    if(atlasButton){
      e.preventDefault();e.stopImmediatePropagation();
      activate(Number(atlasButton.dataset.atlas));
      return;
    }
    const atlasSearchButton=e.target.closest('[data-atlas-search]');
    if(atlasSearchButton){
      e.preventDefault();e.stopImmediatePropagation();
      const type=atlasSearchButton.dataset.atlasSearch,chapter=Number(atlasSearchButton.dataset.atlasSearchChapter),id=atlasSearchButton.dataset.atlasSearchId;
      closeSearch();activate(chapter,'quests',type==='event'?id:null);
      if(type==='person'){T.view='people';renderAtlas();setAtlasHash();openPerson(id);}
      return;
    }
    if(active&&e.target.closest('[data-act]')){active=false;navRender();return;}
    if(!active)return;
    if(e.target.closest('#exportBtn')){e.preventDefault();e.stopImmediatePropagation();exportChapter();return;}
    const tab=e.target.closest('[data-atlas-tab]');
    if(tab){e.preventDefault();e.stopImmediatePropagation();T.view=tab.dataset.atlasTab;renderAtlas();setAtlasHash();return;}
    const filter=e.target.closest('[data-atlas-filter]');
    if(filter){e.preventDefault();e.stopImmediatePropagation();T.filter=filter.dataset.atlasFilter;renderEntries();setAtlasHash();return;}
    const group=e.target.closest('[data-atlas-group]');
    if(group){e.preventDefault();e.stopImmediatePropagation();T.group=group.dataset.atlasGroup;renderPeople();return;}
    const jump=e.target.closest('[data-atlas-jump]');
    if(jump){e.preventDefault();e.stopImmediatePropagation();T.view='quests';T.entry=jump.dataset.atlasJump;T.filter='전체';renderAtlas();setAtlasHash();return;}
    const item=e.target.closest('[data-atlas-entry]');
    if(item&&item.dataset.atlasEntry){
      e.preventDefault();e.stopImmediatePropagation();
      const nav=!!item.closest('.navprev, .navnext');
      selectEntry(item.dataset.atlasEntry,nav);
    }
  },true);
  window.addEventListener('hashchange',()=>{
    const h=new URLSearchParams(location.hash.replace(/^#/,''));
    if(h.has('atlas'))activate(Number(h.get('atlas')),h.get('view')||'quests',h.get('id'),false);
    else if(active){active=false;navRender();}
  });
  async function begin(){
    try{
      const r=await fetch('./data/manifest.json',{cache:'no-store'});
      if(!r.ok)throw new Error('manifest fetch: '+r.status);
      const manifest=await r.json();
      const paths=manifest.atlas||[];
      chapters=await Promise.all(paths.map(async path=>{
        const p=await fetch('./data/'+path,{cache:'no-store'});
        if(!p.ok)throw new Error(path+' '+p.status);
        return p.json();
      }));
      for(let wait=0;wait<300&&!(typeof DATA!=='undefined'&&DATA?.characters?.length);wait++)await new Promise(resolve=>setTimeout(resolve,40));
      initialized=true;navRender();
      const baseSearch=populateSearch;
      populateSearch=function(term){baseSearch(term);atlasSearch(term);};
      const hash=new URLSearchParams(location.hash.replace(/^#/,''));
      if(hash.has('atlas'))activate(Number(hash.get('atlas')),hash.get('view')||'quests',hash.get('id'),false);
    }catch(error){
      console.error('아틀라스 기록을 불러오지 못했습니다.',error);
      const nav=$('atlasnav');if(nav)nav.innerHTML='<div class="empty">아틀라스 기록을 열 수 없습니다.</div>';
    }
  }
  begin();
})();
