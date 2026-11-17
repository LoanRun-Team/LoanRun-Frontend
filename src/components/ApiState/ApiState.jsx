import { errorMessage } from '../../api/ApiError.js'
import './ApiState.scss'
export default function ApiState({status,error,onRetry,children}) {
  if(status==='loading')return <div className="api-state" role="status" aria-live="polite">불러오는 중…</div>
  if(status==='error')return <div className="api-state" role="alert"><p>{errorMessage(error)}</p>{error?.code==='AUTH_REQUIRED'&&<p>로그인 후 다시 시도해 주세요.</p>}<button onClick={onRetry}>다시 시도</button></div>
  return children
}

