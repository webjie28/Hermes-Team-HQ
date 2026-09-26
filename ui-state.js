export function promotionLabel(start = '2026-09-25', days = 30) {
  const end = new Date(`${start}T00:00:00Z`)
  end.setUTCDate(end.getUTCDate() + days - 1)
  return `${days}-day trial · ends ${end.toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric', timeZone:'UTC'})}`
}

export function teamSignature(members, publicMode) {
  return JSON.stringify([publicMode, members.map(({last_activity, task_elapsed_seconds, heartbeat_fresh, ...m}) => ({
    ...m, current_task: m.current_task && {id:m.current_task.id, status:m.current_task.status, title:m.current_task.title},
    recorded_seconds_today: Math.floor((m.recorded_seconds_today || 0) / 60),
    recorded_seconds_week: undefined,
  }))])
}
