import { useState } from 'react'
import LoanDialog from './LoanDialog.jsx'
import { icons } from '../icons.js'
export default function AddLoanDialog({ onClose, onAdd }) {
  const [step,setStep]=useState(1)
  const [manual,setManual]=useState(false)
  const [form,setForm]=useState({name:'',kind:'신용대출',bank:'예시 은행',product:'○○ 신용대출(예시)',original:20000000,balance:20000000,rate:5.8,variable:'고정',start:'2026-01-01',maturity:'2038-03-15',method:'원리금균등분할상환',day:15,payment:200000,extra:0})
  const set=(key,value)=>setForm(prev=>({...prev,[key]:value}))
  const field=(key,label,type='text',required=true)=><label className="lm-field" key={key}><span>{label}</span><input name={key} type={type} required={required} min={type==='number'?0:undefined} step={key==='rate'?'.01':undefined} value={form[key]} placeholder={key==='name'?'예: 전세자금대출':undefined} onChange={e=>set(key,type==='number'?Number(e.target.value):e.target.value)}/></label>
  const select=(key,label,options)=><label className="lm-field" key={key}><span>{label}</span><select value={form[key]} onChange={e=>set(key,e.target.value)}>{options.map(option=><option key={option} value={option}>{option}</option>)}</select></label>
  function submit(event) {event.preventDefault();if(form.original<=0||form.balance<=0||form.balance>form.original||form.payment<=0)return;onAdd({...form,name:form.name||form.kind,variable:form.variable==='변동'})}
  return <LoanDialog title={manual?'대출 추가':step===1?'대출 형태를 선택해 주세요':step===2?'대출 종류와 상품을 선택해 주세요':'상환 방식을 확인해 주세요'} onClose={onClose} className="add-loan-dialog">
    {!manual && <div className="wizard-progress" aria-label={step+' / 3 단계'}>{step} / 3 <span>{[1,2,3].map(n=><i key={n} className={n<=step?'complete':''}/>)}</span></div>}
    {step===1&&!manual?<><div className="loan-type-options"><button className="selected" onClick={()=>setStep(2)}><span><img src={icons.generalLoan} alt=""/></span><strong>일반 대출</strong><img src={icons.radio} alt="선택됨"/></button><button disabled><span><img src={icons.creditLine} alt=""/></span><strong>마이너스통장</strong><small>준비 중</small></button></div><footer><button className="lm-button outline" onClick={onClose}>취소</button><button className="lm-button primary" onClick={()=>setStep(2)}>다음</button></footer></>:step===2&&!manual?<><div className="wizard-fields">{select('kind','대출 종류',['신용대출','주택담보대출','전세자금대출','자동차대출'])}{select('bank','은행',['예시 은행','○○은행'])}{select('product','상품명',[`○○ ${form.kind}(예시)`])}</div><button className="lm-text manual-link" onClick={()=>{setManual(true);set('name','')}}>찾는 상품이 없어요 · 직접 입력하기</button><footer><button className="lm-button outline" onClick={()=>setStep(1)}>이전</button><button className="lm-button primary" onClick={()=>{set('product',`○○ ${form.kind}(예시)`);setStep(3)}}>다음</button></footer></>:<form onSubmit={submit}>{!manual&&<p className="form-inset">{form.kind} · {form.bank} · {form.product}</p>}<div className="loan-form-grid">
      {manual&&<>{field('name','대출 이름')}{select('kind','대출 종류',['신용대출','주택담보대출','전세자금대출','자동차대출'])}{field('original','대출 시작 원금','number')}</>}
      {field('balance',manual?'현재 남은 원금':'현재 잔액','number')}{field('rate',manual?'연 금리':'적용 금리','number')}
      {manual&&<>{select('variable','금리 유형',['고정','변동'])}{field('start','대출 시작일','date')}</>}{field('maturity',manual?'만기일':'만기','date')}{select('method','상환 방식',['원리금균등분할상환','원금균등분할상환','만기일시상환'])}{select('day','매월 납부일',Array.from({length:31},(_,i)=>i+1))}{field('payment','월 납부액','number')}{manual&&field('extra','월 추가 상환액 (선택)','number',false)}
    </div>{form.balance>form.original&&<p className="warning" role="alert">현재 잔액은 대출 시작 원금 이하여야 해요.</p>}<p className="form-notice"><img src={icons.info} alt=""/>입력한 정보는 내 대출에서 수정할 수 있어요</p><footer><button type="button" className="lm-button outline" onClick={()=>manual?onClose():setStep(2)}>{manual?'취소':'이전'}</button><button className="lm-button primary" type="submit">대출 추가하기</button></footer></form>}
  </LoanDialog>
}
