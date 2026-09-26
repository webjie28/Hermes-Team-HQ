import { promotionLabel } from './ui-state.js'
const people = [
  ['judith','Judith','Research, Architecture & Documentation','Lead Senior','#2f8f83',['Technical research','Architecture decisions','Security review','Documentation','Knowledge management'],'Gym Mon/Wed/Fri · 8:00 AM'],
  ['david','David','Product Engineer','Senior','#4f8f6b',['Requirements','User stories','Acceptance criteria','Technical writing'],'Gym Tue/Thu · 6:30 PM'],
  ['jake','Fer','Frontend Engineer','Senior','#d69b3a',['TypeScript','UI implementation','Responsive design','Accessibility'],'Sketch club Wed · 7:00 PM'],
  ['ralph','Inciong','Developer Tooling Engineer','Senior','#9366cc',['Automation','Build tooling','CLI workflows','Developer experience'],'Band practice Fri · 7:00 PM'],
  ['rick','Rick','Full-stack Engineer','Senior','#3f7cc9',['Frontend','Backend','Integration','Performance'],'Cycling Sat · 7:00 AM'],
  ['fulton','Fulton','QA & Security Engineer','Senior','#c65353',['Test automation','Root cause','Regression','Security review'],'Family night Thu · 6:30 PM'],
  ['joem','Joem','DevOps & Release Engineer','Senior','#c58435',['CI/CD','Deployments','Observability','Release control'],'Gym Mon/Wed/Fri · 6:00 PM'],
  ['red','Red','Junior UI/UX Designer','Trainee · Zero to Hero','#9f4e45',['Figma learning','Wireframing','HTML/CSS','Design fundamentals','Implementation QA'],'Mentor: Espina · 30-day trial'],
  ['espina','Espina','UI/UX & Design Systems Designer','Senior · Parent Agent','#b07698',['Design systems','Interaction design','Prototyping','Accessibility','Mentoring','Promotion review'],'Mentors Red and Marielle'],
  ['marielle','Marielle','Junior UI/UX Designer','Trainee · Zero to Hero','#4f8295',['Figma learning','User flows','HTML/CSS','Usability checks','Design QA'],'Mentor: Espina · 30-day trial'],
]

function singaporeShift(shift) {
  return {on:true,label:'Project sprint · task-based'}
}

export function publicSnapshot() {
  const tasks = []
  const current = Object.fromEntries(tasks.map(task=>[task.assignee,task]))
  const members = people.map(([profile,name,role,level,color,skills,personal], index) => {
    const shift = 'project', shiftState = singaporeShift(shift)
    return ({
    profile,name,role,level,color,skills,personal,gender:['judith','marielle'].includes(profile)?'female':'male',shift,
    mentor:['red','marielle'].includes(profile)?'Espina':null,
    promotion_track:['red','marielle'].includes(profile)?promotionLabel():null,
    children:profile==='espina'?['Red','Marielle']:null,
    shift_label:'Project sprint · task-based',
    state:'idle',
    state_label:'Live status unavailable',
    current_task:current[profile]||null,recorded_seconds_today:null,recorded_seconds_week:null,
    active_hours_week:null,activity:'desk',activity_label:'At workstation',
    activity_source:'Public preview',completed_tasks:0,on_shift:shiftState.on,on_leave:false,
    task_elapsed_seconds:current[profile]?.status==='running'?3600+index*600:null,
  })})
  const managerShift = singaporeShift('project')
  return {public_preview:true,now:null,timezone:'Asia/Singapore',
    manager:{name:'BENJIE',title:'Founder & Hermes Main',on_shift:managerShift.on,activity:managerShift.on?'desk':'sleep',activity_label:'Live status unavailable',activity_source:'Public preview'},
    project:{name:'Property Discovery & Location Intelligence SaaS',slug:'property-location-intelligence',plan:{
      estimate:{business_days:7,start:'2026-09-28',target_finish:'2026-10-06'},
      governance:{approval_window_hours:24,release_approver:'BENJIE',unapproved_outputs_go_to_inbox:true},
      milestones:[
        {days:'1',dates:'Sep 28',name:'Lock scope, architecture, data sources, privacy, and acceptance criteria',owners:['Judith','David'],gate:'BENJIE approves scope and GIS disclaimers'},
        {days:'2',dates:'Sep 29',name:'PostGIS schema, API, UX, design system, and scaffold',owners:['Judith','David','Espina','Red','Marielle','Inciong'],gate:'Architecture and design review'},
        {days:'3',dates:'Sep 30',name:'Authentication, roles, protected routes, and listing creation',owners:['Fer','Rick','Fulton'],gate:'Secure seller-to-listing demo'},
        {days:'4',dates:'Oct 1',name:'Map discovery, search, property details, and images',owners:['Fer','Rick','Espina'],gate:'Buyer finds and opens a mapped property'},
        {days:'5',dates:'Oct 2',name:'Basic GIS report, nearby places, favorites, inquiries, and moderation',owners:['Judith','Rick','David','Fulton'],gate:'Complete vertical slice with sources and limitations'},
        {days:'6',dates:'Oct 5',name:'Integration, responsive QA, GIS accuracy, security, and fixes',owners:['Fulton','Fer','Rick','Red','Marielle'],gate:'QA and security evidence accepted'},
        {days:'7',dates:'Oct 6',name:'Final fixes, docs, release candidate, rollback, and handoff',owners:['Joem','Judith','Fulton'],gate:'BENJIE approves, holds, or rejects release'}
      ]
    }},
    personal_ops:null,
    gateway:{state:'preview',telegram:'private'},summary:{working:members.filter(m=>m.state==='working').length,available:members.filter(m=>m.state==='available').length,needs_help:members.filter(m=>m.state==='blocked').length,on_shift:members.filter(m=>m.on_shift).length},members,tasks}
}
