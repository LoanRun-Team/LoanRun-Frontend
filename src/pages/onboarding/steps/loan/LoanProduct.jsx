import { useState } from 'react'
import StepCard from '../../components/StepCard.jsx'
import SelectField from '../../components/SelectField.jsx'
import TextField from '../../components/TextField.jsx'
import { onboardingApi } from '../../../../api/index.js'
import { useRequest } from '../../useRequest.js'

// Figma: S-01b 대출 종류와 상품 / S-01b-open 드롭다운 열림
// 의존 순서: 대출 종류 → 은행 → 상품명. 앞 단계를 바꾸면 뒤 선택은 초기화된다.
// "직접 입력" 모드: 은행명·상품명을 텍스트로 받는다(API: product_id=null, institution_name·product_name 필수).
export default function LoanProduct({ form, setForm }) {
  const { loan_form, loan_type, product_id, institution_name, product_name } = form.loan
  const { institution_id, manual } = form.selection
  const [retry, setRetry] = useState(0)

  const options = useRequest(signal => onboardingApi.getLoanProductOptions({ loan_form }, { signal }), [loan_form, retry])
  const products = useRequest(
    signal => (!manual && loan_type && institution_id ? onboardingApi.getLoanProducts({ loan_type, institution_id, loan_form }, { signal }) : null),
    [manual, loan_type, institution_id, loan_form, retry],
  )

  const loanTypes = (options.data?.loan_types ?? []).map(t => ({ value: t.code, label: t.label }))
  const institutions = (options.data?.institutions ?? []).map(i => ({ value: i.institution_id, label: i.name }))
  const productList = products.data?.products ?? []
  const productOptions = productList.map(p => ({ value: p.product_id, label: p.name }))

  const update = (loan, selection) => setForm(f => ({ ...f, loan: { ...f.loan, ...loan }, selection: { ...f.selection, ...selection } }))
  const resetProduct = { product_id: null, product_name: null }

  const selectType = code => update({ loan_type: code, ...resetProduct }, { product: null, loan_type_label: loanTypes.find(t => t.value === code)?.label ?? null })
  const selectInstitution = id => update({ institution_name: institutions.find(i => i.value === id)?.label ?? null, ...resetProduct }, { institution_id: id, product: null })
  const selectProduct = id => { const p = productList.find(item => item.product_id === id); update({ product_id: id, product_name: p?.name ?? null }, { product: p ?? null }) }
  const enterManual = () => update({ ...resetProduct, institution_name: '', product_name: '' }, { manual: true, institution_id: null, product: null })
  const leaveManual = () => update({ ...resetProduct, institution_name: null }, { manual: false })

  const loading = options.status === 'loading'
  const failed = options.status === 'error' || products.status === 'error'

  return <StepCard>
    <SelectField label="대출 종류" options={loanTypes} value={loan_type} onChange={selectType} disabled={loading} placeholder={loading ? '불러오는 중…' : '선택해 주세요'} />
    {manual ? <>
      <TextField label="은행명" value={institution_name ?? ''} onChange={v => update({ institution_name: v }, {})} placeholder="은행명 입력" />
      <TextField label="상품명" value={product_name ?? ''} onChange={v => update({ product_name: v }, {})} placeholder="상품명 입력" />
    </> : <>
      <SelectField label="은행" options={institutions} value={institution_id} onChange={selectInstitution} disabled={loading} placeholder={loading ? '불러오는 중…' : '선택해 주세요'} />
      <SelectField label="상품명" options={productOptions} value={product_id} onChange={selectProduct}
        disabled={!institution_id || !loan_type || products.status === 'loading'}
        placeholder={products.status === 'loading' && institution_id ? '불러오는 중…' : '선택해 주세요'}
        emptyText="이 조건에 맞는 상품이 없어요" footerAction={{ label: '목록에 없어요 · 직접 입력', onClick: enterManual }} />
    </>}
    {failed && <p className="ob-error" role="alert">목록을 불러오지 못했어요. <button type="button" onClick={() => setRetry(n => n + 1)}>다시 시도</button></p>}
    <div className="ob-manual-link">
      <button type="button" onClick={manual ? leaveManual : enterManual}>{manual ? '목록에서 선택하기' : '찾는 상품이 없어요 · 직접 입력하기'}</button>
    </div>
  </StepCard>
}
