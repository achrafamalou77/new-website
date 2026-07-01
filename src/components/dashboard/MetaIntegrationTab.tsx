'use client'

import { useState, useEffect, useCallback } from 'react'
import Script from 'next/script'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Check, Copy, CheckCheck, ExternalLink, AlertCircle, Loader2,
  Zap, Info, Unplug, RefreshCw, Globe, MessageCircle
} from 'lucide-react'
import { saveMetaIntegration, disconnectMetaPlatform } from '@/app/actions/meta'

/* ─── Types ─────────────────────────────────────────────────── */
interface MetaIntegrationData {
  facebook_connected?: boolean
  facebook_page_name?: string
  facebook_page_id?: string
  facebook_enabled?: boolean
  instagram_connected?: boolean
  instagram_username?: string
  instagram_enabled?: boolean
  whatsapp_connected?: boolean
  whatsapp_phone_display?: string
  whatsapp_business_name?: string
  whatsapp_enabled?: boolean
  webhook_verify_token?: string
  n8n_webhook_url?: string
  meta_token_expires_at?: string | null
}

interface Props {
  agencyId: string
  initialData: MetaIntegrationData | null
}

/* ─── Helper: Status chip ────────────────────────────────────── */
function StatusBadge({ connected }: { connected?: boolean }) {
  return connected ? (
    <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      Connected
    </span>
  ) : (
    <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-slate-500">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
      Not connected
    </span>
  )
}

/* ─── Main component ─────────────────────────────────────────── */
export function MetaIntegrationTab({ agencyId, initialData }: Props) {
  const [data, setData] = useState<MetaIntegrationData>(initialData || {})
  const [waSignupData, setWaSignupData] = useState<{ waba_id?: string; phone_number_id?: string }>({})
  const [n8nUrl, setN8nUrl] = useState(initialData?.n8n_webhook_url || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [disconnecting, setDisconnecting] = useState<string | null>(null)
  const [waConnecting, setWaConnecting] = useState(false)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [urlError, setUrlError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Auto-generated webhook URL for this app
  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/meta/webhook`
      : '/api/meta/webhook'

  const verifyToken =
    data.webhook_verify_token ||
    `vt_${agencyId.replace(/-/g, '').slice(0, 20)}`

  const whatsappExpiry = data.meta_token_expires_at ? new Date(data.meta_token_expires_at) : null
  const whatsappDaysLeft = whatsappExpiry
    ? Math.ceil((whatsappExpiry.getTime() - Date.now()) / 86_400_000)
    : null
  const whatsappNeedsRefresh =
    data.whatsapp_connected && (whatsappDaysLeft === null || whatsappDaysLeft <= 7)

  // Read URL params for success/error messages from OAuth
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const error = params.get('error')

    if (success === 'facebook') {
      setSuccessMsg('✅ Facebook & Instagram connected successfully!')
      // Refresh page data
      window.history.replaceState({}, '', window.location.pathname + '?tab=meta')
      setTimeout(() => window.location.reload(), 1500)
    } else if (error === 'facebook_denied') {
      setSuccessMsg('❌ Facebook connection was cancelled.')
    } else if (error === 'no_pages') {
      setSuccessMsg('❌ No Facebook Pages found. Make sure you have admin access to a Page.')
    } else if (error === 'oauth_failed') {
      setSuccessMsg('❌ OAuth failed. Please try again.')
    } else if (error === 'platform_meta_secret_missing') {
      setSuccessMsg('Meta connection is not finished yet: the platform owner must add the Meta app secret.')
    }
  }, [])

  useEffect(() => {
    const handleSignupMessage = (event: MessageEvent) => {
      if (!event.origin.endsWith('facebook.com')) return

      let payload: any = event.data
      if (typeof payload === 'string') {
        try {
          payload = JSON.parse(payload)
        } catch {
          return
        }
      }

      if (payload?.type !== 'WA_EMBEDDED_SIGNUP') return
      const signup = payload.data || {}
      const phoneNumberId = signup.phone_number_id || signup.phoneNumberId
      const wabaId = signup.waba_id || signup.wabaId
      if (phoneNumberId || wabaId) {
        setWaSignupData({ phone_number_id: phoneNumberId, waba_id: wabaId })
      }
    }

    window.addEventListener('message', handleSignupMessage)
    return () => window.removeEventListener('message', handleSignupMessage)
  }, [waSignupData])

  const copy = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const handleSave = async () => {
    if (n8nUrl && !n8nUrl.startsWith('http')) {
      setUrlError('n8n URL must start with http:// or https://')
      return
    }
    setUrlError('')
    setSaving(true)
    const result = await saveMetaIntegration({
      n8n_webhook_url: n8nUrl,
      facebook_enabled: data.facebook_enabled ?? true,
      instagram_enabled: data.instagram_enabled ?? true,
      whatsapp_enabled: data.whatsapp_enabled ?? true,
      webhook_verify_token: verifyToken,
    })
    setSaving(false)
    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    }
  }

  const handleDisconnect = async (platform: 'facebook' | 'instagram' | 'whatsapp') => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return
    setDisconnecting(platform)
    const result = await disconnectMetaPlatform(platform)
    setDisconnecting(null)
    if (result.success) {
      setData(prev => {
        const next = { ...prev }
        if (platform === 'facebook') {
          next.facebook_connected = false
          next.facebook_page_name = undefined
          next.instagram_connected = false
          next.instagram_username = undefined
        } else if (platform === 'instagram') {
          next.instagram_connected = false
          next.instagram_username = undefined
        } else {
          next.whatsapp_connected = false
          next.whatsapp_phone_display = undefined
          next.whatsapp_business_name = undefined
        }
        return next
      })
    }
  }

  // Launch Meta Embedded Signup for WhatsApp Business
  const handleWhatsAppConnect = useCallback(() => {
    const appId = process.env.NEXT_PUBLIC_META_APP_ID
    const configId = process.env.NEXT_PUBLIC_META_WHATSAPP_CONFIG_ID
    if (!appId) {
      alert('Meta connection is not configured yet. Please contact the platform owner.')
      return
    }
    if (!configId) {
      alert('WhatsApp Embedded Signup is not configured yet. Please contact the platform owner.')
      return
    }

    setWaConnecting(true)

    // Meta Embedded Signup
    ;(window as any).FB?.login(
      async (response: any) => {
        if (response.authResponse) {
          const code = response.authResponse.code
          // Get WABA info from the response
          const wabaId = response.authResponse.waba_id || waSignupData.waba_id || ''
          const phoneNumberId = response.authResponse.phone_number_id || waSignupData.phone_number_id || ''

          try {
            const res = await fetch('/api/meta/whatsapp/connect', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code, waba_id: wabaId, phone_number_id: phoneNumberId })
            })
            const result = await res.json()
            if (result.success) {
              setData(prev => ({
                ...prev,
                whatsapp_connected: true,
                whatsapp_phone_display: result.phone_display,
                whatsapp_business_name: result.business_name,
                meta_token_expires_at: result.token_expires_at,
              }))
              setSuccessMsg('WhatsApp Business connected and token refreshed.')
            } else if (result.error) {
              setSuccessMsg(result.error)
            }
          } catch (e) {
            console.error('WhatsApp connect error:', e)
            setSuccessMsg('WhatsApp connection failed. Please try again.')
          }
        }
        setWaConnecting(false)
      },
      {
        config_id: configId,
        response_type: 'code',
        override_default_response_type: true,
        extras: { setup: {}, featureType: '', sessionInfoVersion: '3' }
      }
    )
  }, [])

  const anyConnected = data.facebook_connected || data.instagram_connected || data.whatsapp_connected

  return (
    <div className="space-y-6">
      {/* Success / error banner */}
      {successMsg && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-xs font-semibold border ${
          successMsg.startsWith('✅')
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {successMsg}
        </div>
      )}

      {/* ── Status Hero ── */}
      <div className={`rounded-2xl p-5 border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
        anyConnected
          ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-200'
          : 'bg-gradient-to-r from-slate-50 to-blue-50/30 border-slate-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
            anyConnected ? 'bg-emerald-500' : 'bg-slate-400'
          }`}>
            <Zap className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              {anyConnected ? 'Chatbot is Live on Meta' : 'Connect your Meta platforms'}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {anyConnected
                ? 'Your AI chatbot is responding to messages on connected platforms.'
                : 'Click the connect buttons below to activate your AI chatbot on WhatsApp, Instagram & Facebook.'}
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0 flex-wrap">
          {data.whatsapp_connected && (
            <span className="text-[10px] font-bold px-2.5 py-1 bg-green-100 border border-green-200 rounded-full text-green-700">📱 WhatsApp</span>
          )}
          {data.instagram_connected && (
            <span className="text-[10px] font-bold px-2.5 py-1 bg-pink-100 border border-pink-200 rounded-full text-pink-700">📸 Instagram</span>
          )}
          {data.facebook_connected && (
            <span className="text-[10px] font-bold px-2.5 py-1 bg-blue-100 border border-blue-200 rounded-full text-blue-700">👤 Facebook</span>
          )}
          {!anyConnected && (
            <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-full text-slate-500">No platforms connected</span>
          )}
        </div>
      </div>

      {/* ── Load Meta JS SDK for WhatsApp Embedded Signup ── */}
      <Script id="meta-js-sdk" strategy="afterInteractive">
        {`
          window.fbAsyncInit = function() {
            FB.init({ appId: '${process.env.NEXT_PUBLIC_META_APP_ID || ''}', cookie: true, xfbml: true, version: 'v19.0' });
          };
          (function(d, s, id) {
            var js, fjs = d.getElementsByTagName(s)[0];
            if (d.getElementById(id)) return;
            js = d.createElement(s); js.id = id;
            js.src = 'https://connect.facebook.net/en_US/sdk.js';
            fjs.parentNode.insertBefore(js, fjs);
          }(document, 'script', 'facebook-jssdk'));
        `}
      </Script>

      {/* ── Platform Cards ── */}
      <div className="grid gap-4">

        {/* WhatsApp Business */}
        <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                {/* Icon */}
                <div className="w-12 h-12 rounded-2xl bg-[#25D366] flex items-center justify-center shadow-md shrink-0">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-bold text-slate-800">WhatsApp Business</h3>
                    <StatusBadge connected={data.whatsapp_connected} />
                  </div>
                  {data.whatsapp_connected ? (
                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <p>📱 <span className="font-semibold text-slate-700">{data.whatsapp_phone_display || 'Phone connected'}</span></p>
                      {data.whatsapp_business_name && <p>🏢 {data.whatsapp_business_name}</p>}
                      {whatsappExpiry && (
                        <p className={whatsappNeedsRefresh ? 'text-amber-600 font-semibold' : 'text-slate-400'}>
                          Token {whatsappDaysLeft !== null && whatsappDaysLeft > 0 ? `expires in ${whatsappDaysLeft} days` : 'needs refresh'}
                        </p>
                      )}
                      {whatsappNeedsRefresh && (
                        <p className="text-amber-600 font-semibold">Refresh the connection to keep replies sending.</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400">Connect via WhatsApp Business API — one click setup</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {data.whatsapp_connected && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Active</span>
                    <Switch
                      checked={data.whatsapp_enabled ?? true}
                      onCheckedChange={v => setData(p => ({ ...p, whatsapp_enabled: v }))}
                    />
                  </div>
                )}
                {data.whatsapp_connected ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={handleWhatsAppConnect}
                      disabled={waConnecting}
                      className="bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-semibold px-3 h-8"
                    >
                      {waConnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      Refresh token
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect('whatsapp')}
                      disabled={disconnecting === 'whatsapp'}
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl text-xs font-semibold px-3 h-8"
                    >
                      {disconnecting === 'whatsapp' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unplug className="h-3.5 w-3.5" />}
                      Disconnect
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={handleWhatsAppConnect}
                    disabled={waConnecting}
                    className="bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs font-bold px-4 h-9 shadow-sm flex items-center gap-1.5"
                  >
                    {waConnecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                      </svg>
                    )}
                    Connect WhatsApp
                  </Button>
                )}
              </div>
            </div>
            
            {/* Platform-owned Meta credentials are handled server-side. */}
          </CardContent>
        </Card>

        {/* Facebook + Instagram card */}
        <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-5 space-y-4">

            {/* Facebook Messenger row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#1877F2] flex items-center justify-center shadow-md shrink-0">
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                    <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0022 12.06C22 6.53 17.5 2.04 12 2.04Z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-bold text-slate-800">Facebook Messenger</h3>
                    <StatusBadge connected={data.facebook_connected} />
                  </div>
                  {data.facebook_connected ? (
                    <p className="text-[11px] text-slate-500">
                      📄 Page: <span className="font-semibold text-slate-700">{data.facebook_page_name}</span>
                      {data.facebook_page_id && <span className="text-slate-400 ml-1">(ID: {data.facebook_page_id})</span>}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400">Responds to Facebook Messenger conversations on your Page</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {data.facebook_connected && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Active</span>
                    <Switch
                      checked={data.facebook_enabled ?? true}
                      onCheckedChange={v => setData(p => ({ ...p, facebook_enabled: v }))}
                    />
                  </div>
                )}
                {data.facebook_connected ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect('facebook')}
                    disabled={disconnecting === 'facebook'}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl text-xs font-semibold px-3 h-8"
                  >
                    {disconnecting === 'facebook' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unplug className="h-3.5 w-3.5" />}
                    Disconnect
                  </Button>
                ) : (
                  <a
                    href="/api/meta/connect/facebook"
                    className="inline-flex items-center gap-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white rounded-xl text-xs font-bold px-4 h-9 shadow-sm transition"
                  >
                    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-white">
                      <path d="M12 2.04C6.5 2.04 2 6.53 2 12.06C2 17.06 5.66 21.21 10.44 21.96V14.96H7.9V12.06H10.44V9.85C10.44 7.34 11.93 5.96 14.22 5.96C15.31 5.96 16.45 6.15 16.45 6.15V8.62H15.19C13.95 8.62 13.56 9.39 13.56 10.18V12.06H16.34L15.89 14.96H13.56V21.96A10 10 0 0022 12.06C22 6.53 17.5 2.04 12 2.04Z" />
                    </svg>
                    Connect Facebook
                  </a>
                )}
              </div>
            </div>

            {/* Instagram DMs row */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md shrink-0"
                  style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                  <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="text-sm font-bold text-slate-800">Instagram DMs</h3>
                    <StatusBadge connected={data.instagram_connected} />
                    {data.facebook_connected && !data.instagram_connected && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">
                        Link IG to your FB Page
                      </span>
                    )}
                  </div>
                  {data.instagram_connected ? (
                    <p className="text-[11px] text-slate-500">
                      @<span className="font-semibold text-slate-700">{data.instagram_username || 'Connected'}</span>
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400">
                      {data.facebook_connected
                        ? 'Instagram detected automatically when a Business account is linked to your Page.'
                        : 'Connect Facebook first — Instagram is linked automatically if your accounts are connected.'}
                    </p>
                  )}
                </div>
              </div>

              {data.instagram_connected && (
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Active</span>
                    <Switch
                      checked={data.instagram_enabled ?? true}
                      onCheckedChange={v => setData(p => ({ ...p, instagram_enabled: v }))}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDisconnect('instagram')}
                    disabled={disconnecting === 'instagram'}
                    className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-xl text-xs font-semibold px-3 h-8"
                  >
                    {disconnecting === 'instagram' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unplug className="h-3.5 w-3.5" />}
                    Disable
                  </Button>
                </div>
              )}
            </div>

          </CardContent>
        </Card>
      </div>

      {/* ── Webhook & n8n Config ── */}
      <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 p-5">
          <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Globe className="h-4 w-4 text-indigo-500" />
            Webhook Configuration
          </CardTitle>
          <CardDescription className="text-[11px] text-slate-500">
            Platform diagnostics for the automatic webhook connection.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 space-y-4">
          {/* Webhook URL (auto-generated, read-only) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Your Webhook URL <span className="text-emerald-600 font-bold">(auto-generated ✓)</span></Label>
            <p className="text-[11px] text-slate-400">Used automatically when the platform subscribes Meta webhooks.</p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={webhookUrl}
                className="rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs font-mono flex-1 text-emerald-800"
              />
              <Button
                type="button"
                onClick={() => copy(webhookUrl, 'webhook')}
                className="h-9 px-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-0 text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedField === 'webhook' ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedField === 'webhook' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* Verify Token */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Webhook Verify Token <span className="text-emerald-600 font-bold">(auto-generated ✓)</span></Label>
            <p className="text-[11px] text-slate-400">Stored automatically for Meta webhook verification.</p>
            <div className="flex gap-2">
              <Input
                readOnly
                value={verifyToken}
                className="rounded-xl bg-emerald-50/50 border border-emerald-200 text-xs font-mono flex-1 text-emerald-800"
              />
              <Button
                type="button"
                onClick={() => copy(verifyToken, 'token')}
                className="h-9 px-3 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-700 border-0 text-xs font-semibold flex items-center gap-1.5"
              >
                {copiedField === 'token' ? <CheckCheck className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedField === 'token' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>

          {/* n8n URL */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <Label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <MessageCircle className="h-3.5 w-3.5 text-orange-500" />
              n8n AI Processing URL <span className="font-normal text-slate-400">(optional)</span>
            </Label>
            <p className="text-[11px] text-slate-400">
              Your n8n webhook URL — messages are forwarded here for AI processing. Leave empty to use our built-in handler.
            </p>
            <div className="flex gap-2">
              <Input
                value={n8nUrl}
                onChange={e => { setN8nUrl(e.target.value); setUrlError('') }}
                placeholder="https://your-n8n.app.n8n.cloud/webhook/meta-webhook"
                className="rounded-xl bg-slate-50 border-slate-200 text-xs font-mono flex-1"
              />
              {n8nUrl && (
                <a
                  href={n8nUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>
            {urlError && (
              <p className="text-[11px] text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {urlError}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Step-by-step Guide ── */}
      <Card className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100 p-5">
          <CardTitle className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            Setup Guide
          </CardTitle>
          <CardDescription className="text-[11px] text-slate-500">Complete these steps to go live.</CardDescription>
        </CardHeader>
        <CardContent className="p-5">
          <ol className="space-y-4 text-xs text-slate-600">
            {[
              {
                num: '1',
                title: 'Connect WhatsApp',
                body: 'Click Connect WhatsApp, approve the Meta popup, and choose the business phone number. Tokens and webhooks are saved automatically.'
              },
              {
                num: '2',
                title: 'Connect Facebook',
                body: 'Click Connect Facebook, approve the Meta popup, and choose the Facebook Page connected to your inbox.'
              },
              {
                num: '3',
                title: 'Instagram links automatically',
                body: 'If your Instagram Business account is linked to the selected Facebook Page, Instagram DMs are enabled automatically.'
              },
              {
                num: '4',
                title: 'Start receiving messages',
                body: 'After connection, message webhooks are subscribed automatically. New WhatsApp, Messenger, and Instagram messages appear in the inbox.'
              },
              {
                num: '5',
                title: 'Turn on AI replies',
                body: 'Enable the AI agent toggle. The inbox will forward messages to the configured workflow and save the replies.'
              },
              {
                num: '6',
                title: 'Test the inbox',
                body: 'Send a real message to the connected business number or page. The message should appear in the platform inbox and the AI can reply when enabled.'
              },
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className={`w-6 h-6 rounded-full font-bold flex items-center justify-center shrink-0 text-[11px] ${
                  i === 5 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                }`}>{step.num}</span>
                <div>
                  <p className="font-semibold">{step.title}</p>
                  <p className="text-slate-400 mt-0.5 leading-relaxed">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* ── Save Button ── */}
      <div className="flex items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <p className="text-xs text-slate-400 font-medium">
          Toggles and n8n URL are saved here. OAuth connections are saved automatically.
        </p>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold px-6 h-9 shadow-sm transition active:scale-95 flex items-center gap-1.5"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <CheckCheck className="h-4 w-4" /> : <Check className="h-4 w-4" />}
          {saved ? 'Saved!' : 'Save Configuration'}
        </Button>
      </div>
    </div>
  )
}
