import { useState } from 'react'
import { FIRST_STEP, STEPS, isStepId, isStepValid, nextStep } from './steps.js'
import { initialForm } from './data.js'

// 현재 스텝은 URL(?step=)이 기준이고, 폼 값은 여기서 모두 들고 있어서 이전으로 돌아가도 유지된다.
export function useOnboarding({ location, navigate }) {
  const [form, setForm] = useState(initialForm)
  const [trail, setTrail] = useState([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const [path, query = ''] = location.split('?')
  const requested = new URLSearchParams(query).get('step')
  const stepId = isStepId(requested) ? requested : FIRST_STEP

  function goTo(id) { setError(''); navigate(`${path}?step=${id}`) }

  async function next() {
    if (busy) return
    let nextForm = form
    const step = STEPS[stepId]
    if (step.submit) {
      setBusy(true)
      setError('')
      try {
        const update = await step.submit(form)
        if (update) { nextForm = update(form); setForm(update) }
      } catch (e) {
        setError(e?.message || '저장하지 못했어요. 잠시 후 다시 시도해 주세요.')
        return
      } finally {
        setBusy(false)
      }
    }
    const target = nextStep(stepId, nextForm)
    if (target === null) return navigate('/')
    setTrail(t => [...t, stepId])
    goTo(target)
  }
  function back() {
    const prev = trail.at(-1)
    if (!prev) return navigate('/')
    setTrail(t => t.slice(0, -1))
    goTo(prev)
  }
  // 스텝 이동 없이 특정 스텝으로 가는 이동(예: 대출 요약 → 대출 추가). 현재 스텝을 이전 기록에 남긴다.
  function jump(id) { setTrail(t => [...t, stepId]); goTo(id) }

  return { stepId, form, setForm, next, back, jump, busy, error, canNext: isStepValid(stepId, form), isFirst: stepId === FIRST_STEP }
}
