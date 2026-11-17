import { useEffect,useRef,useState } from 'react'
export default function LoanFilter({loans,value,onChange}) {
  const ref=useRef(null),[more,setMore]=useState(false)
  useEffect(()=>{
    const el=ref.current
    if(!el)return
    const update=()=>setMore(el.scrollWidth-el.clientWidth-el.scrollLeft>1)
    const frame=requestAnimationFrame(update),observer=new ResizeObserver(update)
    observer.observe(el);el.addEventListener('scroll',update)
    return()=>{cancelAnimationFrame(frame);observer.disconnect();el.removeEventListener('scroll',update)}
  },[loans.length,value])
  if(loans.length<=1)return null
  const label=loan=>{
    const base=(loan.type||loan.name)+' · '+loan.bank
    return loans.filter(l=>(l.type||l.name)===(loan.type||loan.name)&&l.bank===loan.bank).length>1?loan.name:base
  }
  return <div className={'loan-filter-scroll'+(more?' can-scroll':'')}><div ref={ref} className="loan-filter" role="group" aria-label="대출 선택">
    <button type="button" className={value==='all'?'selected':''} aria-pressed={value==='all'} onClick={()=>onChange('all')}>전체</button>
    {loans.map(loan=><button key={loan.id} type="button" className={value===loan.id?'selected':''} aria-pressed={value===loan.id} onClick={()=>onChange(loan.id)}>{label(loan)}</button>)}
  </div></div>
}
