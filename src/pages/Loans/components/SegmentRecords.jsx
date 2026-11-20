import { Fragment, useState } from 'react'
import { money } from '../data.js'
import { icons } from '../icons.js'
import StackedBarChart from '../../../components/Charts/StackedBarChart.jsx'

export default function SegmentRecords({ data }) {
  const [expanded, setExpanded] = useState(null)
  const rows = data.rows || []
  const total = key => rows.length&&rows.every(row=>row[key]!=null)?rows.reduce((sum,row)=>sum+Number(row[key]),0):null
  const targetTotal = rows.length&&rows.every(row=>(row.target===undefined?data.target:row.target)!=null)?rows.reduce((sum,row)=>sum+(row.target===undefined?data.target:row.target),0):null
  const actualTotal = total('actual')
  const differenceLabel = value => value == null ? '—' : value === 0 ? '±0' : (value > 0 ? '+' : '−') + money(Math.abs(value))
  return <>
    <p className="segment-message">{data.message}</p>
    <section className="lm-card segment-chart"><h2>월별 상환</h2><div className="chart-legend"><span><i />원금</span><span><i className="interest" />이자</span><span><i className="extra" />추가 상환</span><span><img src={icons.monthlyTargetLegend} alt="" />목표 {money(data.target)}원</span></div>
      <StackedBarChart rows={[...rows].filter(row=>['principal','interest','extra'].every(key=>row[key]!=null)).reverse().map(row=>({...row,label:row.label || row.month+'월'}))} maxValue={data.max} target={data.target} label="월별 원금·이자·추가 상환 막대그래프" />
    </section>
    <section className="lm-card"><h2>월별 목표와 실제</h2><div className="lm-table-scroll"><table className="lm-table segment-table"><thead><tr>{['월','목표','실제','차이','원금','이자','추가 상환',''].map((label,i)=><th key={i}>{label}</th>)}</tr></thead><tbody>{rows.map(row=><Fragment key={row.id ?? row.month}><tr><td>{row.label || row.month+'월'}</td><td>{money(row.target===undefined?data.target:row.target)}원</td><td>{money(row.actual)}원</td><td className={row.actual==null||row.target===null?'':row.actual < (row.target??data.target) ? 'warning' : 'teal'}>{differenceLabel(row.actual==null||(row.target===undefined?data.target:row.target)==null?null:row.actual-(row.target??data.target))}원</td><td>{money(row.principal)}원</td><td>{money(row.interest)}원</td><td>{money(row.extra)}원</td><td><button className="lm-icon-button" aria-label={row.month+'월 상세 보기'} aria-expanded={expanded === row.month} onClick={()=>setExpanded(expanded === row.month ? null : row.month)}><img src={icons.chevronDown} alt="" /></button></td></tr>{expanded === row.month && <tr className="segment-detail"><td colSpan={8}>{row.observed===false?'월 실적 미확인 · ':''}{row.paymentCount!=null?'납부 기록 '+row.paymentCount+'건 · ':''}{row.month}월 정기 납부 {money(row.principal==null||row.interest==null?null:row.principal+row.interest)}원 · 추가 상환 {money(row.extra)}원</td></tr>}</Fragment>)}</tbody><tfoot><tr><th>{data.periodLabel || '합계'}</th><td>{money(targetTotal)}원</td><td>{money(actualTotal)}원</td><td>{differenceLabel(actualTotal==null||targetTotal==null?null:actualTotal-targetTotal)}원</td><td>{money(total('principal'))}원</td><td>{money(total('interest'))}원</td><td>{money(total('extra'))}원</td><td /></tr></tfoot></table></div></section>
  </>
}
