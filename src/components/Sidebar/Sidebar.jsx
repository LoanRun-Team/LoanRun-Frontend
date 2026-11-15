import { Fragment } from 'react'
import logo from '../../assets/home/loanrun-logo.svg'
import './Sidebar.scss'

const sidebarItems = [
  { id: 'home', label: '홈', href: '/' },
  { id: 'loans', label: '대출 관리', href: '/loans', children: [
    { id: 'overview', label: '내 대출', href: '/loans', parent: 'loans' },
    { id: 'monthly', label: '이번 달 상환', href: '/loans/monthly', parent: 'loans' },
    { id: 'segments', label: '구간 기록', href: '/loans/segments', parent: 'loans' },
    { id: 'plan', label: '상환 계획', href: '/loans/plan', parent: 'loans' },
  ] },
  { id: 'budget', label: '예산·지출', href: '/budget' },
  { id: 'risk', label: '위험 분석', href: '/risk', pro: true },
  { id: 'reports', label: '상환 리포트', href: '/reports', pro: true },
  { id: 'settings', label: '설정', href: '/settings' },
]

/** Shared navigation: active menu id, activeSub submenu id, Free/Pro plan.
 * onNavigate receives { id, label, href, parent? }; omit it to use native links.
 */
export default function Sidebar({ active = 'home', activeSub = 'overview', plan = 'Pro', items = sidebarItems, onNavigate }) {
  function follow(event, item) {
    if (onNavigate && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) { event.preventDefault(); onNavigate(item) }
  }
  return <aside className="sidebar">
    <a className="skip-link" href="#main-content">본문으로 이동</a>
    <a className="sidebar-logo" href="/" aria-label="론런 홈" onClick={event=>follow(event,sidebarItems[0])}><img src={logo} alt="론런"/></a>
    <nav aria-label="주 메뉴">{items.map(item=><Fragment key={item.id}>
      <a href={item.href} className={`sidebar-item${active===item.id?' active':''}`} aria-current={active===item.id&&!item.children?'page':undefined} aria-expanded={item.children?active===item.id:undefined} aria-controls={item.children?'sidebar-'+item.id:undefined} onClick={event=>follow(event,item)}><span>{item.label}</span>{plan==='Free'&&item.pro&&<span className="sidebar-pro">라벨</span>}</a>
      {item.children&&active===item.id&&<div className="sidebar-submenu" id={'sidebar-'+item.id}>{item.children.map(child=><a key={child.id} href={child.href} className={`sidebar-subitem${activeSub===child.id?' active':''}`} aria-current={activeSub===child.id?'page':undefined} onClick={event=>follow(event,child)}><span aria-hidden="true"/>{child.label}</a>)}</div>}
    </Fragment>)}</nav>
  </aside>
}
