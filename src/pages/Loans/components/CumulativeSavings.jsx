
import StackedBarChart from '../../../components/Charts/StackedBarChart.jsx'
import { won } from '../../../api/format.js'
import legend from '../../../assets/loans/savings-target-legend.svg'

const signed = value =>
  value == null
    ? '—'
    : (
        value === 0
          ? '±'
          : value < 0
            ? '−'
            : '+'
      ) + won(Math.abs(value))

export default function CumulativeSavings({ data }) {
  const rows = data.savingMonths || []
  const gap = data.savingGap

  const message =
    data.firstSaving
      ? '이번 달부터 적립을 시작해요 · 등록할 때 마련한 ' +
        won(data.prepared) +
        '부터 쌓아요'
      : gap == null
        ? '적립 기록이 쌓이면 계획과 비교해 드려요'
        : gap === 0
          ? '기록된 금액이 현재 적립 목표와 같아요'
          : gap < 0
            ? '계획보다 ' +
              won(-gap) +
              ' 덜 모았어요'
            : '계획보다 ' +
              won(gap) +
              ' 더 모았어요'

  const maxValue =
    Math.ceil(
      Math.max(
        1,
        ...rows.map(r =>
          Math.max(r.actual ?? 0, r.target ?? 0)
        )
      ) / 1000000
    ) * 1000000

  return (
    <section className="lm-card v3-cumulative-savings">
      <h2>계획 대비 누적 적립</h2>
      <p>{message}</p>

      <div className="cumulative-summary">
        {[
          ['누적 적립', data.savedTotal],
          ['이번 달 목표 적립액', data.monthlyTarget],
          ['누적 마련 금액', data.prepared]
        ].map(([label, value], i) => (
          <div key={label}>
            <p>{label}</p>

            <div className="cumulative-value">
              <strong>{won(value)}</strong>

              {i === 0 && (
                <span className="plan-difference-chip">
                  {data.firstSaving
                    ? '적립 기록 전'
                    : '계획 대비 ' + signed(gap)}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="chart-legend">
        <span>
          <i />
          실제 적립액
        </span>

        <span>
          <img src={legend} alt="" />
          목표 적립액(미적립 이월 포함)
        </span>
      </div>

      {rows.length ? (
        <>
          <StackedBarChart
            cumulative
            accumulate={false}
            maxValue={maxValue}
            rows={rows.map(r => ({
              id: r.month,

              label:
                Number(r.month.slice(5)) +
                '월' +
                (r.ongoing ? ' · 진행 중' : ''),

              principal: r.actual ?? null,
              interest: 0,
              extra: 0,
              plan: r.target ?? null
            }))}
            label="월별 목표 적립액과 실제 적립액 비교"
          />

          <div className="lm-table-scroll">
            <table className="lm-table savings-plan-table">
              <tbody>
                {[
                  '목표',
                  '실제',
                  '차이',
                  '누적 마련'
                ].map((label, i) => (
                  <tr
                    key={label}
                    className={
                      i === 1 ? 'actual-payment-row' : ''
                    }
                  >
                    <th>{label}</th>

                    {rows.map(r => {
                      const value = [
                        r.target,
                        r.actual,
                        r.difference,
                        r.balance
                      ][i]

                      return (
                        <td
                          key={r.month}
                          className={
                            i === 2 &&
                            value != null &&
                            value < 0
                              ? 'warning'
                              : ''
                          }
                        >
                          {i === 2
                            ? signed(value)
                            : won(value)}

                          {i === 1 && r.ongoing && (
                            <small> · 진행 중</small>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <p className="v2-empty">
          적립 기록을 남기면 월별 그래프가 표시돼요.
        </p>
      )}
    </section>
  )
}
