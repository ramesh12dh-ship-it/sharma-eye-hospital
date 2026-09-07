'use client'

import { ChangeEvent, DragEvent, useCallback, useEffect, useRef, useState } from 'react'
import { Camera, Download, ImagePlus, LockKeyhole, RefreshCw, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'

const DEFAULTS = {
  location: 'Dhuri, Punjab, India',
  address: 'Sharma Eye Hospital, SH11, Dhuri, Dhuri Tahsil, Sangrur, Punjab, 148024, India',
  latitude: '30.36967',
  longitude: '75.857442',
}

const OUTPUT_WIDTH = 1206
const OUTPUT_HEIGHT = 1600

function currentIndiaDateTime() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date())
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? ''
  return `${value('year')}-${value('month')}-${value('day')}T${value('hour')}:${value('minute')}`
}

function formatTimestamp(value: string) {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/)
  if (!match) return value
  const [, year, month, day, hourValue, minute] = match
  const hour = Number(hourValue)
  const displayHour = hour % 12 || 12
  const period = hour >= 12 ? 'PM' : 'AM'
  return `${month}/${day}/${year} ${displayHour}:${minute} ${period} GMT +05:30`
}

function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
) {
  const words = text.trim().split(/\s+/)
  const lines: string[] = []
  let current = ''

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (context.measureText(candidate).width <= maxWidth || !current) {
      current = candidate
      continue
    }
    lines.push(current)
    current = word
    if (lines.length === maxLines - 1) break
  }

  if (current && lines.length < maxLines) {
    const consumedWords = lines.join(' ').split(/\s+/).filter(Boolean).length
    const remaining = words.slice(consumedWords).join(' ')
    let finalLine = remaining
    while (context.measureText(finalLine).width > maxWidth && finalLine.length > 1) {
      finalLine = `${finalLine.slice(0, -2).trim()}…`
    }
    lines.push(finalLine)
  }

  return lines
}

function drawStampedPhoto(
  canvas: HTMLCanvasElement,
  photo: HTMLImageElement,
  mapTile: HTMLImageElement,
  capturedAt: string,
) {
  const context = canvas.getContext('2d')
  if (!context) return

  const width = OUTPUT_WIDTH
  const height = OUTPUT_HEIGHT
  canvas.width = OUTPUT_WIDTH
  canvas.height = OUTPUT_HEIGHT

  const sourceRatio = photo.naturalWidth / photo.naturalHeight
  const outputRatio = width / height
  let sourceX = 0
  let sourceY = 0
  let sourceWidth = photo.naturalWidth
  let sourceHeight = photo.naturalHeight
  if (sourceRatio > outputRatio) {
    sourceWidth = photo.naturalHeight * outputRatio
    sourceX = (photo.naturalWidth - sourceWidth) / 2
  } else {
    sourceHeight = photo.naturalWidth / outputRatio
    sourceY = (photo.naturalHeight - sourceHeight) / 2
  }
  context.drawImage(photo, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, width, height)

  const bandY = 1305
  const bandHeight = 295
  context.fillStyle = 'rgb(0 0 0 / 0.76)'
  context.fillRect(0, bandY, width, bandHeight)

  context.drawImage(mapTile, 24, 1332, 240, 240)

  const textX = 289
  const textWidth = 895
  const titleSize = 48
  const bodySize = 31
  let cursorY = 1368

  context.textAlign = 'left'
  context.textBaseline = 'alphabetic'
  context.fillStyle = '#fff'
  context.font = `700 ${titleSize}px Arial, Helvetica, sans-serif`
  context.fillText(DEFAULTS.location, textX, cursorY, textWidth)

  context.font = `400 ${bodySize}px Arial, Helvetica, sans-serif`
  cursorY = 1421
  const addressLines = wrapText(context, DEFAULTS.address, textWidth, 2)
  for (const line of addressLines) {
    context.fillText(line, textX, cursorY, textWidth)
    cursorY += 43
  }

  context.fillText(`Lat: ${DEFAULTS.latitude}° Long: ${DEFAULTS.longitude}°`, textX, 1511, textWidth)
  context.fillText(formatTimestamp(capturedAt), textX, 1555, textWidth)
}

export function PhotoStampGenerator() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const imageRef = useRef<HTMLImageElement | null>(null)
  const mapRef = useRef<HTMLImageElement | null>(null)
  const objectUrlRef = useRef<string | null>(null)
  const [fileName, setFileName] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState('')
  const [capturedAt, setCapturedAt] = useState(currentIndiaDateTime)
  const [mapReady, setMapReady] = useState(false)
  const [isEditingTime, setIsEditingTime] = useState(false)

  const redraw = useCallback(() => {
    if (canvasRef.current && imageRef.current && mapRef.current) {
      drawStampedPhoto(canvasRef.current, imageRef.current, mapRef.current, capturedAt)
    }
  }, [capturedAt])

  useEffect(() => {
    redraw()
  }, [fileName, mapReady, redraw])

  useEffect(() => {
    const mapTile = new Image()
    mapTile.onload = () => {
      mapRef.current = mapTile
      setMapReady(true)
    }
    mapTile.src = '/photo-stamp/dhuri-map.jpg'
  }, [])

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
  }, [])

  const loadFile = useCallback((file?: File) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Choose a JPG, PNG, HEIC, or other image file.')
      return
    }

    setError('')
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current)
    const objectUrl = URL.createObjectURL(file)
    objectUrlRef.current = objectUrl

    const image = new Image()
    image.onload = () => {
      imageRef.current = image
      setCapturedAt(currentIndiaDateTime())
      setIsEditingTime(false)
      setFileName(file.name)
    }
    image.onerror = () => setError('This image could not be opened. Try exporting it as a JPG first.')
    image.src = objectUrl
  }, [])

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    loadFile(event.target.files?.[0])
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    setIsDragging(false)
    loadFile(event.dataTransfer.files?.[0])
  }

  function download() {
    const canvas = canvasRef.current
    if (!canvas || !imageRef.current) return
    const link = document.createElement('a')
    const originalName = fileName.replace(/\.[^.]+$/, '') || 'hospital-photo'
    link.download = `${originalName}-location-stamped.jpg`
    link.href = canvas.toDataURL('image/jpeg', 0.94)
    link.click()
  }

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(330px,0.65fr)]">
      <section className="surface-card overflow-hidden" aria-label="Photo preview">
        <div className="flex min-h-[430px] items-center justify-center bg-ink-900 p-3 sm:p-5">
          {fileName ? (
            <canvas
              ref={canvasRef}
              className="max-h-[72dvh] max-w-full rounded-sm object-contain shadow-2xl"
              aria-label="Preview of the location-stamped photo"
            />
          ) : (
            <div
              onDragEnter={event => { event.preventDefault(); setIsDragging(true) }}
              onDragOver={event => event.preventDefault()}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`flex min-h-[390px] w-full max-w-xl flex-col items-center justify-center rounded-xl border border-dashed px-8 text-center transition-colors ${
                isDragging ? 'border-brand-300 bg-brand-900/50' : 'border-ink-600 bg-ink-800/45'
              }`}
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white">
                <ImagePlus size={25} strokeWidth={1.6} />
              </div>
              <h2 className="mt-5 text-[20px] font-semibold text-white">Choose a patient photo</h2>
              <p className="mt-2 max-w-sm text-[14px] leading-6 text-ink-300">
                Drop a photo here, or select one from this device. The image stays in your browser.
              </p>
              <Button type="button" className="mt-6" onClick={() => inputRef.current?.click()}>
                <Upload size={16} />
                Choose photo
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hairline bg-white px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium text-ink-700">
              {fileName || 'No photo selected'}
            </p>
            <p className="mt-0.5 text-[12px] text-ink-400">Exported as a 1206 × 1600 high-quality JPG</p>
          </div>
          <div className="flex gap-2">
            {fileName && (
              <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()}>
                <RefreshCw size={15} />
                Replace
              </Button>
            )}
            <Button type="button" onClick={download} disabled={!fileName}>
              <Download size={16} />
              Download photo
            </Button>
          </div>
        </div>
      </section>

      <aside className="surface-card p-5 sm:p-6" aria-label="Stamp details">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
            <Camera size={19} strokeWidth={1.8} />
          </div>
          <div>
            <h2 className="text-[17px] font-semibold text-ink-900">Hospital stamp</h2>
            <p className="mt-0.5 text-[12.5px] text-ink-500">Location details stay fixed for every photo.</p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-brand-100 bg-brand-50/70 p-4">
            <div className="flex items-start gap-3">
              <LockKeyhole size={16} className="mt-0.5 shrink-0 text-brand-600" />
              <div className="text-[13px] leading-5 text-ink-600">
                <p className="font-semibold text-ink-800">{DEFAULTS.location}</p>
                <p className="mt-1">{DEFAULTS.address}</p>
                <p className="mt-1 tabular">Lat: {DEFAULTS.latitude}° · Long: {DEFAULTS.longitude}°</p>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="stamp-time">Photo date and time</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingTime(current => !current)}
              >
                {isEditingTime ? 'Done' : 'Change time'}
              </Button>
            </div>
            {isEditingTime ? (
              <Input
                id="stamp-time"
                type="datetime-local"
                value={capturedAt}
                onChange={event => setCapturedAt(event.target.value)}
                autoFocus
              />
            ) : (
              <div id="stamp-time" className="rounded-lg border border-hairline bg-ink-50 px-3 py-2.5 text-[14px] tabular text-ink-800">
                {formatTimestamp(capturedAt)}
              </div>
            )}
            <p className="text-[12px] leading-5 text-ink-400">
              Set automatically when a photo is uploaded. Change it here only when needed.
            </p>
          </div>
        </div>

        {error && (
          <p role="alert" className="mt-4 rounded-lg border border-coral-200 bg-coral-50 px-3 py-2.5 text-[13px] text-coral-700">
            {error}
          </p>
        )}

        <div className="mt-5 border-t border-hairline pt-4 text-[12.5px] leading-5 text-ink-500">
          The map tile, address, and coordinates match the supplied reference and cannot be changed.
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleInput}
        />
      </aside>
    </div>
  )
}
