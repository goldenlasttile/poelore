'use strict';
let DATA, byId, allQuests, qById;
function entriesOf(act) {
  const a = typeof act === 'number' ? actOf(act) : act;
  if (!a || a.status) return [];
  return [
    {id:`a${a.id}-background`, title:'배경', en:'Historical Background', kind:'배경', area:`ACT ${a.id} · 역사와 인물`, chapters:a.background||[], cast:[], special:true},
    ...a.quests,
    {id:`a${a.id}-conclusion`, title:'정리', en:'Narrative Conclusions', kind:'정리', area:`ACT ${a.id} · 흐름과 연결`, chapters:a.conclusion||[], cast:[], special:true}
  ];
}
const tabsDef=[['quests','퀘스트 전개'],['people','주요 인물'],['history','역사 연대표']];
const S={act:1,view:'quests',quest:null,qFilter:'전체',group:'전체',historyAll:false};
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const urlQuest=q=>q?.source||`https://www.poewiki.net/wiki/${encodeURIComponent(q.en.replace(/ /g,'_'))}`;
const wikiItem=en=>'https://www.poewiki.net/wiki/'+encodeURIComponent(en.replace(/ /g,'_'));
const actOf=n=>DATA.acts.find(a=>a.id===n);
function setHash(){const params=new URLSearchParams({act:String(S.act),view:S.view});if(S.quest&&S.view==='quests')params.set('id',S.quest);history.replaceState({},'', '#'+params.toString());}
function bootHash(){const h=new URLSearchParams(location.hash.replace(/^#/,''));const a=Number(h.get('act'));if(a>=1&&a<=10)S.act=a;let v=h.get('view');if(tabsDef.some(t=>t[0]===v))S.view=v;const q=h.get('id');if(q&&(qById.has(q)||/^a([1-9]|10)-(background|conclusion)$/.test(q))){S.quest=q;S.act=qById.has(q)?qById.get(q).act:Number(q.match(/^a(\d+)/)?.[1]||S.act);S.view='quests';}}
function navigate(act,view='quests',quest=null,keep=false){S.act=act;S.view=view;S.quest=quest||entriesOf(act)[0]?.id||null;S.qFilter='전체';S.group='전체';if(!keep)S.historyAll=false;render();setHash();document.querySelector('.content').scrollIntoView({behavior:'smooth',block:'start'});$('sidebar').classList.remove('open');}
function toQuest(qid){let q=qById.get(qid);if(q)navigate(q.act,'quests',qid);closeDrawer();closeSearch();}
function toPerson(id){if(!byId.has(id))return;closeSearch();openPerson(id);}
function render(){let a=actOf(S.act);$('topCrumb').textContent=`ACT ${a.number} · ${a.title}`;$('actnav').innerHTML=DATA.acts.map(x=>`<button class="act-link ${x.id===S.act?'active':''} ${x.status?'planned':''}" data-act="${x.id}"><span class="roman">${x.number}</span><span style="min-width:0"><span class="actname">${esc(x.title)}</span><span class="actsub">${x.status?'준비 중':x.quests.length+'개의 퀘스트 기록'}</span></span>${x.status?'':'<span class="tag-new">수록</span>'}</button>`).join('');const done=DATA.acts.filter(x=>!x.status);$('archiveStats').textContent=`${done.length}개 액트 · ${allQuests.length}개 퀘스트 · ${DATA.characters.filter(c=>c.acts?.length).length}명 인물`;
 $('hero').innerHTML=`<div class="eyebrow">RECORD ${a.number} / ${a.status?'COMING SOON':'COMPLETE'}</div><h1 class="serif"><em>${a.number}</em>${esc(a.title)}</h1><p class="subtitle">${esc(a.tagline)}<br><span style="color:#8fa5ad">${esc(a.overview)}</span></p><div class="herobottom"><span class="hero-pill">⌁ ${esc(a.location)}</span>${!a.status?`<span class="hero-pill">퀘스트 <b>${a.quests.length}</b></span><span class="hero-pill">연관 인물 <b>${DATA.characters.filter(c=>c.acts.includes(a.id)).length}</b></span><span class="hero-pill">역사 기록 <b>${DATA.events.filter(e=>e.act===a.id).length}</b></span>`:'<span class="hero-pill">자료 업데이트 대기</span>'}</div>`;
 $('tabs').innerHTML=tabsDef.map(([id,label])=>`<button class="tab ${S.view===id?'active':''}" data-view="${id}" aria-selected="${S.view===id}">${label}<span class="num">${id==='quests'?a.quests.length:id==='people'?DATA.characters.filter(c=>c.acts.includes(a.id)).length:id==='history'?DATA.events.filter(e=>e.act===a.id).length:''}</span></button>`).join('');
 if(a.status){$('panel').innerHTML=`<div class="sectionhead"><h2>확장 예정 액트</h2></div><div class="planned-panel"><div class="sig">✦</div><h2>${a.title}</h2><p>ACT ${a.number}는 준비 중입니다. 퀘스트 · 인물 · 역사 · 서사 정리를 동일한 형식으로 채울 수 있도록 메뉴와 데이터 구조를 만들어 두었습니다.</p><button data-act="4">ACT IV 기록 보기 ←</button></div>`;return;}
 if(S.view==='quests')renderQuests();else if(S.view==='people')renderPeople();else renderHistory();
}
function visibleQuests() {
 const all=entriesOf(S.act);
 return S.qFilter==='전체' ? all : all.filter(q=>q.special||q.kind===S.qFilter);
}
function renderQuests(){
 const a=actOf(S.act), qs=a.quests, shown=visibleQuests();
 if(!shown.some(q=>q.id===S.quest))S.quest=shown[0]?.id||null;
 const current=shown.find(q=>q.id===S.quest);
 $('panel').innerHTML=`<div class="sectionhead"><div><h2>퀘스트 연대기</h2><p>배경부터 사건 전개와 정리까지. 목록을 선택해 원래의 긴 이야기를 읽어보세요.</p></div><div class="minitag">${qs.length} QUESTS · 2 ARTICLES</div></div>
 <div class="quest-layout"><div class="quest-index"><div class="index-top"><strong>사건 목록</strong><div class="filter-row">${['전체','메인','서브','분기','연결','전직','추가'].filter(t=>t==='전체'||qs.some(q=>q.kind===t)).map(t=>`<button class="chip ${S.qFilter===t?'on':''}" data-filter="${t}">${t}</button>`).join('')}</div></div><div class="quest-items">${shown.map((item)=>`<button class="q-index-btn ${item.id===S.quest?'active':''} ${item.special?'q-bookend':''}" data-quest="${item.id}" aria-current="${item.id===S.quest?'true':'false'}"><span class="q-index-number">${item.special?(item.kind==='배경'?'◈':'◆'):String(qs.indexOf(item)+1).padStart(2,'0')}</span><span><span class="q-index-name">${esc(item.title)}</span><span class="q-index-place">${item.special?esc(item.area):esc(item.kind)+' · '+esc(item.area.split('·')[0])}</span></span></button>`).join('')}</div></div><div id="questDetail"></div></div>`;
 renderQuestDetail(current,shown);
}
function selectQuest(id){
 const shown=visibleQuests(),q=shown.find(x=>x.id===id);
 if(!q) return;
 S.quest=id;
 // Keep .quest-items in the DOM: re-creating the list previously reset scrollTop to zero.
 renderQuestDetail(q,shown);
 setHash();
}
function articleSections(chapters) {
 return (chapters||[]).map(ch=>`<section class="story-section"><h3 class="subheading"><span class="marker"></span>${esc(ch.heading)}</h3>${(ch.paragraphs||[]).map(p=>`<p class="story">${esc(p)}</p>`).join('')}</section>`).join('');
}
function renderQuestDetail(q,shown){
 const node=$('questDetail');
 if(!q){node.innerHTML='<div class="empty">선택할 기록이 없습니다.</div>';return;}
 const idx=shown.findIndex(x=>x.id===q.id);
 const secondary=q.special?`ACT ${S.act} · ${q.kind==='배경'?'역사적 배경': '사건의 흐름과 의미'}`:q.en;
 node.innerHTML=`<article class="quest-detail"><div class="detail-inner"><div class="q-serial"><span>${q.special?'CHAPTER': 'QUEST'} ${String(idx+1).padStart(2,'0')} / ${String(shown.length).padStart(2,'0')}</span><span style="flex:1;border-top:1px solid var(--edge)"></span>ACT ${S.act}</div><h2 class="q-detail-title serif">${esc(q.title)}</h2><div class="q-en mono">${esc(secondary)}</div><div class="q-meta"><span class="kind ${esc(q.kind)}">${esc(q.kind)}${q.special?' 기록':' 퀘스트'}</span><span class="area-label">⌁ ${esc(q.area)}</span></div>${articleSections(q.chapters)}${!q.special?`<div class="detail-aside"><div class="mini-cap">등장인물 · 누르면 인물 기록으로 이동</div><div class="person-chips">${(q.cast||[]).filter(id=>byId.has(id)).map(id=>`<button class="person-chip" data-person="${id}">${esc(byId.get(id).name)} ↗</button>`).join('')||'<span style="color:var(--muted);font-size:12px">기록된 인물 없음</span>'}</div>${q.item?`<p class="q-item"><b>주요 아이템 / 보상</b> · ${esc(q.item)}</p>`:''}</div>`:''}</div>
 <div class="detail-bottom"><button class="navprev" data-quest="${idx>0?shown[idx-1].id:''}" ${idx===0?'disabled':''}>← ${idx>0?esc(shown[idx-1].title):'첫 기록'}</button>${!q.special?`<a class="source-link" href="${esc(urlQuest(q))}" target="_blank" rel="noopener">Wiki ↗</a>`:'<span class="reading-indicator">ARCHIVE</span>'}<button class="navnext" data-quest="${idx<shown.length-1?shown[idx+1].id:''}" ${idx===shown.length-1?'disabled':''}>${idx<shown.length-1?esc(shown[idx+1].title):'마지막 기록'} →</button></div></article>`;
 document.querySelectorAll('.q-index-btn').forEach(b=>{const yes=b.dataset.quest===q.id;b.classList.toggle('active',yes);b.setAttribute('aria-current',String(yes));});
}
function renderPeople(){
 const people=DATA.characters.filter(c=>c.acts.includes(S.act));
 const groups=['전체',...new Set(people.map(p=>p.personType.split(' · ')[0]))];
 const matches=S.group==='전체'?people:people.filter(p=>p.personType.startsWith(S.group));
 $('panel').innerHTML=`<div class="sectionhead"><div><h2>인물 도감</h2><p>소속과 등장 유형을 구분했습니다. 선택하면 인물사 · 관계 · 고유 아이템을 열람할 수 있습니다.</p></div><span class="minitag">${people.length} FIGURES</span></div><div class="groupfilters">${groups.map(g=>`<button class="chip ${S.group===g?'on':''}" data-group="${esc(g)}">${esc(g)}</button>`).join('')}</div><div class="cards">${matches.map(c=>`<button class="charcard" data-person="${c.id}"><div class="char-top"><span class="avatar">${esc(c.name[0])}</span><span class="smallpill">${esc(c.personType)}</span></div><div><h3>${esc(c.name)}</h3><div class="english mono">${esc(c.en)}</div></div><div class="char-affil">${esc(c.affiliation)}</div><p class="summary">${esc(c.summary)}</p><span class="readmore">인물 기록 열기 ↗</span></button>`).join('')}</div>`;
}
function renderHistory(){let events=DATA.events.filter(e=>Number.isInteger(e.act)&&(S.historyAll||e.act===S.act));if(S.historyAll){const rank=p=>p.includes('고대')&&!p.includes('제국')?0:p.includes('고대·')?0:p.includes('초기')?1:p.includes('말기')?2:p.includes('대재앙')?3:p.includes('오랜 과거')?4:p.includes('현재')?5:4;events=events.slice().sort((a,b)=>rank(a.period)-rank(b.period));}$('panel').innerHTML=`<div class="sectionhead"><div><h2>역사 기록</h2><p>배경 사건과 현재 퀘스트가 어느 지점에서 만나는지 살펴보세요.</p></div><span class="minitag">${events.length} EVENTS</span></div><div class="timeline"><div class="timeline-head"><button class="toggle ${!S.historyAll?'active':''}" data-history="current">현재 액트</button><button class="toggle ${S.historyAll?'active':''}" data-history="all">전체 액트 연대기</button></div><div class="timeline-list">${events.map(e=>`<article class="event"><small>${S.historyAll?`ACT ${e.act} · `:''}${esc(e.period)}</small><h3>${esc(e.title)}</h3><p>${esc(e.desc)}</p><div class="event-foot">${e.people.filter(id=>byId.has(id)).slice(0,5).map(id=>`<button data-person="${id}">◌ ${esc(byId.get(id).name)}</button>`).join('')}${e.quest&&qById.has(e.quest)?`<button data-jumpquest="${e.quest}">관련 퀘스트 ↗</button>`:''}</div></article>`).join('')}</div></div>`}
function openPerson(id){
 const c=byId.get(id);if(!c)return;
 $('drawerWrap').classList.remove('hidden');document.body.style.overflow='hidden';
 const qs=allQuests.filter(q=>(q.cast||[]).includes(c.id));
 const acts=c.actChronicles||[];
 const selected=acts.some(x=>x.act===S.act)?S.act:(acts[0]?.act??null);
 const life=(c.lifeChapters||[]).length
   ?`<div class="divider"></div><h3 class="person-section-label">생전의 배경과 개인사</h3>${c.lifeChapters.map(ch=>`<div class="person-life"><h4>${esc(ch.heading)}</h4>${(ch.paragraphs||[]).map(p=>`<p>${esc(p)}</p>`).join('')}</div>`).join('')}`:'';
 const eraNarrative=acts.length?`<div class="divider"></div><h3 class="person-section-label">ACT별 행적</h3><p class="person-tip">각 액트를 선택하면 해당 시기의 사건과 문헌 단서만 볼 수 있습니다. 「역사 기록」으로 등장한 경우 실제로 그 지역에서 활동했다는 뜻은 아닙니다.</p><div class="person-act-nav" role="group" aria-label="액트별 인물 행적">${acts.map(ch=>`<button type="button" class="person-act-tab ${ch.act===selected?'active':''}" data-person-act="${ch.act}" aria-pressed="${ch.act===selected}">ACT ${ch.act}</button>`).join('')}</div>${acts.map(ch=>`<section class="person-act-section ${ch.act===selected?'':'hidden'}" data-person-section="${ch.act}"><div class="person-act-meta"><span>ACT ${ch.act}</span><span>${esc(ch.status)}</span></div><h4>${esc(ch.title)}</h4>${ch.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}${ch.record?`<div class="person-record"><b>게임 내 근거</b><span>${esc(ch.record)}</span>${ch.source?`<a href="${esc(ch.source)}" target="_blank" rel="noopener noreferrer">관련 기록 ↗</a>`:''}</div>`:''}</section>`).join('')}`:
 `${(c.bioChapters||[]).map(ch=>`<h3 class="bio-heading">${esc(ch.heading)}</h3>${(ch.paragraphs||[]).map(t=>`<p>${esc(t)}</p>`).join('')}`).join('')}`;
 const atlasNarrative=(c.atlasChronicles||[]).length?'<div class="divider"></div><h3 class="person-section-label">아틀라스에서의 행적</h3>'+c.atlasChronicles.map(ch=>'<div class="person-life"><h4>ATLAS '+esc(ch.chapter)+' · '+esc(ch.title)+'</h4><p class="person-tip">'+esc(ch.status)+'</p>'+(ch.paragraphs||[]).map(p=>'<p>'+esc(p)+'</p>').join('')+(ch.record?'<p class="person-tip">'+esc(ch.record)+'</p>':'')+'</div>').join(''):'';
 const excerpts=(c.excerpts||[]).map(x=>`<figure class="lore-excerpt"><blockquote>“${esc(x.quote)}”</blockquote><figcaption><a href="${esc(x.source)}" target="_blank" rel="noopener noreferrer">${esc(x.attribution)} ↗</a></figcaption><p>${esc(x.context)}</p></figure>`).join('');
 const otherUniqueItems=(c.items||[]).filter(x=>!(c.itemLore||[]).some(entry=>entry.item===x));
 const itemLore=(c.itemLore||[]).map(x=>`<article class="unique-lore-card"><div class="unique-lore-top"><span class="unique-lore-label">${esc(x.relation||'관련 기록')}</span><a class="unique-lore-name" href="${esc(x.source||wikiItem(x.item))}" target="_blank" rel="noopener noreferrer">✧ ${esc(x.item)} ↗</a></div><h4>${esc(x.heading)}</h4><p>${esc(x.body)}</p></article>`).join('');

 $('drawerBody').innerHTML=`<div class="person-facts"><span class="fact-pill"><b>인물 유형</b>${esc(c.personType)}</span><span class="fact-pill"><b>소속</b>${esc(c.affiliation)}</span><span class="fact-pill"><b>시대</b>${esc(c.era)}</span></div><h2 class="drawer-name serif">${esc(c.name)}</h2><div class="drawer-en mono">${esc(c.en)} — ${esc(c.narrativeRole||c.role)}</div><p class="drawer-lead">${esc(c.summary)}</p><div class="divider"></div><h3 class="person-section-label">인물 개요</h3><p>${esc(c.history)}</p>${life}${eraNarrative}${atlasNarrative}${excerpts?`<div class="divider"></div><h3 class="person-section-label">대사와 문헌 속 한 문장</h3>${excerpts}`:''}${c.trivia?.length?`<div class="trivia-panel"><h3>트리비아 · 관련 기록</h3>${c.trivia.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}<div class="divider"></div><h3>인물 관계</h3>${c.relations.length?c.relations.map(([to,label])=>`<button class="relation" data-person="${to}"><span class="linkname">${esc(byId.get(to)?.name||to)} ↗</span><span>${esc(label)}</span></button>`).join(''):'<p>기록된 관계가 없습니다.</p>'}<div class="divider"></div><h3>관련 고유 아이템</h3>${itemLore?`<p class="person-tip">이름이 없어도 인물의 행적을 실제로 보여주는 아이템은 함께 수록했습니다. 문구 자체의 사실과 다른 대사로 확인한 사실을 구분합니다.</p>${itemLore}${otherUniqueItems.length?`<div class="unique-lore-simple"><div class="unique-extra-heading">그 밖의 명칭 관련 고유 아이템 · 별도 서사 미기록</div>${otherUniqueItems.map(x=>`<a class="itemlink" href="${wikiItem(x)}" target="_blank" rel="noopener noreferrer">✧ ${esc(x)} ↗</a>`).join('')}</div>`:''}`:c.items.length?`<div class="unique-lore-simple">${c.items.map(x=>`<a class="itemlink" href="${wikiItem(x)}" target="_blank" rel="noopener noreferrer">✧ ${esc(x)} ↗</a>`).join('')}<p class="person-tip">아이템 이름과 인물의 연관성은 있으나, 별도로 확인한 서사적 단서는 아직 기록하지 않았습니다.</p></div>`:'<p>서사적으로 확인된 고유 아이템은 아직 수록되지 않았습니다.</p>'}<div class="divider"></div><h3>관련 퀘스트</h3>${qs.length?qs.map(q=>`<button class="tag-quest" data-jumpquest="${q.id}">ACT ${q.act} · ${esc(q.title)} ↗</button>`).join(''):'<p>직접 연관된 퀘스트는 기록되지 않았습니다.</p>'}`;
 const scroller=document.querySelector('.drawer');if(scroller)scroller.scrollTop=0;
}

function closeDrawer(){$('drawerWrap').classList.add('hidden');document.body.style.overflow=''}
function openSearch(){$('searchOverlay').classList.remove('hidden');$('searchInput').value='';populateSearch('');setTimeout(()=>$('searchInput').focus(),0)}
function closeSearch(){$('searchOverlay').classList.add('hidden')}
function populateSearch(term){let t=term.toLocaleLowerCase().trim();const score=(name,all)=>name.toLowerCase().includes(t)?2:all.toLowerCase().includes(t)?1:0;let results=[];allQuests.forEach(q=>{let sc=score(q.title+' '+q.en,q.area+' '+(q.chapters||[]).map(ch=>ch.heading+' '+(ch.paragraphs||[]).join(' ')).join(' '));if(sc)results.push({type:'퀘스트',score:sc,title:q.title,sub:`ACT ${q.act} · ${q.kind} · ${q.area}`,act:q.act,id:q.id})});DATA.characters.filter(c=>(c.acts||[]).length).forEach(c=>{let sc=score(c.name+' '+c.en,c.role+' '+c.affiliation+' '+c.personType+' '+c.summary+' '+c.history+' '+c.items.join(' ')+' '+(c.itemLore||[]).map(x=>[x.item,x.heading,x.body].join(' ')).join(' ')+' '+(c.actChronicles||[]).flatMap(ch=>[ch.title,...ch.paragraphs]).join(' '));if(sc)results.push({type:'인물',score:sc,title:c.name,sub:`${c.acts.map(n=>'ACT '+n).join(', ')} · ${c.role}`,id:c.id,act:c.acts[0]})});DATA.events.filter(e=>Number.isInteger(e.act)).forEach((e,i)=>{let sc=score(e.title,e.desc+' '+e.period);if(sc)results.push({type:'역사',score:sc,title:e.title,sub:`ACT ${e.act} · ${e.period}`,act:e.act,id:i})});
if(!t){results=[...allQuests.filter(q=>q.kind==='메인'&&[1,2,3,4].includes(q.act)).slice(0,3).map(q=>({type:'퀘스트',score:1,title:q.title,sub:`ACT ${q.act} · ${q.area}`,act:q.act,id:q.id})),...DATA.characters.filter(c=>['daresso','kaom','malachai','dialla'].includes(c.id)).map(c=>({type:'인물',score:1,title:c.name,sub:c.role,act:c.acts[0],id:c.id}))]}results.sort((a,b)=>b.score-a.score);$('searchResults').innerHTML=results.length?results.slice(0,30).map(r=>`<button class="result" data-search-type="${r.type}" data-search-id="${r.id}" data-search-act="${r.act}"><span class="rtype">${r.type}</span><span><b>${esc(r.title)}</b><small>${esc(r.sub)}</small></span></button>`).join(''):`<div class="empty">일치하는 기록이 없습니다. 이름이나 퀘스트의 일부를 다시 검색해 보세요.</div>`;}
function exportData(){let blob=new Blob([JSON.stringify(actOf(S.act),null,2)],{type:'application/json;charset=utf-8'});let link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download='act-'+String(S.act).padStart(2,'0')+'-export.json';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),2000)}
document.addEventListener('click',e=>{const actTab=e.target.closest('[data-person-act]');if(actTab){const n=actTab.dataset.personAct;document.querySelectorAll('.person-act-tab').forEach(t=>{const on=t.dataset.personAct===n;t.classList.toggle('active',on);t.setAttribute('aria-pressed',String(on))});document.querySelectorAll('.person-act-section').forEach(s=>s.classList.toggle('hidden',s.dataset.personSection!==n));return}const person=e.target.closest('[data-person]');if(person){openPerson(person.dataset.person);return}const jq=e.target.closest('[data-jumpquest]');if(jq){toQuest(jq.dataset.jumpquest);return}const quest=e.target.closest('[data-quest]');if(quest&&quest.dataset.quest){const isPageNav=!!quest.closest('.navprev, .navnext');selectQuest(quest.dataset.quest);if(isPageNav)requestAnimationFrame(() => { const detail=$('questDetail'); if(detail) detail.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'}); });return}const a=e.target.closest('[data-act]');if(a){navigate(Number(a.dataset.act));return}const view=e.target.closest('[data-view]');if(view){S.view=view.dataset.view;render();setHash();return}const f=e.target.closest('[data-filter]');if(f){S.qFilter=f.dataset.filter;renderQuests();setHash();return}const group=e.target.closest('[data-group]');if(group){S.group=group.dataset.group;renderPeople();return}const history=e.target.closest('[data-history]');if(history){S.historyAll=history.dataset.history==='all';renderHistory();return}const sr=e.target.closest('[data-search-type]');if(sr){const id=sr.dataset.searchId,act=Number(sr.dataset.searchAct),type=sr.dataset.searchType;closeSearch();if(type==='퀘스트')toQuest(id);else if(type==='인물'){navigate(act,'people');openPerson(id)}else navigate(act,'history');return}});
$('searchBtn').addEventListener('click',openSearch);$('closeSearch').addEventListener('click',closeSearch);$('searchInput').addEventListener('input',e=>populateSearch(e.target.value));$('searchOverlay').addEventListener('click',e=>{if(e.target===$('searchOverlay'))closeSearch()});$('closeDrawer').addEventListener('click',closeDrawer);$('drawerWrap').addEventListener('click',e=>{if(e.target===$('drawerWrap'))closeDrawer()});$('exportBtn').addEventListener('click',exportData);$('menuBtn').addEventListener('click',()=>$('sidebar').classList.toggle('open'));document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeDrawer();closeSearch();$('sidebar').classList.remove('open')}else if((e.key==='/'&&!(e.target instanceof HTMLInputElement))||(e.key.toLowerCase()==='k'&&(e.ctrlKey||e.metaKey))){e.preventDefault();openSearch()}});
window.addEventListener('hashchange',()=>{if(!$('drawerWrap').classList.contains('hidden')||!$('searchOverlay').classList.contains('hidden'))return;bootHash();render()});
async function loadData(){
 try {
  const manifestResp=await fetch('./data/manifest.json',{cache:'no-store'});
  if(!manifestResp.ok)throw new Error(`manifest.json (${manifestResp.status})`);
  const manifest=await manifestResp.json();
  const urls=[...manifest.acts.map(path=>'./data/'+path),'./data/characters.json','./data/history.json'];
  const payloads=await Promise.all(urls.map(async url=>{const r=await fetch(url,{cache:'no-store'});if(!r.ok)throw new Error(url+' '+r.status);return r.json();}));
  DATA={meta:manifest.meta,acts:payloads.slice(0,manifest.acts.length),characters:payloads[manifest.acts.length],events:payloads[manifest.acts.length+1]};
  byId=new Map(DATA.characters.map(x=>[x.id,x]));
  allQuests=DATA.acts.flatMap(a=>a.quests.map(q=>({...q,act:a.id})));
  qById=new Map(allQuests.map(q=>[q.id,q]));
  bootHash();if(!S.quest)S.quest=entriesOf(S.act)[0]?.id||null;
  render();
 } catch(err) {
  console.error('아카이브 데이터 오류',err);
  $('panel').innerHTML=`<div class="planned-panel"><h2>데이터를 열 수 없습니다</h2><p>GitHub Pages에서 열거나 README.txt의 로컬 서버 실행 방법을 확인하세요. ${esc(err.message)}</p></div>`;
 }
}
loadData();
