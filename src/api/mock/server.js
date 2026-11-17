import fixtures from './specFixtures.js'

// This module simulates the backend. Financial forecasts are fixture values,
// not a production financial calculator. Components never calculate forecasts.
export function createMockServer({ storage, delay = 120 } = {}) {
  const copy = value => structuredClone(value)
  const example = key => copy(fixtures[key]?.data)
  const seedLoan = example('GET /api/loans/{loan_id}/')
  const seed = {
    profile: example('GET /api/users/me/'), finance: example('GET /api/budgets/profile/'),
    notifications: example('GET /api/settings/notifications/'), loans: [seedLoan],
    payments: [], plans: example('GET /api/repayment-plans/').plans, savings:[], confirmations:{}, allocations:{},
  }
  let state = seed
  try { const saved = JSON.parse(storage?.getItem('loanrun.mock-api.v2') || 'null'); if(saved?.version===2)state=saved.data } catch { /* Storage is optional. */ }
  state.savings??=[];state.confirmations??={};state.allocations??={}
  let revision=0
  const persist = () => { revision++;try { storage?.setItem('loanrun.mock-api.v2', JSON.stringify({version:2,data:state})) } catch { /* Session still works. */ } }
  const sum = (rows,key) => rows.reduce((a,r)=>a+(r[key]||0),0)
  const response = (key,data,status=200) => Response.json({...fixtures[key],data},{status})
  const failure = (code,message,errors={},status=400) => Response.json({success:false,code,message,errors},{status})
  const idempotent = new Map()
  const previews=new Map()
  function savingsFor(loan,month='2026-11') {
    const records=state.savings.filter(s=>s.loan_id===loan.loan_id)
    const balance=Math.max(0,(loan.initial_savings_balance||0)+sum(records,'amount')-sum(state.payments.filter(p=>p.loan_id===loan.loan_id),'savings_used_amount'))
    const plan=state.plans.find(p=>p.loan_id===loan.loan_id)
    const required=loan.required_monthly_saving||example('GET /api/repayment-savings/').required_monthly_saving
    return {loan_id:loan.loan_id,savings_balance:balance,required_monthly_saving:required,planned_saving_amount:plan?.planned_saving_amount||required,actual_saving_amount:sum(records.filter(s=>s.saved_at.startsWith(month)),'amount'),saving_progress_pct:loan.remaining_principal?balance/loan.remaining_principal*100:null,remaining_principal:loan.remaining_principal,results:records.toSorted((a,b)=>b.saved_at.localeCompare(a.saved_at))}
  }
  function loanFields(loan){const savings=loan.repayment_method==='BULLET'?savingsFor(loan):null;return {...loan,savings_balance:savings?.savings_balance||0,required_monthly_saving:savings?.required_monthly_saving||0}}
  const planFor = loan => {
    const plan=state.plans.find(p=>p.loan_id===loan.loan_id)
    if(!plan)return undefined
    const extra=sum(state.payments.filter(p=>p.loan_id===loan.loan_id&&p.paid_at.startsWith('2026-11')),'extra_amount')
    const saving=loan.repayment_method==='BULLET'?savingsFor(loan):{}
    const {results,...savingFields}=saving
    void results
    return {...plan,...savingFields,...(loan.repayment_method==='BULLET'?{cumulative_actual_saving_amount:sum(state.savings.filter(s=>s.loan_id===loan.loan_id),'amount')}:{}),actual_extra_amount:extra,extra_gap_amount:extra-(plan.planned_extra_amount||0)}
  }
  function schedule(month,loanId) {
    const loans=state.loans.filter(l=>l.status!=='PAID'&&l.remaining_principal>0&&(!loanId || l.loan_id===loanId))
    const due_items=loans.map(l=>{
      const base=l.next_payment || seedLoan.next_payment
      const payments=state.payments.filter(p=>p.loan_id===l.loan_id && p.paid_at.startsWith(month))
      const regular=payments.filter(p=>p.payment_type==='REGULAR').reduce((n,p)=>n+(p.principal_amount||0)+(p.interest_amount||0),0)
      const extra=sum(payments,'extra_amount'), required=l.contractual_monthly_payment ?? l.estimated_monthly_payment
      const planned=planFor(l)?.extra_monthly_payment || 0
      const outstanding=Math.max(0,required-regular)
      const day=Math.min(l.payment_day,new Date(Number(month.slice(0,4)),Number(month.slice(5)),0).getDate())
      const saving=l.repayment_method==='BULLET'?savingsFor(l,month):null
      const unpaid=state.confirmations[month+':'+(l.loan_id+20)]===true
      const dueDate=`${month}-${String(day).padStart(2,'0')}`
      const status=outstanding===0?'PAID':regular?'PARTIAL':unpaid?'UNPAID':'UPCOMING'
      return {...base,loan_id:l.loan_id,due_item_id:l.loan_id+20,product_name:l.product_name,due_date:dueDate,required_amount:required,planned_extra_amount:planned,paid_required_amount:Math.min(required,regular),paid_extra_amount:extra,outstanding_amount:outstanding,status,display_status:status,unpaid_confirmed:unpaid,planned_saving_amount:saving?.planned_saving_amount||0,actual_saving_amount:saving?.actual_saving_amount||0,total_planned_amount:required+planned,remaining_extra_amount:Math.max(0,planned-extra)}
    })
    return {month,due_items,calendar_events:due_items.map(d=>({date:d.due_date,type:'REGULAR_DUE',loan_id:d.loan_id,due_item_id:d.due_item_id,amount:d.required_amount})),monthly_totals:{scheduled_repayment:sum(due_items,'required_amount'),actual_repayment:sum(due_items,'paid_required_amount'),remaining_required_amount:sum(due_items,'outstanding_amount'),planned_extra_amount:sum(due_items,'planned_extra_amount'),actual_extra_amount:sum(due_items,'paid_extra_amount'),planned_saving_amount:sum(due_items,'planned_saving_amount'),actual_saving_amount:sum(due_items,'actual_saving_amount'),completed_count:due_items.filter(d=>d.status==='PAID').length,total_count:due_items.length,remaining_amount:sum(due_items,'outstanding_amount')}}
  }
  function propose(inputs) {
    return inputs.map(input=>{
      const loan=state.loans.find(l=>l.loan_id===input.loan_id)
      const old=planFor(loan) || seedLoan.plan
      const fixture=example('POST /api/repayment-plans/preview/').proposed_plans[0]
      const extra=input.mode==='EXTRA_AMOUNT'?input.extra_monthly_payment:input.mode==='MATURITY'?0:input.mode==='PREFERENCE'?({FAST:150000,BALANCED:100000,STABLE:0}[input.preference]):fixture.extra_monthly_payment
      return {...old,...fixture,...input,extra_monthly_payment:extra,monthly_amount:(loan.contractual_monthly_payment||0)+extra,target_payoff_date:input.target_date || fixture.target_payoff_date,projected_payoff_date:input.target_date || fixture.projected_payoff_date,estimated_payoff_date:input.target_date || fixture.estimated_payoff_date,planned_extra_amount:extra}
    })
  }
  async function dispatch(url,init={}) {
    if(init.signal?.aborted)throw new DOMException('Aborted','AbortError')
    await new Promise((resolve,reject)=>{const timer=setTimeout(resolve,delay);init.signal?.addEventListener('abort',()=>{clearTimeout(timer);reject(new DOMException('Aborted','AbortError'))},{once:true})})
    const parsed=new URL(url,'http://mock.local'),path=parsed.pathname,query=parsed.searchParams,method=init.method||'GET'
    const key=method+' '+path,headers=new Headers(init.headers)
    if(!headers.get('Authorization')?.startsWith('Bearer '))return failure('AUTH_REQUIRED','로그인이 필요합니다.',{},401)
    let body={};try{if(init.body)body=JSON.parse(init.body)}catch{return failure('VALIDATION_ERROR','JSON 형식을 확인해 주세요.')}
    const loanId=Number(query.get('loan_id')) || null
    if(key==='GET /api/plans/overall/'){
      if(state.profile.plan_type==='FREE')return response(key,{state:'LOCKED'})
      const base=example(key),active=state.loans.filter(l=>l.status!=='PAID'&&l.remaining_principal>0)
      const allocations=active.map((l,i)=>({loan_id:l.loan_id,product_name:l.product_name,amount:l.repayment_method==='BULLET'?planFor(l)?.planned_saving_amount||0:planFor(l)?.planned_extra_amount||0,priority:i+1,allocation_type:l.repayment_method==='BULLET'?'REPAYMENT_SAVING':'EXTRA_PAYMENT',projected_payoff_date:planFor(l)?.projected_payoff_date||null,target_payoff_date:planFor(l)?.target_payoff_date||null,actual_amount:0}))
      const current=state.allocations['2026-11']?.allocations
      const recommended=[...allocations.filter(a=>a.allocation_type==='REPAYMENT_SAVING'),...allocations.filter(a=>a.allocation_type!=='REPAYMENT_SAVING')]
      const changed=current&&JSON.stringify(current.map(a=>[a.loan_id,a.amount]))!==JSON.stringify(recommended.map(a=>[a.loan_id,a.amount]))
      return response(key,{...base,allocations,strategy_code:changed?'MANUAL':base.strategy_code,projected_payoff_date:allocations.map(a=>a.projected_payoff_date).filter(Boolean).sort().at(-1)||null})
    }
    // Final Figma permits over-budget saves. This demo deliberately differs from
    // the supplied contract's balanced-total rule; the real API remains authoritative.
    const budgetPath=path.match(/^\/api\/budgets\/(\d{4}-\d{2})\/(allocation\/)?$/)
    if(budgetPath){
      const ym=budgetPath[1],base=example('GET /api/budgets/{year_month}/')
      const planned=state.loans.filter(l=>l.status!=='PAID'&&l.remaining_principal>0).map(l=>({loan_id:l.loan_id,amount:l.repayment_method==='BULLET'?planFor(l)?.planned_saving_amount||0:planFor(l)?.planned_extra_amount||0,allocation_type:l.repayment_method==='BULLET'?'REPAYMENT_SAVING':'EXTRA_PAYMENT'}))
      if(method==='GET')return response('GET /api/budgets/{year_month}/',{...base,year_month:ym,allocation:state.allocations[ym]||{allocations:planned,reserve_amount:Math.max(0,base.available_cash-sum(planned,'amount')),total_allocated:sum(planned,'amount')}})
      if(method==='PUT'&&budgetPath[2]){
        const rows=body.allocations
        if(!headers.get('Idempotency-Key')||!Array.isArray(rows)||new Set(rows.map(r=>r.loan_id)).size!==rows.length||!Number.isSafeInteger(body.reserve_amount)||body.reserve_amount<0)return failure('VALIDATION_ERROR','배분 정보를 확인해 주세요.')
        if(rows.some(r=>{const l=state.loans.find(l=>l.loan_id===r.loan_id);return !l||l.status==='PAID'||!Number.isSafeInteger(r.amount)||r.amount<0||!['EXTRA_PAYMENT','REPAYMENT_SAVING'].includes(r.allocation_type)||((r.allocation_type==='REPAYMENT_SAVING')!==(l.repayment_method==='BULLET'))||(r.allocation_type==='EXTRA_PAYMENT'&&r.amount>l.remaining_principal)}))return failure('VALIDATION_ERROR','배분 금액과 대출을 확인해 주세요.')
        state.allocations[ym]={allocations:rows,reserve_amount:body.reserve_amount,total_allocated:sum(rows,'amount')+body.reserve_amount};persist()
        return response('PUT /api/budgets/{year_month}/allocation/',{...example('PUT /api/budgets/{year_month}/allocation/'),year_month:ym,available_cash:base.available_cash,allocation:state.allocations[ym],strategy_code:'MANUAL'})
      }
    }
    const savingPath=path.match(/^\/api\/repayment-savings\/(?:(\d+)\/)?$/)
    if(savingPath){
      const existing=state.savings.find(s=>s.saving_id===Number(savingPath[1]))
      const loan=state.loans.find(l=>l.loan_id===(method==='GET'?loanId:method==='POST'?body.loan_id:existing?.loan_id))
      if(!loan||loan.repayment_method!=='BULLET')return failure('VALIDATION_ERROR','만기일시 대출을 선택해 주세요.')
      if(method==='GET')return response('GET /api/repayment-savings/',savingsFor(loan))
      if(!headers.get('Idempotency-Key'))return failure('VALIDATION_ERROR','중복 방지 키가 필요합니다.')
      if(!['POST','PATCH','DELETE'].includes(method))return failure('NOT_FOUND','지원되지 않는 API입니다.',{},404)
      const updated={...existing,...body}
      if(method!=='DELETE'&&(!Number.isSafeInteger(updated.amount)||updated.amount<1||!/^\d{4}-\d{2}-\d{2}$/.test(updated.saved_at)||updated.saved_at>new Date().toISOString().slice(0,10)))return failure('VALIDATION_ERROR','적립 날짜와 금액을 확인해 주세요.')
      const reduction=method==='DELETE'?existing.amount:method==='PATCH'?existing.amount-updated.amount:0
      if(reduction>savingsFor(loan).savings_balance)return failure('VALIDATION_ERROR','이미 사용한 적립금은 삭제하거나 줄일 수 없어요.')
      let saving
      if(method==='POST'){saving={loan_id:loan.loan_id,saving_id:Math.max(60,...state.savings.map(s=>s.saving_id))+1,saved_at:body.saved_at,amount:body.amount,editable:true,created_at:new Date().toISOString()};state.savings.push(saving)}
      if(method==='PATCH'){saving=Object.assign(existing,{saved_at:updated.saved_at,amount:updated.amount})}
      if(method==='DELETE')state.savings=state.savings.filter(s=>s!==existing)
      persist();const {results,...summary}=savingsFor(loan);void results
      return response(method+' /api/repayment-savings/'+(method==='POST'?'':'{saving_id}/'),{...summary,...(method==='DELETE'?{saving_id:existing.saving_id,deleted:true}:{saving}),report_stale:true},method==='POST'?201:200)
    }
    const confirmation=path.match(/^\/api\/payments\/schedule\/(\d+)\/confirmation\/$/)
    if(confirmation&&method==='PATCH'){
      if(typeof body.unpaid_confirmed!=='boolean'||!headers.get('Idempotency-Key'))return failure('VALIDATION_ERROR','확인 상태와 중복 방지 키가 필요합니다.')
      const item=schedule('2026-11').due_items.find(d=>d.due_item_id===Number(confirmation[1]))
      if(!item)return failure('NOT_FOUND','납부 일정을 찾을 수 없습니다.',{},404)
      state.confirmations['2026-11:'+item.due_item_id]=body.unpaid_confirmed;persist()
      return response('PATCH /api/payments/schedule/{due_item_id}/confirmation/',{...schedule('2026-11').due_items.find(d=>d.due_item_id===item.due_item_id),report_stale:true})
    }
    if(path==='/api/users/me/') {
      if(method==='GET')return response(key,state.profile)
      if(method==='PATCH'){if(body.name!==undefined&&(!body.name.trim()||body.name.length>50))return failure('VALIDATION_ERROR','이름을 확인해 주세요.',{name:['1~50자로 입력해 주세요.']});state.profile={...state.profile,...body};persist();return response(key,state.profile)}
      if(method==='DELETE'){if(body.confirm!==true)return failure('VALIDATION_ERROR','탈퇴 확인이 필요합니다.');state=copy(seed);persist();return response(key,{deleted:true})}
    }
    for(const [endpoint,field] of [['/api/budgets/profile/','finance'],['/api/settings/notifications/','notifications']])if(path===endpoint){
      if(method==='GET')return response(key,state[field])
      if(method==='PATCH'||method==='PUT'){
        if(field==='finance' && (!Number.isInteger(body.monthly_income)||body.monthly_income<0 || (body.income_type==='REGULAR'&&(!Number.isInteger(body.payday)||body.payday<1||body.payday>31))))return failure('VALIDATION_ERROR','금액과 수령일을 확인해 주세요.')
        state[field]={...state[field],...body};if(field==='finance')state.finance.essential_expenses=body.fixed_essential_expenses+body.variable_essential_expenses;persist();return response(key,state[field])
      }
    }
    if(key==='GET /api/loans/'){
      const status=query.get('status')||'ACTIVE',loans=state.loans.filter(l=>status==='ALL'||(status==='PAID'?(l.status==='PAID'||l.remaining_principal===0):(l.status!=='PAID'&&l.remaining_principal>0)))
      return response(key,{...example(key),loans:loans.map(loanFields),count:loans.length,total_remaining_principal:sum(loans,'remaining_principal'),total_monthly_due:sum(loans,'estimated_monthly_payment'),estimated_payoff_date:loans.length?state.plans.map(p=>p.estimated_payoff_date).sort().at(-1)||null:null})
    }
    if(key==='POST /api/loans/' || key==='POST /api/loans/preview/'){
      if(!body.institution_name || !body.product_name || body.original_principal<=0 || body.remaining_principal<0 || body.remaining_principal>body.original_principal || body.annual_rate<0 || body.annual_rate>=30 || body.start_date>new Date().toISOString().slice(0,10) || body.maturity_date<=body.start_date || body.payment_day<1 || body.payment_day>31)return failure('VALIDATION_ERROR','대출 입력값을 확인해 주세요.')
      if(path.endsWith('/preview/')){
        const estimated=body.contractual_monthly_payment??example(key).estimated_monthly_payment
        const interest=body.repayment_method==='BULLET'?estimated:Math.min(estimated,example(key).estimated_next_interest)
        return response(key,{...example(key),contractual_monthly_payment:body.contractual_monthly_payment,estimated_monthly_payment:estimated,estimated_next_principal:estimated-interest,estimated_next_interest:interest})
      }
      if(state.loans.length>=7)return failure('LOAN_LIMIT_EXCEEDED','대출은 최대 7개까지 등록할 수 있습니다.',{},409)
      const id=Math.max(0,...state.loans.map(l=>l.loan_id))+1
      const loan={...copy(seedLoan),...body,loan_id:id,estimated_monthly_payment:body.contractual_monthly_payment??280000,paid_principal:body.original_principal-body.remaining_principal,progress_percent:Math.round((body.original_principal-body.remaining_principal)/body.original_principal*10000)/100,plan:null,next_payment:null}
      state.loans.push(loan)
      state.plans.push({...copy(seedLoan.plan),loan_id:id,mode:'MATURITY',extra_monthly_payment:0,planned_extra_amount:0,monthly_amount:body.contractual_monthly_payment,target_payoff_date:body.maturity_date,projected_payoff_date:body.maturity_date,estimated_payoff_date:body.maturity_date})
      persist();return response(key,loan,201)
    }
    const detail=path.match(/^\/api\/loans\/(\d+)\/(rate-history\/)?$/)
    if(detail){const loan=state.loans.find(l=>l.loan_id===Number(detail[1]));if(!loan)return failure('LOAN_NOT_FOUND','대출을 찾을 수 없습니다.',{},404)
      if(detail[2])return response('GET /api/loans/{loan_id}/rate-history/',{loan_id:loan.loan_id,rates:loan.loan_id===1?example('GET /api/loans/{loan_id}/rate-history/').rates:[]})
      if(method==='GET')return response('GET /api/loans/{loan_id}/',{...loanFields(loan),next_payment:schedule('2026-11',loan.loan_id).due_items[0]||null,plan:planFor(loan)||null})
      if(method==='PATCH'){
        Object.assign(loan,body);persist();return response('PATCH /api/loans/{loan_id}/',loan)
      }
      if(method==='DELETE'){
        state.loans=state.loans.filter(l=>l.loan_id!==loan.loan_id)
        state.plans=state.plans.filter(p=>p.loan_id!==loan.loan_id)
        state.payments=state.payments.filter(p=>p.loan_id!==loan.loan_id)
        state.savings=state.savings.filter(s=>s.loan_id!==loan.loan_id)
        persist();return response('DELETE /api/loans/{loan_id}/',{loan_id:loan.loan_id,deleted:true})
      }
    }
    if(key==='GET /api/payments/schedule/')return response(key,schedule(query.get('month')||'2026-11',loanId))
    const payments=state.payments.filter(p=>(!loanId||p.loan_id===loanId)&&(!query.get('start_date')||p.paid_at>=query.get('start_date'))&&(!query.get('end_date')||p.paid_at<=query.get('end_date')))
    if(key==='GET /api/payments/'){
      const page=Number(query.get('page'))||1,page_size=Number(query.get('page_size'))||20
      return response(key,{count:payments.length,page,page_size,next_page:page*page_size<payments.length?page+1:null,previous_page:page>1?page-1:null,results:payments.toSorted((a,b)=>b.paid_at.localeCompare(a.paid_at)).slice((page-1)*page_size,page*page_size),totals:Object.fromEntries(['amount','principal_amount','interest_amount','extra_amount'].map(k=>[k,sum(payments,k)]))})
    }
    if(key==='POST /api/payments/'){
      const loan=state.loans.find(l=>l.loan_id===body.loan_id)
      if(!loan)return failure('LOAN_NOT_FOUND','대출을 찾을 수 없습니다.',{},404)
      if(!Number.isSafeInteger(body.amount)||body.amount<=0||!/^\d{4}-\d{2}-\d{2}$/.test(body.paid_at)||body.paid_at>new Date().toISOString().slice(0,10)||!['REGULAR','EXTRA'].includes(body.payment_type))return failure('VALIDATION_ERROR','납부일과 금액을 확인해 주세요.')
      if(body.payment_type==='REGULAR'&&body.due_item_id!==loan.loan_id+20)return failure('VALIDATION_ERROR','정기 납부 일정을 선택해 주세요.')
      const idem=headers.get('Idempotency-Key');if(!idem)return failure('VALIDATION_ERROR','중복 방지 키가 필요합니다.')
      if(idempotent.has(idem))return idempotent.get(idem).clone()
      // Fixed sample allocation represents a backend response; not a finance rule.
      const previous=state.payments.filter(p=>p.loan_id===loan.loan_id&&p.paid_at.startsWith(body.paid_at.slice(0,7)))
      const remainingRequired=schedule(body.paid_at.slice(0,7),loan.loan_id).due_items[0].outstanding_amount
      const basic=body.payment_type==='EXTRA'?0:Math.min(body.amount,remainingRequired)
      const interest=Math.min(basic,Math.max(0,30000-sum(previous,'interest_amount')))
      const parts=['principal_amount','extra_amount','interest_amount','fee_amount']
      const manual=parts.some(k=>body[k]!=null)
      if(manual&&(parts.some(k=>!Number.isSafeInteger(body[k])||body[k]<0)||parts.reduce((n,k)=>n+body[k],0)!==body.amount))return failure('VALIDATION_ERROR','원금·이자·수수료 합계가 납부 총액과 같아야 해요.')
      const principal=manual?body.principal_amount:basic-interest
      const extra=manual?body.extra_amount:body.amount-basic
      const actualInterest=manual?body.interest_amount:interest
      const fee=manual?body.fee_amount:0,savingsUsed=body.savings_used_amount||0
      if(savingsUsed<0||!Number.isSafeInteger(savingsUsed)||savingsUsed>principal+extra||(savingsUsed>0&&(loan.repayment_method!=='BULLET'||savingsUsed>savingsFor(loan).savings_balance)))return failure('VALIDATION_ERROR','사용할 적립금을 확인해 주세요.')
      if(principal+extra>loan.remaining_principal)return failure('VALIDATION_ERROR','잔액을 초과해 납부할 수 없습니다.')
      const payment={...body,payment_id:Math.max(50,...state.payments.map(p=>p.payment_id))+1,principal_amount:principal,interest_amount:actualInterest,extra_amount:extra,fee_amount:fee,savings_used_amount:savingsUsed,created_at:new Date().toISOString()}
      state.payments.push(payment);loan.remaining_principal-=principal+extra;loan.paid_principal+=principal+extra;loan.progress_percent=Math.round(loan.paid_principal/loan.original_principal*10000)/100;loan.status=loan.remaining_principal===0?'PAID':'ACTIVE';persist()
      const result=response(key,{...example(key),payment,remaining_principal:loan.remaining_principal,updated_schedule:schedule(body.paid_at.slice(0,7),loan.loan_id).due_items[0],updated_plan:planFor(loan)||null,report_stale:true},201)
      idempotent.set(idem,result.clone());return result
    }
    if(key==='GET /api/payments/monthly-summary/'){
      const start=query.get('from_month')||'2026-06',end=query.get('to_month')||'2026-11',months=[]
      let cursor=start;while(cursor<=end&&months.length<120){const rows=payments.filter(p=>p.paid_at.startsWith(cursor));const target=schedule(cursor,loanId).due_items.reduce((a,d)=>a+d.total_planned_amount,0);months.push({year_month:cursor,target_amount:target,actual_amount:rows.length?sum(rows,'amount'):null,principal_amount:rows.length?sum(rows,'principal_amount'):null,interest_amount:rows.length?sum(rows,'interest_amount'):null,extra_amount:rows.length?sum(rows,'extra_amount'):null,difference:rows.length?sum(rows,'amount')-target:null,payment_count:rows.length,data_status:rows.length?'RECORDED':'INSUFFICIENT'});const d=new Date(cursor+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+1);cursor=d.toISOString().slice(0,7)}
      for(const row of months){const loans=state.loans.filter(l=>l.repayment_method==='BULLET'&&(!loanId||l.loan_id===loanId));const saved=state.savings.filter(r=>(!loanId||r.loan_id===loanId)&&r.saved_at.startsWith(row.year_month));const targets=loans.map(l=>{const p=planFor(l);return p?.effective_date?.slice(0,7)<=row.year_month?p.planned_saving_amount:null});row.planned_saving_amount=targets.length&&targets.every(t=>t!=null)?targets.reduce((n,t)=>n+t,0):null;row.actual_saving_amount=saved.length?sum(saved,'amount'):null;row.observed=row.year_month<'2026-11'&&saved.length>0;}return response(key,{months})
    }
    if(key==='GET /api/repayment-plans/'){
      const loans=state.loans.filter(l=>!loanId||l.loan_id===loanId),plans=loans.map(planFor).filter(Boolean),base=example(key)
      return response(key,{...base,plans,aggregate:plans.length?{...base.aggregate,remaining_principal:sum(loans,'remaining_principal'),monthly_basic_amount:sum(loans,'contractual_monthly_payment'),monthly_extra_amount:sum(plans,'extra_monthly_payment'),monthly_total_amount:sum(plans,'monthly_amount'),estimated_payoff_date:plans.map(p=>p.estimated_payoff_date).sort().at(-1)}:null,progress:{...base.progress,paid_principal:sum(loans,'paid_principal')},overall_access:loans.length===0?'EMPTY':loans.length===1?'SINGLE_LOAN':'AVAILABLE'})
    }
    if(key==='POST /api/repayment-plans/preview/'||key==='PUT /api/repayment-plans/'){
      if(!body.plans?.length||body.plans.some(p=>!state.loans.some(l=>l.loan_id===p.loan_id)||p.extra_monthly_payment<0))return failure('VALIDATION_ERROR','계획 입력값을 확인해 주세요.')
      const proposed=propose(body.plans)
      const summary={estimated_payoff_date:proposed.map(p=>p.estimated_payoff_date).sort().at(-1),estimated_total_interest:sum(proposed,'estimated_total_interest'),monthly_burden:sum(proposed,'monthly_amount')}
      if(method==='POST'){const version=crypto.randomUUID();previews.set(version,JSON.stringify([body.plans,revision]));return response(key,{...example(key),...summary,preview_version:version,current_plans:state.plans.filter(p=>body.plans.some(i=>i.loan_id===p.loan_id)),proposed_plans:proposed})}
      if(previews.get(body.preview_version)!==JSON.stringify([body.plans,revision]))return failure('PLAN_PREVIEW_STALE','계획을 다시 미리보기 해 주세요.',{},409)
      state.plans=[...state.plans.filter(p=>!body.plans.some(i=>i.loan_id===p.loan_id)),...proposed];persist();return response(key,{...example(key),...summary,plans:proposed})
    }
    if(key==='GET /api/dashboard/'){
      const data=example(key),scheduleData=schedule('2026-11',loanId),loans=state.loans.filter(l=>!loanId||l.loan_id===loanId)
      data.plan_type=state.profile.plan_type
      if(data.plan_type==='FREE'){
        data.risk_summary={level:null,available_cash:null,locked:true}
        data.report_status={status:'NOT_GENERATED',report_id:null,stale:false,locked:true,updated_at:null,is_new:false}
      }
      return response(key,{...data,loans:loans.map(l=>({loan_id:l.loan_id,product_name:l.product_name,remaining_principal:l.remaining_principal,paid_principal:l.paid_principal,progress_percent:l.progress_percent,status:l.status,savings_balance:loanFields(l).savings_balance,required_monthly_saving:loanFields(l).required_monthly_saving})),total_remaining_principal:sum(loans,'remaining_principal'),overall_progress_percent:sum(loans,'original_principal')?sum(loans,'paid_principal')/sum(loans,'original_principal')*100:0,next_payment:scheduleData.due_items.find(d=>d.outstanding_amount>0)||null,monthly_summary:scheduleData.monthly_totals,monthly_checklist:scheduleData.due_items,report_status:{...data.report_status,stale:!data.report_status.locked&&state.payments.length>0}})
    }
    if(key==='GET /api/settings/export/'){
      if(query.get('format')!=='csv')return failure('INVALID_EXPORT_FORMAT','CSV 형식만 지원합니다.')
      const escape=v=>'"'+String(v??'').replace(/^[=+@-]/,"'$&").replaceAll('"','""')+'"'
      const rows=[['record_type','loan_id','product_name','paid_at','amount','principal_amount','interest_amount','extra_amount','remaining_principal'],...state.loans.map(l=>['loan',l.loan_id,l.product_name,'','','','','',l.remaining_principal]),...state.payments.map(p=>['payment',p.loan_id,state.loans.find(l=>l.loan_id===p.loan_id)?.product_name,p.paid_at,p.amount,p.principal_amount,p.interest_amount,p.extra_amount,''])]
      return new Response('\uFEFF'+rows.map(row=>row.map(escape).join(',')).join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="ronrun-export.csv"'}})
    }
    if(key==='GET /api/loan-products/')return response(key,{products:example(key).products.filter(p=>(!query.get('loan_type')||p.loan_type===query.get('loan_type'))&&p.institution_id===Number(query.get('institution_id')))})
    if(key==='GET /api/settings/subscription/')return response(key,{...example(key),plan_type:state.profile.plan_type,pro_features:state.profile.plan_type==='FREE'?[]:example(key).pro_features})
    if(method==='GET'&&fixtures[key])return response(key,example(key))
    if(key==='POST /api/auth/logout/')return response(key,{logged_out:true})
    return failure('NOT_FOUND','지원되지 않는 API 경로입니다.',{},404)
  }
  async function fetch(url,init={}) {
    const headers=new Headers(init.headers),id=headers.get('Idempotency-Key')
    if(!id||!(init.method&&init.method!=='GET'))return dispatch(url,init)
    const fingerprint=JSON.stringify([url,init.method,init.body||''])
    const prior=idempotent.get('request:'+id)
    if(prior){if(prior.fingerprint!==fingerprint)return failure('IDEMPOTENCY_CONFLICT','같은 키에 다른 요청을 보낼 수 없습니다.',{},409);return (await prior.result).clone()}
    const result=dispatch(url,init);idempotent.set('request:'+id,{fingerprint,result})
    try{return (await result).clone()}catch(e){idempotent.delete('request:'+id);throw e}
  }
  return {fetch}
}
