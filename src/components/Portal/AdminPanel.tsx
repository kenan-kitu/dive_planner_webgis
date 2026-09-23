import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CircleMarker, MapContainer, TileLayer } from 'react-leaflet'
import { BASEMAPS } from '../../config/mapStyles'
import { useLanguage } from '../../i18n/LanguageContext'
import {
  archiveSubmission,
  deleteAdminComment,
  getAdminDashboard,
  listAdminComments,
  listAdminDiveCenters,
  listAdminSubmissions,
  listAdminUsers,
  reviewSubmission,
  setDiveCenterVerification,
  updateAdminUser,
  type AdminComment,
  type AdminDashboard,
  type AdminDiveCenterProfile,
  type AdminUser,
  type DiveSiteSubmission,
} from '../../services/portal'
import { useAuth } from '../Auth/AuthContext'

interface AdminPanelProps {
  open: boolean
  onClose: () => void
  onCommunityChanged: () => void
}

type AdminTab = 'dashboard' | 'users' | 'centers' | 'comments' | 'submissions'

const EMPTY_DASHBOARD: AdminDashboard = {
  total_users: 0,
  dive_center_accounts: 0,
  comments: 0,
  pending_submissions: 0,
  approved_submissions: 0,
  rejected_submissions: 0,
  archived_submissions: 0,
}

async function fetchAdminData(token: string) {
  return Promise.allSettled([
    getAdminDashboard(token),
    listAdminUsers(token),
    listAdminDiveCenters(token),
    listAdminComments(token),
    listAdminSubmissions(token),
  ] as const)
}

function ReviewLocationMap({ submission }: { submission: DiveSiteSubmission }) {
  const satellite = BASEMAPS.satellite
  return (
    <div className="review-map" aria-label={submission.name}>
      <MapContainer
        center={[submission.latitude, submission.longitude]}
        zoom={11}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution={satellite.attribution}
          url={satellite.url}
          maxZoom={satellite.maxZoom}
        />
        <CircleMarker
          center={[submission.latitude, submission.longitude]}
          radius={9}
          pathOptions={{ color: '#f59e0b', fillColor: '#fbbf24', fillOpacity: 0.9 }}
        />
      </MapContainer>
    </div>
  )
}

export function AdminPanel({ open, onClose, onCommunityChanged }: AdminPanelProps) {
  const { token, user } = useAuth()
  const { language, t } = useLanguage()
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [dashboard, setDashboard] = useState(EMPTY_DASHBOARD)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [centers, setCenters] = useState<AdminDiveCenterProfile[]>([])
  const [comments, setComments] = useState<AdminComment[]>([])
  const [submissions, setSubmissions] = useState<DiveSiteSubmission[]>([])
  const [notes, setNotes] = useState<Record<number, string>>({})
  const [inspectedId, setInspectedId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [workingId, setWorkingId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sectionErrors, setSectionErrors] = useState<Partial<Record<AdminTab, string>>>({})

  const applyAdminData = (
    data: Awaited<ReturnType<typeof fetchAdminData>>,
  ) => {
    const [nextDashboard, nextUsers, nextCenters, nextComments, nextSubmissions] = data
    const nextErrors: Partial<Record<AdminTab, string>> = {}
    if (nextDashboard.status === 'fulfilled') setDashboard(nextDashboard.value)
    else nextErrors.dashboard = t.portal.loadFailed
    if (nextUsers.status === 'fulfilled') setUsers(nextUsers.value)
    else nextErrors.users = t.portal.loadFailed
    if (nextCenters.status === 'fulfilled') setCenters(nextCenters.value)
    else nextErrors.centers = t.portal.loadFailed
    if (nextComments.status === 'fulfilled') setComments(nextComments.value)
    else nextErrors.comments = t.portal.loadFailed
    if (nextSubmissions.status === 'fulfilled') setSubmissions(nextSubmissions.value)
    else nextErrors.submissions = t.portal.loadFailed
    setSectionErrors(nextErrors)
  }

  useEffect(() => {
    if (!open || !token) return
    let active = true
    setLoading(true)
    setError(null)
    setSectionErrors({})
    setNotes({})
    setInspectedId(null)
    fetchAdminData(token)
      .then((data) => active && applyAdminData(data))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [open, t.portal.loadFailed, token])

  if (!open || !token || !user) return null

  const runAction = async (id: number, action: () => Promise<unknown>) => {
    setWorkingId(id)
    setError(null)
    try {
      await action()
      applyAdminData(await fetchAdminData(token))
    } catch {
      setError(t.portal.actionFailed)
    } finally {
      setWorkingId(null)
    }
  }

  const changeUserRole = (account: AdminUser) =>
    runAction(account.id, () =>
      updateAdminUser(
        account.id,
        { role: account.role === 'USER' ? 'DIVE_CENTER' : 'USER' },
        token,
      ),
    )

  const changeUserActive = (account: AdminUser) =>
    runAction(account.id, () =>
      updateAdminUser(account.id, { is_active: !account.is_active }, token),
    )

  const deleteComment = (comment: AdminComment) => {
    if (!window.confirm(t.portal.deleteCommentConfirm)) return
    void runAction(comment.id, () => deleteAdminComment(comment.id, token))
  }

  const review = (submission: DiveSiteSubmission, decision: 'approve' | 'reject') => {
    void runAction(submission.id, async () => {
      await reviewSubmission(submission.id, decision, notes[submission.id] ?? '', token)
      onCommunityChanged()
    })
  }

  const archive = (submission: DiveSiteSubmission) => {
    void runAction(submission.id, async () => {
      await archiveSubmission(submission.id, notes[submission.id] ?? '', token)
      onCommunityChanged()
    })
  }

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US')

  const statusLabel = (submission: DiveSiteSubmission) =>
    t.portal.status[submission.status]

  return createPortal(
    <div className="management-backdrop" role="presentation">
      <section
        className="management-screen management-screen--admin"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-panel-title"
      >
        <header className="management-header">
          <div><small>{t.portal.applicationAdministration}</small><h2 id="admin-panel-title">{t.portal.adminPanel}</h2></div>
          <button type="button" onClick={onClose} aria-label={t.portal.close}>×</button>
        </header>
        <nav className="management-tabs" aria-label={t.portal.adminPanel}>
          {(['dashboard', 'users', 'centers', 'comments', 'submissions'] as AdminTab[]).map((item) => (
            <button key={item} type="button" aria-pressed={tab === item} onClick={() => setTab(item)}>{t.portal.adminTabs[item]}</button>
          ))}
        </nav>
        <div className="management-body">
          {loading ? <p>{t.status.loading}</p> : null}
          {error ? <p className="management-message is-error">{error}</p> : null}
          {sectionErrors[tab] ? <p className="management-message is-error">{sectionErrors[tab]}</p> : null}

          {tab === 'dashboard' && !loading ? (
            <section aria-labelledby="admin-dashboard-heading">
              <div className="section-heading"><div><small>{t.portal.overview}</small><h3 id="admin-dashboard-heading">{t.portal.adminTabs.dashboard}</h3></div></div>
              <div className="dashboard-grid">
                <article><strong>{dashboard.total_users}</strong><span>{t.portal.totalUsers}</span></article>
                <article><strong>{dashboard.dive_center_accounts}</strong><span>{t.portal.diveCenterAccounts}</span></article>
                <article><strong>{dashboard.comments}</strong><span>{t.portal.comments}</span></article>
                <article><strong>{dashboard.pending_submissions}</strong><span>{t.portal.status.PENDING}</span></article>
                <article><strong>{dashboard.approved_submissions}</strong><span>{t.portal.status.APPROVED}</span></article>
                <article><strong>{dashboard.rejected_submissions}</strong><span>{t.portal.status.REJECTED}</span></article>
                <article><strong>{dashboard.archived_submissions}</strong><span>{t.portal.status.ARCHIVED}</span></article>
              </div>
            </section>
          ) : null}

          {tab === 'users' && !loading ? (
            <section className="management-list" aria-labelledby="admin-users-heading">
              <div className="section-heading"><div><small>{t.portal.accessControl}</small><h3 id="admin-users-heading">{t.portal.adminTabs.users}</h3></div></div>
              {users.map((account) => (
                <article className="management-card management-card--row" key={account.id}>
                  <div><small>{account.email}</small><h4>{account.display_name}</h4><span>{formatDate(account.created_at)}</span></div>
                  <div className="user-state"><span className="status-pill">{t.auth.roles[account.role]}</span><span className={`status-pill ${account.is_active ? 'is-approved' : 'is-rejected'}`}>{account.is_active ? t.portal.active : t.portal.inactive}</span></div>
                  {account.role !== 'ADMIN' ? <footer>
                    <button type="button" disabled={workingId === account.id} onClick={() => changeUserRole(account)}>{account.role === 'USER' ? t.portal.promote : t.portal.demote}</button>
                    <button type="button" disabled={workingId === account.id} onClick={() => changeUserActive(account)}>{account.is_active ? t.portal.deactivate : t.portal.activate}</button>
                  </footer> : null}
                </article>
              ))}
            </section>
          ) : null}

          {tab === 'centers' && !loading ? (
            <section className="management-list" aria-labelledby="admin-centers-heading">
              <div className="section-heading"><div><small>{t.portal.profileVerification}</small><h3 id="admin-centers-heading">{t.portal.adminTabs.centers}</h3></div></div>
              {centers.length === 0 ? <p className="empty-state">{t.portal.noProfiles}</p> : centers.map((center) => (
                <article className="management-card management-card--row" key={center.id}>
                  <div><small>{center.email}</small><h4>{center.business_name}</h4><p>{center.description}</p></div>
                  <span className={`status-pill ${center.is_verified ? 'is-approved' : ''}`}>{center.is_verified ? t.portal.verified : t.portal.unverified}</span>
                  <footer><button type="button" disabled={workingId === center.id} onClick={() => void runAction(center.id, () => setDiveCenterVerification(center.id, !center.is_verified, token))}>{center.is_verified ? t.portal.unverify : t.portal.verify}</button></footer>
                </article>
              ))}
            </section>
          ) : null}

          {tab === 'comments' && !loading ? (
            <section className="management-list" aria-labelledby="admin-comments-heading">
              <div className="section-heading"><div><small>{t.portal.moderation}</small><h3 id="admin-comments-heading">{t.portal.adminTabs.comments}</h3></div></div>
              {comments.length === 0 ? <p className="empty-state">{t.community.noComments}</p> : comments.map((comment) => (
                <article className="management-card" key={comment.id}>
                  <div className="management-card__heading"><div><small>{comment.display_name} · {t.auth.roles[comment.role]}</small><h4>{comment.dive_site_name}</h4></div><span>{formatDate(comment.created_at)}</span></div>
                  <p>{comment.body}</p>
                  <footer><button type="button" disabled={workingId === comment.id} onClick={() => deleteComment(comment)}>{t.community.delete}</button></footer>
                </article>
              ))}
            </section>
          ) : null}

          {tab === 'submissions' && !loading ? (
            <section className="management-list" aria-labelledby="admin-submissions-heading">
              <div className="section-heading"><div><small>{t.portal.reviewQueue}</small><h3 id="admin-submissions-heading">{t.portal.adminTabs.submissions}</h3></div></div>
              {submissions.length === 0 ? <p className="empty-state">{t.portal.noSubmissions}</p> : submissions.map((submission) => (
                <article className="management-card" key={submission.id}>
                  <div className="management-card__heading"><div><small>{submission.business_name ?? submission.submitter_name} · {submission.site_type}</small><h4>{submission.name}</h4></div><span className={`status-pill is-${submission.status.toLowerCase()}`}>{statusLabel(submission)}</span></div>
                  <p>{submission.description}</p>
                  <dl className="compact-definitions"><div><dt>{t.portal.coordinates}</dt><dd>{submission.latitude.toFixed(5)}, {submission.longitude.toFixed(5)}</dd></div><div><dt>{t.details.depth}</dt><dd>{submission.min_depth_m ?? '—'}–{submission.max_depth_m ?? '—'} m</dd></div></dl>
                  <button type="button" onClick={() => setInspectedId((current) => current === submission.id ? null : submission.id)}>{inspectedId === submission.id ? t.portal.hideMap : t.portal.inspectMap}</button>
                  {inspectedId === submission.id ? <ReviewLocationMap submission={submission} /> : null}
                  {submission.admin_note ? <p className="admin-note"><strong>{t.portal.adminNote}:</strong> {submission.admin_note}</p> : null}
                  {submission.status === 'PENDING' ? <div className="review-actions">
                    <label>{t.portal.adminNote}<textarea value={notes[submission.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [submission.id]: event.target.value }))} /></label>
                    <div><button className="approve-action" type="button" disabled={workingId === submission.id} onClick={() => review(submission, 'approve')}>{t.portal.approve}</button><button className="reject-action" type="button" disabled={workingId === submission.id} onClick={() => review(submission, 'reject')}>{t.portal.reject}</button></div>
                  </div> : null}
                  {submission.status === 'APPROVED' ? <div className="review-actions">
                    <label>{t.portal.adminNote}<textarea value={notes[submission.id] ?? ''} onChange={(event) => setNotes((current) => ({ ...current, [submission.id]: event.target.value }))} /></label>
                    <div><button className="reject-action" type="button" disabled={workingId === submission.id} onClick={() => archive(submission)}>{t.portal.archive}</button></div>
                  </div> : null}
                </article>
              ))}
            </section>
          ) : null}
        </div>
      </section>
    </div>,
    document.body,
  )
}
