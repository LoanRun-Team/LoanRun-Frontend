import './ApiState.scss'
export default function ExampleNotice({children,onExit}) {
  return <aside className="api-example-notice" aria-label="예시 데이터 안내"><span>{children||'이 화면은 예시 데이터예요. 실제 대출·납부 기록에는 반영되지 않아요.'}</span>{onExit&&<button type="button" onClick={onExit}>실제 내 대출 보기</button>}</aside>
}
