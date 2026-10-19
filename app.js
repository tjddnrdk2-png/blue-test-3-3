const input = document.querySelector('#search');
const cards = document.querySelector('#cards');
const count = document.querySelector('#count');
let articles = [];
// JSON 원본에 섞여 있는 다음 장/부칙 표제만 표시 본문에서 제거합니다.
const clean = text => text.replace(/\n\s*(?:제\d+장[^\n]*|부\s*칙[^\n]*)/g, '').trim();
// 본문에서 첫 문장을 추출하므로 다른 JSON을 불러와도 요약이 일치합니다.
const summarize = text => {
 const body = clean(text).replace(/\s+/g, ' ');
 const sentence = body.match(/^.*?[.!?](?:\s|$)/u);
 return sentence ? sentence[0].trim() : body;
};
function render() {
 const keyword = input.value.trim().toLocaleLowerCase('ko');
 const matches = articles.filter(a => (a['제목']+' '+clean(a['본문'])).toLocaleLowerCase('ko').includes(keyword));
 count.textContent = `결과 ${matches.length}건`;
 cards.replaceChildren();
 document.querySelector('#empty').hidden = matches.length !== 0;
 for (const article of matches) {
  const card = document.createElement('article'); card.className = 'card';
  const number = document.createElement('span'); number.className='article-number'; number.textContent=article['조'];
  const title=document.createElement('h3'); title.textContent=article['제목'];
  const summary=document.createElement('p'); summary.className='summary'; summary.textContent=summarize(article['본문']);
  const details=document.createElement('details'); const toggle=document.createElement('summary'); toggle.textContent='조항 본문 보기';
  const full=document.createElement('p'); full.className='full'; full.textContent=clean(article['본문']);
  details.append(toggle,full); card.append(number,title,summary,details); cards.append(card);
 }
}
input.addEventListener('input',render);
document.querySelector('#clear').addEventListener('click',()=>{input.value='';render();input.focus();});
const status = document.querySelector('#data-status');
function loadData(data, source) {
 if (!Array.isArray(data) || !data.every(a => a && ['조','제목','본문'].every(k => typeof a[k] === 'string'))) {
  throw new Error('조, 제목, 본문 문자열을 가진 JSON 목록이 필요합니다.');
 }
 articles = data;
 status.textContent = `${source} · ${articles.length}개 조항`;
 render();
}
// file://에서도 즉시 표시되도록 원본 JSON 사본을 HTML 안에 포함합니다.
try {
 loadData(JSON.parse(document.querySelector('#article-data').textContent), '첨부 조항데이터.json');
} catch (error) {
 count.textContent = '조항 데이터를 확인해 주세요.';
 status.textContent = error.message;
}
// 웹 서버로 열면 같은 폴더의 최신 JSON을 우선 사용합니다.
if (location.protocol === 'http:' || location.protocol === 'https:') {
 fetch('조항데이터.json').then(r => {
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
 }).then(data => loadData(data, '조항데이터.json'))
 .catch(() => { status.textContent += ' · HTML에 포함된 데이터 사용'; });
}
document.querySelector('#json-file').addEventListener('change', async event => {
 const file = event.target.files[0];
 if (!file) return;
 try {
  loadData(JSON.parse((await file.text()).replace(/^\uFEFF/, '')), file.name);
 } catch (error) {
  status.textContent = `불러오기 실패: ${error.message} 기존 데이터를 유지합니다.`;
 }
 event.target.value = '';
});
