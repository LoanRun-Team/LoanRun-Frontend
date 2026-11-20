import ReportEntry from './ReportEntry.jsx'
import {services} from '../../../api/runtime.js'
import {useApiResource} from '../../../api/useApiResource.js'
import {errorMessage} from '../../../api/ApiError.js'
import {loadHomeReport} from '../../../api/homeReportView.js'

export default function ConnectedReportEntry({plan,revision,onOpen,onUpgrade}) {
  const resource=useApiResource('home:report:'+plan+':'+revision,signal=>loadHomeReport(services,plan,signal))
  const locked=plan==='Free'||resource.error?.code==='PRO_REQUIRED'
  const report=resource.data||{locked,is_new:false,updated_at:null}
  const statusText=locked?null:resource.status==='error'?errorMessage(resource.error):resource.status!=='success'?'리포트 상태를 확인하고 있어요':null
  return <ReportEntry report={{...report,locked}} statusText={statusText} onOpen={locked?onUpgrade:onOpen}/>
}
