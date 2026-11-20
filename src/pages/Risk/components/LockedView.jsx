import iconLock from '../../../assets/risk/icon-lock.svg'
import iconCheck from '../../../assets/risk/icon-check.svg'
import iconInfo from '../../../assets/onboarding/icon-info.svg'

// PRO 가 아닐 때(403 PRO_REQUIRED)의 화면. 뒤에 흐리게 보이는 미리보기는 화면에 박아 둔 예시이고, 위에 PRO 안내가 뜬다.
const PREVIEW_ROWS = [
  { label: '소득 대비 상환', value: '25.7%', chip: '양호', tone: 'stable' },
  { label: '여유자금', value: '120,000원', chip: '주의', tone: 'caution' },
  { label: '변동금리 노출', value: '88%', chip: '주의', tone: 'caution' },
  { label: '선택 지출 여유', value: '20,000원', chip: '양호', tone: 'stable' },
]
const BENEFITS = [
  '위험 분석: 재정에 어떤 위험 요소가 있는지 알 수 있어요.',
  '지출 시나리오: 큰 지출이 생겼을 때 완납일 변화를 알아 보세요.',
  '상환 리포트: 또래와 비교하고, 내 상환 속도와 완납 가능성을 알려드려요.',
]

export function LockedPreview() {
  return <div className="rk-preview" aria-hidden="true" inert>
      <section className="rk-card">
        <div className="rk-preview-top">
          <div className="rk-preview-level">
            <p className="rk-preview-caption">지금 재정 위험도</p>
            <p className="rk-level caution">주의</p>
            <div className="rk-track-wrap">
              <div className="rk-track"><i className="stable" /><i className="caution" /><i className="danger" /><b /></div>
              <div className="rk-track-labels"><span>안정</span><span className="on">주의</span><span>위험</span></div>
            </div>
            <p className="rk-preview-caption">여유자금이 적어 작은 변화에도 추가 상환이 흔들려요</p>
          </div>
          <div className="rk-preview-why">
            <h2 className="rk-title">왜 주의일까요?</h2>
            {PREVIEW_ROWS.map(r => <p key={r.label} className="rk-why-row"><span>{r.label}</span><strong>{r.value}</strong><em className={`rk-chip ${r.tone}`}>{r.chip}</em></p>)}
            <p className="rk-banner"><img src={iconInfo} alt="" width="20" height="20" /><span>여유자금을 4,000원만 더 확보하면 +1%p까지 버틸 수 있어요</span></p>
          </div>
        </div>
      </section>
      <section className="rk-card rk-preview-range">
        <h2>버틸 수 있는 폭</h2>
        <p>금리·소득·선택 지출이 얼마나 바뀌어도 계획을 지킬 수 있는지 확인해요.</p>
        <span className="rk-button outline">버틸 수 있는 폭 자세히 보기 →</span>
      </section>
    </div>
}

export function LockedOverlay({ onUpgrade }) {
  return <div className="rk-lock">
      <section className="rk-lock-card" aria-labelledby="rk-lock-title">
        <img src={iconLock} alt="" width="20" height="20" />
        <h2 id="rk-lock-title">PRO에서 위험 분석을 확인할 수 있어요</h2>
        <ul>{BENEFITS.map(text => <li key={text}><img src={iconCheck} alt="" width="20" height="20" />{text}</li>)}</ul>
        <button type="button" className="rk-button primary large" onClick={onUpgrade}>업그레이드하고 보기</button>
      </section>
    </div>
}
