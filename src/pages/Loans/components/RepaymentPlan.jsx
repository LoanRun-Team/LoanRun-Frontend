
import {
  won,
  monthLabel,
  trackLabels,
  seoulToday
} from '../../../api/format.js'
import { clampPercent } from '../../../components/Charts/chartGeometry.js'
import { v2Icons } from '../v2Icons.js'
import { icons } from '../icons.js'
import CumulativeRepayment from './CumulativeRepayment.jsx'
import SavingsPlan from './SavingsPlan.jsx'
import OverallPlan from './OverallPlan.jsx'

function getTargetDate(loan, plan) {
  return loan?.dto?.target_payoff_date !== undefined
    ? loan.dto.target_payoff_date
    : plan?.target_payoff_date ?? null
}

function getEstimatedDate(loan, plan) {
  return loan?.dto?.estimated_payoff_date !== undefined
    ? loan.dto.estimated_payoff_date
    : plan?.estimated_payoff_date ??
        plan?.projected_payoff_date ??
        null
}

function ProgressCard({ loan, plan, stage }) {
  const actual = plan?.actual_progress_pct
  const planned = plan?.planned_progress_pct
  const start = plan?.effective_date?.slice(0, 7).replace('-', '.')
  const gap = plan?.extra_gap_amount
  const target = getTargetDate(loan, plan)

  return (
    <section className="lm-card v2-progress-card">
      <h2>
        목표 달성 현황 <small>계획 시작 시점 기준</small>
      </h2>

      {stage === 'paid' ? (
        <>
          <strong>완납해서 상환 목표를 모두 달성했어요</strong>
          <p>완납 대출은 추가 상환 목표를 만들지 않아요</p>
        </>
      ) : stage === 'grace' ? (
        <>
          <strong>거치 기간에는 추가 상환 목표를 만들지 않아요</strong>
          <p>원금 상환이 시작되면 목표 달성 현황을 보여 드려요</p>
        </>
      ) : (
        <>
          <div className="v2-pace-track">
            <span>출발</span>

            <div className="v2-pace-rail">
              <div
                style={{
                  width: clampPercent(actual) + '%'
                }}
              />

              {planned != null && planned !== actual && (
                <span
                  className="v2-pace-pacer"
                  style={{
                    left: clampPercent(planned) + '%'
                  }}
                >
                  <img src={v2Icons.pacer} alt="페이스메이커" />
                </span>
              )}

              {actual != null && (
                <span
                  className="v2-pace-runner"
                  style={{
                    left: clampPercent(actual) + '%'
                  }}
                >
                  <b>나 {actual}%</b>
                  <img src={v2Icons.runner} alt="나" />
                </span>
              )}

              {planned != null && (
                <span
                  className="v2-planned-label"
                  style={{
                    left: clampPercent(planned) + '%'
                  }}
                >
                  계획 {planned}%
                </span>
              )}
            </div>

            <strong>
              <img src={v2Icons.flag} alt="" />
              목표 {monthLabel(target)}
            </strong>
          </div>

          <p className="goal-principal-message">
            {actual == null
              ? '아직 비교할 기록이 충분하지 않아요'
              : (start ? '계획 시작(' + start + ')부터 ' : '') +
                '원금 ' + actual + '%를 갚았어요'}

            {gap != null && gap < 0
              ? ' · 이번 달 추가 상환 ' +
                won(Math.abs(gap)) + ' 부족'
              : ''}
          </p>
        </>
      )}
    </section>
  )
}

function ExtraCard({
  plan,
  stage,
  early,
  onRecord,
  dueDate,
  estimated
}) {
  const target = plan?.planned_extra_amount
  const actual = plan?.actual_extra_amount
  const gap = plan?.extra_gap_amount
  const cumulativeGap = plan?.cumulative_extra_gap_amount

  const label =
    stage === 'paid'
      ? '목표 없음 (완납)'
      : stage === 'grace' || target === 0
        ? '목표 없음'
        : '목표 ' + won(target) + ' · 기록 ' + won(actual)

  const state =
    stage === 'grace' || stage === 'paid' || target === 0
      ? 'none'
      : target == null || actual == null
        ? 'unknown'
        : actual >= target && target > 0
          ? 'achieved'
          : gap != null &&
              gap < 0 &&
              dueDate &&
              dueDate < seoulToday()
            ? 'short'
            : 'progress'

  return (
    <section className="lm-card v2-extra-card">
      <h2>추가 상환 현황</h2>

      {stage === 'grace' && (
        <p>거치 기간에는 추가 상환 목표를 만들지 않아요</p>
      )}

      <dl className="v2-key-values">
        <div>
          <dt>이번 달 추가 상환</dt>
          <dd>
            {label}

            {stage === 'active' && state !== 'none' && (
              <span
                className={
                  'v2-status ' +
                  (state === 'unknown' ? 'none' : state)
                }
              >
                {state === 'achieved'
                  ? '달성'
                  : state === 'short'
                    ? '부족 ' + won(Math.abs(gap))
                    : state === 'unknown'
                      ? '확인 전'
                      : '진행 중'}
              </span>
            )}
          </dd>
        </div>

        <div>
          <dt>누적 추가 상환</dt>

          <dd className={cumulativeGap < 0 ? 'warning' : ''}>
            계획 대비{' '}
            {cumulativeGap == null
              ? '—'
              : (cumulativeGap < 0 ? '−' : '') +
                won(Math.abs(cumulativeGap))}
          </dd>
        </div>

        <div>
          <dt>
            {stage === 'paid'
              ? '완납일'
              : early
                ? '계획대로면 완납 예상일'
                : '현재 시점 완납 예상일'}
          </dt>

          <dd>
            <small>
              {stage === 'active'
                ? early
                  ? '계획 기준 예상'
                  : '실제 상환 기록 기준'
                : ''}
            </small>

            {stage === 'paid'
              ? '—'
              : monthLabel(estimated)}
          </dd>
        </div>
      </dl>

      {early && stage === 'active' && (
        <p className="field-helper">
          상환 기록이 3개월 쌓이면 실제 기록으로 계산해요
        </p>
      )}

      {stage === 'grace' && (
        <div className="v2-actions">
          <button
            className="lm-button outline small"
            onClick={onRecord}
          >
            추가 상환 기록하기
          </button>

          <small>기록하면 거치 후 월 납부액이 줄어요</small>
        </div>
      )}
    </section>
  )
}

export default function RepaymentPlan({
  loans,
  filter,
  navigate,
  data,
  planData,
  onRecord,
  onSavings,
  savings,
  onSavingsEdit,
  onSavingsDelete,
  onShortfall,
  onFee,
  scenario,
  api
}) {
  if (
    filter === 'all' &&
    (loans.length > 1 || scenario?.startsWith('overall-'))
  ) {
    return (
      <OverallPlan
        api={api}
        loans={loans}
        navigate={navigate}
        scenario={scenario}
      />
    )
  }

  const selected =
    loans.find(l => l.id === filter) || loans[0]

  if (!selected) {
    return (
      <section className="lm-card">
        <p>등록된 대출이 없어요.</p>
      </section>
    )
  }

  const plan = selected.dto.plan
  const stage = selected.stage || 'active'
  const early = (data?.periods?.length || 0) < 3

  if (selected.dto.repayment_method === 'BULLET') {
    return (
      <SavingsPlan
        loan={selected}
        data={savings}
        navigate={navigate}
        onRecord={onRecord}
        onSavings={onSavings}
        onEdit={onSavingsEdit}
        onDelete={onSavingsDelete}
        onShortfall={onShortfall}
        onFee={onFee}
        scenario={scenario}
      />
    )
  }

  const isMortgage = selected.dto.loan_type === 'MORTGAGE'

  const target = getTargetDate(selected, plan)
  const estimated = getEstimatedDate(selected, plan)

  const personality =
    selected.id === 'all'
      ? '개별 계획 합계'
      : {
          FAST: '빠른 상환',
          BALANCED: '균형 상환',
          STABLE: '생활 안정 우선'
        }[plan?.preference] || '직접 설정'

  const goal =
    stage === 'paid'
      ? '완납'
      : stage === 'grace'
        ? '거치 기간'
        : isMortgage
          ? monthLabel(target)
          : personality

  const facts =
    stage === 'paid'
      ? [
          ['남은 원금', '0원'],
          ['완납일', '—'],
          ['다음 납부', '없음'],
          ['추가 상환 목표', '없음']
        ]
      : stage === 'grace'
        ? [
            ['이번 달 납부액', won(selected.payment) + ' (이자만)'],
            ['목표 완납일', monthLabel(target)],
            ['거치 종료일', selected.graceEnd || '—'],
            ['원금 상환 시작', '거치 종료 후']
          ]
        : isMortgage
          ? [
              ['월 상환액', won(data.monthly)],
              ['기본 상환', won(data.base)],
              ['추가 상환', won(data.extra)],
              ['상환 성향', personality]
            ]
          : [
              ['월 상환액', won(data.monthly)],
              ['목표 완납일', monthLabel(target)],
              ['기본 상환', won(data.base)],
              ['추가 상환', won(data.extra)]
            ]

  const pace =
    trackLabels[plan?.track?.status] || '분석 자료 부족'

  const dDay = plan?.d_day
  const delay = plan?.payoff_delay_months

  const paceMessage =
    stage === 'grace'
      ? '거치 종료 후 원금 상환이 시작돼요'
      : !target
        ? '목표 완납일을 설정해 주세요'
        : early
          ? '계획을 시작했어요'
          : !estimated || delay == null
            ? '아직 비교할 기록이 충분하지 않아요'
            : delay > 0
              ? '계획보다 ' + delay + '개월 늦어요'
              : delay < 0
                ? '계획보다 ' + Math.abs(delay) + '개월 빨라요'
                : '완납 예상일이 목표와 같아요'

  return (
    <>
      <div className="plan-top-row">
        <section className="lm-card v2-goal-card">
          <header>
            <h2>내 상환 목표</h2>

            {plan?.priority != null && (
              <span className="lm-chip">
                우선순위 {plan.priority}
              </span>
            )}
          </header>

          <div className="v2-goal-main">
            <div>
              <p>
                {stage !== 'active'
                  ? '상환 단계'
                  : isMortgage
                    ? '목표 완납일 · 내가 정한 날짜'
                    : '상환 성향'}
              </p>

              <strong>{goal}</strong>
            </div>

            {stage !== 'paid' && (
              <button
                className="lm-button outline"
                onClick={() =>
                  navigate('/loans/plan/edit?loan=' + selected.id)
                }
              >
                계획 수정
              </button>
            )}
          </div>

          {stage === 'paid' && (
            <p className="v2-goal-caption">
              남은 원금이 0원이 되어 완납으로 바뀌었어요
            </p>
          )}

          <dl className="v2-goal-facts">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="lm-card plan-finish">
          <h2>완주까지</h2>

          <strong className="d-day">
            {stage === 'paid'
              ? '완주!'
              : target == null || dDay == null
                ? '—'
                : dDay === 0
                  ? 'D-DAY'
                  : dDay < 0
                    ? 'D+' + Math.abs(dDay)
                    : 'D-' + dDay}
          </strong>

          <p>
            {stage === 'paid' ? '완납일' : '목표 완납일'}{' '}

            <strong>
              {stage === 'paid' ? '—' : monthLabel(target)}
            </strong>{' '}

            <small>
              {stage === 'active' && target
                ? '내가 정한 날짜'
                : ''}
            </small>
          </p>

          <div className="pace-status">
            {stage === 'paid' ? (
              <button
                className="lm-button outline small"
                onClick={() =>
                  navigate('/loans/history?loan=' + selected.id)
                }
              >
                완주 화면 보기
              </button>
            ) : (
              <>
                <span className={stage === 'grace' ? 'warning' : ''}>
                  <img src={icons.steadyDot} alt="" />
                  {stage === 'grace' ? '거치 기간' : pace}
                </span>

                <strong>{paceMessage}</strong>
              </>
            )}
          </div>
        </section>
      </div>

      {stage === 'grace' && (
        <section className="lm-card v2-grace-guide">
          <h2>거치 기간 안내</h2>

          <div>
            <section>
              <p>원금 상환이 시작되면 월 납부액이 늘어요</p>

              <strong>
                {won(selected.payment)} →{' '}
                {won(selected.design?.postGracePayment)}
              </strong>

              <p className="warning">
                거치 종료 후 납부액을 확인해 주세요
              </p>
            </section>

            <dl className="v2-key-values">
              <div>
                <dt>지금 월 납부액 (이자만)</dt>
                <dd>{won(selected.payment)}</dd>
              </div>

              <div>
                <dt>거치 종료일</dt>
                <dd>{selected.graceEnd || '—'}</dd>
              </div>

              <div>
                <dt>원금 상환 시작 월</dt>
                <dd>
                  {selected.design?.firstPrincipalMonth ||
                    '거치 종료 후'}
                </dd>
              </div>

              <div>
                <dt>시작 후 예상 월 납부액</dt>
                <dd>{won(selected.design?.postGracePayment)}</dd>
              </div>
            </dl>
          </div>
        </section>
      )}

      <div className="v2-plan-status-row">
        <ProgressCard
          loan={selected}
          plan={plan}
          stage={stage}
        />

        <ExtraCard
          plan={plan}
          stage={stage}
          early={early}
          dueDate={selected.nextDate}
          estimated={estimated}
          onRecord={() =>
            onRecord({
              type: 'extra',
              loanId: selected.id === 'all'
                ? loans[0].id
                : selected.id
            })
          }
        />
      </div>

      <CumulativeRepayment
        data={data}
        message={
          stage === 'paid'
            ? '완납 후에도 상환 기록은 그대로 볼 수 있어요'
            : stage === 'grace'
              ? '거치 기간이라 이자만 내고 있어요'
              : undefined
        }
      />
    </>
  )
}
