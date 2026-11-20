import { useState } from 'react'
import Sidebar from '../../components/Sidebar/Sidebar.jsx'
import DetailDialog from '../Home/components/DetailDialog.jsx'
import ApiState from '../../components/ApiState/ApiState.jsx'
import { services } from '../../api/runtime.js'
import { useApiResource } from '../../api/useApiResource.js'
import { errorMessage } from '../../api/ApiError.js'
import { won, incomeLabels } from '../../api/format.js'
import avatar from '../../assets/common/avatar.svg'
import toggleOn from '../../assets/settings/toggle-on.svg'
import toggleOff from '../../assets/settings/toggle-off.svg'
import ExpensesDialog from './components/ExpensesDialog.jsx'
import './Settings.scss'

const tabs=[['profile','프로필'],['income','소득·상환'],['plan','요금제'],['notifications','알림'],['account','데이터·계정']]
export default function Settings({location,navigate}) {
  const tab=location.split('?')[0].split('/')[2]||'profile'
  const active=tabs.some(([id])=>id===tab)?tab:'profile'
  const financeApi=services
  const resource=useApiResource('settings:'+active,async signal=>{
    const [profile,subscription]=await Promise.all([services.profile(signal),services.subscription(signal)])
    const [finance,notifications]=await Promise.all([
      ['income','account'].includes(active)?financeApi.finance(signal).catch(error=>{if(error.code==='FINANCE_PROFILE_NOT_FOUND')return null;throw error}):null,
      active==='notifications'?services.notifications(signal):null])
    const plans=active==='income'&&finance?await services.plans(undefined,signal):null
    return {profile,finance,subscription,notifications,plans}
  })
  const [editing,setEditing]=useState(null),[draft,setDraft]=useState(''),[panel,setPanel]=useState(null),[error,setError]=useState(''),[pending,setPending]=useState(false)
  const data=resource.data
  async function mutate(action) {setPending(true);setError('');try {await action();setEditing(null);resource.reload()}catch(e){setError(errorMessage(e))}finally{setPending(false)}}
  function row(label,key,value,options={}) {
    return <div className="settings-row" key={key||label}><span className="settings-label">{label}</span>{editing===key&&key?<form className="settings-edit" onSubmit={e=>{e.preventDefault();mutate(()=>options.save(draft))}}>
      {options.choices?<select aria-label={label} value={draft} onChange={e=>setDraft(e.target.value)}>{options.choices.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select>:<input autoFocus aria-label={label} type="text" inputMode={options.numeric?'numeric':undefined} pattern={options.numeric?'[0-9]+':undefined} required value={draft} onChange={e=>setDraft(e.target.value)}/>}
      <button className="settings-button" disabled={pending}>저장</button><button className="settings-button" type="button" disabled={pending} onClick={()=>setEditing(null)}>취소</button>
    </form>:<><span className="settings-value">{value}</span>{options.toggle?<button className="settings-toggle" role="switch" aria-label={label} aria-checked={Boolean(options.checked)} disabled={pending||options.disabled} title={options.disabled&&key==='risk_signal'?'위험 신호 알림은 준비 중이에요':undefined} onClick={()=>options.onToggle?options.onToggle(!options.checked):mutate(()=>services.updateNotifications({[key]:!options.checked}))}><img src={options.checked?toggleOn:toggleOff} alt=""/></button>:options.save?<button className="settings-button" disabled={pending||options.disabled} onClick={()=>{setEditing(key);setDraft(String(options.raw??value));setError('')}}>편집</button>:options.action?<button className={'settings-button '+(options.buttonClass||'')} disabled={pending||options.disabled} title={options.disabled?'아직 사용할 수 없는 기능이에요':undefined} onClick={options.action}>{options.button}</button>:null}</>}</div>
  }
  // 로그인이 없는 익명 세션이라 로그아웃·탈퇴 API 는 쓰지 않는다. 누르면 온보딩 처음 화면으로 보낸다.
  const startOver=()=>navigate('/onboarding')
  async function exportData(){await mutate(async()=>{const {blob,filename}=await services.exportData({format:'csv'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)})}
  const financeSave=(key,value)=>financeApi.saveFinance({...data.finance,...(key==='payday'?{income_type:'REGULAR'}:{}),[key]:Number(value)})
  return <div className={'settings-shell settings-'+active}><Sidebar active="settings" plan={data?.subscription.plan_type==='PRO'?'Pro':'Free'} onNavigate={item=>navigate(item.href)}/>
    <aside className="settings-nav"><h1>설정</h1><nav aria-label="설정 메뉴">{tabs.map(([id,label])=><a key={id} href={'/settings/'+id} className={active===id?'active':''} aria-current={active===id?'page':undefined} onClick={e=>{if(!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&e.button===0){e.preventDefault();setEditing(null);setError('');navigate('/settings/'+id)}}}>{label}</a>)}</nav></aside>
    <main id="main-content" className="settings-content"><ApiState status={resource.status} error={resource.error} onRetry={resource.reload}/>
    {resource.status==='success'&&data&&<>
      <header className="settings-person"><img src={avatar} alt=""/><strong>{data.profile.name}</strong><span>{data.profile.occupation}</span></header>
      <section className="settings-section"><h2>{tabs.find(([id])=>id===active)[1]}</h2>
      {error&&<p className="inline-api-error" role="alert">{error}</p>}
      {active==='profile'&&<>{row('이름','name',data.profile.name,{save:value=>services.updateProfile({name:value})})}{row('직업','occupation',data.profile.occupation||'미입력',{raw:data.profile.occupation||'',save:value=>services.updateProfile({occupation:value})})}{row('소득 유형','income_type',incomeLabels[data.profile.income_type],{raw:data.profile.income_type,choices:Object.entries(incomeLabels),save:value=>services.updateProfile({income_type:value})})}</>}
      {active==='income'&&<>
        {row('월 실수령액','monthly_income',won(data.finance?.monthly_income),{raw:data.finance?.monthly_income,numeric:true,disabled:!data.finance,save:value=>financeSave('monthly_income',value)})}
        {row('수령일','payday',!data.finance?'—':data.finance.income_type==='REGULAR'?'매월 '+data.finance.payday+'일':'미지정',{raw:data.finance?.payday??'',numeric:true,disabled:!data.finance,save:value=>financeSave('payday',value)})}
        {row('불규칙 소득','irregular_income',!data.finance?'—':data.finance.income_type==='IRREGULAR'?'켬':'끔',{toggle:true,disabled:!data.finance,checked:data.finance?.income_type==='IRREGULAR',onToggle:checked=>{if(checked)mutate(()=>financeApi.saveFinance({...data.finance,income_type:'IRREGULAR',payday:null}));else{setError('');setDraft('');setEditing('payday')}}})}
        {row('월 목표 상환액',null,won(data.plans?.aggregate?.monthly_total_amount),{button:'편집',disabled:!data.finance,action:()=>navigate('/loans/plan/edit')})}
      </>}
      {active==='plan'&&<>{row('현재 요금제',null,data.subscription.plan_type==='PRO'?'PRO':'무료')}{data.subscription.plan_type==='PRO'?row('PRO 요금제',null,'이용 중'):row('PRO 요금제',null,'월 4,900원(예시)',{button:pending?'변경 중…':'업그레이드',buttonClass:'primary',action:()=>mutate(()=>services.updateSubscription('PRO'))})}</>}
      {active==='notifications'&&<>{row('납부 예정일','payment_due','3일 전',{toggle:true,checked:data.notifications.payment_due})}{row('위험 신호','risk_signal','',{toggle:true,checked:false,disabled:true})}{row('상환 리포트 업데이트 알림','report_update','',{toggle:true,checked:data.notifications.report_update})}</>}
      {active==='account'&&<>{row('지출 입력',null,'직접 입력',{button:'편집',disabled:!data.finance,action:()=>setPanel('expenses')})}{row('데이터 내보내기',null,'',{button:'내보내기',action:exportData})}{row('로그아웃',null,'',{button:'로그아웃',action:startOver})}{row('회원 탈퇴',null,'',{button:'탈퇴하기',buttonClass:'text',action:startOver})}</>}
      </section></>}
    </main>
    {panel==='expenses'?<ExpensesDialog finance={data.finance} pending={pending} error={error} onClose={()=>!pending&&setPanel(null)} onSave={values=>mutate(async()=>{await financeApi.saveFinance(values);setPanel(null)})}/>:panel&&<DetailDialog title={panel} onClose={()=>setPanel(null)}/>}
  </div>
}
