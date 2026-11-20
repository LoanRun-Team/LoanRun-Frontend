import check from '../../../assets/onboarding/icon-check.svg'
import { STEP_GROUPS } from '../steps.js'

// 온보딩 3단계 표시. 완료(체크), 현재(채움), 예정 상태가 있고 연결선은 단계 사이에만 있다.
// 현재 단계까지 이어진 선은 강조색이고, 현재 단계에 하위 라벨(2-1 소득, 2-2 생활비·저축)이 있으면 함께 보여준다.
export default function Stepper({ group, sub }) {
  const current = STEP_GROUPS.findIndex(g => g.id === group)
  return <ol className="ob-stepper" aria-label="온보딩 진행 단계">
    {STEP_GROUPS.map((g, i) => {
      const state = i < current ? 'done' : i === current ? 'current' : 'todo'
      return <li key={g.id} className="ob-stepper-item">
        {i > 0 && <span className={`ob-stepper-line${i <= current ? ' on' : ''}`} aria-hidden="true" />}
        <div className={`ob-step ${state}`} aria-current={state === 'current' ? 'step' : undefined}>
          <span className="ob-step-circle">{state === 'done' ? <img src={check} alt="완료" width="20" height="20" /> : i + 1}</span>
          <span className="ob-step-label">{g.label}</span>
          {state === 'current' && g.subs && <span className="ob-step-sub">
            {g.subs.map(s => <span key={s.id} className={s.id === sub ? 'active' : ''}>{s.label}</span>)}
          </span>}
        </div>
      </li>
    })}
  </ol>
}
