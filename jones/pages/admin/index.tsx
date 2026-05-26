'use client'

/**
 * Admin Panel — main page.
 * Handles login, sidebar navigation, section editing, image upload, media library, and saving.
 * Works on both localhost and production (Vercel).
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { SiteContent, HeroSlide, FaqItem, SocialLink, HomeContent, ProductSeoOverride } from '@Data/defaultContent'
import { defaultContent } from '@Data/defaultContent'

// ─── Section config for sidebar ───
const SECTIONS = [
  { key: 'seo', label: 'SEO Settings', icon: '🔍' },
  { key: 'mainMenu', label: 'Main Menu', icon: '📋' },
  { key: 'hero', label: 'Hero Slider', icon: '🏠' },
  { key: 'latestProducts', label: 'Best Sellers This Week', icon: '📦' },
  { key: 'categories', label: 'Categories', icon: '📂' },
  { key: 'youtube', label: 'YouTube Video', icon: '▶️' },
  { key: 'bannerCTA', label: 'Banner CTA', icon: '🎯' },
  { key: 'featuredArticles', label: 'Featured Articles', icon: '📰' },
  { key: 'bestsellers', label: 'Bestsellers', icon: '🏆' },
  { key: 'faq', label: 'FAQ Section', icon: '❓' },
  { key: 'footer', label: 'Footer', icon: '🦶' },
  { key: 'products', label: 'Products', icon: '🛍️' },
  { key: 'brands', label: 'Brands', icon: '🏢' },
  { key: 'tags', label: 'Tags', icon: '🏷️' },
  { key: 'articles', label: 'Blog Articles', icon: '✍️' },
  { key: 'articleCategories', label: 'Blog Categories', icon: '📚' },
  { key: 'mediaLibrary', label: 'Media Library', icon: '🖼️' },
] as const

type SectionKey = (typeof SECTIONS)[number]['key']

// ─── Image Upload Component ───
interface ImageUploaderProps {
  currentUrl: string
  onUpload: (url: string) => void
  label?: string
}

function ImageUploader({ currentUrl, onUpload, label }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', files[0])

    try {
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      if (data.urls && data.urls.length > 0) {
        onUpload(data.urls[0])
      }
      if (data.errors && data.errors.length > 0) {
        setError(data.errors[0])
      }
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleUpload(e.dataTransfer.files)
  }

  return (
    <div className='admin-field'>
      {label && <label>{label}</label>}
      <div className='admin-upload-row'>
        <input
          value={currentUrl}
          onChange={e => onUpload(e.target.value)}
          placeholder='Image URL or upload...'
          className='admin-upload-url-input'
        />
        <button
          type='button'
          className='admin-btn-upload'
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? '⏳' : '📤'} Upload
        </button>
      </div>
      <div
        className={`admin-dropzone ${dragOver ? 'dragover' : ''}`}
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className='admin-dropzone-content'>
            <span className='admin-spinner' />
            <span>Uploading...</span>
          </div>
        ) : currentUrl ? (
          <div className='admin-dropzone-preview'>
            <img src={currentUrl} alt='Preview' onError={e => (e.currentTarget.style.display = 'none')} />
            <span className='admin-dropzone-change'>Click or drag to change</span>
          </div>
        ) : (
          <div className='admin-dropzone-content'>
            <span className='admin-dropzone-icon'>📁</span>
            <span>Drag & drop image here or click to browse</span>
            <span className='admin-dropzone-hint'>JPG, PNG, WebP, GIF, SVG • Max 5MB</span>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type='file'
        accept='image/*'
        style={{ display: 'none' }}
        onChange={e => handleUpload(e.target.files)}
      />
      {error && <div className='admin-field-error'>{error}</div>}
    </div>
  )
}

// ─── Media Library Component ───
interface MediaItem {
  url: string
  pathname: string
  size: number
  uploadedAt: string
}

function MediaLibrary() {
  const [media, setMedia] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadMedia = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/media')
      if (res.ok) {
        const data = await res.json()
        setMedia(data.media || [])
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMedia()
  }, [loadMedia])

  const [confirmingMediaDelete, setConfirmingMediaDelete] = useState<string | null>(null)

  const handleDelete = async (url: string) => {
    if (confirmingMediaDelete !== url) {
      setConfirmingMediaDelete(url)
      setTimeout(() => setConfirmingMediaDelete(prev => prev === url ? null : prev), 5000)
      return
    }
    setConfirmingMediaDelete(null)
    setDeleting(url)
    try {
      await fetch('/api/admin/media', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      setMedia(prev => prev.filter(m => m.url !== url))
    } catch {
      // ignore
    } finally {
      setDeleting(null)
    }
  }

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('file', files[i])
    }
    try {
      const res = await fetch('/api/admin/upload', { method: 'POST', body: formData })
      if (res.ok) {
        await loadMedia()
      }
    } catch {
      // ignore
    } finally {
      setUploading(false)
    }
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url)
    setCopiedUrl(url)
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  return (
    <div className='admin-section-card'>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <h3 style={{ margin: 0 }}>Media Library</h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className='admin-btn-add' style={{ width: 'auto', margin: 0, padding: '0.5rem 1rem' }}
            onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? '⏳ Uploading...' : '📤 Upload Images'}
          </button>
          <button className='admin-btn-outline' onClick={loadMedia} disabled={loading} style={{ padding: '0.5rem 0.75rem' }}>
            🔄
          </button>
        </div>
      </div>
      <input ref={fileInputRef} type='file' accept='image/*' multiple style={{ display: 'none' }}
        onChange={e => handleUpload(e.target.files)} />

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className='admin-spinner' style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#71717a' }}>Loading media...</p>
        </div>
      ) : media.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#71717a' }}>
          <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🖼️</p>
          <p>No images uploaded yet</p>
          <p style={{ fontSize: '0.8125rem' }}>Upload images to use them in your site content</p>
        </div>
      ) : (
        <div className='admin-media-grid'>
          {media.map(item => (
            <div key={item.url} className='admin-media-item'>
              <div className='admin-media-thumb'>
                <img src={item.url} alt={item.pathname} />
              </div>
              <div className='admin-media-info'>
                <span className='admin-media-name' title={item.pathname}>
                  {item.pathname.split('/').pop()}
                </span>
                <span className='admin-media-size'>
                  {(item.size / 1024).toFixed(0)}KB
                </span>
              </div>
              <div className='admin-media-actions'>
                <button className='admin-btn-outline' style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                  onClick={() => copyUrl(item.url)}
                  title='Copy URL'>
                  {copiedUrl === item.url ? '✓ Copied' : '📋 Copy URL'}
                </button>
                <button className='admin-btn-remove' style={{ padding: '0.25rem 0.5rem', background: confirmingMediaDelete === item.url ? '#dc2626' : undefined }}
                  onClick={() => handleDelete(item.url)}
                  disabled={deleting === item.url}>
                  {deleting === item.url ? '⏳' : confirmingMediaDelete === item.url ? '⚠️ Confirm?' : '🗑️'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      <p style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#52525b' }}>
        {media.length} image{media.length !== 1 ? 's' : ''} • Images are stored as URLs (no base64)
      </p>
    </div>
  )
}

// ─── Product Management Component ───
interface ProductItem {
  id: number
  name: string
  slug: string
  code: string
  price: string
  fakePrice: string | null
  status: string
  statusDisplay: string
  categorySlug: string
  category: { id: number; slug: string; name: string } | null
  brandSlug: string
  brand: { id: number; slug: string; name: string } | null
  tagIds: number[]
  tagSlugs: string[]
  tags: { id: number; slug: string; name: string }[]
  isFeatured: boolean
  bestSeller: boolean
  image: string | null
  images?: string[]
  descShort: string
  desc: string
  metaTitle: string
  metaDesc: string
  createdAt: string | null
}

interface ProductFormData {
  name: string
  slug: string
  price: string
  fake_price: string
  category_id: string
  brand_id: string
  status: string
  desc_short: string
  desc: string
  is_featured: boolean
  best_seller: boolean
  meta_title: string
  meta_desc: string
  tag_ids: string[]
  image_urls: string[]
}

const emptyForm: ProductFormData = {
  name: '', slug: '', price: '', fake_price: '', category_id: '', brand_id: '',
  status: 'D', desc_short: '', desc: '', is_featured: false, best_seller: false,
  meta_title: '', meta_desc: '', tag_ids: [], image_urls: [''],
}

// Local slugifier for live preview / auto-fill on create. Server's
// AutoSlugField is the source of truth; if it differs (e.g. collision
// suffix -N), we surface the final value via the save-response toast.
function slugifyForPreview (input: string): string {
  return input
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[đĐ]/g, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function stripHeroSlidesFromContent(content: SiteContent): SiteContent {
  return {
    ...content,
    home: {
      ...content.home,
      hero: {
        ...content.home.hero,
        defaultSlides: [],
      },
    },
  }
}

interface HeroSlideRecord extends HeroSlide {
  id: number
  status: boolean
}

function HeroSliderManagement({
  enabled,
  order,
  onEnabledChange,
  onOrderChange,
  onDirty,
  onSlidesChange,
  showToast,
}: {
  enabled: boolean
  order: number
  onEnabledChange: (value: boolean) => void
  onOrderChange: (value: number) => void
  onDirty: () => void
  onSlidesChange: (slides: HeroSlideRecord[]) => void
  showToast: (message: string, type: 'success' | 'error') => void
}) {
  const [slides, setSlides] = useState<HeroSlideRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)

  const triggerRevalidate = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paths: ['/', '/c', '/b', '/t'],
          tags: ['cms-content'],
        }),
      })
      console.log('[admin hero-slides] revalidate', res.status)
    } catch (error) {
      console.log('[admin hero-slides] revalidate error', error)
    }
  }, [])

  const loadSlides = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/hero-slides', { cache: 'no-store' })
      const data = await res.json().catch(() => ({}))
      console.log('[admin hero-slides] load', data)
      const items = Array.isArray(data.items) ? data.items : []
      setSlides(items.map((item: any) => ({
        id: Number(item.id),
        type: String(item.type || item.backgroundText || ''),
        title: String(item.title || ''),
        description: String(item.description || ''),
        buttonText: String(item.buttonText || ''),
        image: String(item.image || ''),
        link: String(item.link || '/'),
        order: Number(item.order || 1),
        status: item.status !== false,
      })))
    } catch (error) {
      console.log('[admin hero-slides] load error', error)
      showToast('Failed to load hero slides', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadSlides()
  }, [loadSlides])

  useEffect(() => {
    onSlidesChange(slides)
  }, [slides, onSlidesChange])

  const updateSlide = (id: number, field: keyof HeroSlideRecord, value: string | number | boolean) => {
    setSlides(prev => prev.map(slide => (slide.id === id ? { ...slide, [field]: value } : slide)))
    onDirty()
  }

  const handleCreate = async () => {
    setCreating(true)
    try {
      const payload = {
        slide: {
          type: 'signature',
          title: 'New Slide',
          description: 'Text below title',
          buttonText: 'SHOP NOW',
          image: '/img/hero-banner-default.png',
          link: '/c/',
          order: slides.length + 1,
          status: true,
        },
      }
      console.log('[admin hero-slides] create', payload)
      const res = await fetch('/api/admin/hero-slides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to create hero slide')
      await loadSlides()
      await triggerRevalidate()
      showToast('Hero slide created', 'success')
    } catch (error: any) {
      console.log('[admin hero-slides] create error', error)
      showToast(error.message || 'Failed to create hero slide', 'error')
    } finally {
      setCreating(false)
    }
  }

  const handleSave = async (slide: HeroSlideRecord) => {
    setSavingId(slide.id)
    try {
      const payload = {
        slide: {
          type: slide.type,
          title: slide.title,
          description: slide.description,
          buttonText: slide.buttonText,
          image: slide.image,
          link: slide.link,
          order: Number(slide.order) || 1,
          status: slide.status,
        },
      }
      console.log('[admin hero-slides] save', slide.id, payload)
      const res = await fetch(`/api/admin/hero-slides/${slide.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to update hero slide')
      await loadSlides()
      await triggerRevalidate()
      showToast('Hero slide saved', 'success')
    } catch (error: any) {
      console.log('[admin hero-slides] save error', error)
      showToast(error.message || 'Failed to save hero slide', 'error')
    } finally {
      setSavingId(null)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this hero slide?')) return
    try {
      console.log('[admin hero-slides] delete', id)
      const res = await fetch(`/api/admin/hero-slides/${id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete hero slide')
      await loadSlides()
      await triggerRevalidate()
      showToast('Hero slide deleted', 'success')
    } catch (error: any) {
      console.log('[admin hero-slides] delete error', error)
      showToast(error.message || 'Failed to delete hero slide', 'error')
    }
  }

  return (
    <div>
      <div className='admin-toggle-row'>
        <label>Section Enabled</label>
        <button className={`admin-toggle ${enabled ? 'enabled' : ''}`} onClick={() => onEnabledChange(!enabled)} />
      </div>
      <div className='admin-field'>
        <label>Display Order</label>
        <input
          type='number'
          className='admin-order-input'
          value={order}
          onChange={e => onOrderChange(parseInt(e.target.value) || 1)}
        />
      </div>

      <h3 style={{ marginTop: '1.5rem' }}>Slides</h3>
      {loading ? (
        <p>Loading hero slides...</p>
      ) : slides.length === 0 ? (
        <div className='admin-empty-state'>
          <p>No hero slides found.</p>
          <button className='admin-btn-add' onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating...' : '+ Add Slide'}
          </button>
        </div>
      ) : (
        slides.map((slide, index) => (
          <div key={slide.id} className='admin-list-item'>
            <div className='admin-list-item-header'>
              <span className='admin-list-item-number'>Slide {index + 1}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className='admin-btn-outline' onClick={() => handleSave(slide)} disabled={savingId === slide.id}>
                  {savingId === slide.id ? 'Saving...' : 'Save Slide'}
                </button>
                <button className='admin-btn-remove' onClick={() => handleDelete(slide.id)}>
                  ✕ Remove
                </button>
              </div>
            </div>
            <div className='admin-field-row'>
              <div className='admin-field'>
                <label>Background Text</label>
                <input value={slide.type} onChange={e => updateSlide(slide.id, 'type', e.target.value)} placeholder='Text behind the title' />
              </div>
              <div className='admin-field'>
                <label>Title</label>
                <input value={slide.title} onChange={e => updateSlide(slide.id, 'title', e.target.value)} />
              </div>
              <div className='admin-field'>
                <label>Order</label>
                <input
                  type='number'
                  value={slide.order}
                  onChange={e => updateSlide(slide.id, 'order', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className='admin-field'>
                <label>Status</label>
                <button
                  type='button'
                  className={`admin-toggle ${slide.status ? 'enabled' : ''}`}
                  onClick={() => updateSlide(slide.id, 'status', !slide.status)}
                />
              </div>
            </div>
            <div className='admin-field'>
              <label>Text below title</label>
              <textarea
                value={slide.description}
                placeholder='Text shown under the slide title'
                onChange={e => updateSlide(slide.id, 'description', e.target.value)}
                rows={2}
              />
            </div>
            <div className='admin-field-row'>
              <div className='admin-field'>
                <label>Button Text</label>
                <input value={slide.buttonText} onChange={e => updateSlide(slide.id, 'buttonText', e.target.value)} />
              </div>
              <div className='admin-field'>
                <label>Button Link</label>
                <input value={slide.link} onChange={e => updateSlide(slide.id, 'link', e.target.value)} />
              </div>
            </div>
            <ImageUploader
              currentUrl={slide.image}
              onUpload={url => updateSlide(slide.id, 'image', url)}
              label='Slide Image'
            />
          </div>
        ))
      )}

      {!loading && slides.length > 0 && (
        <button className='admin-btn-add' onClick={handleCreate} disabled={creating}>
          {creating ? 'Creating...' : '+ Add Slide'}
        </button>
      )}
    </div>
  )
}

function ProductManagement({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [products, setProducts] = useState<ProductItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ProductFormData>(emptyForm)
  // Track whether the admin has manually touched the slug field. While
  // false (create mode + admin typing in name), slug auto-fills from
  // name. After any manual edit, auto-fill stops to avoid clobbering.
  const [slugTouched, setSlugTouched] = useState(false)
  // Original slug captured on Edit, used to flag URL-breaking changes.
  const [originalSlug, setOriginalSlug] = useState('')
  const [options, setOptions] = useState<{ categories: any[]; brands: any[]; tags: any[] }>({ categories: [], brands: [], tags: [] })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null)

  // Inline quick-create panels (let admins add brand/category/tag without
  // leaving the product form).
  const [quickCreate, setQuickCreate] = useState<'brand' | 'category' | 'tag' | null>(null)
  const [qcName, setQcName] = useState('')
  const [qcLeague, setQcLeague] = useState('')
  const [qcLeagueNew, setQcLeagueNew] = useState('')
  const [qcSubmitting, setQcSubmitting] = useState(false)

  const closeQuickCreate = () => {
    setQuickCreate(null); setQcName(''); setQcLeague(''); setQcLeagueNew('')
  }

  const openQuickCreate = (kind: 'brand' | 'category' | 'tag') => {
    setQuickCreate(kind); setQcName(''); setQcLeague(''); setQcLeagueNew('')
  }

  // Distinct league names already in use, fed into the brand quick-create combobox.
  const existingLeagues = React.useMemo(() => {
    const set = new Set<string>()
    for (const b of (options.brands || [])) {
      const l = (b.league || '').trim()
      if (l) set.add(l)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [options.brands])

  const handleQuickCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qcName.trim()) return
    setQcSubmitting(true)
    try {
      let createdId: number | null = null

      if (quickCreate === 'brand') {
        const fd = new FormData()
        fd.append('name', qcName.trim())
        const finalLeague = qcLeague === '__new__' ? qcLeagueNew.trim() : qcLeague.trim()
        fd.append('league', finalLeague)
        fd.append('order', '1')
        const res = await fetch('/api/admin/brands', { method: 'POST', body: fd })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Failed to create brand')
        createdId = data.id || null
        showToast(`Brand "${qcName}" created`, 'success')
      } else if (quickCreate === 'category') {
        const fd = new FormData()
        fd.append('name', qcName.trim())
        fd.append('order', '1')
        const res = await fetch('/api/admin/categories', { method: 'POST', body: fd })
        const data = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(data.error || 'Failed to create category')
        createdId = data.id || null
        showToast(`Category "${qcName}" created`, 'success')
      } else if (quickCreate === 'tag') {
        // Multi-tag input: split on common separators, dedupe case-insensitively,
        // reuse existing tag IDs, create the rest via POST. createdId stays null
        // so the single-add fallback below is skipped — we update form.tag_ids
        // directly with the full set.
        const SEP_RE = /[,;\n\r\t|]+/
        const rawNames = qcName.split(SEP_RE).map(s => s.trim()).filter(Boolean)
        const seen = new Set<string>()
        const names: string[] = []
        for (const n of rawNames) {
          const k = n.toLowerCase()
          if (!seen.has(k)) { seen.add(k); names.push(n) }
        }
        const existingByName = new Map<string, number>()
        for (const t of (options.tags || [])) {
          existingByName.set(String(t.name).toLowerCase(), Number(t.id))
        }
        const idsToAdd: number[] = []
        let createdCount = 0, reusedCount = 0
        for (const name of names) {
          const existingId = existingByName.get(name.toLowerCase())
          if (existingId) {
            idsToAdd.push(existingId); reusedCount++
            continue
          }
          const res = await fetch('/api/admin/tags', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) throw new Error(data.error || `Failed to create tag "${name}"`)
          const newId = Number(data.tag?.id ?? data.id ?? 0)
          if (newId) {
            idsToAdd.push(newId)
            existingByName.set(name.toLowerCase(), newId)
            createdCount++
          }
        }
        if (idsToAdd.length > 0) {
          setForm(prev => {
            const cur = new Set(prev.tag_ids)
            for (const id of idsToAdd) cur.add(String(id))
            return { ...prev, tag_ids: Array.from(cur) }
          })
        }
        showToast(
          `${idsToAdd.length} tag(s) — ${createdCount} created, ${reusedCount} reused`,
          'success',
        )
      }

      // Refresh dropdown options so the new item appears.
      await fetchOptions()

      // Pre-select the newly-created item in the form.
      if (createdId) {
        if (quickCreate === 'brand') setForm(prev => ({ ...prev, brand_id: String(createdId) }))
        if (quickCreate === 'category') setForm(prev => ({ ...prev, category_id: String(createdId) }))
        if (quickCreate === 'tag') {
          setForm(prev => prev.tag_ids.includes(String(createdId))
            ? prev
            : { ...prev, tag_ids: [...prev.tag_ids, String(createdId)] })
        }
      }

      // Background revalidate so user-facing site reflects the new entity.
      const paths = quickCreate === 'brand' ? ['/', '/b'] : quickCreate === 'category' ? ['/', '/c'] : ['/', '/t']
      const tags = quickCreate === 'brand' ? ['cms-content', 'brand-groups'] : ['cms-content']
      fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths, tags }),
      }).catch(() => {})

      closeQuickCreate()
    } catch (err: any) {
      showToast(err.message || 'Quick create failed', 'error')
    } finally {
      setQcSubmitting(false)
    }
  }

  const fetchProducts = useCallback(async (p = page, s = search) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), page_size: '15' })
      if (s) params.set('search', s)
      const res = await fetch(`/api/admin/products?${params}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setProducts(data.items || [])
      setTotalPages(data.numPages || 1)
      setTotal(data.total || 0)
    } catch {
      showToast('Failed to load products', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, showToast])

  const fetchOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/products/options', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setOptions(data)
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])
  useEffect(() => { fetchOptions() }, [fetchOptions])

  const handleSearch = () => { setPage(1); fetchProducts(1, search) }

  const handleCreate = () => {
    setForm(emptyForm)
    setEditingId(null)
    setSlugTouched(false)   // allow name → slug auto-fill
    setOriginalSlug('')
    setMode('create')
  }

  const handleEdit = (p: ProductItem) => {
    setForm({
      name: p.name, slug: p.slug, price: p.price, fake_price: p.fakePrice || '',
      category_id: p.category ? String(p.category.id) : '',
      brand_id: p.brand ? String(p.brand.id) : '',
      status: p.status,
      desc_short: p.descShort || '',
      desc: p.desc || '',
      is_featured: p.isFeatured, best_seller: p.bestSeller,
      meta_title: p.metaTitle || '',
      meta_desc: p.metaDesc || '',
      tag_ids: (p.tagIds || []).map(String),
      image_urls: (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : ['']),
    })
    setEditingId(p.id)
    setSlugTouched(true)     // never auto-overwrite an existing slug
    setOriginalSlug(p.slug)
    setMode('edit')
  }

  const handleDelete = async (id: number, name: string) => {
    if (confirmingDelete !== id) {
      setConfirmingDelete(id)
      setTimeout(() => setConfirmingDelete(prev => prev === id ? null : prev), 5000)
      return
    }
    setConfirmingDelete(null)
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      // Optimistic: remove from UI immediately
      setProducts(prev => prev.filter(p => p.id !== id))
      setTotal(t => Math.max(0, t - 1))
      showToast(`Product "${name}" deleted`, 'success')
      // Revalidate in background for user-facing pages
      fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/', '/c', '/b', '/t'], tags: ['cms-content'] }),
      }).catch(() => {})
    } catch {
      showToast('Failed to delete product', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const formData = new FormData()
      formData.append('name', form.name)
      // Slug: send field always so PUT treats empty as "let server
      // re-derive from name" rather than "leave untouched". Server
      // (AutoSlugField) keeps current value when input is blank.
      formData.append('slug', form.slug.trim())
      formData.append('price', form.price)
      if (form.fake_price) formData.append('fake_price', form.fake_price)
      formData.append('category_id', form.category_id)
      formData.append('brand_id', form.brand_id)
      formData.append('status', form.status)
      formData.append('desc_short', form.desc_short)
      formData.append('desc', form.desc)
      formData.append('is_featured', String(form.is_featured))
      formData.append('best_seller', String(form.best_seller))
      if (form.meta_title) formData.append('meta_title', form.meta_title)
      if (form.meta_desc) formData.append('meta_desc', form.meta_desc)
      form.tag_ids.forEach(id => formData.append('tag_ids', id))
      // Always send tag_ids marker so PUT treats empty as "cleared all tags"
      // rather than "left untouched".
      if (form.tag_ids.length === 0) formData.append('tag_ids', '')
      const cleanedImageUrls = form.image_urls.map(u => u.trim()).filter(Boolean)
      cleanedImageUrls.forEach(u => formData.append('image_urls', u))
      if (cleanedImageUrls.length === 0) formData.append('image_urls', '')

      let res: Response
      if (mode === 'create') {
        res = await fetch('/api/admin/products', { method: 'POST', body: formData })
      } else {
        res = await fetch(`/api/admin/products/${editingId}`, { method: 'PUT', body: formData })
      }

      const data = await res.json().catch(() => ({} as any))
      if (!res.ok) {
        throw new Error(data.error || 'Save failed')
      }

      // Surface server's final slug — AutoSlugField may have appended a
      // -N suffix to resolve collisions with another product.
      const finalSlug: string = data.slug || form.slug
      const adjusted = form.slug && finalSlug && finalSlug !== form.slug
      showToast(
        mode === 'create'
          ? `Product created — /p/${finalSlug}/`
          : adjusted
            ? `Updated — server adjusted slug to /p/${finalSlug}/`
            : 'Product updated!',
        'success',
      )
      // Purge caches so product changes appear on frontend immediately
      fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/', '/c', '/b', '/t'], tags: ['cms-content'] }),
      }).catch(() => {})
      setMode('list')
      fetchProducts()
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const statusColors: Record<string, string> = { D: '#a1a1aa', A: '#22c55e', O: '#ef4444' }
  const statusLabels: Record<string, string> = { D: 'Draft', A: 'Active', O: 'Out of Stock' }

  // ─── Create/Edit Form ───
  if (mode === 'create' || mode === 'edit') {
    return (
      <div className='admin-section-card'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>{mode === 'create' ? '➕ Create Product' : `✏️ Edit Product #${editingId}`}</h3>
          <button className='admin-btn-outline' onClick={() => setMode('list')}>← Back to List</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className='admin-field'>
            <label>Product Name *</label>
            <input
              value={form.name}
              onChange={e => {
                const newName = e.target.value
                setForm(prev => {
                  // Auto-derive slug while creating, until admin manually
                  // edits the slug field. Edit mode preserves existing slug.
                  if (mode === 'create' && !slugTouched) {
                    return { ...prev, name: newName, slug: slugifyForPreview(newName) }
                  }
                  return { ...prev, name: newName }
                })
              }}
              required
            />
          </div>
          <div className='admin-field'>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
              <span>URL Slug</span>
              <span style={{ color: '#71717a', fontSize: '0.7rem', fontWeight: 'normal', fontFamily: 'monospace' }}>
                Preview: /p/<strong style={{ color: '#a1a1aa' }}>{form.slug || '...'}</strong>/
              </span>
            </label>
            <input
              value={form.slug}
              onChange={e => {
                setSlugTouched(true)
                // Live-sanitize: lowercase + only [a-z0-9-]. Keeps the
                // input inline with what the server will accept.
                const cleaned = e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/-+/g, '-')
                setForm({ ...form, slug: cleaned })
              }}
              placeholder='auto-generated-from-name'
              pattern='[a-z0-9-]+'
              style={{ fontFamily: 'monospace' }}
            />
            {mode === 'edit' && form.slug !== originalSlug && form.slug.trim() !== '' && (
              <small style={{ color: '#fbbf24', fontSize: '0.7rem', marginTop: '0.25rem', display: 'block' }}>
                ⚠️ Slug đổi: URL cũ <code>/p/{originalSlug}/</code> sẽ trả 404.
                Cân nhắc thêm redirect 301 trước khi save.
              </small>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className='admin-field'>
              <label>Price *</label>
              <input type='number' step='0.01' value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required />
            </div>
            <div className='admin-field'>
              <label>Compare-at Price (strikethrough)</label>
              <input type='number' step='0.01' value={form.fake_price} onChange={e => setForm({ ...form, fake_price: e.target.value })} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
            <div className='admin-field'>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Category *</span>
                <button type='button' onClick={() => openQuickCreate('category')}
                  style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}>
                  + New
                </button>
              </label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} required>
                <option value=''>Select...</option>
                {options.categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {quickCreate === 'category' && (
                <div style={{ marginTop: '0.5rem', padding: '0.625rem', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '0.375rem', background: '#0f172a' }}>
                  <input
                    autoFocus
                    placeholder='New category name'
                    value={qcName}
                    onChange={e => setQcName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleQuickCreate(e as any) } }}
                    style={{ width: '100%', fontSize: '0.8rem' }}
                  />
                  <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem', justifyContent: 'flex-end' }}>
                    <button type='button' className='admin-btn-outline' onClick={closeQuickCreate}
                      style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', width: 'auto', flex: '0 0 auto' }}>Cancel</button>
                    <button type='button' className='admin-btn-primary' disabled={qcSubmitting || !qcName.trim()}
                      onClick={handleQuickCreate as any}
                      style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', width: 'auto', flex: '0 0 auto' }}>
                      {qcSubmitting ? '⏳ Creating...' : '✓ Create'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className='admin-field'>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Brand *</span>
                <button type='button' onClick={() => openQuickCreate('brand')}
                  style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}>
                  + New
                </button>
              </label>
              <select value={form.brand_id} onChange={e => setForm({ ...form, brand_id: e.target.value })} required>
                <option value=''>Select...</option>
                {options.brands.map((b: any) => <option key={b.id} value={b.id}>{b.name}{b.league ? ` — ${b.league}` : ''}</option>)}
              </select>
              {quickCreate === 'brand' && (
                <div style={{ marginTop: '0.5rem', padding: '0.625rem', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '0.375rem', background: '#0f172a', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  <input
                    autoFocus
                    placeholder='New brand name'
                    value={qcName}
                    onChange={e => setQcName(e.target.value)}
                    style={{ fontSize: '0.8rem' }}
                  />
                  <select value={qcLeague} onChange={e => setQcLeague(e.target.value)} style={{ fontSize: '0.8rem' }}>
                    <option value=''>— Group / League (none) —</option>
                    {existingLeagues.map(l => <option key={l} value={l}>{l}</option>)}
                    <option value='__new__'>➕ Add new group...</option>
                  </select>
                  {qcLeague === '__new__' && (
                    <input
                      placeholder='New group name (e.g. Anime, Sport)'
                      value={qcLeagueNew}
                      onChange={e => setQcLeagueNew(e.target.value)}
                      style={{ fontSize: '0.8rem' }}
                      required
                    />
                  )}
                  <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end' }}>
                    <button type='button' className='admin-btn-outline' onClick={closeQuickCreate}
                      style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', width: 'auto', flex: '0 0 auto' }}>Cancel</button>
                    <button type='button' className='admin-btn-primary'
                      disabled={qcSubmitting || !qcName.trim() || (qcLeague === '__new__' && !qcLeagueNew.trim())}
                      onClick={handleQuickCreate as any}
                      style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', width: 'auto', flex: '0 0 auto' }}>
                      {qcSubmitting ? '⏳ Creating...' : '✓ Create'}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div className='admin-field'>
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                <option value='D'>Draft</option>
                <option value='A'>Active (Selling)</option>
                <option value='O'>Out of Stock</option>
              </select>
            </div>
          </div>
          <div className='admin-field'>
            <label>Short Description</label>
            <textarea value={form.desc_short} onChange={e => setForm({ ...form, desc_short: e.target.value })} rows={2} />
          </div>
          <div className='admin-field'>
            <label>Full Description (HTML)</label>
            <textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} rows={4} />
          </div>
          <div className='admin-field'>
            <label>Product Image URLs <span style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 'normal' }}>(first one is primary, drag-order respected)</span></label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {form.image_urls.map((url, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url || '/img/placehold.png'}
                    alt={`Preview ${idx + 1}`}
                    style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: '0.375rem', border: '1px solid #27272a', flexShrink: 0, background: '#18181b' }}
                    onError={e => { (e.currentTarget as HTMLImageElement).src = '/img/placehold.png' }}
                  />
                  <input
                    type='url'
                    value={url}
                    onChange={e => {
                      const next = [...form.image_urls]
                      next[idx] = e.target.value
                      setForm({ ...form, image_urls: next })
                    }}
                    placeholder={idx === 0 ? 'https://example.com/primary.jpg' : 'https://example.com/image.jpg'}
                    style={{ flex: 1 }}
                  />
                  <button
                    type='button'
                    className='admin-btn-remove'
                    onClick={() => {
                      const next = form.image_urls.filter((_, i) => i !== idx)
                      setForm({ ...form, image_urls: next.length > 0 ? next : [''] })
                    }}
                    disabled={form.image_urls.length === 1 && !form.image_urls[0]}
                    style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                    title='Remove this URL'
                  >🗑️</button>
                </div>
              ))}
              <button
                type='button'
                className='admin-btn-outline'
                onClick={() => setForm({ ...form, image_urls: [...form.image_urls, ''] })}
                style={{ alignSelf: 'flex-start', padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}
              >➕ Add image URL</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.5rem', margin: '1rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type='checkbox' checked={form.is_featured} onChange={e => setForm({ ...form, is_featured: e.target.checked })} />
              ⭐ Featured Product
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type='checkbox' checked={form.best_seller} onChange={e => setForm({ ...form, best_seller: e.target.checked })} />
              🏆 Best Seller
            </label>
          </div>
          <div className='admin-field'>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>
                Tags <span style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 'normal' }}>
                  (click to toggle — {form.tag_ids.length} selected)
                </span>
              </span>
              <button type='button' onClick={() => openQuickCreate('tag')}
                style={{ background: 'transparent', border: 'none', color: '#60a5fa', fontSize: '0.7rem', cursor: 'pointer', padding: 0 }}>
                + New tag
              </button>
            </label>
            {quickCreate === 'tag' && (() => {
              const SEP_RE = /[,;\n\r\t|]+/
              const parsed: { name: string; isNew: boolean }[] = []
              const seen = new Set<string>()
              for (const raw of qcName.split(SEP_RE)) {
                const n = raw.trim()
                if (!n) continue
                const k = n.toLowerCase()
                if (seen.has(k)) continue
                seen.add(k)
                const isNew = !(options.tags || []).some((t: any) => String(t.name).toLowerCase() === k)
                parsed.push({ name: n, isNew })
              }
              const newCount = parsed.filter(p => p.isNew).length
              const reuseCount = parsed.length - newCount
              return (
                <div style={{ marginBottom: '0.5rem', padding: '0.625rem', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '0.375rem', background: '#0f172a' }}>
                  <input
                    autoFocus
                    placeholder='Type or paste: tag1, tag2, tag3 — Enter to add'
                    value={qcName}
                    onChange={e => setQcName(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleQuickCreate(e as any) } }}
                    onPaste={e => {
                      const text = e.clipboardData.getData('text')
                      if (!text) return
                      // Normalise newlines/tabs/semicolons/pipes → ', ' so the
                      // parser sees one shape and the input stays single-line.
                      const normalised = text.replace(SEP_RE, ', ').replace(/\s*,\s*/g, ', ').trim()
                      e.preventDefault()
                      const target = e.currentTarget
                      const start = target.selectionStart ?? qcName.length
                      const end = target.selectionEnd ?? qcName.length
                      const before = qcName.slice(0, start)
                      const after = qcName.slice(end)
                      const pad = before && !/[,\s]$/.test(before) ? ', ' : ''
                      setQcName(before + pad + normalised + after)
                    }}
                    style={{ width: '100%', fontSize: '0.8rem' }}
                  />
                  {parsed.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.375rem' }}>
                      {parsed.map(p => (
                        <span key={p.name}
                          title={p.isNew ? 'Sẽ tự tạo mới khi Save' : 'Tag đã có — sẽ reuse'}
                          style={{
                            padding: '2px 8px', borderRadius: '0.75rem', fontSize: '0.7rem',
                            background: p.isNew ? '#16a34a' : '#1e3a5f',
                            color: p.isNew ? '#fff' : '#60a5fa',
                            border: p.isNew ? 'none' : '1px solid #3b82f6',
                          }}>
                          {p.name}{p.isNew ? '  +new' : ''}
                        </span>
                      ))}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: '0.375rem', marginTop: '0.375rem', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.7rem', color: '#a1a1aa' }}>
                      {parsed.length === 0 ? '' : `${parsed.length} tag(s) — ${newCount} new, ${reuseCount} reuse`}
                    </span>
                    <div style={{ display: 'flex', gap: '0.375rem' }}>
                      <button type='button' className='admin-btn-outline' onClick={closeQuickCreate}
                        style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', width: 'auto', flex: '0 0 auto' }}>Cancel</button>
                      <button type='button' className='admin-btn-primary' disabled={qcSubmitting || parsed.length === 0}
                        onClick={handleQuickCreate as any}
                        style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', width: 'auto', flex: '0 0 auto' }}>
                        {qcSubmitting ? '⏳ Processing...' : `✓ Apply ${parsed.length} tag(s)`}
                      </button>
                    </div>
                  </div>
                </div>
              )
            })()}
            {options.tags.length === 0 && quickCreate !== 'tag' ? (
              <p style={{ fontSize: '0.8rem', color: '#a1a1aa', margin: '0.25rem 0' }}>
                No tags available. Click &quot;+ New tag&quot; above to create one inline.
              </p>
            ) : options.tags.length === 0 ? null : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', padding: '0.5rem', border: '1px solid #27272a', borderRadius: '0.375rem', maxHeight: 160, overflowY: 'auto', background: '#18181b' }}>
                {options.tags.map((t: any) => {
                  const tagId = String(t.id)
                  const selected = form.tag_ids.includes(tagId)
                  return (
                    <button
                      type='button'
                      key={tagId}
                      onClick={() => {
                        const next = selected
                          ? form.tag_ids.filter(s => s !== tagId)
                          : [...form.tag_ids, tagId]
                        setForm({ ...form, tag_ids: next })
                      }}
                      style={{
                        padding: '0.25rem 0.625rem',
                        fontSize: '0.75rem',
                        borderRadius: '2rem',
                        border: selected ? '1px solid #3b82f6' : '1px solid #3f3f46',
                        background: selected ? '#1e3a5f' : 'transparent',
                        color: selected ? '#60a5fa' : '#d4d4d8',
                        cursor: 'pointer',
                      }}
                    >
                      {selected ? '✓ ' : ''}{t.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className='admin-field'>
              <label>Meta Title (SEO)</label>
              <input value={form.meta_title} onChange={e => setForm({ ...form, meta_title: e.target.value })} maxLength={60} />
            </div>
            <div className='admin-field'>
              <label>Meta Description (SEO)</label>
              <input value={form.meta_desc} onChange={e => setForm({ ...form, meta_desc: e.target.value })} maxLength={145} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type='submit' className='admin-btn-save' disabled={saving}>
              {saving ? '⏳ Saving...' : mode === 'create' ? '➕ Create Product' : '💾 Update Product'}
            </button>
            <button type='button' className='admin-btn-outline' onClick={() => setMode('list')}>Cancel</button>
          </div>
        </form>
      </div>
    )
  }

  // ─── Product List ───
  return (
    <div className='admin-section-card'>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>🛍️ Products ({total})</h3>
        <button className='admin-btn-save' onClick={handleCreate}>➕ Add Product</button>
      </div>

      {/* Search */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <input
          placeholder='Search by name, code, or slug...'
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          style={{ flex: 1 }}
        />
        <button className='admin-btn-outline' onClick={handleSearch}>🔍 Search</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className='admin-spinner' style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#71717a' }}>Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#71717a' }}>
          <p>No products found</p>
          {search && <p style={{ fontSize: '0.8rem' }}>Try a different search term</p>}
        </div>
      ) : (
        <>
          {/* Product Table */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#a1a1aa' }}>Image</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#a1a1aa' }}>Name</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#a1a1aa' }}>Code</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#a1a1aa' }}>Price</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#a1a1aa' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#a1a1aa' }}>Category</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#a1a1aa', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.5rem' }}>
                      {p.image ? (
                        <img src={p.image} alt={p.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 4 }} />
                      ) : (
                        <div style={{ width: 40, height: 40, background: '#27272a', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#71717a' }}>N/A</div>
                      )}
                    </td>
                    <td style={{ padding: '0.5rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.name}
                      <div style={{ fontSize: '0.7rem', color: '#71717a' }}>
                        {p.isFeatured && '⭐ '}{p.bestSeller && '🏆 '}
                      </div>
                    </td>
                    <td style={{ padding: '0.5rem', color: '#a1a1aa', fontFamily: 'monospace', fontSize: '0.75rem' }}>{p.code}</td>
                    <td style={{ padding: '0.5rem' }}>
                      ${p.price}
                      {p.fakePrice && <span style={{ textDecoration: 'line-through', color: '#71717a', marginLeft: 4, fontSize: '0.75rem' }}>${p.fakePrice}</span>}
                    </td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={{ background: statusColors[p.status] + '22', color: statusColors[p.status], padding: '0.125rem 0.5rem', borderRadius: 12, fontSize: '0.75rem' }}>
                        {statusLabels[p.status] || p.statusDisplay}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem', color: '#a1a1aa', fontSize: '0.8rem' }}>{p.category?.name || '-'}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      <button className='admin-btn-outline' style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginRight: 4 }} onClick={() => handleEdit(p)}>✏️</button>
                      <button className='admin-btn-remove' style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: confirmingDelete === p.id ? 70 : undefined, background: confirmingDelete === p.id ? '#dc2626' : undefined }} onClick={() => handleDelete(p.id, p.name)} disabled={deleting === p.id}>
                        {deleting === p.id ? '⏳' : confirmingDelete === p.id ? '⚠️ Confirm?' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className='admin-btn-outline' disabled={page <= 1} onClick={() => { setPage(page - 1); fetchProducts(page - 1) }}>← Prev</button>
              <span style={{ color: '#a1a1aa', alignSelf: 'center', fontSize: '0.8rem' }}>Page {page} / {totalPages}</span>
              <button className='admin-btn-outline' disabled={page >= totalPages} onClick={() => { setPage(page + 1); fetchProducts(page + 1) }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Main Menu Management Component ───
interface AdminMenuItem {
  id?: number
  name: string
  link: string
  target: string
  rel: string
  order: number
  groups: AdminMenuGroup[]
}

interface AdminMenuGroup {
  id?: number
  name: string
  order: number
  items: AdminMenuSubItem[]
}

interface AdminMenuSubItem {
  id?: number
  name: string
  link: string
  target: string
  rel: string
  order: number
}

function MainMenuManagement() {
  const [menus, setMenus] = useState<AdminMenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToastMsg = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchMenus = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/menus')
      if (!res.ok) throw new Error('Failed to fetch menus')
      const data = await res.json()
      setMenus(data.items || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchMenus() }, [fetchMenus])

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
          padding: '0.75rem 1.25rem', borderRadius: '0.5rem', color: '#fff',
          background: toast.type === 'success' ? '#22c55e' : '#ef4444',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontSize: '0.875rem', fontWeight: 500,
        }}>{toast.message}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>📋 Navigation Menu Management</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#71717a' }}>
            Manage the navigation menu items that appear in the header.
            These items are synced from the backend CMS.
          </p>
        </div>
        <button className='admin-btn-outline' onClick={fetchMenus} disabled={loading}
          style={{ padding: '0.5rem 0.75rem' }}>🔄 Refresh</button>
      </div>

      {/* Menu List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#71717a' }}>
          <div className='admin-spinner' style={{ margin: '0 auto 0.5rem' }} /> Loading menus...
        </div>
      ) : error ? (
        <div className='admin-section-card'>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#ef4444', marginBottom: '0.5rem' }}>⚠️ {error}</p>
            <p style={{ color: '#71717a', fontSize: '0.8125rem', marginBottom: '1rem' }}>
              Menu items are managed through the Django backend API.<br/>
              If no menu items appear, they need to be created in the Django admin first.
            </p>
            <button className='admin-btn-outline' onClick={fetchMenus}>🔄 Retry</button>
          </div>
        </div>
      ) : menus.length === 0 ? (
        <div className='admin-section-card'>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📋</p>
            <p style={{ color: '#a1a1aa', marginBottom: '0.5rem' }}>No navigation menu items found</p>
            <p style={{ color: '#71717a', fontSize: '0.8125rem' }}>
              Navigation menu items need to be created in the Django backend admin panel.<br />
              The frontend header will automatically display them once created.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {menus.map((menu, menuIdx) => (
            <div key={menu.id || menuIdx} className='admin-section-card'>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{
                    background: '#3b82f622', color: '#60a5fa', padding: '0.25rem 0.75rem',
                    borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 600,
                  }}>Menu #{menuIdx + 1}</span>
                  <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{menu.name}</h4>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#71717a' }}>Order: {menu.order}</span>
                </div>
              </div>

              {/* Menu details */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.5rem' }}>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Link</span>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', fontFamily: 'monospace', wordBreak: 'break-all' }}>{menu.link || '—'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target</span>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>{menu.target || '_self'}</p>
                </div>
                <div>
                  <span style={{ fontSize: '0.7rem', color: '#71717a', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Rel</span>
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem' }}>{menu.rel || '—'}</p>
                </div>
              </div>

              {/* Groups */}
              {menu.groups && menu.groups.length > 0 && (
                <div>
                  <h5 style={{ margin: '0 0 0.75rem', fontSize: '0.8125rem', color: '#a1a1aa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Dropdown Groups ({menu.groups.length})
                  </h5>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                    {menu.groups.map((group, groupIdx) => (
                      <div key={group.id || groupIdx} style={{
                        border: '1px solid rgba(255,255,255,0.08)', borderRadius: '0.5rem', padding: '0.75rem',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{group.name}</span>
                          <span style={{ fontSize: '0.7rem', color: '#71717a' }}>#{group.order}</span>
                        </div>
                        {group.items && group.items.length > 0 ? (
                          <ul style={{ margin: 0, padding: '0 0 0 1rem', listStyleType: 'disc' }}>
                            {group.items.map((item, itemIdx) => (
                              <li key={item.id || itemIdx} style={{ fontSize: '0.8125rem', marginBottom: '0.25rem', color: '#d4d4d8' }}>
                                <a href={item.link} target='_blank' rel='noopener noreferrer'
                                  style={{ color: '#60a5fa', textDecoration: 'none' }}
                                  onMouseOver={e => (e.currentTarget.style.textDecoration = 'underline')}
                                  onMouseOut={e => (e.currentTarget.style.textDecoration = 'none')}>
                                  {item.name}
                                </a>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p style={{ fontSize: '0.75rem', color: '#52525b', margin: 0 }}>No sub-items</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!menu.groups || menu.groups.length === 0) && (
                <p style={{ fontSize: '0.8125rem', color: '#52525b', margin: 0 }}>
                  No dropdown groups — this menu item links directly to <code style={{ color: '#60a5fa' }}>{menu.link}</code>
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Info box */}
      <div className='admin-section-card' style={{ marginTop: '1.5rem', border: '1px solid rgba(96,165,250,0.2)' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '1.25rem' }}>ℹ️</span>
          <div>
            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.25rem' }}>How Navigation Menu Works</p>
            <p style={{ margin: 0, fontSize: '0.8125rem', color: '#a1a1aa', lineHeight: 1.5 }}>
              The header navigation automatically displays:<br/>
              • <strong>Shop menu</strong> — auto-generated from Categories & Brands<br/>
              • <strong>CMS Menu items</strong> — shown here, managed via Django backend<br/>
              Each menu item can have dropdown groups with sub-items. Changes are reflected on the frontend after page refresh.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

interface CategoryItem {
  id: number
  name: string
  slug: string
  image: string | null
  desc: string
  order: number
  numProducts: number
}

interface CategoryFormData {
  name: string
  order: string
  desc: string
}

function CategoryManagement() {
  const [cats, setCats] = useState<CategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null)
  const [formData, setFormData] = useState<CategoryFormData>({ name: '', order: '1', desc: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null)

  const showToastMsg = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchCats = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/categories', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch categories')
      const data = await res.json()
      setCats(data.items || data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchCats() }, [fetchCats])

  const resetForm = () => {
    setFormData({ name: '', order: '1', desc: '' })
    setImageFile(null)
    setImagePreview(null)
    setEditingCat(null)
    setShowForm(false)
  }

  const openCreateForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (cat: CategoryItem) => {
    setEditingCat(cat)
    setFormData({ name: cat.name, order: String(cat.order), desc: cat.desc || '' })
    setImagePreview(cat.image)
    setImageFile(null)
    setShowForm(true)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('name', formData.name)
      fd.append('order', formData.order)
      fd.append('desc', formData.desc)
      if (imageFile) fd.append('image', imageFile)

      const url = editingCat ? `/api/admin/categories/${editingCat.id}` : '/api/admin/categories'
      const method = editingCat ? 'PUT' : 'POST'

      const res = await fetch(url, { method, body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.detail || 'Failed')

      showToastMsg(data.message || (editingCat ? 'Category updated!' : 'Category created!'), 'success')
      // Optimistic: re-fetch to get the new item with server-assigned fields
      fetchCats()
      // Revalidate in background for user-facing pages
      fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/', '/c'], tags: ['cms-content'] }),
      }).catch(() => {})
      resetForm()
    } catch (err: any) {
      showToastMsg(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (cat: CategoryItem) => {
    if (confirmingDelete !== cat.id) {
      setConfirmingDelete(cat.id)
      setTimeout(() => setConfirmingDelete(prev => prev === cat.id ? null : prev), 5000)
      return
    }
    setConfirmingDelete(null)
    try {
      const res = await fetch(`/api/admin/categories/${cat.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.detail || 'Failed to delete')
      // Optimistic: remove from UI immediately
      setCats(prev => prev.filter(c => c.id !== cat.id))
      showToastMsg(data.message || 'Category deleted', 'success')
      // Revalidate in background for user-facing pages
      fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/', '/c'], tags: ['cms-content'] }),
      }).catch(() => {})
    } catch (err: any) {
      showToastMsg(err.message, 'error')
    }
  }

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
          padding: '0.75rem 1.25rem', borderRadius: '0.5rem', color: '#fff',
          background: toast.type === 'success' ? '#22c55e' : '#ef4444',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontSize: '0.875rem', fontWeight: 500,
        }}>{toast.message}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>Category Management</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#71717a' }}>
            {cats.length} categor{cats.length !== 1 ? 'ies' : 'y'} total
          </p>
        </div>
        {!showForm && (
          <button className='admin-btn-primary' onClick={openCreateForm}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ➕ Add Category
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className='admin-section-card' style={{ marginBottom: '1.5rem', border: '1px solid rgba(74,222,128,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0 }}>{editingCat ? `✏️ Edit: ${editingCat.name}` : '➕ Create Category'}</h4>
            <button className='admin-btn-outline' onClick={resetForm} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>← Back to List</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className='admin-field'>
                <label>Category Name *</label>
                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className='admin-field'>
                <label>Display Order</label>
                <input type='number' min='0' value={formData.order} onChange={e => setFormData({ ...formData, order: e.target.value })} />
              </div>
            </div>
            <div className='admin-field' style={{ marginTop: '0.75rem' }}>
              <label>Description (HTML for SEO)</label>
              <textarea value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} rows={3} />
            </div>
            <div className='admin-field' style={{ marginTop: '0.75rem' }}>
              <label>Category Image</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {imagePreview && (
                  <div style={{ width: 64, height: 64, borderRadius: '0.5rem', overflow: 'hidden', background: '#27272a', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={imagePreview} alt='Image preview' style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <input type='file' accept='image/*' onChange={handleImageChange} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button type='submit' className='admin-btn-primary' disabled={submitting || !formData.name.trim()}>
                {submitting ? '⏳ Saving...' : editingCat ? '💾 Update Category' : '➕ Create Category'}
              </button>
              <button type='button' className='admin-btn-outline' onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Category List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#71717a' }}>
          <div className='admin-spinner' style={{ margin: '0 auto 0.5rem' }} /> Loading categories...
        </div>
      ) : error ? (
        <div className='admin-section-card'>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#ef4444', marginBottom: '0.5rem' }}>⚠️ {error}</p>
            <p style={{ color: '#71717a', fontSize: '0.8125rem', marginBottom: '1rem' }}>
              Category management requires Django backend admin-categories endpoints.<br/>
              If the backend doesn&apos;t support this yet, categories can only be managed in Django admin.
            </p>
            <button className='admin-btn-outline' onClick={fetchCats}>🔄 Retry</button>
          </div>
        </div>
      ) : cats.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#71717a' }}>No categories yet. Click &quot;Add Category&quot; to create one.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: '#a1a1aa', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Image</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: '#a1a1aa', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: '#a1a1aa', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Slug</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', color: '#a1a1aa', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Order</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', color: '#a1a1aa', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Products</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: '#a1a1aa', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...cats].sort((a, b) => a.name.localeCompare(b.name)).map(cat => (
                <tr key={cat.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.625rem 0.5rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '0.375rem', overflow: 'hidden', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {cat.image && !cat.image.includes('placehold') ? (
                        <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#71717a' }}>{cat.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.625rem 0.5rem', fontWeight: 600 }}>{cat.name}</td>
                  <td style={{ padding: '0.625rem 0.5rem', color: '#71717a', fontFamily: 'monospace', fontSize: '0.8125rem' }}>{cat.slug}</td>
                  <td style={{ padding: '0.625rem 0.5rem', textAlign: 'center' }}>{cat.order}</td>
                  <td style={{ padding: '0.625rem 0.5rem', textAlign: 'center' }}>
                    <span style={{ background: '#1e3a5f', color: '#60a5fa', padding: '0.125rem 0.5rem', borderRadius: '2rem', fontSize: '0.75rem' }}>
                      {cat.numProducts}
                    </span>
                  </td>
                  <td style={{ padding: '0.625rem 0.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className='admin-btn-outline' onClick={() => openEditForm(cat)}
                        style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>✏️ Edit</button>
                      <button className='admin-btn-remove' onClick={() => handleDelete(cat)}
                        style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', minWidth: confirmingDelete === cat.id ? 70 : undefined, background: confirmingDelete === cat.id ? '#dc2626' : undefined }}
                        title={cat.numProducts > 0 ? 'Warning: has products assigned' : 'Delete category'}>{confirmingDelete === cat.id ? '⚠️ Confirm?' : '🗑️'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Brand Management Component ───
interface BrandItem {
  id: number
  name: string
  slug: string
  logo: string | null
  order: number
  league: string
  numProducts: number
}

interface BrandFormData {
  name: string
  league: string
  newLeague: string
  order: string
  desc: string
  logo_url: string
}

const emptyBrandForm: BrandFormData = {
  name: '', league: '', newLeague: '', order: '1', desc: '', logo_url: '',
}

function BrandManagement({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [brands, setBrands] = useState<BrandItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<BrandItem | null>(null)
  const [formData, setFormData] = useState<BrandFormData>(emptyBrandForm)
  const [submitting, setSubmitting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null)

  const fetchBrands = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/brands', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch brands')
      const data = await res.json()
      setBrands(data.items || data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchBrands() }, [fetchBrands])

  // Distinct league names from existing brands — feeds the league combobox.
  const leagueOptions = React.useMemo(() => {
    const set = new Set<string>()
    for (const b of brands) {
      const l = (b.league || '').trim()
      if (l) set.add(l)
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [brands])

  const resetForm = () => {
    setFormData(emptyBrandForm)
    setEditing(null)
    setShowForm(false)
  }

  const openCreate = () => { resetForm(); setShowForm(true) }

  const openEdit = (b: BrandItem) => {
    setEditing(b)
    setFormData({
      name: b.name,
      league: b.league || '',
      newLeague: '',
      order: String(b.order),
      desc: '',
      logo_url: b.logo && !b.logo.includes('placehold') ? b.logo : '',
    })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      // newLeague (when "+ Add new" picked) takes priority.
      const finalLeague = formData.league === '__new__'
        ? formData.newLeague.trim()
        : formData.league.trim()

      const fd = new FormData()
      fd.append('name', formData.name.trim())
      fd.append('league', finalLeague)
      fd.append('order', formData.order || '1')
      fd.append('desc', formData.desc || '')
      fd.append('logo_url', formData.logo_url.trim())

      const url = editing ? `/api/admin/brands/${editing.id}` : '/api/admin/brands'
      const method = editing ? 'PUT' : 'POST'
      const res = await fetch(url, { method, body: fd })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || data.detail || 'Failed')

      showToast(data.message || (editing ? 'Brand updated!' : 'Brand created!'), 'success')
      fetchBrands()
      // Refresh the public-facing menu/listing so league regroups immediately.
      fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/', '/b'], tags: ['cms-content', 'brand-groups'] }),
      }).catch(() => {})
      resetForm()
    } catch (err: any) {
      showToast(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (b: BrandItem) => {
    if (confirmingDelete !== b.id) {
      setConfirmingDelete(b.id)
      setTimeout(() => setConfirmingDelete(prev => prev === b.id ? null : prev), 5000)
      return
    }
    setConfirmingDelete(null)
    try {
      const res = await fetch(`/api/admin/brands/${b.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      setBrands(prev => prev.filter(x => x.id !== b.id))
      showToast(data.message || 'Brand deleted', 'success')
      fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/', '/b'], tags: ['cms-content', 'brand-groups'] }),
      }).catch(() => {})
    } catch (err: any) {
      showToast(err.message, 'error')
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>Brand Management</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#71717a' }}>
            {brands.length} brand{brands.length !== 1 ? 's' : ''} total · grouped by league in header menu
          </p>
        </div>
        {!showForm && (
          <button className='admin-btn-primary' onClick={openCreate}>➕ Add Brand</button>
        )}
      </div>

      {showForm && (
        <div className='admin-section-card' style={{ marginBottom: '1.5rem', border: '1px solid rgba(74,222,128,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0 }}>{editing ? `✏️ Edit: ${editing.name}` : '➕ Create Brand'}</h4>
            <button className='admin-btn-outline' onClick={resetForm} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>← Back</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className='admin-field'>
                <label>Brand Name *</label>
                <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required autoFocus />
              </div>
              <div className='admin-field'>
                <label>Display Order</label>
                <input type='number' min='0' value={formData.order} onChange={e => setFormData({ ...formData, order: e.target.value })} />
              </div>
            </div>

            <div className='admin-field' style={{ marginTop: '0.75rem' }}>
              <label>Group / League (Sport, Rock Band, Music, Movie, Culture, Business...)</label>
              <select
                value={formData.league}
                onChange={e => setFormData({ ...formData, league: e.target.value })}
              >
                <option value=''>— None —</option>
                {leagueOptions.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
                <option value='__new__'>➕ Add new group...</option>
              </select>
              {formData.league === '__new__' && (
                <input
                  style={{ marginTop: '0.5rem' }}
                  placeholder='Enter new group name (e.g. Anime, Sport, Music)'
                  value={formData.newLeague}
                  onChange={e => setFormData({ ...formData, newLeague: e.target.value })}
                  required
                />
              )}
              <p style={{ fontSize: '0.75rem', color: '#a1a1aa', margin: '0.25rem 0 0' }}>
                Group quyết định cột brand sẽ xuất hiện trong header mega-menu.
              </p>
            </div>

            <div className='admin-field' style={{ marginTop: '0.75rem' }}>
              <label>Logo URL</label>
              <input
                type='url'
                placeholder='https://example.com/logo.png'
                value={formData.logo_url}
                onChange={e => setFormData({ ...formData, logo_url: e.target.value })}
              />
            </div>

            <div className='admin-field' style={{ marginTop: '0.75rem' }}>
              <label>Description (HTML for SEO)</label>
              <textarea value={formData.desc} onChange={e => setFormData({ ...formData, desc: e.target.value })} rows={3} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button type='submit' className='admin-btn-primary' disabled={submitting || !formData.name.trim()}>
                {submitting ? '⏳ Saving...' : editing ? '💾 Update Brand' : '➕ Create Brand'}
              </button>
              <button type='button' className='admin-btn-outline' onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#71717a' }}>
          <div className='admin-spinner' style={{ margin: '0 auto 0.5rem' }} /> Loading brands...
        </div>
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#ef4444', marginBottom: '0.5rem' }}>⚠️ {error}</p>
          <button className='admin-btn-outline' onClick={fetchBrands}>🔄 Retry</button>
        </div>
      ) : brands.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#71717a' }}>No brands yet. Click &quot;Add Brand&quot; to create one.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: '#a1a1aa', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Logo</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: '#a1a1aa', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: '#a1a1aa', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Group</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: '#a1a1aa', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Slug</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', color: '#a1a1aa', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Order</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', color: '#a1a1aa', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Products</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: '#a1a1aa', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {[...brands].sort((a, b) => (a.league || '').localeCompare(b.league || '') || a.name.localeCompare(b.name)).map(b => (
                <tr key={b.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.625rem 0.5rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '0.375rem', overflow: 'hidden', background: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {b.logo && !b.logo.includes('placehold') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.logo} alt={b.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#71717a' }}>{b.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '0.625rem 0.5rem', fontWeight: 600 }}>{b.name}</td>
                  <td style={{ padding: '0.625rem 0.5rem' }}>
                    {b.league
                      ? <span style={{ background: '#1e3a5f', color: '#60a5fa', padding: '0.125rem 0.5rem', borderRadius: '2rem', fontSize: '0.75rem' }}>{b.league}</span>
                      : <span style={{ color: '#52525b', fontSize: '0.75rem' }}>—</span>}
                  </td>
                  <td style={{ padding: '0.625rem 0.5rem', color: '#71717a', fontFamily: 'monospace', fontSize: '0.8125rem' }}>{b.slug}</td>
                  <td style={{ padding: '0.625rem 0.5rem', textAlign: 'center' }}>{b.order}</td>
                  <td style={{ padding: '0.625rem 0.5rem', textAlign: 'center' }}>
                    <span style={{ background: '#1e3a5f', color: '#60a5fa', padding: '0.125rem 0.5rem', borderRadius: '2rem', fontSize: '0.75rem' }}>{b.numProducts}</span>
                  </td>
                  <td style={{ padding: '0.625rem 0.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className='admin-btn-outline' onClick={() => openEdit(b)}
                        style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>✏️ Edit</button>
                      <button className='admin-btn-remove' onClick={() => handleDelete(b)}
                        style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', minWidth: confirmingDelete === b.id ? 70 : undefined, background: confirmingDelete === b.id ? '#dc2626' : undefined }}
                        title={b.numProducts > 0 ? 'Warning: has products assigned' : 'Delete brand'}>{confirmingDelete === b.id ? '⚠️ Confirm?' : '🗑️'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Tag Management Component ───
interface TagItem {
  id: number
  name: string
  slug: string
  order: number
  numProducts: number
}

interface TagFormData {
  name: string
}

function TagManagement() {
  const [tags, setTags] = useState<TagItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingTag, setEditingTag] = useState<TagItem | null>(null)
  const [formData, setFormData] = useState<TagFormData>({ name: '' })
  const [submitting, setSubmitting] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null)

  const showToastMsg = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchTags = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/tags', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch tags')
      const data = await res.json()
      setTags(data.items || data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchTags() }, [fetchTags])

  const resetForm = () => {
    setFormData({ name: '' })
    setEditingTag(null)
    setShowForm(false)
  }

  const openCreateForm = () => {
    resetForm()
    setShowForm(true)
  }

  const openEditForm = (tag: TagItem) => {
    setEditingTag(tag)
    setFormData({ name: tag.name })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const url = editingTag ? `/api/admin/tags/${editingTag.id}` : '/api/admin/tags'
      const method = editingTag ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: formData.name }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.detail || 'Failed')

      showToastMsg(data.message || (editingTag ? 'Tag updated!' : 'Tag created!'), 'success')
      // Optimistic: add or update in list immediately
      if (!editingTag && data.tag) {
        setTags(prev => [...prev, { ...data.tag, numProducts: 0 }])
      } else {
        fetchTags()
      }
      // Revalidate in background for user-facing pages
      fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/', '/t'], tags: ['cms-content'] }),
      }).catch(() => {})
      resetForm()
    } catch (err: any) {
      showToastMsg(err.message, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (tag: TagItem) => {
    if (confirmingDelete !== tag.id) {
      setConfirmingDelete(tag.id)
      setTimeout(() => setConfirmingDelete(prev => prev === tag.id ? null : prev), 5000)
      return
    }
    setConfirmingDelete(null)
    try {
      const res = await fetch(`/api/admin/tags/${tag.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || data.detail || 'Failed to delete')
      // Optimistic: remove from UI immediately
      setTags(prev => prev.filter(t => t.id !== tag.id))
      showToastMsg(data.message || 'Tag deleted', 'success')
      // Revalidate in background for user-facing pages
      fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/', '/t'], tags: ['cms-content'] }),
      }).catch(() => {})
    } catch (err: any) {
      showToastMsg(err.message, 'error')
    }
  }

  return (
    <div>
      {toast && (
        <div style={{
          position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999,
          padding: '0.75rem 1.25rem', borderRadius: '0.5rem', color: '#fff',
          background: toast.type === 'success' ? '#22c55e' : '#ef4444',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)', fontSize: '0.875rem', fontWeight: 500,
        }}>{toast.message}</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h3 style={{ margin: 0 }}>Tag Management</h3>
          <p style={{ margin: '0.25rem 0 0', fontSize: '0.8125rem', color: '#71717a' }}>
            {tags.length} tag{tags.length !== 1 ? 's' : ''} total
          </p>
        </div>
        {!showForm && (
          <button className='admin-btn-primary' onClick={openCreateForm}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ➕ Add Tag
          </button>
        )}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className='admin-section-card' style={{ marginBottom: '1.5rem', border: '1px solid rgba(74,222,128,0.3)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h4 style={{ margin: 0 }}>{editingTag ? `✏️ Edit: ${editingTag.name}` : '➕ Create Tag'}</h4>
            <button className='admin-btn-outline' onClick={resetForm} style={{ padding: '0.25rem 0.75rem', fontSize: '0.75rem' }}>← Back to List</button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className='admin-field'>
              <label>Tag Name *</label>
              <input
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder='e.g. new-arrivals, jordan-1, under-50'
                required
                autoFocus
              />
              <p style={{ fontSize: '0.75rem', color: '#a1a1aa', margin: '0.25rem 0 0' }}>
                Tags tự động sort theo số products dùng chúng (phổ biến nhất lên đầu).
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button type='submit' className='admin-btn-primary' disabled={submitting || !formData.name.trim()}>
                {submitting ? '⏳ Saving...' : editingTag ? '💾 Update Tag' : '➕ Create Tag'}
              </button>
              <button type='button' className='admin-btn-outline' onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Tag List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#71717a' }}>
          <div className='admin-spinner' style={{ margin: '0 auto 0.5rem' }} /> Loading tags...
        </div>
      ) : error ? (
        <div className='admin-section-card'>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p style={{ color: '#ef4444', marginBottom: '0.5rem' }}>⚠️ {error}</p>
            <p style={{ color: '#71717a', fontSize: '0.8125rem', marginBottom: '1rem' }}>
              Tag management requires Django backend admin-tags endpoints.<br/>
              If the backend doesn&apos;t support this yet, tags can only be managed in Django admin.
            </p>
            <button className='admin-btn-outline' onClick={fetchTags}>🔄 Retry</button>
          </div>
        </div>
      ) : tags.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#71717a' }}>No tags yet. Click &quot;Add Tag&quot; to create one.</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: '#a1a1aa', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Name</th>
                <th style={{ textAlign: 'left', padding: '0.75rem 0.5rem', color: '#a1a1aa', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Slug</th>
                <th style={{ textAlign: 'center', padding: '0.75rem 0.5rem', color: '#a1a1aa', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Products</th>
                <th style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: '#a1a1aa', fontWeight: 500, fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tags.map(tag => (
                <tr key={tag.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '0.625rem 0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ color: '#a1a1aa', fontSize: '0.875rem' }}>#</span>
                      <span style={{ fontWeight: 600 }}>{tag.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: '0.625rem 0.5rem', color: '#71717a', fontFamily: 'monospace', fontSize: '0.8125rem' }}>{tag.slug}</td>
                  <td style={{ padding: '0.625rem 0.5rem', textAlign: 'center' }}>
                    <span style={{ background: '#1e3a5f', color: '#60a5fa', padding: '0.125rem 0.5rem', borderRadius: '2rem', fontSize: '0.75rem' }}>
                      {tag.numProducts}
                    </span>
                  </td>
                  <td style={{ padding: '0.625rem 0.5rem', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className='admin-btn-outline' onClick={() => openEditForm(tag)}
                        style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem' }}>✏️ Edit</button>
                      <button className='admin-btn-remove' onClick={() => handleDelete(tag)}
                        style={{ padding: '0.25rem 0.625rem', fontSize: '0.75rem', minWidth: confirmingDelete === tag.id ? 70 : undefined, background: confirmingDelete === tag.id ? '#dc2626' : undefined }}
                        title={tag.numProducts > 0 ? 'Warning: has products assigned' : 'Delete tag'}>{confirmingDelete === tag.id ? '⚠️ Confirm?' : '🗑️'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── Article Management Component ───
interface ArticleListItem {
  id: number
  title: string
  slug: string
  code: string
  excerpt: string
  featuredImage: string
  status: 'draft' | 'published'
  featured: boolean
  authorName: string
  categoryId: number | null
  categorySlug: string
  categoryName: string
  tagIds: number[]
  tagSlugs: string[]
  publishedAt: string
  createdAt: string
  updatedAt: string
}

interface ArticleCategoryOption {
  id: number
  name: string
  slug: string
}

interface ArticleTagOption {
  id: number
  name: string
  slug: string
}

interface ArticleFormData {
  title: string
  slug: string
  excerpt: string
  content: string
  featuredImage: string
  categoryId: string
  tagIds: string[]
  authorName: string
  status: 'draft' | 'published'
  featured: boolean
  publishedAt: string
  metaTitle: string
  metaDesc: string
}

const emptyArticleForm: ArticleFormData = {
  title: '',
  slug: '',
  excerpt: '',
  content: '',
  featuredImage: '',
  categoryId: '',
  tagIds: [],
  authorName: '',
  status: 'draft',
  featured: false,
  publishedAt: '',
  metaTitle: '',
  metaDesc: '',
}

function ArticleManagement({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [articles, setArticles] = useState<ArticleListItem[]>([])
  const [categories, setCategories] = useState<ArticleCategoryOption[]>([])
  const [allTags, setAllTags] = useState<ArticleTagOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'' | 'draft' | 'published'>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list')
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState<ArticleFormData>(emptyArticleForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const fetchArticles = useCallback(async (p = page, s = search, st = statusFilter) => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(p), page_size: '15' })
      if (s) params.set('search', s)
      if (st) params.set('status', st)
      const res = await fetch(`/api/admin/articles?${params}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setArticles(data.items || [])
      setTotalPages(data.numPages || 1)
      setTotal(data.total || 0)
    } catch {
      showToast('Failed to load articles', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, statusFilter, showToast])

  const fetchOptions = useCallback(async () => {
    try {
      // Fetch both categories (for display) and the options endpoint
      // (categories + tags with integer IDs for form pickers).
      const [catRes, optRes] = await Promise.all([
        fetch('/api/admin/article-categories', { cache: 'no-store' }),
        fetch('/api/admin/articles/options', { cache: 'no-store' }),
      ])
      if (catRes.ok) {
        const data = await catRes.json()
        setCategories(data.items || [])
      }
      if (optRes.ok) {
        const data = await optRes.json()
        setAllTags(data.tags || [])
      }
    } catch { /* ignore */ }
  }, [])

  useEffect(() => { fetchArticles() }, [fetchArticles])
  useEffect(() => { fetchOptions() }, [fetchOptions])

  const handleSearch = () => { setPage(1); fetchArticles(1, search, statusFilter) }

  const handleCreate = () => {
    setForm({ ...emptyArticleForm, categoryId: categories[0] ? String(categories[0].id) : '' })
    setEditingId(null)
    setShowPreview(false)
    setMode('create')
  }

  const handleEdit = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/articles/${id}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      const a = data.article
      setForm({
        title: a.title || '',
        slug: a.slug || '',
        excerpt: a.excerpt || '',
        content: a.content || '',
        featuredImage: a.featuredImage || '',
        categoryId: a.categoryId ? String(a.categoryId) : '',
        tagIds: (a.tagIds || []).map(String),
        authorName: a.authorName || '',
        status: a.status || 'draft',
        featured: !!a.featured,
        publishedAt: a.publishedAt ? a.publishedAt.slice(0, 16) : '',
        metaTitle: a.metaTitle || '',
        metaDesc: a.metaDesc || '',
      })
      setEditingId(id)
      setShowPreview(false)
      setMode('edit')
    } catch {
      showToast('Failed to load article', 'error')
    }
  }

  const handleDelete = async (id: number, title: string) => {
    if (confirmingDelete !== id) {
      setConfirmingDelete(id)
      setTimeout(() => setConfirmingDelete(prev => prev === id ? null : prev), 5000)
      return
    }
    setConfirmingDelete(null)
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/articles/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setArticles(prev => prev.filter(a => a.id !== id))
      setTotal(t => Math.max(0, t - 1))
      showToast(`Article "${title}" deleted`, 'success')
      fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/', '/blog', `/articles/${articles.find(a => a.id === id)?.slug || ''}`], tags: ['cms-content'] }),
      }).catch(() => {})
    } catch {
      showToast('Failed to delete article', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        title: form.title,
        excerpt: form.excerpt,
        content: form.content,
        featuredImage: form.featuredImage,
        authorName: form.authorName,
        status: form.status,
        featured: form.featured,
        metaTitle: form.metaTitle,
        metaDesc: form.metaDesc,
        categoryId: form.categoryId ? parseInt(form.categoryId, 10) : null,
        tagIds: form.tagIds.map(id => parseInt(id, 10)).filter(n => !Number.isNaN(n)),
        publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : '',
      }

      let res: Response
      if (mode === 'create') {
        res = await fetch('/api/admin/articles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        res = await fetch(`/api/admin/articles/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Save failed')
      }

      const data = await res.json()
      const savedSlug = data.article?.slug || form.slug

      showToast(mode === 'create' ? 'Article created!' : 'Article updated!', 'success')
      // Purge caches so the post appears on the live site within a few seconds.
      fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paths: ['/', '/blog', `/articles/${savedSlug}`],
          tags: ['cms-content'],
        }),
      }).catch(() => {})

      setMode('list')
      fetchArticles()
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const statusBadge: Record<string, { color: string; label: string }> = {
    draft: { color: '#a1a1aa', label: 'Draft' },
    published: { color: '#22c55e', label: 'Published' },
  }

  // ─── Create / Edit form ───
  if (mode === 'create' || mode === 'edit') {
    return (
      <div className='admin-section-card'>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3>{mode === 'create' ? '✍️ Write New Article' : `✏️ Edit Article #${editingId}`}</h3>
          <button className='admin-btn-outline' onClick={() => setMode('list')}>← Back to List</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className='admin-field'>
            <label>Title *</label>
            <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className='admin-field'>
            <label>Slug (optional — auto-generated from title)</label>
            <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} placeholder='my-first-post' />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
            <div className='admin-field'>
              <label>Category</label>
              <select value={form.categoryId} onChange={e => setForm({ ...form, categoryId: e.target.value })}>
                <option value=''>— None —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className='admin-field'>
              <label>Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as 'draft' | 'published' })}>
                <option value='draft'>Draft</option>
                <option value='published'>Published</option>
              </select>
            </div>
            <div className='admin-field'>
              <label>Author Name</label>
              <input value={form.authorName} onChange={e => setForm({ ...form, authorName: e.target.value })} placeholder='Jane Doe' />
            </div>
          </div>

          <div className='admin-field'>
            <label>Excerpt (short summary shown on list & cards)</label>
            <textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2} />
          </div>

          <div className='admin-field'>
            <ImageUploader
              currentUrl={form.featuredImage}
              onUpload={url => setForm({ ...form, featuredImage: url })}
              label='Featured Image (cover)'
            />
          </div>

          <div className='admin-field'>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Content (HTML) *</label>
              <button type='button' className='admin-btn-outline' style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setShowPreview(s => !s)}>
                {showPreview ? '📝 Edit' : '👁️ Preview'}
              </button>
            </div>
            {showPreview ? (
              <div
                className='wiki-styled'
                style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 6, padding: '1rem', minHeight: 200, background: 'rgba(255,255,255,0.02)' }}
                dangerouslySetInnerHTML={{ __html: form.content || '<p style="opacity:.5">Nothing to preview yet…</p>' }}
              />
            ) : (
              <textarea
                value={form.content}
                onChange={e => setForm({ ...form, content: e.target.value })}
                rows={14}
                placeholder='<p>Write your article as HTML — e.g. &lt;h2&gt;Heading&lt;/h2&gt; &lt;p&gt;Paragraph&lt;/p&gt;</p>'
                style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                required
              />
            )}
            <p style={{ fontSize: '0.75rem', color: '#71717a', marginTop: '0.25rem' }}>
              Tip: you can paste HTML (headings, paragraphs, &lt;img src=&quot;…&quot; /&gt;, links). Content is rendered via html-react-parser.
            </p>
          </div>

          <div className='admin-field'>
            <label>
              Tags <span style={{ fontSize: '0.75rem', color: '#a1a1aa', fontWeight: 'normal' }}>
                (click to toggle — {form.tagIds.length} selected)
              </span>
            </label>
            {allTags.length === 0 ? (
              <p style={{ fontSize: '0.8rem', color: '#a1a1aa', margin: '0.25rem 0' }}>
                No article tags available. Manage them from Django admin.
              </p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', padding: '0.5rem', border: '1px solid #27272a', borderRadius: '0.375rem', maxHeight: 160, overflowY: 'auto', background: '#18181b' }}>
                {allTags.map(t => {
                  const tagId = String(t.id)
                  const selected = form.tagIds.includes(tagId)
                  return (
                    <button
                      type='button'
                      key={tagId}
                      onClick={() => {
                        const next = selected
                          ? form.tagIds.filter(s => s !== tagId)
                          : [...form.tagIds, tagId]
                        setForm({ ...form, tagIds: next })
                      }}
                      style={{
                        padding: '0.25rem 0.625rem',
                        fontSize: '0.75rem',
                        borderRadius: '2rem',
                        border: selected ? '1px solid #3b82f6' : '1px solid #3f3f46',
                        background: selected ? '#1e3a5f' : 'transparent',
                        color: selected ? '#60a5fa' : '#d4d4d8',
                        cursor: 'pointer',
                      }}
                    >
                      {selected ? '✓ ' : ''}{t.name}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
          <div className='admin-field'>
            <label>Publish Date (optional — defaults to now)</label>
            <input type='datetime-local' value={form.publishedAt} onChange={e => setForm({ ...form, publishedAt: e.target.value })} />
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', margin: '1rem 0' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input type='checkbox' checked={form.featured} onChange={e => setForm({ ...form, featured: e.target.checked })} />
              ⭐ Featured Article
            </label>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className='admin-field'>
              <label>Meta Title (SEO)</label>
              <input value={form.metaTitle} onChange={e => setForm({ ...form, metaTitle: e.target.value })} maxLength={60} />
            </div>
            <div className='admin-field'>
              <label>Meta Description (SEO)</label>
              <input value={form.metaDesc} onChange={e => setForm({ ...form, metaDesc: e.target.value })} maxLength={160} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type='submit' className='admin-btn-save' disabled={saving}>
              {saving ? '⏳ Saving...' : mode === 'create' ? '✍️ Create Article' : '💾 Update Article'}
            </button>
            <button type='button' className='admin-btn-outline' onClick={() => setMode('list')}>Cancel</button>
          </div>
        </form>
      </div>
    )
  }

  // ─── List view ───
  return (
    <div className='admin-section-card'>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h3>✍️ Blog Articles ({total})</h3>
        <button className='admin-btn-save' onClick={handleCreate}>➕ Write New Article</button>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <input
          placeholder='Search title, slug, excerpt...'
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value as '' | 'draft' | 'published'); setPage(1); fetchArticles(1, search, e.target.value as '' | 'draft' | 'published') }}>
          <option value=''>All Status</option>
          <option value='published'>Published</option>
          <option value='draft'>Draft</option>
        </select>
        <button className='admin-btn-outline' onClick={handleSearch}>🔍 Search</button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className='admin-spinner' style={{ margin: '0 auto 1rem' }} />
          <p style={{ color: '#71717a' }}>Loading articles...</p>
        </div>
      ) : articles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#71717a' }}>
          <p>No articles yet</p>
          <p style={{ fontSize: '0.8rem' }}>Click &quot;Write New Article&quot; to publish your first post.</p>
        </div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#a1a1aa' }}>Cover</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#a1a1aa' }}>Title</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#a1a1aa' }}>Category</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#a1a1aa' }}>Status</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#a1a1aa' }}>Published</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#a1a1aa', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {articles.map(a => (
                  <tr key={a.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.5rem' }}>
                      {a.featuredImage ? (
                        <img src={a.featuredImage} alt={a.title} style={{ width: 56, height: 36, objectFit: 'cover', borderRadius: 4 }} />
                      ) : (
                        <div style={{ width: 56, height: 36, background: '#27272a', borderRadius: 4 }} />
                      )}
                    </td>
                    <td style={{ padding: '0.5rem', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      <div style={{ fontWeight: 500 }}>{a.title}{a.featured && ' ⭐'}</div>
                      <div style={{ fontSize: '0.7rem', color: '#71717a', fontFamily: 'monospace' }}>/{a.slug}</div>
                    </td>
                    <td style={{ padding: '0.5rem', color: '#a1a1aa', fontSize: '0.8rem' }}>{a.categoryName || '—'}</td>
                    <td style={{ padding: '0.5rem' }}>
                      <span style={{ background: statusBadge[a.status].color + '22', color: statusBadge[a.status].color, padding: '0.125rem 0.5rem', borderRadius: 12, fontSize: '0.75rem' }}>
                        {statusBadge[a.status].label}
                      </span>
                    </td>
                    <td style={{ padding: '0.5rem', color: '#a1a1aa', fontSize: '0.75rem' }}>
                      {a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : '—'}
                    </td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      <button className='admin-btn-outline' style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginRight: 4 }} onClick={() => handleEdit(a.id)}>✏️</button>
                      <button className='admin-btn-remove' style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: confirmingDelete === a.id ? 70 : undefined, background: confirmingDelete === a.id ? '#dc2626' : undefined }} onClick={() => handleDelete(a.id, a.title)} disabled={deleting === a.id}>
                        {deleting === a.id ? '⏳' : confirmingDelete === a.id ? '⚠️ Confirm?' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button className='admin-btn-outline' disabled={page <= 1} onClick={() => { setPage(page - 1); fetchArticles(page - 1) }}>← Prev</button>
              <span style={{ color: '#a1a1aa', alignSelf: 'center', fontSize: '0.8rem' }}>Page {page} / {totalPages}</span>
              <button className='admin-btn-outline' disabled={page >= totalPages} onClick={() => { setPage(page + 1); fetchArticles(page + 1) }}>Next →</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

// ─── Article Category Management ───
interface ArticleCategoryItem {
  id: number
  name: string
  slug: string
  desc: string
  order: number
  metaTitle: string
  metaDesc: string
  numArticles: number
}

function ArticleCategoryManagement({ showToast }: { showToast: (msg: string, type: 'success' | 'error') => void }) {
  const [categories, setCategories] = useState<ArticleCategoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState({ name: '', slug: '', desc: '', order: 0, metaTitle: '', metaDesc: '' })
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState<number | null>(null)

  const fetchCategories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/article-categories', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCategories(data.items || [])
    } catch {
      showToast('Failed to load categories', 'error')
    } finally {
      setLoading(false)
    }
  }, [showToast])

  useEffect(() => { fetchCategories() }, [fetchCategories])

  const resetForm = () => {
    setForm({ name: '', slug: '', desc: '', order: 0, metaTitle: '', metaDesc: '' })
    setEditingId(null)
  }

  const handleEdit = (c: ArticleCategoryItem) => {
    setForm({
      name: c.name,
      slug: c.slug,
      desc: c.desc,
      order: c.order,
      metaTitle: c.metaTitle,
      metaDesc: c.metaDesc,
    })
    setEditingId(c.id)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/admin/article-categories/${editingId}` : '/api/admin/article-categories'
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Save failed')
      }
      showToast(editingId ? 'Category updated' : 'Category created', 'success')
      fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/blog'], tags: ['cms-content'] }),
      }).catch(() => {})
      resetForm()
      fetchCategories()
    } catch (err: any) {
      showToast(err.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, name: string, numArticles: number) => {
    if (confirmingDelete !== id) {
      setConfirmingDelete(id)
      setTimeout(() => setConfirmingDelete(prev => prev === id ? null : prev), 5000)
      return
    }
    setConfirmingDelete(null)
    setDeleting(id)
    try {
      const res = await fetch(`/api/admin/article-categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      showToast(`Category "${name}" deleted${numArticles ? ` (${numArticles} article(s) unassigned)` : ''}`, 'success')
      fetch('/api/admin/revalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths: ['/blog'], tags: ['cms-content'] }),
      }).catch(() => {})
      fetchCategories()
    } catch {
      showToast('Failed to delete category', 'error')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className='admin-section-card' style={{ marginBottom: '1.5rem', border: '1px solid rgba(74,222,128,0.3)' }}>
        <h3>{editingId ? `✏️ Edit Category #${editingId}` : '➕ New Blog Category'}</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 100px', gap: '1rem' }}>
            <div className='admin-field'>
              <label>Name *</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className='admin-field'>
              <label>Slug (optional)</label>
              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className='admin-field'>
              <label>Order</label>
              <input type='number' value={form.order} onChange={e => setForm({ ...form, order: parseInt(e.target.value) || 0 })} />
            </div>
          </div>
          <div className='admin-field'>
            <label>Description</label>
            <textarea value={form.desc} onChange={e => setForm({ ...form, desc: e.target.value })} rows={2} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className='admin-field'>
              <label>Meta Title (SEO)</label>
              <input value={form.metaTitle} onChange={e => setForm({ ...form, metaTitle: e.target.value })} maxLength={60} />
            </div>
            <div className='admin-field'>
              <label>Meta Description (SEO)</label>
              <input value={form.metaDesc} onChange={e => setForm({ ...form, metaDesc: e.target.value })} maxLength={160} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
            <button type='submit' className='admin-btn-save' disabled={saving}>
              {saving ? '⏳ Saving...' : editingId ? '💾 Update' : '➕ Create'}
            </button>
            {editingId && (
              <button type='button' className='admin-btn-outline' onClick={resetForm}>Cancel</button>
            )}
          </div>
        </form>
      </div>

      <div className='admin-section-card'>
        <h3>📚 Blog Categories ({categories.length})</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className='admin-spinner' style={{ margin: '0 auto 0.5rem' }} /> Loading...
          </div>
        ) : categories.length === 0 ? (
          <p style={{ color: '#71717a', textAlign: 'center', padding: '1rem' }}>No categories yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'left' }}>
                  <th style={{ padding: '0.5rem', color: '#a1a1aa' }}>Name</th>
                  <th style={{ padding: '0.5rem', color: '#a1a1aa' }}>Slug</th>
                  <th style={{ padding: '0.5rem', color: '#a1a1aa' }}>Articles</th>
                  <th style={{ padding: '0.5rem', color: '#a1a1aa' }}>Order</th>
                  <th style={{ padding: '0.5rem', color: '#a1a1aa', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.5rem', fontWeight: 500 }}>{c.name}</td>
                    <td style={{ padding: '0.5rem', color: '#a1a1aa', fontFamily: 'monospace', fontSize: '0.75rem' }}>{c.slug}</td>
                    <td style={{ padding: '0.5rem', color: '#a1a1aa' }}>{c.numArticles}</td>
                    <td style={{ padding: '0.5rem', color: '#a1a1aa' }}>{c.order}</td>
                    <td style={{ padding: '0.5rem', textAlign: 'right' }}>
                      <button className='admin-btn-outline' style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginRight: 4 }} onClick={() => handleEdit(c)}>✏️</button>
                      <button className='admin-btn-remove' style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', minWidth: confirmingDelete === c.id ? 70 : undefined, background: confirmingDelete === c.id ? '#dc2626' : undefined }} onClick={() => handleDelete(c.id, c.name, c.numArticles)} disabled={deleting === c.id}>
                        {deleting === c.id ? '⏳' : confirmingDelete === c.id ? '⚠️ Confirm?' : '🗑️'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  const [isAuth, setIsAuth] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [content, setContent] = useState<SiteContent>(stripHeroSlidesFromContent(defaultContent))
  const [heroSlides, setHeroSlides] = useState<HeroSlideRecord[]>([])
  const [activeSection, setActiveSection] = useState<SectionKey>('seo')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [hasChanges, setHasChanges] = useState(false)

  // Check if already authenticated via session cookie
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const authRes = await fetch('/api/admin/auth')
        if (!authRes.ok) {
          setIsAuth(false)
          setIsCheckingAuth(false)
          return
        }
        const authData = await authRes.json()
        if (!authData.authenticated) {
          setIsAuth(false)
          setIsCheckingAuth(false)
          return
        }
        // Session is valid — load content
        const contentRes = await fetch('/api/admin/content', { cache: 'no-store' })
        if (contentRes.ok) {
          const data = await contentRes.json()
          setContent(stripHeroSlidesFromContent({ ...defaultContent, ...data, productSeo: data.productSeo || [] }))
        }
        setIsAuth(true)
      } catch {
        setIsAuth(false)
      } finally {
        setIsCheckingAuth(false)
      }
    }
    checkAuth()
  }, [])

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }, [])

  // ─── Login ───
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Login failed')
      }
      // Load content
      const contentRes = await fetch('/api/admin/content', { cache: 'no-store' })
      const contentData = await contentRes.json()
      setContent(stripHeroSlidesFromContent({ ...defaultContent, ...contentData, productSeo: contentData.productSeo || [] }))
      setIsAuth(true)
    } catch (err: any) {
      setLoginError(err.message || 'Login failed')
    } finally {
      setLoginLoading(false)
    }
  }

  // ─── Logout ───
  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' })
    setIsAuth(false)
    setPassword('')
  }

  // ─── Save ───
  const handleSave = async () => {
    setSaving(true)
    try {
      for (const slide of heroSlides) {
        const payload = {
          slide: {
            type: slide.type,
            title: slide.title,
            description: slide.description,
            buttonText: slide.buttonText,
            image: slide.image,
            link: slide.link,
            order: Number(slide.order) || 1,
            status: slide.status,
          },
        }

        const response = slide.id
          ? await fetch(`/api/admin/hero-slides/${slide.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })
          : await fetch('/api/admin/hero-slides', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload),
            })

        if (!response.ok) {
          const data = await response.json().catch(() => ({} as any))
          throw new Error(data.error || `Hero slide save failed (HTTP ${response.status})`)
        }
      }

      // Products/brands/tags/articles live in Django now — the Blob only
      // holds home/footer/seo/menu state, so no read-modify-write merge
      // against sibling fields is needed here.
      const payload = {
        ...content,
        home: {
          ...content.home,
          hero: {
            enabled: content.home.hero.enabled,
            order: content.home.hero.order,
          },
        },
      }
      console.log('[admin content] submit payload', { heroSlides: content.home.hero.defaultSlides.length })
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({} as any))
        const parts = [data.error || `Save failed (HTTP ${res.status})`]
        if (data.detail) parts.push(`— ${data.detail}`)
        if (data.hasBlobToken === false) parts.push('— BLOB_READ_WRITE_TOKEN missing on Vercel')
        throw new Error(parts.join(' '))
      }

      // Trigger on-demand revalidation to purge all server caches immediately
      try {
        await fetch('/api/admin/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paths: ['/', '/c', '/b', '/t'],
            tags: ['cms-content'],
          }),
        })
      } catch {
        // revalidation is best-effort, don't fail the save
      }

      setHasChanges(false)
      showToast('✓ Content saved & cache purged!', 'success')
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ─── Content Updaters ───
  const updateContent = (updater: (prev: SiteContent) => SiteContent) => {
    setContent(prev => updater(prev))
    setHasChanges(true)
  }

  const updateSeo = (field: string, value: string) => {
    updateContent(prev => ({ ...prev, seo: { ...prev.seo, [field]: value } }))
  }

  const updateHomeSection = (section: keyof HomeContent, field: string, value: any) => {
    updateContent(prev => ({
      ...prev,
      home: {
        ...prev.home,
        [section]: { ...prev.home[section], [field]: value },
      },
    }))
  }

  const updateFooter = (field: string, value: any) => {
    updateContent(prev => ({ ...prev, footer: { ...prev.footer, [field]: value } }))
  }

  const updateFooterContact = (field: string, value: string) => {
    updateContent(prev => ({
      ...prev,
      footer: { ...prev.footer, contact: { ...prev.footer.contact, [field]: value } },
    }))
  }

  // ─── Product SEO Updaters ───
  const addProductSeo = () => {
    updateContent(prev => ({
      ...prev,
      productSeo: [...(prev.productSeo || []), { slug: '', title: '', description: '', keywords: '', ogImage: '' }],
    }))
  }

  const updateProductSeo = (index: number, field: keyof ProductSeoOverride, value: string) => {
    updateContent(prev => {
      const items = [...(prev.productSeo || [])]
      items[index] = { ...items[index], [field]: value }
      return { ...prev, productSeo: items }
    })
  }

  const removeProductSeo = (index: number) => {
    updateContent(prev => {
      const items = [...(prev.productSeo || [])]
      items.splice(index, 1)
      return { ...prev, productSeo: items }
    })
  }

  // ─── Checking auth ───
  if (isCheckingAuth) {
    return (
      <div className='admin-login-wrapper'>
        <div className='admin-login-card' style={{ textAlign: 'center' }}>
          <div className='admin-spinner' style={{ margin: '2rem auto' }} />
          <p style={{ color: '#71717a' }}>Loading...</p>
        </div>
      </div>
    )
  }

  // ─── Login Screen ───
  if (!isAuth) {
    return (
      <div className='admin-login-wrapper'>
        <form className='admin-login-card' onSubmit={handleLogin}>
          <h1>🔒 Admin Panel</h1>
          <p>Enter your admin password to continue</p>
          {loginError && <div className='admin-error'>{loginError}</div>}
          <div className='admin-field'>
            <input
              type='password'
              className='admin-input'
              placeholder='Enter admin password...'
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
              autoComplete='current-password'
            />
          </div>
          <button
            type='submit'
            className='admin-btn-primary'
            disabled={loginLoading || !password}
          >
            {loginLoading ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                <span className='admin-spinner' /> Authenticating...
              </span>
            ) : 'Sign In'}
          </button>
        </form>
      </div>
    )
  }

  // ─── Dashboard ───
  return (
    <div className='admin-dashboard'>
      {/* Sidebar */}
      <aside className='admin-sidebar'>
        <div className='admin-sidebar-header'>
          <h2>🛠️ FulfillNext CMS</h2>
        </div>
        <nav className='admin-sidebar-nav'>
          {SECTIONS.map(sec => {
            const isHomeSection = sec.key !== 'seo' && sec.key !== 'footer' && sec.key !== 'mediaLibrary' && sec.key !== 'products' && sec.key !== 'tags' && sec.key !== 'mainMenu' && sec.key !== 'articles' && sec.key !== 'articleCategories'
            const homeKey = sec.key as keyof HomeContent
            const sectionData = isHomeSection ? content.home[homeKey] : null
            const isEnabled = sectionData && 'enabled' in (sectionData as any) ? (sectionData as any).enabled : true

            return (
              <div
                key={sec.key}
                className={`admin-nav-item ${activeSection === sec.key ? 'active' : ''}`}
                onClick={() => setActiveSection(sec.key)}
              >
                <span className='admin-nav-icon'>{sec.icon}</span>
                <span style={{ flex: 1 }}>{sec.label}</span>
                {isHomeSection && (
                  <button
                    className={`admin-nav-toggle ${isEnabled ? 'enabled' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      updateHomeSection(homeKey, 'enabled', !isEnabled)
                    }}
                    title={isEnabled ? 'Disable section' : 'Enable section'}
                  />
                )}
              </div>
            )
          })}
        </nav>
        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button className='admin-btn-danger' onClick={handleLogout} style={{ width: '100%' }}>
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className='admin-main'>
        {/* Top Bar */}
        <div className='admin-topbar'>
          <div className='admin-topbar-title'>
            {SECTIONS.find(s => s.key === activeSection)?.icon}{' '}
            {SECTIONS.find(s => s.key === activeSection)?.label}
          </div>
          <div className='admin-topbar-actions'>
            {hasChanges && (
              <span style={{ color: '#fbbf24', fontSize: '0.8125rem' }}>● Unsaved changes</span>
            )}
            <button
              className='admin-btn-outline'
              onClick={() => window.open('https://www.fulfillnext.com', '_blank')}
            >
              👁️ Preview Site
            </button>
            <button
              className='admin-btn-save'
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? (
                <>
                  <span className='admin-spinner' /> Saving...
                </>
              ) : '💾 Save Changes'}
            </button>
          </div>
        </div>

        {/* Editor */}
        <div className='admin-editor'>
          {/* SEO Section */}
          {activeSection === 'seo' && (
            <div className='admin-section-card'>
              <h3>SEO & Meta Tags</h3>
              <div className='admin-field'>
                <label>Site Title</label>
                <input value={content.seo.title} onChange={e => updateSeo('title', e.target.value)} />
              </div>
              <div className='admin-field'>
                <label>Meta Description</label>
                <textarea value={content.seo.description} onChange={e => updateSeo('description', e.target.value)} rows={3} />
              </div>
              <div className='admin-field'>
                <label>Keywords (comma-separated)</label>
                <input value={content.seo.keywords} onChange={e => updateSeo('keywords', e.target.value)} />
              </div>
              <ImageUploader
                currentUrl={content.seo.ogImage}
                onUpload={url => updateSeo('ogImage', url)}
                label='OG Image'
              />
            </div>
          )}

          {/* Main Menu Section */}
          {activeSection === 'mainMenu' && (
            <div className='admin-section-card'>
              <MainMenuManagement />
            </div>
          )}

          {/* Hero Section */}
          {activeSection === 'hero' && (
            <div className='admin-section-card'>
                <h3>Hero Slider</h3>
                <HeroSliderManagement
                  enabled={content.home.hero.enabled}
                  order={content.home.hero.order}
                  onEnabledChange={value => updateHomeSection('hero', 'enabled', value)}
                  onOrderChange={value => updateHomeSection('hero', 'order', value)}
                  onDirty={() => setHasChanges(true)}
                  onSlidesChange={setHeroSlides}
                  showToast={showToast}
                />
            </div>
          )}

          {/* Simple section editors */}
          {(['latestProducts', 'featuredArticles', 'bestsellers'] as Array<keyof HomeContent>).map(sectionKey => {
            if (activeSection !== sectionKey) return null
            const section = content.home[sectionKey] as any
            return (
              <div key={sectionKey} className='admin-section-card'>
                <h3>{SECTIONS.find(s => s.key === sectionKey)?.label}</h3>
                <div className='admin-toggle-row'>
                  <label>Section Enabled</label>
                  <button
                    className={`admin-toggle ${section.enabled ? 'enabled' : ''}`}
                    onClick={() => updateHomeSection(sectionKey, 'enabled', !section.enabled)}
                  />
                </div>
                <div className='admin-field'>
                  <label>Display Order</label>
                  <input
                    type='number'
                    className='admin-order-input'
                    value={section.order}
                    onChange={e => updateHomeSection(sectionKey, 'order', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className='admin-field'>
                  <label>Title</label>
                  <input
                    value={section.title}
                    onChange={e => updateHomeSection(sectionKey, 'title', e.target.value)}
                  />
                </div>
                {section.subtitle !== undefined && (
                  <div className='admin-field'>
                    <label>Subtitle</label>
                    <textarea
                      value={section.subtitle}
                      onChange={e => updateHomeSection(sectionKey, 'subtitle', e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
              </div>
            )
          })}

          {/* Categories Section — with full category management */}
          {activeSection === 'categories' && (
            <>
              <div className='admin-section-card'>
                <h3>📂 Categories Section Settings</h3>
                <div className='admin-toggle-row'>
                  <label>Section Enabled</label>
                  <button
                    className={`admin-toggle ${content.home.categories.enabled ? 'enabled' : ''}`}
                    onClick={() => updateHomeSection('categories', 'enabled', !content.home.categories.enabled)}
                  />
                </div>
                <div className='admin-field'>
                  <label>Display Order</label>
                  <input type='number' className='admin-order-input' value={content.home.categories.order}
                    onChange={e => updateHomeSection('categories', 'order', parseInt(e.target.value) || 1)} />
                </div>
                <div className='admin-field'>
                  <label>Title</label>
                  <input value={content.home.categories.title}
                    onChange={e => updateHomeSection('categories', 'title', e.target.value)} />
                </div>
                <div className='admin-field'>
                  <label>Subtitle</label>
                  <textarea value={content.home.categories.subtitle}
                    onChange={e => updateHomeSection('categories', 'subtitle', e.target.value)} rows={2} />
                </div>
              </div>
              <div className='admin-section-card' style={{ marginTop: '1rem' }}>
                <CategoryManagement />
              </div>
            </>
          )}

          {/* YouTube Section */}
          {activeSection === 'youtube' && (
            <div className='admin-section-card'>
              <h3>YouTube Video</h3>
              <div className='admin-toggle-row'>
                <label>Section Enabled</label>
                <button
                  className={`admin-toggle ${content.home.youtube.enabled ? 'enabled' : ''}`}
                  onClick={() => updateHomeSection('youtube', 'enabled', !content.home.youtube.enabled)}
                />
              </div>
              <div className='admin-field'>
                <label>Display Order</label>
                <input
                  type='number'
                  className='admin-order-input'
                  value={content.home.youtube.order}
                  onChange={e => updateHomeSection('youtube', 'order', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className='admin-field'>
                <label>Title</label>
                <input value={content.home.youtube.title} onChange={e => updateHomeSection('youtube', 'title', e.target.value)} />
              </div>
              <div className='admin-field'>
                <label>Subtitle</label>
                <textarea value={content.home.youtube.subtitle} onChange={e => updateHomeSection('youtube', 'subtitle', e.target.value)} rows={2} />
              </div>
              <div className='admin-field'>
                <label>YouTube Video ID (e.g. &quot;6CQZ6fKkROY&quot;)</label>
                <input value={content.home.youtube.videoId} onChange={e => updateHomeSection('youtube', 'videoId', e.target.value)} />
              </div>
              {content.home.youtube.videoId && (
                <div style={{ marginTop: '1rem', borderRadius: '0.5rem', overflow: 'hidden', aspectRatio: '16/9', maxWidth: '400px' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${content.home.youtube.videoId}`}
                    title='Preview'
                    style={{ width: '100%', height: '100%', border: 'none' }}
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          )}

          {/* Banner CTA */}
          {activeSection === 'bannerCTA' && (
            <div className='admin-section-card'>
              <h3>Banner CTA</h3>
              <div className='admin-toggle-row'>
                <label>Section Enabled</label>
                <button
                  className={`admin-toggle ${content.home.bannerCTA.enabled ? 'enabled' : ''}`}
                  onClick={() => updateHomeSection('bannerCTA', 'enabled', !content.home.bannerCTA.enabled)}
                />
              </div>
              <div className='admin-field'>
                <label>Display Order</label>
                <input
                  type='number'
                  className='admin-order-input'
                  value={content.home.bannerCTA.order}
                  onChange={e => updateHomeSection('bannerCTA', 'order', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className='admin-field'>
                <label>Title</label>
                <input value={content.home.bannerCTA.title} onChange={e => updateHomeSection('bannerCTA', 'title', e.target.value)} />
              </div>
              <div className='admin-field'>
                <label>Description</label>
                <textarea value={content.home.bannerCTA.description} onChange={e => updateHomeSection('bannerCTA', 'description', e.target.value)} rows={3} />
              </div>
              <ImageUploader
                currentUrl={content.home.bannerCTA.backgroundImage}
                onUpload={url => updateHomeSection('bannerCTA', 'backgroundImage', url)}
                label='Background Image'
              />
              <h3 style={{ marginTop: '1.5rem' }}>Buttons</h3>
              <div className='admin-field-row'>
                <div className='admin-field'>
                  <label>Primary Button Text</label>
                  <input
                    value={content.home.bannerCTA.primaryButton.text}
                    onChange={e => updateHomeSection('bannerCTA', 'primaryButton', { ...content.home.bannerCTA.primaryButton, text: e.target.value })}
                  />
                </div>
                <div className='admin-field'>
                  <label>Primary Button Link</label>
                  <input
                    value={content.home.bannerCTA.primaryButton.link}
                    onChange={e => updateHomeSection('bannerCTA', 'primaryButton', { ...content.home.bannerCTA.primaryButton, link: e.target.value })}
                  />
                </div>
              </div>
              <div className='admin-field-row'>
                <div className='admin-field'>
                  <label>Secondary Button Text</label>
                  <input
                    value={content.home.bannerCTA.secondaryButton.text}
                    onChange={e => updateHomeSection('bannerCTA', 'secondaryButton', { ...content.home.bannerCTA.secondaryButton, text: e.target.value })}
                  />
                </div>
                <div className='admin-field'>
                  <label>Secondary Button Link</label>
                  <input
                    value={content.home.bannerCTA.secondaryButton.link}
                    onChange={e => updateHomeSection('bannerCTA', 'secondaryButton', { ...content.home.bannerCTA.secondaryButton, link: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* FAQ Section */}
          {activeSection === 'faq' && (
            <div className='admin-section-card'>
              <h3>FAQ Section</h3>
              <div className='admin-toggle-row'>
                <label>Section Enabled</label>
                <button
                  className={`admin-toggle ${content.home.faq.enabled ? 'enabled' : ''}`}
                  onClick={() => updateHomeSection('faq', 'enabled', !content.home.faq.enabled)}
                />
              </div>
              <div className='admin-field'>
                <label>Display Order</label>
                <input
                  type='number'
                  className='admin-order-input'
                  value={content.home.faq.order}
                  onChange={e => updateHomeSection('faq', 'order', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className='admin-field'>
                <label>Section Title</label>
                <input value={content.home.faq.title} onChange={e => updateHomeSection('faq', 'title', e.target.value)} />
              </div>
              <div className='admin-field'>
                <label>Subtitle</label>
                <textarea value={content.home.faq.subtitle} onChange={e => updateHomeSection('faq', 'subtitle', e.target.value)} rows={2} />
              </div>
              <div className='admin-field'>
                <label>Footer Text</label>
                <input value={content.home.faq.footerText} onChange={e => updateHomeSection('faq', 'footerText', e.target.value)} />
              </div>
              <h3 style={{ marginTop: '1.5rem' }}>FAQ Items</h3>
              {content.home.faq.items.map((item, i) => (
                <div key={i} className='admin-list-item'>
                  <div className='admin-list-item-header'>
                    <span className='admin-list-item-number'>Q{i + 1}</span>
                    <button
                      className='admin-btn-remove'
                      onClick={() => {
                        const items = [...content.home.faq.items]
                        items.splice(i, 1)
                        updateHomeSection('faq', 'items', items)
                      }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                  <div className='admin-field'>
                    <label>Question</label>
                    <input
                      value={item.question}
                      onChange={e => {
                        const items = [...content.home.faq.items]
                        items[i] = { ...items[i], question: e.target.value }
                        updateHomeSection('faq', 'items', items)
                      }}
                    />
                  </div>
                  <div className='admin-field'>
                    <label>Answer</label>
                    <textarea
                      value={item.answer}
                      onChange={e => {
                        const items = [...content.home.faq.items]
                        items[i] = { ...items[i], answer: e.target.value }
                        updateHomeSection('faq', 'items', items)
                      }}
                      rows={3}
                    />
                  </div>
                </div>
              ))}
              <button
                className='admin-btn-add'
                onClick={() => {
                  const newItem: FaqItem = { question: 'New question?', answer: 'Answer here...' }
                  updateHomeSection('faq', 'items', [...content.home.faq.items, newItem])
                }}
              >
                + Add FAQ Item
              </button>
            </div>
          )}

          {/* Footer Section */}
          {activeSection === 'footer' && (
            <div className='admin-section-card'>
              <h3>Footer Content</h3>
              <div className='admin-field'>
                <label>Footer Title</label>
                <input value={content.footer.title} onChange={e => updateFooter('title', e.target.value)} />
              </div>
              <div className='admin-field'>
                <label>Description</label>
                <textarea value={content.footer.description} onChange={e => updateFooter('description', e.target.value)} rows={4} />
              </div>
              <div className='admin-field'>
                <label>Copyright Text</label>
                <input value={content.footer.copyright} onChange={e => updateFooter('copyright', e.target.value)} />
              </div>
              <h3 style={{ marginTop: '1.5rem' }}>Contact Info</h3>
              <div className='admin-field'>
                <label>Email</label>
                <input value={content.footer.contact.email} onChange={e => updateFooterContact('email', e.target.value)} />
              </div>
              <div className='admin-field-row'>
                <div className='admin-field'>
                  <label>Phone</label>
                  <input value={content.footer.contact.phone} onChange={e => updateFooterContact('phone', e.target.value)} />
                </div>
                <div className='admin-field'>
                  <label>Address</label>
                  <input value={content.footer.contact.address} onChange={e => updateFooterContact('address', e.target.value)} />
                </div>
              </div>
              <h3 style={{ marginTop: '1.5rem' }}>Social Links</h3>
              {content.footer.socialLinks.map((link, i) => (
                <div key={i} className='admin-list-item' style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem' }}>
                  <span style={{ width: '80px', textTransform: 'capitalize', fontSize: '0.875rem', color: '#a1a1aa' }}>
                    {link.platform}
                  </span>
                  <input
                    style={{ flex: 1 }}
                    value={link.url}
                    onChange={e => {
                      const links = [...content.footer.socialLinks]
                      links[i] = { ...links[i], url: e.target.value }
                      updateFooter('socialLinks', links)
                    }}
                  />
                  <button
                    className={`admin-toggle ${link.visible ? 'enabled' : ''}`}
                    style={{ width: '36px', height: '20px' }}
                    onClick={() => {
                      const links = [...content.footer.socialLinks]
                      links[i] = { ...links[i], visible: !links[i].visible }
                      updateFooter('socialLinks', links)
                    }}
                    title={link.visible ? 'Visible' : 'Hidden'}
                  />
                </div>
              ))}
            </div>
          )}


          {/* Brands Management Section */}
          {activeSection === 'brands' && (
            <div className='admin-section-card'>
              <BrandManagement showToast={showToast} />
            </div>
          )}

          {/* Tags Management Section */}
          {activeSection === 'tags' && (
            <div className='admin-section-card'>
              <TagManagement />
            </div>
          )}

          {/* Products Management Section */}
          {activeSection === 'products' && (
            <ProductManagement showToast={showToast} />
          )}

          {/* Blog Articles Management Section */}
          {activeSection === 'articles' && (
            <ArticleManagement showToast={showToast} />
          )}

          {/* Blog Article Categories Management Section */}
          {activeSection === 'articleCategories' && (
            <ArticleCategoryManagement showToast={showToast} />
          )}

          {/* Media Library Section */}
          {activeSection === 'mediaLibrary' && (
            <MediaLibrary />
          )}
        </div>

        {/* Status Bar */}
        <div className='admin-statusbar'>
          <span>{hasChanges ? '● Unsaved changes' : '✓ All changes saved'}</span>
          <span>FulfillNext Admin CMS v2.0 • Images stored as URLs</span>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  )
}
