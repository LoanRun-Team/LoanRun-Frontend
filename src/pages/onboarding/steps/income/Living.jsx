import StepCard from '../../components/StepCard.jsx'
import NumberField from '../../components/NumberField.jsx'
import Banner from '../../components/Banner.jsx'

// 생활비·저축 입력. 필드 이름은 PUT /api/budgets/profile/ 요청 본문과 같다.
const FIELDS = [
  { key: 'fixed_essential_expenses', label: '고정 필수 지출(월세·보험료·통신비)', placeholder: '예: 700,000' },
  { key: 'variable_essential_expenses', label: '변동 필수 지출(식비·교통비·생필품)', placeholder: '예: 400,000' },
  { key: 'discretionary_expenses', label: '월평균 선택 지출', placeholder: '예: 800,000' },
  { key: 'savings', label: '매월 저축액', placeholder: '예: 500,000' },
  { key: 'emergency_fund', label: '현재 비상자금 잔액 (선택)', placeholder: '예: 1,200,000' },
]

export default function Living({ form, setForm }) {
  const patch = p => setForm(f => ({ ...f, living: { ...f.living, ...p } }))
  return <StepCard>
    {FIELDS.map(f => <NumberField key={f.key} label={f.label} value={form.living[f.key]} unit="원" placeholder={f.placeholder} onChange={v => patch({ [f.key]: v })} />)}
    <Banner>현재 저축액은 실제 현금 흐름에 반영돼요</Banner>
  </StepCard>
}
