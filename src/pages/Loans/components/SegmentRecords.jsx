
import { Fragment, useState } from 'react'
import { money } from '../data.js'
import { icons } from '../icons.js'
import StackedBarChart from '../../../components/Charts/StackedBarChart.jsx'

function amount(value) {
  return value == null ? '—' : money(value) + '원'
}

function differenceLabel(value) {
  if (value == null) return '—'
  if (value === 0) return '±0원'
  return (value > 0 ? '+' : '−') + money(Math.abs(value)) + '원'
}

export default function SegmentRecords({ data }) {
  const [expanded, setExpanded] = useState(null)
  const rows = data.rows || []

  const getTarget = row =>
    row.target === undefined ? data.target : row.target

  const total = key =>
    rows.length && rows.every(row => row[key] != null)
      ? rows.reduce((sum, row) => sum + Number(row[key]), 0)
      : null

  const targetTotal =
    rows.length && rows.every(row => getTarget(row) != null)
      ? rows.reduce((sum, row) => sum + Number(getTarget(row)), 0)
      : null

  const actualTotal = total('actual')

  const chartRows = [...rows]
    .filter(row =>
      ['principal', 'interest', 'extra'].every(key => row[key] != null)
    )
    .reverse()
    .map(row => ({
      ...row,
      label: row.label || row.month + '월'
    }))

  return (
    <>
      <p className="segment-message">{data.message}</p>

      <section className="lm-card segment-chart">
        <h2>월별 상환</h2>

        <div className="chart-legend">
          <span><i />원금</span>
          <span><i className="interest" />이자</span>
          <span><i className="extra" />추가 상환</span>

          <span>
            <img src={icons.monthlyTargetLegend} alt="" />
            목표 {amount(data.target)}
          </span>
        </div>

        {chartRows.length ? (
          <StackedBarChart
            rows={chartRows}
            maxValue={data.max}
            target={data.target}
            label="월별 원금·이자·추가 상환 막대그래프"
          />
        ) : (
          <p className="v2-empty">
            아직 확인된 월별 납부 기록이 없어요.
          </p>
        )}
      </section>

      <section className="lm-card">
        <h2>월별 목표와 실제</h2>

        <div className="lm-table-scroll">
          <table className="lm-table segment-table">
            <thead>
              <tr>
                {[
                  '월',
                  '목표',
                  '실제',
                  '차이',
                  '원금',
                  '이자',
                  '추가 상환',
                  ''
                ].map((label, i) => (
                  <th key={i}>{label}</th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map(row => {
                const target = getTarget(row)

                const difference =
                  row.actual == null || target == null
                    ? null
                    : row.actual - target

                return (
                  <Fragment key={row.id ?? row.month}>
                    <tr>
                      <td>{row.label || row.month + '월'}</td>
                      <td>{amount(target)}</td>
                      <td>{amount(row.actual)}</td>

                      <td className={
                        difference == null
                          ? ''
                          : difference < 0 ? 'warning' : 'teal'
                      }>
                        {differenceLabel(difference)}
                      </td>

                      <td>{amount(row.principal)}</td>
                      <td>{amount(row.interest)}</td>
                      <td>{amount(row.extra)}</td>

                      <td>
                        <button
                          className="lm-icon-button"
                          aria-label={row.month + ' 상세 보기'}
                          aria-expanded={expanded === row.month}
                          onClick={() =>
                            setExpanded(
                              expanded === row.month ? null : row.month
                            )
                          }
                        >
                          <img src={icons.chevronDown} alt="" />
                        </button>
                      </td>
                    </tr>

                    {expanded === row.month && (
                      <tr className="segment-detail">
                        <td colSpan={8}>
                          {row.observed === false && '월 실적 미확인 · '}

                          {row.paymentCount != null &&
                            '납부 기록 ' + row.paymentCount + '건 · '}

                          {row.month} 정기 납부{' '}
                          {amount(
                            row.principal == null || row.interest == null
                              ? null
                              : row.principal + row.interest
                          )}

                          {' · 추가 상환 '}
                          {amount(row.extra)}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                )
              })}
            </tbody>

            <tfoot>
              <tr>
                <th>{data.periodLabel || '합계'}</th>
                <td>{amount(targetTotal)}</td>
                <td>{amount(actualTotal)}</td>

                <td>
                  {differenceLabel(
                    actualTotal == null || targetTotal == null
                      ? null
                      : actualTotal - targetTotal
                  )}
                </td>

                <td>{amount(total('principal'))}</td>
                <td>{amount(total('interest'))}</td>
                <td>{amount(total('extra'))}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </section>
    </>
  )
}
