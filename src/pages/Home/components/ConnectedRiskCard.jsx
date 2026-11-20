import { services } from '../../../api/runtime.js'
import { useApiResource } from '../../../api/useApiResource.js'
import { loadHomeRisk } from '../../../api/homeRiskView.js'
import RiskCard from './RiskCard.jsx'

export default function ConnectedRiskCard({plan,onNavigate,revision=0}){
  const resource=useApiResource('home:risk:'+plan+':'+revision,signal=>loadHomeRisk(services,plan,signal))
  return <RiskCard plan={resource.error?.code==='PRO_REQUIRED'?'Free':plan} onNavigate={onNavigate} risk={resource.status==='success'?resource.data:null} status={resource.status} error={resource.error} markerPercent={null}/>
}
