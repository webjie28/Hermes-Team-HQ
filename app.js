const $ = (selector) => document.querySelector(selector)
import { updateReviewMembers } from './review-ui.js'
import { promotionLabel, teamSignature } from './ui-state.js'
import { publicSnapshot } from './public-demo.js'
const $$ = (selector) => [...document.querySelectorAll(selector)]
let snapshot = null
let campus = null
let lastTeamSignature = null
import('./campus.js').then(({ Campus }) => {
  campus = new Campus()
  if (snapshot) campus.update(snapshot)
}).catch(error => {
  $('#campus-stage').textContent = 'Campus could not load. Team & Skills and Board are still available.'
  console.error(error)
})

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;')

function toast(message) {
  const el = $('#toast')
  el.textContent = message
  el.classList.add('show')
  setTimeout(() => el.classList.remove('show'), 3200)
}

function ago(value) {
  if (!value) return 'No runs yet'
  const seconds = Math.max(0, (Date.now() - new Date(value).getTime()) / 1000)
  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}

function memberCard(member) {
  const task = member.current_task
  const taskText = task
    ? `<strong>${escapeHtml(task.status)}</strong> · ${escapeHtml(task.title)}`
    : 'No assigned task. Ready for work.'
  return `<article class="member-card" data-profile="${member.profile}" style="--member-color:${member.color}">
    <div class="member-top"><div class="avatar">${member.name.slice(0, 1)}</div><div><h3 class="member-name">${member.name}</h3><p class="member-role">${escapeHtml(member.role)} · ${escapeHtml(member.level)}</p></div></div>
    <div class="status-pill ${member.state}">${member.state_label}</div>
    <p class="task-line">${taskText}</p>
    <div class="skill-list">${member.skills.map(skill => `<span>${escapeHtml(skill)}</span>`).join('')}</div>
    <p class="life-line">◷ ${escapeHtml(member.personal)}</p>
    ${member.mentor?`<p class="life-line">Mentor: ${escapeHtml(member.mentor)} · ${escapeHtml(member.promotion_track || '')}</p>`:''}
    <div class="member-stats"><div><span>Recorded work today</span><strong>${Math.floor((member.recorded_seconds_today || 0) / 3600)}h ${Math.floor((member.recorded_seconds_today || 0) % 3600 / 60)}m</strong></div><div><span>Recorded this week</span><strong>${member.active_hours_week}h</strong></div></div>
    <div class="card-actions">${member.telegram_url?`<a href="${member.telegram_url}" target="_blank" rel="noreferrer">Telegram desk</a>`:''}<button data-leave="${member.profile}">Set leave</button><button data-assign="${member.profile}">Assign task</button></div>
  </article>`
}

function renderTeam() {
  for (const member of snapshot.members) if (['red','marielle'].includes(member.profile)) member.promotion_track = promotionLabel(member.trial_start, member.trial_days)
  const signature = teamSignature(snapshot.members, Boolean(snapshot.public_preview))
  if (signature === lastTeamSignature) return
  lastTeamSignature = signature
  const active = document.activeElement
  const focusProfile = active?.closest('.member-card')?.dataset.profile
  const focusText = active?.textContent
  $('#team-grid').innerHTML = snapshot.members.map(memberCard).join('')
  if (!snapshot.public_preview) document.querySelectorAll('.member-card').forEach((card,index)=>{const b=document.createElement('button');b.textContent='Review work & access';b.onclick=()=>document.dispatchEvent(new CustomEvent('worker-review',{detail:snapshot.members[index].profile}));card.querySelector('.card-actions').prepend(b)})
  if(snapshot.public_preview) document.querySelectorAll('[data-leave],[data-assign]').forEach(button=>button.disabled=true)
  if (focusProfile) [...document.querySelectorAll('.member-card')].find(card=>card.dataset.profile===focusProfile)?.querySelectorAll('button,a').forEach(button=>{if(button.textContent===focusText) button.focus({preventScroll:true})})
  $$('[data-assign]').forEach(button => button.addEventListener('click', () => openTaskForm(button.dataset.assign)))
  $$('[data-leave]').forEach(button => button.addEventListener('click', () => setLeave(button.dataset.leave)))
}

async function setLeave(profile) {
  const suggested = new Date(Date.now() + 86400000).toISOString().slice(0, 10)
  const date = window.prompt('Leave date (YYYY-MM-DD)', suggested)
  if (!date) return
  try {
    const response = await fetch('/api/leave', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profile, date }) })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Could not set leave')
    toast(`Leave recorded for ${date}`); await refresh()
  } catch (error) { toast(error.message) }
}

const groups = [
  ['Scheduled', ['scheduled']],
  ['Queue', ['triage', 'todo', 'ready']],
  ['Working', ['running']],
  ['Review / Blocked', ['review', 'blocked']],
  ['Done', ['done']],
]

function renderBoard() {
  const plan = snapshot.project?.plan
  $('#project-summary').textContent = plan
    ? `${snapshot.project.name} · ${plan.estimate.business_days} business days · target ${plan.estimate.target_finish}`
    : `${snapshot.project?.name || 'No active project'} · waiting for an approved project plan`
  const milestones = plan?.milestones || []
  $('#project-process').innerHTML = milestones.length ? `<div class="process-heading"><div><span>Visible delivery process</span><strong>${escapeHtml(plan.estimate.start)} → ${escapeHtml(plan.estimate.target_finish)}</strong></div><p>Every gate requires evidence. Production stays locked until BENJIE approves.</p></div><div class="process-grid">${milestones.map((item,index)=>`<article class="process-card"><span class="process-number">${index+1}</span><div><small>Days ${escapeHtml(item.days)} · ${escapeHtml(item.dates)}</small><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml((item.owners||[]).join(' · '))}</p><b>Gate: ${escapeHtml(item.gate)}</b></div></article>`).join('')}</div>` : ''
  $('#board-columns').innerHTML = groups.map(([label, states]) => {
    const tasks = snapshot.tasks.filter(task => states.includes(task.status)).slice(0, 15)
    return `<section class="board-column"><h3>${label} · ${tasks.length}</h3>${tasks.length ? tasks.map(task => {
      const member = snapshot.members.find(item => item.profile === task.assignee)
      return `<article class="task-card"><strong>${escapeHtml(task.title)}</strong><span>${member ? member.name : escapeHtml(task.assignee || 'Unassigned')} · ${escapeHtml(task.status)}</span></article>`
    }).join('') : '<div class="empty">Nothing here</div>'}</section>`
  }).join('')
}

function renderHeader() {
  $('#working-count').textContent = snapshot.summary.working
  $('#available-count').textContent = snapshot.summary.available
  $('#blocked-count').textContent = snapshot.summary.needs_help
  const healthy = snapshot.gateway.state === 'running' && snapshot.gateway.telegram === 'connected'
  $('#gateway-state').textContent = snapshot.public_preview ? 'Public preview' : healthy ? 'Connected' : `${snapshot.gateway.state} / ${snapshot.gateway.telegram}`
  $('#last-refresh').textContent = snapshot.now ? `Updated ${new Date(snapshot.now).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}` : 'Live backend unavailable · no verified status'
}

function renderPersonalOps() {
  const ops = snapshot.personal_ops
  const root = $('#personal-ops')
  root.hidden = !ops?.agent
  if (!ops?.agent) { root.innerHTML = ''; return }
  const sources = Object.entries(ops.sources || {})
  const agentStatus = escapeHtml((ops.agent.status || 'unknown').replaceAll('_',' '))
  const evidenceReady = Object.values(ops.evidence || {}).filter(Boolean).length
  const evidenceTotal = Object.keys(ops.evidence || {}).length
  const stages = [['O','Observe','Auditor'],['O','Orient','Analyst'],['D','Decide','Planner'],['A','Act','Operator']]
  root.innerHTML = `<div class="ops-intro"><p class="eyebrow">PERSONAL OODA REPORTER</p><h2>${escapeHtml(ops.agent.name)} · ${escapeHtml(ops.agent.role)}</h2><p><strong>${agentStatus}</strong> · Local evidence ${evidenceReady}/${evidenceTotal}. External actions stay approval-gated.</p><div class="ooda-loop">${stages.map(([letter,key,role])=>`<article><b>${letter}</b><span>${key}</span><small>${role}</small></article>`).join('')}</div>${ops.focus?`<div class="ops-focus"><span>One workflow<br><strong>${escapeHtml(ops.focus.workflow)}</strong></span><span>One market<br><strong>${escapeHtml(ops.focus.market)}</strong></span><span>One recurring pain<br><strong>${escapeHtml(ops.focus.recurring_user_pain)}</strong></span></div>`:''}</div><div class="ops-sources">${sources.map(([key,value])=>`<article><span>${escapeHtml(key.replaceAll('_',' '))}</span><strong class="${value.status==='connected'?'connected':'pending'}">${escapeHtml(value.status.replaceAll('_',' '))}</strong><small>${value.last_successful_sync?`Last sync: ${escapeHtml(value.last_successful_sync)}`:'No verified sync yet'}</small></article>`).join('')}</div>`
}

function populateAssignees() {
  $('#task-assignee').innerHTML = snapshot.members.map(member => `<option value="${member.profile}">${member.name} — ${escapeHtml(member.role)}</option>`).join('')
}

async function refresh() {
  try {
    const response = await fetch('/api/status', { cache: 'no-store' })
    if (!response.ok) throw new Error(`Status ${response.status}`)
    snapshot = await response.json()
    document.body.classList.toggle('public-preview', Boolean(snapshot.public_preview))
    $('#open-review-desk').hidden = Boolean(snapshot.public_preview)
    updateReviewMembers(snapshot.members)
    renderHeader(); renderPersonalOps(); renderTeam(); renderBoard(); campus?.update(snapshot); populateAssignees()
  } catch (error) {
    snapshot = publicSnapshot()
    $('#open-review-desk').hidden = true
    updateReviewMembers(snapshot.members)
    renderHeader(); renderPersonalOps(); renderTeam(); renderBoard(); campus?.update(snapshot); populateAssignees()
    document.body.classList.add('public-preview')
  }
}

function openTaskForm(profile) {
  $('#task-form').classList.remove('hidden')
  if (profile) $('#task-assignee').value = profile
  $('#task-title').focus()
}

function activateTab(tab, focus = false) {
  $$('.tab').forEach(item => {
    const selected = item === tab
    item.classList.toggle('active', selected)
    item.setAttribute('aria-selected', String(selected)); item.tabIndex = selected ? 0 : -1
  })
  $$('.view').forEach(view => {const selected = view.id === `${tab.dataset.view}-view`; view.classList.toggle('active', selected); view.hidden = !selected})
  if (focus) tab.focus()
}
$$('.tab').forEach((tab,index,tabs) => {
  tab.addEventListener('click', () => activateTab(tab))
  tab.addEventListener('keydown', event => {
    const target = {ArrowRight:(index+1)%tabs.length,ArrowLeft:(index+tabs.length-1)%tabs.length,Home:0,End:tabs.length-1}[event.key]
    if (target !== undefined) {event.preventDefault();activateTab(tabs[target], true)}
  })
})

$('#show-task-form').addEventListener('click', () => openTaskForm())
$('#cancel-task').addEventListener('click', () => $('#task-form').classList.add('hidden'))
$('#task-form').addEventListener('submit', async (event) => {
  event.preventDefault()
  const submit = event.submitter
  submit.disabled = true
  submit.textContent = 'Creating…'
  try {
    const response = await fetch('/api/tasks', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignee: $('#task-assignee').value, title: $('#task-title').value, body: $('#task-body').value })
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || 'Could not create task')
    event.target.reset(); event.target.classList.add('hidden'); toast('Task created in Hermes Kanban'); await refresh()
  } catch (error) { toast(error.message) }
  finally { submit.disabled = false; submit.textContent = 'Create task' }
})

function tickClock() {
  $('#clock').textContent = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Singapore', hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date())
}

tickClock(); setInterval(tickClock, 1000)
refresh(); setInterval(refresh, 15000)
