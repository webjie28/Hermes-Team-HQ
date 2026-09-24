const people = [
  ['judith','Judith','Technical Research & Architecture','Lead Senior','#2f8f83',['Technical research','Architecture decisions','API evaluation','Security review'],'Gym Mon/Wed/Fri · 8:00 AM'],
  ['david','David','Product Engineer','Senior','#4f8f6b',['Requirements','User stories','Acceptance criteria','Technical writing'],'Gym Tue/Thu · 6:30 PM'],
  ['jake','Fer','Frontend Engineer','Senior','#d69b3a',['TypeScript','UI implementation','Responsive design','Accessibility'],'Sketch club Wed · 7:00 PM'],
  ['ralph','Inciong','Developer Tooling Engineer','Senior','#9366cc',['Automation','Build tooling','CLI workflows','Developer experience'],'Band practice Fri · 7:00 PM'],
  ['rick','Rick','Full-stack Engineer','Senior','#3f7cc9',['Frontend','Backend','Integration','Performance'],'Cycling Sat · 7:00 AM'],
  ['fulton','Fulton','QA & Security Engineer','Senior','#c65353',['Test automation','Root cause','Regression','Security review'],'Family night Thu · 6:30 PM'],
  ['joem','Joem','DevOps & Release Engineer','Senior','#c58435',['CI/CD','Deployments','Observability','Release control'],'Gym Mon/Wed/Fri · 6:00 PM'],
]

export function publicSnapshot() {
  const tasks = [
    {id:'public-1',assignee:'david',status:'review',title:'Product brief and acceptance criteria'},
    {id:'public-2',assignee:'jake',status:'running',title:'Responsive storefront design system'},
    {id:'public-3',assignee:'ralph',status:'running',title:'Framework scaffold and quality gates'},
    {id:'public-4',assignee:'rick',status:'ready',title:'Catalog and full-stack integration'},
    {id:'public-5',assignee:'fulton',status:'todo',title:'QA, accessibility, and security release gate'},
    {id:'public-6',assignee:'joem',status:'scheduled',title:'Release candidate and owner handoff'},
  ]
  const current = Object.fromEntries(tasks.map(task=>[task.assignee,task]))
  const members = people.map(([profile,name,role,level,color,skills,personal], index) => ({
    profile,name,role,level,color,skills,personal,shift:profile==='judith'?'night':'day',
    shift_label:profile==='judith'?'Night shift · 10:00 PM–8:00 AM':'Day shift · 8:00 AM–5:00 PM',
    state:current[profile]?.status==='running'?'working':current[profile]?.status==='review'?'review':'available',
    state_label:current[profile]?.status==='running'?'Working':current[profile]?.status==='review'?'In review':'Available',
    current_task:current[profile]||null,recorded_seconds_today:(index+2)*1560,recorded_seconds_week:(index+3)*9180,
    active_hours_week:Number((((index+3)*9180)/3600).toFixed(1)),activity:'desk',activity_label:'At workstation',
    activity_source:'Public preview',completed_tasks:index,on_shift:true,on_leave:false,
    task_elapsed_seconds:current[profile]?.status==='running'?3600+index*600:null,
  }))
  return {public_preview:true,now:new Date().toISOString(),timezone:'Asia/Singapore',
    manager:{name:'BENJIE',title:'Founder & Hermes Main',on_shift:true,activity:'desk',activity_label:'Reviewing the team',activity_source:'Public preview'},
    gateway:{state:'preview',telegram:'private'},summary:{working:2,available:4,needs_help:0,on_shift:members.length},members,tasks}
}
