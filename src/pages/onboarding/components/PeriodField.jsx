import NumberField from './NumberField.jsx'

// 년·개월 두 칸 입력.
export default function PeriodField({ label, years, months, onChange }) {
  return <div className="ob-field">
    <span className="ob-label">{label}</span>
    <div className="ob-period">
      <NumberField label={`${label} (년)`} value={years} unit="년" onChange={v => onChange({ years: v, months })} hideLabel />
      <NumberField label={`${label} (개월)`} value={months} unit="개월" onChange={v => onChange({ years, months: v })} hideLabel />
    </div>
  </div>
}
