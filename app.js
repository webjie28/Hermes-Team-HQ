const $ = (selector) => document.querySelector(selector)
import { updateReviewMembers } from './review-ui.js?v=12'
import { publicSnapshot } from './public-demo.js?v=1'
const $$ = (selector) => [...document.querySelectorAll(selector)]
let snapshot = null
let campus = null
import('./campus.js?v=14').then(({ Campus }) => {
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
  return `<article class="member-card" style="--member-color:${member.color}">
    <div class="member-top"><div class="avatar">${member.name.slice(0, 1)}</div><div><h3 class="member-name">${member.name}</h3><p class="member-role">${escapeHtml(member.role)} · ${escapeHtml(member.level)}</p></div></div>
    <div class="status-pill ${member.state}">${member.state_label}</div>
    <p class="task-line">${taskText}</p>
    <div class="skill-list">${member.skills.map(skill => `<span>${escapeHtml(skill)}</span>`).join('')}</div>
    <p class="life-line">◷ ${escapeHtml(member.personal)}</p>
    <div class="member-stats"><div><span>Recorded work today</span><strong>${Math.floor((member.recorded_seconds_today || 0) / 3600)}h ${Math.floor((member.recorded_seconds_today || 0) % 3600 / 60)}m</strong></div><div><span>Recorded this week</span><strong>${member.active_hours_week}h</strong></div></div>
    <div class="card-actions">${member.telegram_url?`<a href="${member.telegram_url}" target="_blank" rel="noreferrer">Telegram desk</a>`:''}<button data-leave="${member.profile}">Set leave</button><button data-assign="${member.profile}">Assign task</button></div>
  </article>`
}

function renderTeam() {
  $('#team-grid').innerHTML = snapshot.members.map(memberCard).join('')
  document.querySelectorAll('.member-card').forEach((card,index)=>{const b=document.createElement('button');b.textContent='Review work & access';b.onclick=()=>document.dispatchEvent(new CustomEvent('worker-review',{detail:snapshot.members[index].profile}));card.querySelector('.card-actions').prepend(b)})
  if(snapshot.public_preview) document.querySelectorAll('[data-leave],[data-assign]').forEach(button=>button.disabled=true)
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
  $('#last-refresh').textContent = `Updated ${new Date(snapshot.now).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
}

function populateAssignees() {
  $('#task-assignee').innerHTML = snapshot.members.map(member => `<option value="${member.profile}">${member.name} — ${escapeHtml(member.role)}</option>`).join('')
}

async function refresh() {
  try {
    const response = await fetch('/api/status', { cache: 'no-store' })
    if (!response.ok) throw new Error(`Status ${response.status}`)
    snapshot = await response.json()
    updateReviewMembers(snapshot.members)
    renderHeader(); renderTeam(); renderBoard(); campus?.update(snapshot); populateAssignees()
  } catch (error) {
    snapshot = publicSnapshot()
    updateReviewMembers(snapshot.members)
    renderHeader(); renderTeam(); renderBoard(); campus?.update(snapshot); populateAssignees()
    document.body.classList.add('public-preview')
  }
}

function openTaskForm(profile) {
  $('#task-form').classList.remove('hidden')
  if (profile) $('#task-assignee').value = profile
  $('#task-title').focus()
}

$$('.tab').forEach(tab => tab.addEventListener('click', () => {
  $$('.tab').forEach(item => item.classList.toggle('active', item === tab))
  $$('.view').forEach(view => view.classList.toggle('active', view.id === `${tab.dataset.view}-view`))
}))

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
