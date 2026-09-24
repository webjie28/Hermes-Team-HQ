const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
const text = value => typeof value === 'string' ? value : JSON.stringify(value, null, 2)
const advice = {
  judith: 'Architecture reviewer: Firebase/Vercel read-only metadata when needed; no secrets or production writes.',
  david: 'Product requirements and acceptance: no Firebase or Vercel account access needed.',
  jake: 'Frontend: Vercel preview access only. Use Firebase emulator/test data, not production admin credentials.',
  ralph: 'Developer tooling: narrowly scoped CI/CD setup only when required. No owner role or billing access.',
  rick: 'Firebase development owner: only required products in a development project. Production rules/data changes require a separate approval.',
  fulton: 'QA/security: preview URLs and read-only logs/configuration with sensitive data redacted. No production write access.',
  joem: 'Vercel release operator: project-scoped preview deployments. Production release needs approval for the exact commit and environment.'
}
let members = [], records = [], token = '', selected = null
const dialog = document.createElement('dialog')
dialog.className = 'review-dialog'; dialog.setAttribute('aria-label','Worker review and access approvals'); document.body.append(dialog)

async function load() {
  const response = await fetch('/api/reviews', {cache:'no-store'})
  if (!response.ok && !['localhost','127.0.0.1'].includes(location.hostname)) { records=[]; token=''; return }
  if (!response.ok) throw new Error('Review service unavailable. Refresh after the dashboard restarts.')
  const data = await response.json(); records = data.items; token = data.token
  const pending = records.filter(item=>!item.decision && (item.kind==='access'||['review','done','blocked'].includes(item.status))).length
  const badge = document.querySelector('#review-pending-count'); if (badge) badge.textContent=pending
}
async function save(path, data) {
  if (!token) throw new Error('Owner actions are available only on the private local dashboard.')
  const response = await fetch(path, {method:'POST', headers:{'Content-Type':'application/json','X-Review-Token':token}, body:JSON.stringify(data)})
  const result = await response.json()
  if (!response.ok) throw new Error(result.error || 'Could not save')
  return result
}
function card(item) {
  const member = members.find(m=>m.profile===item.profile)
  const canApprove = item.kind==='access' || (['review','done'].includes(item.status) && Boolean(item.report))
  return `<article class="decision-card" data-review-id="${esc(item.id)}">
    <div class="review-kicker">${item.kind==='access'?'ACCESS REQUEST':'WORK REVIEW'} <span>${esc(item.decision?.action || 'Awaiting decision')}</span></div>
    <h3>${esc(item.title)}</h3>
    <div class="review-byline"><strong>${esc(member?.name || item.profile)}</strong><span>${esc(member?.role || item.project)}</span><time>${item.date?esc(new Date(item.date*1000).toLocaleString('en-PH',{timeZone:'Asia/Singapore',dateStyle:'medium',timeStyle:'short'})):'Not recorded'}</time></div>
    ${item.kind==='access'?`<p><b>${esc(item.service)} · ${esc(item.environment)}</b><br>Requested scope: ${esc(item.scope)}</p>`:''}
    <h4>What you need to know</h4><div class="review-summary">${esc(text(item.summary))}</div>
    ${item.report?`<details><summary>Read the full worker report</summary><pre>${esc(text(item.report))}</pre></details>`:'<p class="review-note">No worker report filed yet.</p>'}
    <label>Give an instruction<textarea maxlength="4000" placeholder="Tell ${esc(member?.name || 'the worker')} what needs to change…"></textarea></label>
    <div class="decision-actions"><button data-decision="approve" ${canApprove?'':'disabled'}>Approve</button><button data-decision="hold">Hold</button><button data-decision="send_back">Send back</button><button data-decision="instruct">Instruct</button></div>
    ${item.decision?`<p class="review-note">Saved ${esc(item.decision.at)} · ${esc(item.decision.note)}</p>`:''}
    <p class="review-note">This records your decision only. It does not grant cloud access, deploy code, or send Telegram messages.</p>
    <p class="review-feedback" role="status"></p>
  </article>`
}
function render() {
  const publicMode = !['localhost','127.0.0.1'].includes(location.hostname)
  const person = members.find(m=>m.profile===selected)
  const own = selected ? records.filter(r=>r.profile===selected) : records.filter(r=>r.kind==='access'||['review','done','blocked'].includes(r.status))
  const pending = own.filter(item=>!item.decision).length
  dialog.innerHTML = `<header><div><p class="review-kicker">OWNER CONTROL</p><h2>${esc(person?.name || 'Review desk')}</h2>${person?`<p>${esc(person.role)}</p>`:'<p>Decisions waiting for BENJIE</p>'}</div><div class="review-header-actions"><span class="review-count">${pending} pending</span><button class="review-close" aria-label="Close review">×</button></div></header>
    <div class="review-layout"><aside class="review-sidebar"><p class="review-sidebar-label">Workspace</p><button class="review-filter active"><span>Approval inbox · 24/7</span><b>${pending}</b></button>
      <div class="review-safety"><strong>Approval stays with you</strong><p>Firebase and Vercel are not connected. Nothing here can grant access or deploy.</p></div>
      ${person?`<div class="review-person-advice"><strong>Access guidance</strong><p>${esc(advice[person.profile])}</p><a href="${esc(person.telegram_url)}" target="_blank" rel="noreferrer">Open Telegram desk ↗</a></div>`:''}
      ${publicMode?'':`<button class="new-access-button" type="button">+ Draft access request</button>`}</aside><section class="review-workspace">
    <div class="review-items">${own.length?own.map(card).join(''):'<div class="review-empty"><span>✓</span><h3>You’re all caught up</h3><p>No work reports or access requests need your decision.</p></div>'}</div>
    <section class="access-proposal" hidden><div class="proposal-heading"><div><p class="review-kicker">NEW REQUEST</p><h3>Draft scoped access</h3></div><button type="button" class="proposal-close">×</button></div><p class="proposal-note">Creates a review item only. It never grants access.</p><form id="access-proposal-form">
      <label>Worker<select name="profile">${members.map(m=>`<option value="${esc(m.profile)}" ${m.profile===selected?'selected':''}>${esc(m.name)} — ${esc(m.role)}</option>`).join('')}</select></label>
      <label>Service<select name="service"><option>Firebase</option><option>Vercel</option></select></label>
      <label>Exact project ID / slug<input name="project" required maxlength="160" placeholder="Select the real project before approval"></label>
      <label>Environment<select name="environment"><option value="development">Development</option><option value="preview">Preview</option><option value="production">Production — separate approval required</option></select></label>
      <label class="wide">Exact permissions and duration<input name="scope" required maxlength="1000" placeholder="Read-only logs, this project only, 24 hours"></label>
      <label class="wide">Reason<textarea name="reason" required maxlength="2000" placeholder="Why is access needed, and what task does it unblock?"></textarea></label>
      <div class="wide proposal-actions"><button type="button" class="proposal-cancel">Cancel</button><button type="submit">File for review</button></div><p class="wide" role="status" id="proposal-feedback"></p>
    </form></section></section></div>`
  dialog.querySelector('.review-close').onclick=()=>dialog.close()
  const proposal=dialog.querySelector('.access-proposal'), accessButton=dialog.querySelector('.new-access-button')
  if(accessButton) accessButton.onclick=()=>{proposal.hidden=false;proposal.scrollIntoView({behavior:'smooth'})}
  dialog.querySelector('.proposal-close').onclick=dialog.querySelector('.proposal-cancel').onclick=()=>proposal.hidden=true
  dialog.querySelectorAll('[data-decision]').forEach(button=>button.onclick=async()=>{
    const article=button.closest('[data-review-id]'), item=records.find(r=>r.id===article.dataset.reviewId)
    const feedback=article.querySelector('.review-feedback')
    if(button.dataset.decision==='approve' && !confirm('Record approval for this exact item? This does NOT grant cloud access or execute work.'))return
    button.disabled=true
    try { const result=await save('/api/reviews/decision',{id:item.id,revision:item.revision,action:button.dataset.decision,note:article.querySelector('textarea').value}); feedback.textContent=result.message }
    catch(error){feedback.textContent=error.message}
    finally {button.disabled=false}
  })
  dialog.querySelector('form').onsubmit=async event=>{
    event.preventDefault();const feedback=dialog.querySelector('#proposal-feedback');const button=event.submitter;button.disabled=true
    try {await save('/api/reviews/propose',Object.fromEntries(new FormData(event.target)));await load();render()}
    catch(error){feedback.textContent=error.message;button.disabled=false}
  }
}
async function open(profile=null) {
  selected=profile
  try { await load();render(); if(!dialog.open)dialog.showModal() }
  catch(error) { alert(error.message) }
}
document.addEventListener('worker-review',event=>open(event.detail))
document.querySelector('#open-review-desk').onclick=()=>open()
export function updateReviewMembers(value) { members=value }
load().catch(()=>{})
