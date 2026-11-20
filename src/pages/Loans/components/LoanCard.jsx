
import ProgressRing from '../../../components/Charts/ProgressRing.jsx'
import { clampPercent } from '../../../components/Charts/chartGeometry.js'
import { money } from '../data.js'
import { v2Icons } from '../v2Icons.js'
import { won } from '../../../api/format.js'

export default function LoanCard({
  loan,
  onHistory,
  onPlan,
  onRate,
  onDelete,
  canDelete = true,
  canPlan = true,
  onSavings,
  onEdit
}) {
  const paid =
    loan.stage === 'paid' ||
    loan.dto.status === 'PAID' ||
    loan.balance === 0

  const percent = clampPercent(loan.percent)

  const targetDate = loan.targetPayoffDate ?? '—'
  const estimatedDate = loan.estimatedPayoffDate ?? '—'
  const nextDate = loan.nextDate ?? '—'

  const principalPayment = loan.principalPayment
  const interestPayment = loan.interestPayment

  const extraPayment =
    loan.dto.plan?.extra_monthly_payment

  const rate =
    loan.rate == null
      ? '—'
      : loan.rate + '%'

  return (
    <article
      className={
        'lm-card owned-loan ' +
        (paid ? 'is-complete' : '')
      }
    >
      <header>
        <h2>{loan.name}</h2>

        <span
          className={
            'lm-chip ' +
            (paid ? 'complete-chip' : '')
          }
        >
          {paid
            ? '완납'
            : loan.variable
              ? '변동금리'
              : '고정금리'}
        </span>
      </header>

      <p className="product-name">
        {loan.product}
      </p>

      <div className="balance-row">
        <div>
          <p className="lm-caption">
            남은 원금
          </p>

          <strong className="lm-number">
            {money(loan.balance)}
            {loan.balance != null && (
              <small>원</small>
            )}
          </strong>
        </div>

        <div
          className="principal-ring"
          role="img"
          aria-label={
            loan.percent == null
              ? '갚은 원금 확인 불가'
              : '갚은 원금 ' + percent + '%'
          }
        >
          <ProgressRing percent={percent} />

          <div>
            <span>갚은 원금</span>

            <strong>
              {loan.percent == null
                ? '—'
                : percent + '%'}
            </strong>
          </div>
        </div>
      </div>

      <dl className="loan-facts">
        <div>
          <dt>
            앞으로 낼 이자(현재 금리 기준)
          </dt>

          <dd>
            {paid ? '0원' : loan.interest ?? '—'}
          </dd>
        </div>

        <div>
          <dt>
            {paid
              ? '정기 납부'
              : '다음 정기 납부 구성'}
          </dt>

          <dd>
            {paid ? (
              '없음 · 완납'
            ) : (
              <>
                원금 {won(principalPayment)}
                {' + '}
                이자 {won(interestPayment)}

                {extraPayment > 0 && (
                  <small>
                    추가 상환 {won(extraPayment)} 별도
                  </small>
                )}
              </>
            )}
          </dd>
        </div>

        <div>
          <dt>금리</dt>

          <dd>
            {loan.variable ? (
              <button
                className="rate-history-button"
                onClick={onRate}
              >
                <span>
                  변동 {rate}

                  {loan.dto.next_rate_reset_date && (
                    <small>
                      다음 재설정{' '}
                      {loan.dto.next_rate_reset_date}
                    </small>
                  )}
                </span>

                <img
                  src={v2Icons.rateChevron}
                  alt=""
                />
              </button>
            ) : (
              '고정 ' + rate
            )}
          </dd>
        </div>

        <div>
          <dt>
            {paid
              ? '상환 상태'
              : '다음 상환일 / 목표 완납'}
          </dt>

          <dd>
            {paid
              ? '완납'
              : nextDate + ' / ' + targetDate}
          </dd>
        </div>

        {!paid && (
          <div>
            <dt>현재 예상 완납일</dt>

            <dd>{estimatedDate}</dd>
          </div>
        )}
      </dl>

      <footer>
        {onEdit && (
          <button
            className="lm-button subtle small"
            onClick={onEdit}
          >
            정보 수정
          </button>
        )}

        <button
          className="lm-button subtle small"
          onClick={onHistory}
        >
          {paid
            ? '상환 기록 보기'
            : '상환 내역'}
        </button>

        <button
          className="lm-button subtle small"
          disabled={!canPlan}
          title={
            !canPlan
              ? '상환 계획 기능은 준비 중이에요'
              : undefined
          }
          onClick={onPlan}
        >
          {paid
            ? '완주 화면 보기'
            : '상환 계획'}
        </button>

        {onSavings &&
          loan.dto.repayment_method === 'BULLET' && (
            <button
              className="lm-button subtle small"
              onClick={onSavings}
            >
              적립 내역
            </button>
          )}

        <button
          className="lm-text loan-delete-link"
          disabled={!canDelete}
          title={
            !canDelete
              ? '대출 삭제 기능은 준비 중이에요'
              : undefined
          }
          onClick={onDelete}
        >
          론런에서 삭제
        </button>
      </footer>
    </article>
  )
}
