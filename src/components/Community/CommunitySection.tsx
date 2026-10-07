import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../Auth/AuthContext'
import { useLanguage } from '../../i18n/LanguageContext'
import {
  addFavorite,
  createComment,
  deleteComment,
  getFavoriteStatus,
  getRating,
  listComments,
  removeFavorite,
  removeRating,
  setRating,
  updateComment,
  type CommunityComment,
  type RatingSummary,
} from '../../services/community'

interface CommunitySectionProps {
  siteId: number
}

const EMPTY_RATING: RatingSummary = {
  average_rating: null,
  rating_count: 0,
  current_user_rating: null,
}

export function CommunitySection({ siteId }: CommunitySectionProps) {
  const { language, t } = useLanguage()
  const {
    user,
    token,
    openSignIn,
    notifyFavoritesChanged,
  } = useAuth()
  const [comments, setComments] = useState<CommunityComment[]>([])
  const [rating, setRatingSummary] = useState<RatingSummary>(EMPTY_RATING)
  const [favorited, setFavorited] = useState(false)
  const [commentBody, setCommentBody] = useState('')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingBody, setEditingBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)
    Promise.all([
      listComments(siteId),
      getRating(siteId, token),
      token ? getFavoriteStatus(siteId, token) : Promise.resolve({ favorited: false }),
    ])
      .then(([nextComments, nextRating, favorite]) => {
        if (cancelled) return
        setComments(nextComments)
        setRatingSummary(nextRating)
        setFavorited(favorite.favorited)
      })
      .catch(() => {
        if (!cancelled) setError(t.community.loadFailed)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [siteId, t.community.loadFailed, token])

  const runAction = async (action: () => Promise<void>) => {
    setSubmitting(true)
    setError(null)
    try {
      await action()
    } catch {
      setError(t.community.actionFailed)
    } finally {
      setSubmitting(false)
    }
  }

  const submitComment = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!token || !commentBody.trim()) return
    void runAction(async () => {
      const created = await createComment(siteId, commentBody, token)
      setComments((current) => [...current, created])
      setCommentBody('')
    })
  }

  const saveComment = (commentId: number) => {
    if (!token || !editingBody.trim()) return
    void runAction(async () => {
      const updated = await updateComment(commentId, editingBody, token)
      setComments((current) =>
        current.map((comment) => (comment.id === commentId ? updated : comment)),
      )
      setEditingId(null)
      setEditingBody('')
    })
  }

  const removeComment = (commentId: number) => {
    if (!token || !window.confirm(t.community.deleteConfirm)) return
    void runAction(async () => {
      await deleteComment(commentId, token)
      setComments((current) => current.filter((comment) => comment.id !== commentId))
    })
  }

  const chooseRating = (value: number) => {
    if (!token) {
      openSignIn()
      return
    }
    void runAction(async () => {
      setRatingSummary(await setRating(siteId, value, token))
    })
  }

  const clearRating = () => {
    if (!token) return
    void runAction(async () => {
      await removeRating(siteId, token)
      setRatingSummary(await getRating(siteId, token))
    })
  }

  const toggleFavorite = () => {
    if (!token) {
      openSignIn()
      return
    }
    void runAction(async () => {
      const result = favorited
        ? await removeFavorite(siteId, token)
        : await addFavorite(siteId, token)
      setFavorited(result.favorited)
      notifyFavoritesChanged()
    })
  }

  const formatDate = (value: string) =>
    new Intl.DateTimeFormat(language === 'tr' ? 'tr-TR' : 'en-US', {
      dateStyle: 'medium',
    }).format(new Date(value))

  return (
    <section className="detail-section community-section" aria-labelledby="community-title">
      <div className="community-section__heading">
        <div>
          <p className="eyebrow">{t.community.community}</p>
          <h3 id="community-title">{t.community.community}</h3>
        </div>
        <button
          type="button"
          className={favorited ? 'favorite-button is-active' : 'favorite-button'}
          aria-pressed={favorited}
          onClick={toggleFavorite}
          disabled={submitting}
        >
          <span aria-hidden="true">{favorited ? '♥' : '♡'}</span>
          {favorited ? t.community.removeFavorite : t.community.addFavorite}
        </button>
      </div>

      {loading ? <p className="community-status">{t.community.loading}</p> : null}
      {error ? <p className="community-error">{error}</p> : null}

      <div className="community-rating">
        <div>
          <strong>{t.community.rating}</strong>
          <span>
            {rating.average_rating == null
              ? t.community.noRatings
              : t.community.ratingSummary
                  .replace('{average}', rating.average_rating.toFixed(1))
                  .replace('{count}', String(rating.rating_count))}
          </span>
        </div>
        <fieldset disabled={submitting}>
          <legend>{t.community.yourRating}</legend>
          <div className="rating-stars">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={t.community.rateStars.replace('{count}', String(value))}
                aria-pressed={rating.current_user_rating === value}
                className={
                  rating.current_user_rating != null && value <= rating.current_user_rating
                    ? 'is-selected'
                    : ''
                }
                onClick={() => chooseRating(value)}
              >
                ★
              </button>
            ))}
          </div>
          {rating.current_user_rating != null ? (
            <button className="rating-remove" type="button" onClick={clearRating}>
              {t.community.removeRating}
            </button>
          ) : null}
        </fieldset>
      </div>

      {!user ? (
        <div className="community-sign-in">
          <span>{t.community.signInToContinue}</span>
          <button type="button" onClick={openSignIn}>{t.auth.signIn}</button>
        </div>
      ) : (
        <form className="comment-form" onSubmit={submitComment}>
          <label htmlFor={`comment-${siteId}`}>{t.community.writeComment}</label>
          <textarea
            id={`comment-${siteId}`}
            value={commentBody}
            onChange={(event) => setCommentBody(event.target.value)}
            placeholder={t.community.commentPlaceholder}
            maxLength={2000}
            required
          />
          <button type="submit" disabled={submitting || !commentBody.trim()}>
            {t.community.submitComment}
          </button>
        </form>
      )}

      <div className="community-comments">
        <h4>{t.community.comments}</h4>
        {!loading && comments.length === 0 ? <p>{t.community.noComments}</p> : null}
        {comments.map((comment) => {
          const isOwner = user?.id === comment.user_id
          const canDelete = isOwner || user?.role === 'ADMIN'
          return (
            <article key={comment.id} className="comment-card">
              <header>
                <div>
                  <strong>{comment.display_name}</strong>
                  <span>{comment.role.replace('_', ' ')}</span>
                </div>
                <time dateTime={comment.created_at}>{formatDate(comment.created_at)}</time>
              </header>
              {editingId === comment.id ? (
                <div className="comment-edit">
                  <textarea
                    value={editingBody}
                    onChange={(event) => setEditingBody(event.target.value)}
                    maxLength={2000}
                    aria-label={t.community.editComment}
                  />
                  <div>
                    <button type="button" onClick={() => saveComment(comment.id)}>
                      {t.community.save}
                    </button>
                    <button type="button" onClick={() => setEditingId(null)}>
                      {t.community.cancel}
                    </button>
                  </div>
                </div>
              ) : (
                <p>{comment.body}</p>
              )}
              {(isOwner || canDelete) && editingId !== comment.id ? (
                <footer>
                  {isOwner ? (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(comment.id)
                        setEditingBody(comment.body)
                      }}
                    >
                      {t.community.edit}
                    </button>
                  ) : null}
                  {canDelete ? (
                    <button type="button" onClick={() => removeComment(comment.id)}>
                      {t.community.delete}
                    </button>
                  ) : null}
                </footer>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}
