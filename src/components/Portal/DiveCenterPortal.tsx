import { useEffect, useState, type FormEvent } from 'react'
import { createPortal } from 'react-dom'
import { CircleMarker, MapContainer, TileLayer, useMapEvents } from 'react-leaflet'
import { BASEMAPS } from '../../config/mapStyles'
import { useLanguage } from '../../i18n/LanguageContext'
import {
  createDiveSiteSubmission,
  deleteDiveSiteSubmission,
  getDiveCenterProfile,
  listDiveCenterSubmissions,
  saveDiveCenterProfile,
  updateDiveSiteSubmission,
  type DiveCenterProfile,
  type DiveCenterProfileInput,
  type DiveSiteSubmission,
  type DiveSiteSubmissionInput,
} from '../../services/portal'
import { useAuth } from '../Auth/AuthContext'

interface DiveCenterPortalProps {
  open: boolean
  onClose: () => void
}

type PortalTab = 'profile' | 'submissions' | 'add'
type Coordinates = [longitude: number, latitude: number]

const EMPTY_PROFILE: DiveCenterProfileInput = {
  business_name: '',
  description: null,
  phone: null,
  website: null,
  address: null,
  agencies: [],
  services: [],
}

const EMPTY_SUBMISSION: DiveSiteSubmissionInput = {
  name: '',
  site_type: 'Reef',
  min_depth_m: null,
  max_depth_m: null,
  description: '',
  longitude: -81.1,
  latitude: 24.72,
}

function MapClick({ onChange }: { onChange: (coordinates: Coordinates) => void }) {
  useMapEvents({
    click(event) {
      onChange([event.latlng.lng, event.latlng.lat])
    },
  })
  return null
}

function LocationPicker({
  coordinates,
  onChange,
}: {
  coordinates: Coordinates | null
  onChange: (coordinates: Coordinates) => void
}) {
  const satellite = BASEMAPS.satellite
  return (
    <div className="portal-map" role="region" aria-label="Submission location map">
      <MapContainer center={[24.72, -81.1]} zoom={8} scrollWheelZoom>
        <TileLayer
          attribution={satellite.attribution}
          url={satellite.url}
          maxZoom={satellite.maxZoom}
        />
        <MapClick onChange={onChange} />
        {coordinates ? (
          <CircleMarker
            center={[coordinates[1], coordinates[0]]}
            radius={9}
            pathOptions={{ color: '#f59e0b', fillColor: '#fbbf24', fillOpacity: 0.9 }}
          />
        ) : null}
      </MapContainer>
    </div>
  )
}

function commaList(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

function optionalNumber(value: string): number | null {
  return value === '' ? null : Number(value)
}

export function DiveCenterPortal({ open, onClose }: DiveCenterPortalProps) {
  const { token } = useAuth()
  const { t } = useLanguage()
  const [tab, setTab] = useState<PortalTab>('profile')
  const [profile, setProfile] = useState<DiveCenterProfile | null>(null)
  const [profileForm, setProfileForm] = useState<DiveCenterProfileInput>(EMPTY_PROFILE)
  const [agenciesText, setAgenciesText] = useState('')
  const [servicesText, setServicesText] = useState('')
  const [submissions, setSubmissions] = useState<DiveSiteSubmission[]>([])
  const [submissionForm, setSubmissionForm] =
    useState<DiveSiteSubmissionInput>(EMPTY_SUBMISSION)
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !token) return
    let active = true
    setLoading(true)
    setError(null)
    setMessage(null)
    Promise.all([getDiveCenterProfile(token), listDiveCenterSubmissions(token)])
      .then(([nextProfile, nextSubmissions]) => {
        if (!active) return
        setProfile(nextProfile)
        setSubmissions(nextSubmissions)
        if (nextProfile) {
          setProfileForm({
            business_name: nextProfile.business_name,
            description: nextProfile.description,
            phone: nextProfile.phone,
            website: nextProfile.website,
            address: nextProfile.address,
            agencies: nextProfile.agencies,
            services: nextProfile.services,
          })
          setAgenciesText(nextProfile.agencies.join(', '))
          setServicesText(nextProfile.services.join(', '))
        } else {
          setProfileForm(EMPTY_PROFILE)
          setAgenciesText('')
          setServicesText('')
        }
      })
      .catch(() => active && setError(t.portal.loadFailed))
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [open, t.portal.loadFailed, token])

  if (!open || !token) return null

  const refreshSubmissions = async () => {
    setSubmissions(await listDiveCenterSubmissions(token))
  }

  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const saved = await saveDiveCenterProfile(
        {
          ...profileForm,
          agencies: commaList(agenciesText),
          services: commaList(servicesText),
        },
        token,
      )
      setProfile(saved)
      setMessage(t.portal.profileSaved)
    } catch {
      setError(t.portal.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  const resetSubmission = () => {
    setSubmissionForm(EMPTY_SUBMISSION)
    setCoordinates(null)
    setEditingId(null)
  }

  const submitSite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!coordinates) {
      setError(t.portal.chooseLocation)
      return
    }
    const payload = {
      ...submissionForm,
      longitude: coordinates[0],
      latitude: coordinates[1],
    }
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      if (editingId == null) {
        await createDiveSiteSubmission(payload, token)
      } else {
        await updateDiveSiteSubmission(editingId, payload, token)
      }
      await refreshSubmissions()
      resetSubmission()
      setTab('submissions')
      setMessage(t.portal.submissionSaved)
    } catch {
      setError(t.portal.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  const editSubmission = (submission: DiveSiteSubmission) => {
    setSubmissionForm({
      name: submission.name,
      site_type: submission.site_type,
      min_depth_m: submission.min_depth_m,
      max_depth_m: submission.max_depth_m,
      description: submission.description,
      longitude: submission.longitude,
      latitude: submission.latitude,
    })
    setCoordinates([submission.longitude, submission.latitude])
    setEditingId(submission.id)
    setTab('add')
  }

  const removeSubmission = async (submission: DiveSiteSubmission) => {
    if (!window.confirm(t.portal.deleteSubmissionConfirm)) return
    setError(null)
    try {
      await deleteDiveSiteSubmission(submission.id, token)
      await refreshSubmissions()
    } catch {
      setError(t.portal.actionFailed)
    }
  }

  const statusLabel = (status: DiveSiteSubmission['status']) =>
    t.portal.status[status]

  return createPortal(
    <div className="management-backdrop" role="presentation">
      <section
        className="management-screen"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dive-center-portal-title"
      >
        <header className="management-header">
          <div>
            <small>{t.portal.accountArea}</small>
            <h2 id="dive-center-portal-title">{t.portal.diveCenterDashboard}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label={t.portal.close}>×</button>
        </header>

        <nav className="management-tabs" aria-label={t.portal.diveCenterDashboard}>
          <button type="button" aria-pressed={tab === 'profile'} onClick={() => setTab('profile')}>
            {t.portal.myProfile}
          </button>
          <button type="button" aria-pressed={tab === 'submissions'} onClick={() => setTab('submissions')}>
            {t.portal.mySubmissions}
          </button>
          <button type="button" aria-pressed={tab === 'add'} onClick={() => { resetSubmission(); setTab('add') }}>
            {t.portal.addDiveSite}
          </button>
        </nav>

        <div className="management-body">
          {loading ? <p>{t.status.loading}</p> : null}
          {error ? <p className="management-message is-error">{error}</p> : null}
          {message ? <p className="management-message is-success">{message}</p> : null}

          {tab === 'profile' && !loading ? (
            <form className="management-form" onSubmit={saveProfile}>
              <div className="section-heading">
                <div>
                  <small>{t.portal.myProfile}</small>
                  <h3>{t.portal.editProfile}</h3>
                </div>
                <span className={profile?.is_verified ? 'status-pill is-approved' : 'status-pill'}>
                  {profile?.is_verified ? t.portal.verified : t.portal.unverified}
                </span>
              </div>
              <label>
                {t.portal.businessName}
                <input required minLength={2} maxLength={150} value={profileForm.business_name} onChange={(event) => setProfileForm((current) => ({ ...current, business_name: event.target.value }))} />
              </label>
              <label className="field-span">
                {t.portal.description}
                <textarea maxLength={2000} value={profileForm.description ?? ''} onChange={(event) => setProfileForm((current) => ({ ...current, description: event.target.value || null }))} />
              </label>
              <label>
                {t.portal.phone}
                <input maxLength={100} value={profileForm.phone ?? ''} onChange={(event) => setProfileForm((current) => ({ ...current, phone: event.target.value || null }))} />
              </label>
              <label>
                {t.portal.website}
                <input type="url" maxLength={500} value={profileForm.website ?? ''} onChange={(event) => setProfileForm((current) => ({ ...current, website: event.target.value || null }))} />
              </label>
              <label className="field-span">
                {t.portal.address}
                <input maxLength={500} value={profileForm.address ?? ''} onChange={(event) => setProfileForm((current) => ({ ...current, address: event.target.value || null }))} />
              </label>
              <label>
                {t.portal.agencies}
                <input value={agenciesText} onChange={(event) => setAgenciesText(event.target.value)} placeholder="PADI, SSI, CMAS" />
              </label>
              <label>
                {t.portal.services}
                <input value={servicesText} onChange={(event) => setServicesText(event.target.value)} placeholder={t.portal.commaSeparated} />
              </label>
              <div className="form-actions field-span">
                <button className="primary-action" type="submit" disabled={saving}>{saving ? t.auth.working : t.community.save}</button>
              </div>
            </form>
          ) : null}

          {tab === 'submissions' && !loading ? (
            <section className="management-list" aria-labelledby="my-submissions-title">
              <div className="section-heading">
                <div>
                  <small>{t.portal.diveSites}</small>
                  <h3 id="my-submissions-title">{t.portal.mySubmissions}</h3>
                </div>
                <button className="primary-action" type="button" onClick={() => { resetSubmission(); setTab('add') }}>{t.portal.addDiveSite}</button>
              </div>
              {submissions.length === 0 ? <p className="empty-state">{t.portal.noSubmissions}</p> : submissions.map((submission) => (
                <article className="management-card" key={submission.id}>
                  <div className="management-card__heading">
                    <div><small>{submission.site_type}</small><h4>{submission.name}</h4></div>
                    <span className={`status-pill is-${submission.status.toLowerCase()}`}>{statusLabel(submission.status)}</span>
                  </div>
                  <p>{submission.description}</p>
                  <dl className="compact-definitions">
                    <div><dt>{t.portal.coordinates}</dt><dd>{submission.latitude.toFixed(5)}, {submission.longitude.toFixed(5)}</dd></div>
                    <div><dt>{t.details.depth}</dt><dd>{submission.min_depth_m ?? '—'}–{submission.max_depth_m ?? '—'} m</dd></div>
                  </dl>
                  {submission.admin_note ? <p className="admin-note"><strong>{t.portal.adminNote}:</strong> {submission.admin_note}</p> : null}
                  {submission.status === 'PENDING' ? (
                    <footer>
                      <button type="button" onClick={() => editSubmission(submission)}>{t.community.edit}</button>
                      <button type="button" onClick={() => removeSubmission(submission)}>{t.community.delete}</button>
                    </footer>
                  ) : null}
                </article>
              ))}
            </section>
          ) : null}

          {tab === 'add' && !loading ? (
            <form className="submission-layout" onSubmit={submitSite}>
              <div className="submission-map-column">
                <div className="section-heading"><div><small>{t.portal.location}</small><h3>{t.portal.chooseOnMap}</h3></div></div>
                <p>{t.portal.mapHelp}</p>
                <LocationPicker coordinates={coordinates} onChange={setCoordinates} />
                <output className="coordinate-output">
                  {coordinates ? `${coordinates[1].toFixed(6)}, ${coordinates[0].toFixed(6)}` : t.portal.noLocation}
                </output>
              </div>
              <div className="management-form submission-fields">
                <div className="section-heading field-span"><div><small>{editingId == null ? t.portal.newSubmission : t.portal.editSubmission}</small><h3>{t.portal.siteInformation}</h3></div></div>
                <label>{t.portal.siteName}<input required minLength={2} maxLength={150} value={submissionForm.name} onChange={(event) => setSubmissionForm((current) => ({ ...current, name: event.target.value }))} /></label>
                <label>{t.portal.siteType}<select value={submissionForm.site_type} onChange={(event) => setSubmissionForm((current) => ({ ...current, site_type: event.target.value as DiveSiteSubmissionInput['site_type'] }))}><option value="Reef">{t.dataValues.reef}</option><option value="Wreck">{t.dataValues.wreck}</option><option value="Wall">{t.dataValues.wall}</option></select></label>
                <label>{t.details.minimumDepth}<input type="number" min="0" max="300" step="0.1" value={submissionForm.min_depth_m ?? ''} onChange={(event) => setSubmissionForm((current) => ({ ...current, min_depth_m: optionalNumber(event.target.value) }))} /></label>
                <label>{t.details.maximumDepth}<input type="number" min="0" max="300" step="0.1" value={submissionForm.max_depth_m ?? ''} onChange={(event) => setSubmissionForm((current) => ({ ...current, max_depth_m: optionalNumber(event.target.value) }))} /></label>
                <label className="field-span">{t.portal.description}<textarea required minLength={10} maxLength={2000} value={submissionForm.description} onChange={(event) => setSubmissionForm((current) => ({ ...current, description: event.target.value }))} /></label>
                <div className="form-actions field-span">
                  <button type="button" onClick={() => { resetSubmission(); setTab('submissions') }}>{t.community.cancel}</button>
                  <button className="primary-action" type="submit" disabled={saving}>{saving ? t.auth.working : t.portal.submitForReview}</button>
                </div>
              </div>
            </form>
          ) : null}
        </div>
      </section>
    </div>,
    document.body,
  )
}
