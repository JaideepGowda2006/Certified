import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FaClone,
  FaFileImage,
  FaImage,
  FaLayerGroup,
  FaLock,
  FaLockOpen,
  FaMinus,
  FaPalette,
  FaQrcode,
  FaRegCircle,
  FaRegSquare,
  FaSave,
  FaSignature,
  FaTextHeight,
  FaTrash,
  FaUpload,
} from 'react-icons/fa'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const A4_WIDTH = 1123
const A4_HEIGHT = 794
const GRID_SIZE = 20
const CANVAS_CUSTOM_PROPS = ['truecertType', 'placeholderKey', 'assetRole', 'assetKey', 'isLocked']

const PLACEHOLDER_VALUES = {
  candidate_name: '{{candidate_name}}',
  course_name: '{{course_name}}',
  issue_date: '{{issue_date}}',
  certificate_id: '{{certificate_id}}',
  qr_code: '{{qr_code}}',
}

const FONT_OPTIONS = [
  'Times New Roman',
  'Georgia',
  'Garamond',
  'Trebuchet MS',
  'Verdana',
  'Arial',
  'Courier New',
]

const TEXT_OBJECT_TYPES = new Set(['textbox', 'text', 'i-text'])

const initialFormState = {
  templateName: 'Default Internship Template',
  certificateTitle: 'CERTIFICATE OF COMPLETION',
  candidateName: '',
  courseName: '',
  issueDate: '',
  certificateId: '',
  expiryDate: '',
  issuerName: '',
  grade: '',
  description: '',
}

const ensureHexColor = (value, fallback) => {
  const normalized = String(value || '').trim()
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(normalized)) {
    if (normalized.length === 4) {
      return `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`.toLowerCase()
    }

    return normalized.toLowerCase()
  }

  return fallback
}

const isTextObject = (object) => TEXT_OBJECT_TYPES.has(object?.type)

const replacePlaceholderText = (text, replacements) => {
  let output = String(text || '')
  Object.entries(replacements).forEach(([token, value]) => {
    output = output.replaceAll(token, value)
  })
  return output
}

const formatIssueDate = (value) => {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error('Failed to read image file.'))
    reader.readAsDataURL(file)
  })

const cloneFabricObject = (object) =>
  new Promise((resolve, reject) => {
    try {
      if (typeof object.clone !== 'function') {
        reject(new Error('Selected object cannot be duplicated.'))
        return
      }

      if (object.clone.length >= 1) {
        object.clone((cloned) => {
          resolve(cloned)
        })
        return
      }

      const maybePromise = object.clone()
      if (maybePromise?.then) {
        maybePromise.then(resolve).catch(reject)
        return
      }

      resolve(maybePromise)
    } catch (error) {
      reject(error)
    }
  })

const loadFabricImageFromUrl = async (fabricLib, url) => {
  if (fabricLib?.Image?.fromURL) {
    return new Promise((resolve, reject) => {
      fabricLib.Image.fromURL(
        url,
        (image) => {
          if (!image) {
            reject(new Error('Fabric image instance was not created.'))
            return
          }

          resolve(image)
        },
        {
          crossOrigin: 'anonymous',
        },
      )
    })
  }

  if (fabricLib?.FabricImage?.fromURL) {
    return fabricLib.FabricImage.fromURL(url, {
      crossOrigin: 'anonymous',
    })
  }

  throw new Error('Image loader is not available in current Fabric version.')
}

const loadCanvasFromJson = (canvas, json) =>
  new Promise((resolve, reject) => {
    let settled = false

    const done = () => {
      if (settled) {
        return
      }
      settled = true
      canvas.renderAll()
      resolve()
    }

    const fail = (error) => {
      if (settled) {
        return
      }
      settled = true
      reject(error)
    }

    const reviver = (_, object) => {
      if (object?.type === 'image' && typeof object.set === 'function') {
        object.set('crossOrigin', 'anonymous')
      }
    }

    try {
      const maybePromise = canvas.loadFromJSON(json, done, reviver)

      if (maybePromise?.then) {
        maybePromise.then(done).catch(fail)
      }
    } catch (error) {
      fail(error)
    }
  })

const buildSelectionState = (object) => ({
  type: object?.type || '',
  isText: isTextObject(object),
  fontSize: Number(object?.fontSize || 20),
  fontFamily: object?.fontFamily || FONT_OPTIONS[0],
  fontWeight: String(object?.fontWeight || 'normal'),
  textColor: ensureHexColor(object?.fill, '#0f172a'),
  backgroundColor: ensureHexColor(
    isTextObject(object) ? object?.backgroundColor : object?.fill,
    '#ffffff',
  ),
  opacity: Number(object?.opacity ?? 1),
  width: Math.max(1, Math.round(object?.getScaledWidth?.() || object?.width || 1)),
  height: Math.max(1, Math.round(object?.getScaledHeight?.() || object?.height || 1)),
  rotation: Math.round(object?.angle || 0),
  textAlign: object?.textAlign || 'center',
  isLocked: Boolean(object?.isLocked || object?.lockMovementX),
  hasShadow: Boolean(object?.shadow),
})

const getDefaultPlacement = () => ({
  left: A4_WIDTH / 2,
  top: A4_HEIGHT / 2,
  originX: 'center',
  originY: 'center',
})

const getAssetMaxDimensions = (role) => {
  if (role === 'backgroundImage') {
    return {
      maxWidth: A4_WIDTH - 90,
      maxHeight: A4_HEIGHT - 90,
    }
  }

  if (role === 'signature') {
    return {
      maxWidth: 260,
      maxHeight: 120,
    }
  }

  return {
    maxWidth: 220,
    maxHeight: 220,
  }
}

const seedStarterCanvas = (canvas, fabricLib) => {
  const heading = new fabricLib.Textbox('CERTIFICATE OF COMPLETION', {
    ...getDefaultPlacement(),
    top: 120,
    width: 760,
    textAlign: 'center',
    fontFamily: 'Times New Roman',
    fontWeight: '700',
    fontSize: 58,
    fill: '#0f172a',
    editable: true,
  })

  const subtitle = new fabricLib.Textbox('This certificate is proudly presented to', {
    ...getDefaultPlacement(),
    top: 198,
    width: 540,
    textAlign: 'center',
    fontFamily: 'Georgia',
    fontSize: 24,
    fill: '#334155',
  })

  const candidateName = new fabricLib.Textbox(PLACEHOLDER_VALUES.candidate_name, {
    ...getDefaultPlacement(),
    top: 288,
    width: 680,
    textAlign: 'center',
    fontFamily: 'Georgia',
    fontWeight: '700',
    fontSize: 52,
    fill: '#0f766e',
  })
  candidateName.truecertType = 'placeholder'
  candidateName.placeholderKey = PLACEHOLDER_VALUES.candidate_name

  const courseLabel = new fabricLib.Textbox('For successfully completing', {
    ...getDefaultPlacement(),
    top: 350,
    width: 420,
    textAlign: 'center',
    fontFamily: 'Trebuchet MS',
    fontSize: 22,
    fill: '#334155',
  })

  const courseName = new fabricLib.Textbox(PLACEHOLDER_VALUES.course_name, {
    ...getDefaultPlacement(),
    top: 412,
    width: 700,
    textAlign: 'center',
    fontFamily: 'Times New Roman',
    fontWeight: '700',
    fontSize: 40,
    fill: '#0f172a',
  })
  courseName.truecertType = 'placeholder'
  courseName.placeholderKey = PLACEHOLDER_VALUES.course_name

  const issueDate = new fabricLib.Textbox(`Issued on ${PLACEHOLDER_VALUES.issue_date}`, {
    left: 170,
    top: 665,
    width: 340,
    textAlign: 'left',
    fontFamily: 'Verdana',
    fontSize: 18,
    fill: '#334155',
    originX: 'left',
    originY: 'center',
  })
  issueDate.truecertType = 'placeholder'
  issueDate.placeholderKey = PLACEHOLDER_VALUES.issue_date

  const certificateId = new fabricLib.Textbox(`Certificate ID: ${PLACEHOLDER_VALUES.certificate_id}`, {
    left: 170,
    top: 704,
    width: 420,
    textAlign: 'left',
    fontFamily: 'Verdana',
    fontSize: 17,
    fill: '#334155',
    originX: 'left',
    originY: 'center',
  })
  certificateId.truecertType = 'placeholder'
  certificateId.placeholderKey = PLACEHOLDER_VALUES.certificate_id

  const signatureLine = new fabricLib.Line([0, 0, 230, 0], {
    left: 760,
    top: 670,
    stroke: '#334155',
    strokeWidth: 2,
  })

  const signatureLabel = new fabricLib.Textbox('Authorized Signature', {
    left: 760,
    top: 694,
    width: 230,
    textAlign: 'center',
    fontFamily: 'Verdana',
    fontSize: 14,
    fill: '#475569',
  })

  const qrFrame = new fabricLib.Rect({
    width: 148,
    height: 148,
    fill: '#ffffff',
    stroke: '#334155',
    strokeWidth: 1.8,
    strokeDashArray: [8, 5],
    rx: 12,
    ry: 12,
    originX: 'center',
    originY: 'center',
  })

  const qrLabel = new fabricLib.Textbox('QR CODE', {
    width: 120,
    textAlign: 'center',
    fontFamily: 'Verdana',
    fontSize: 20,
    fontWeight: '700',
    fill: '#334155',
    originX: 'center',
    originY: 'center',
  })

  const qrPlaceholder = new fabricLib.Group([qrFrame, qrLabel], {
    ...getDefaultPlacement(),
    left: 958,
    top: 640,
  })
  qrPlaceholder.truecertType = 'qr-placeholder'
  qrPlaceholder.placeholderKey = PLACEHOLDER_VALUES.qr_code

  const border = new fabricLib.Rect({
    left: 26,
    top: 26,
    width: A4_WIDTH - 52,
    height: A4_HEIGHT - 52,
    fill: 'transparent',
    stroke: '#b89b50',
    strokeWidth: 3,
  })
  border.truecertType = 'border'

  canvas.add(border)
  canvas.add(heading)
  canvas.add(subtitle)
  canvas.add(candidateName)
  canvas.add(courseLabel)
  canvas.add(courseName)
  canvas.add(issueDate)
  canvas.add(certificateId)
  canvas.add(signatureLine)
  canvas.add(signatureLabel)
  canvas.add(qrPlaceholder)
  canvas.setActiveObject(heading)
  canvas.requestRenderAll()
}

const CreateCertificatePage = () => {
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    ...initialFormState,
    issuerName: user?.name || '',
  })
  const [createdCertificate, setCreatedCertificate] = useState(null)
  const [templates, setTemplates] = useState([])
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [assetFilesByRole, setAssetFilesByRole] = useState({
    logo: null,
    signature: null,
    seal: null,
    watermark: null,
    backgroundImage: null,
  })
  const [selectedState, setSelectedState] = useState(null)
  const [snapToGrid, setSnapToGrid] = useState(true)
  const [toasts, setToasts] = useState([])
  const [loading, setLoading] = useState({
    templates: false,
    saveTemplate: false,
    loadTemplate: false,
    generate: false,
  })

  const canvasElementRef = useRef(null)
  const canvasRef = useRef(null)
  const fabricRef = useRef(null)
  const snapToGridRef = useRef(snapToGrid)
  const toastTimeoutsRef = useRef([])

  const logoInputRef = useRef(null)
  const signatureInputRef = useRef(null)
  const sealInputRef = useRef(null)
  const watermarkInputRef = useRef(null)
  const backgroundInputRef = useRef(null)

  const pushToast = (type, message) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`

    setToasts((previous) => [...previous, { id, type, message }])

    const timer = setTimeout(() => {
      setToasts((previous) => previous.filter((toast) => toast.id !== id))
    }, 3800)

    toastTimeoutsRef.current.push(timer)
  }

  const syncSelectedState = () => {
    const canvas = canvasRef.current
    if (!canvas) {
      setSelectedState(null)
      return
    }

    const activeObject = canvas.getActiveObject()
    if (!activeObject) {
      setSelectedState(null)
      return
    }

    setSelectedState(buildSelectionState(activeObject))
  }

  const updateLoading = (key, value) => {
    setLoading((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  const withCanvas = (callback, { silent = false } = {}) => {
    const canvas = canvasRef.current
    const fabricLib = fabricRef.current

    if (!canvas || !fabricLib) {
      if (!silent) {
        pushToast('error', 'Canvas is still initializing. Please wait a moment.')
      }
      return null
    }

    return callback(canvas, fabricLib)
  }

  const addTextObject = (text, options = {}) => {
    withCanvas((canvas, fabricLib) => {
      const textObject = new fabricLib.Textbox(text, {
        ...getDefaultPlacement(),
        width: 560,
        textAlign: 'center',
        fontFamily: 'Times New Roman',
        fontSize: 36,
        fill: '#0f172a',
        editable: true,
        ...options,
      })

      if (options.placeholderKey) {
        textObject.truecertType = 'placeholder'
        textObject.placeholderKey = options.placeholderKey
      }

      canvas.add(textObject)
      canvas.setActiveObject(textObject)
      canvas.requestRenderAll()
      syncSelectedState()
    })
  }

  const addQrPlaceholder = () => {
    withCanvas((canvas, fabricLib) => {
      const qrFrame = new fabricLib.Rect({
        width: 152,
        height: 152,
        fill: '#ffffff',
        stroke: '#1e293b',
        strokeWidth: 2,
        strokeDashArray: [9, 5],
        rx: 10,
        ry: 10,
        originX: 'center',
        originY: 'center',
      })

      const qrLabel = new fabricLib.Textbox('QR CODE', {
        width: 118,
        textAlign: 'center',
        fontFamily: 'Verdana',
        fontWeight: '700',
        fontSize: 18,
        fill: '#1e293b',
        originX: 'center',
        originY: 'center',
      })

      const qrGroup = new fabricLib.Group([qrFrame, qrLabel], {
        ...getDefaultPlacement(),
      })

      qrGroup.truecertType = 'qr-placeholder'
      qrGroup.placeholderKey = PLACEHOLDER_VALUES.qr_code

      canvas.add(qrGroup)
      canvas.setActiveObject(qrGroup)
      canvas.requestRenderAll()
      syncSelectedState()
    })
  }

  const addBorder = () => {
    withCanvas((canvas, fabricLib) => {
      const border = new fabricLib.Rect({
        left: 28,
        top: 28,
        width: A4_WIDTH - 56,
        height: A4_HEIGHT - 56,
        fill: 'transparent',
        stroke: '#b89b50',
        strokeWidth: 2.5,
      })
      border.truecertType = 'border'

      canvas.add(border)
      canvas.setActiveObject(border)
      canvas.requestRenderAll()
      syncSelectedState()
    })
  }

  const addDividerLine = () => {
    withCanvas((canvas, fabricLib) => {
      const line = new fabricLib.Line([0, 0, 360, 0], {
        ...getDefaultPlacement(),
        stroke: '#475569',
        strokeWidth: 2,
      })
      line.truecertType = 'divider'

      canvas.add(line)
      canvas.setActiveObject(line)
      canvas.requestRenderAll()
      syncSelectedState()
    })
  }

  const addShape = () => {
    withCanvas((canvas, fabricLib) => {
      const shape = new fabricLib.Rect({
        ...getDefaultPlacement(),
        width: 240,
        height: 140,
        fill: '#ecfeff',
        stroke: '#0f766e',
        strokeWidth: 2,
        rx: 16,
        ry: 16,
      })
      shape.truecertType = 'shape'

      canvas.add(shape)
      canvas.setActiveObject(shape)
      canvas.requestRenderAll()
      syncSelectedState()
    })
  }

  const addSealPlaceholder = () => {
    withCanvas((canvas, fabricLib) => {
      const ring = new fabricLib.Circle({
        ...getDefaultPlacement(),
        radius: 72,
        fill: '#fff7ed',
        stroke: '#b45309',
        strokeWidth: 3,
      })

      const label = new fabricLib.Textbox('OFFICIAL\nSEAL', {
        ...getDefaultPlacement(),
        width: 124,
        textAlign: 'center',
        fontFamily: 'Verdana',
        fontWeight: '700',
        fontSize: 20,
        lineHeight: 1.1,
        fill: '#9a3412',
      })

      const sealGroup = new fabricLib.Group([ring, label], {
        ...getDefaultPlacement(),
        left: A4_WIDTH - 180,
        top: 200,
      })
      sealGroup.truecertType = 'seal-placeholder'

      canvas.add(sealGroup)
      canvas.setActiveObject(sealGroup)
      canvas.requestRenderAll()
      syncSelectedState()
    })
  }

  const resetCanvas = () => {
    withCanvas((canvas, fabricLib) => {
      canvas.clear()
      canvas.setBackgroundColor('#ffffff', canvas.renderAll.bind(canvas))
      seedStarterCanvas(canvas, fabricLib)
      syncSelectedState()
    })
  }

  const getAssetInputByRole = (role) => {
    if (role === 'logo') {
      return logoInputRef.current
    }

    if (role === 'signature') {
      return signatureInputRef.current
    }

    if (role === 'seal') {
      return sealInputRef.current
    }

    if (role === 'watermark') {
      return watermarkInputRef.current
    }

    if (role === 'backgroundImage') {
      return backgroundInputRef.current
    }

    return null
  }

  const handlePickAsset = (role) => {
    const input = getAssetInputByRole(role)
    if (!input) {
      pushToast('error', 'Asset picker is not available.')
      return
    }

    input.click()
  }

  const handleAssetSelected = async (role, event) => {
    const selectedFile = event.target.files?.[0] || null
    event.target.value = ''

    if (!selectedFile) {
      return
    }

    if (!selectedFile.type.startsWith('image/')) {
      pushToast('error', 'Please upload an image file (PNG, JPG, JPEG, or WEBP).')
      return
    }

    try {
      const dataUrl = await toDataUrl(selectedFile)

      await withCanvas(async (canvas, fabricLib) => {
        const image = await loadFabricImageFromUrl(fabricLib, dataUrl)
        const assetKey = `${role}_${Date.now()}`

        image.set({
          ...getDefaultPlacement(),
          crossOrigin: 'anonymous',
        })

        const { maxWidth, maxHeight } = getAssetMaxDimensions(role)
        const safeWidth = Number(image.width || 1)
        const safeHeight = Number(image.height || 1)
        const ratio = Math.min(maxWidth / safeWidth, maxHeight / safeHeight, 1)
        image.scale(ratio)

        if (role === 'backgroundImage') {
          image.set({
            opacity: 0.28,
          })
          canvas.add(image)
          image.moveTo(0)
        } else {
          if (role === 'watermark') {
            image.set({
              opacity: 0.15,
              angle: -18,
            })
          }

          if (role === 'signature') {
            image.set({
              left: A4_WIDTH - 230,
              top: A4_HEIGHT - 130,
            })
          }

          if (role === 'logo') {
            image.set({
              left: 150,
              top: 120,
            })
          }

          canvas.add(image)
        }

        image.truecertType = 'image-asset'
        image.assetRole = role
        image.assetKey = assetKey

        canvas.setActiveObject(image)
        canvas.requestRenderAll()
        syncSelectedState()
      })

      setAssetFilesByRole((previous) => ({
        ...previous,
        [role]: selectedFile,
      }))

      pushToast('success', `${role.replaceAll(/([A-Z])/g, ' $1')} image added.`)
    } catch {
      pushToast('error', 'Failed to load the selected image on canvas.')
    }
  }

  const duplicateSelectedObject = async () => {
    const canvas = canvasRef.current
    const object = canvas?.getActiveObject()

    if (!canvas || !object) {
      pushToast('error', 'Select an object to duplicate.')
      return
    }

    try {
      const cloned = await cloneFabricObject(object)
      cloned.set({
        left: (object.left || 0) + 20,
        top: (object.top || 0) + 20,
      })
      cloned.setCoords()
      canvas.add(cloned)
      canvas.setActiveObject(cloned)
      canvas.requestRenderAll()
      syncSelectedState()
    } catch {
      pushToast('error', 'Could not duplicate this object.')
    }
  }

  const deleteSelectedObject = () => {
    withCanvas((canvas) => {
      const object = canvas.getActiveObject()
      if (!object) {
        pushToast('error', 'Select an object to delete.')
        return
      }

      canvas.remove(object)
      canvas.discardActiveObject()
      canvas.requestRenderAll()
      syncSelectedState()
    })
  }

  const toggleLockSelectedObject = () => {
    withCanvas((canvas) => {
      const object = canvas.getActiveObject()
      if (!object) {
        pushToast('error', 'Select an object to lock or unlock.')
        return
      }

      const nextLocked = !(object.isLocked || object.lockMovementX)
      object.isLocked = nextLocked
      object.lockMovementX = nextLocked
      object.lockMovementY = nextLocked
      object.lockScalingX = nextLocked
      object.lockScalingY = nextLocked
      object.lockRotation = nextLocked
      object.hasControls = !nextLocked

      canvas.requestRenderAll()
      syncSelectedState()
    })
  }

  const moveLayer = (direction) => {
    withCanvas((canvas) => {
      const object = canvas.getActiveObject()
      if (!object) {
        pushToast('error', 'Select an object to change its layer.')
        return
      }

      if (direction === 'front') {
        canvas.bringToFront(object)
      }

      if (direction === 'forward') {
        canvas.bringForward(object)
      }

      if (direction === 'backward') {
        canvas.sendBackwards(object)
      }

      if (direction === 'back') {
        canvas.sendToBack(object)
      }

      canvas.requestRenderAll()
      syncSelectedState()
    })
  }

  const updateSelectedObject = (updater) => {
    withCanvas((canvas, fabricLib) => {
      const object = canvas.getActiveObject()
      if (!object) {
        return
      }

      updater(object, fabricLib)
      object.setCoords()
      canvas.requestRenderAll()
      syncSelectedState()
    })
  }

  const updateDimensions = (nextWidth, nextHeight) => {
    updateSelectedObject((object) => {
      if (Number.isFinite(nextWidth) && nextWidth > 1) {
        const currentWidth = object.getScaledWidth() || 1
        object.scaleX = (object.scaleX || 1) * (nextWidth / currentWidth)
      }

      if (Number.isFinite(nextHeight) && nextHeight > 1) {
        const currentHeight = object.getScaledHeight() || 1
        object.scaleY = (object.scaleY || 1) * (nextHeight / currentHeight)
      }
    })
  }

  const refreshTemplates = async () => {
    updateLoading('templates', true)

    try {
      const response = await api.get('/certificates/templates')
      setTemplates(response.data.templates || [])
    } catch {
      pushToast('error', 'Could not fetch templates from server.')
    } finally {
      updateLoading('templates', false)
    }
  }

  const saveTemplate = async () => {
    const canvas = canvasRef.current
    if (!canvas) {
      pushToast('error', 'Canvas is not ready yet.')
      return
    }

    const templateJson = canvas.toJSON(CANVAS_CUSTOM_PROPS)
    if (!Array.isArray(templateJson.objects) || templateJson.objects.length === 0) {
      pushToast('error', 'Cannot save empty template. Add at least one object.')
      return
    }

    updateLoading('saveTemplate', true)

    try {
      const payload = {
        templateName: formData.templateName,
        templateJson,
      }

      const response = await api.post('/certificates/templates', payload)
      const savedTemplate = response.data.template

      setSelectedTemplateId(savedTemplate.id)
      pushToast('success', 'Template saved successfully.')
      await refreshTemplates()
    } catch (error) {
      pushToast('error', error.response?.data?.message || 'Template save failed.')
    } finally {
      updateLoading('saveTemplate', false)
    }
  }

  const loadTemplate = async () => {
    if (!selectedTemplateId) {
      pushToast('error', 'Select a template to load.')
      return
    }

    const canvas = canvasRef.current
    if (!canvas) {
      pushToast('error', 'Canvas is not ready yet.')
      return
    }

    updateLoading('loadTemplate', true)

    try {
      const response = await api.get(`/certificates/templates/${selectedTemplateId}`)
      const template = response.data.template

      if (!template?.templateJson) {
        throw new Error('Template JSON is missing.')
      }

      await loadCanvasFromJson(canvas, template.templateJson)
      setFormData((previous) => ({
        ...previous,
        templateName: template.templateName || previous.templateName,
      }))
      syncSelectedState()
      pushToast('success', 'Template loaded into canvas.')
    } catch (error) {
      pushToast('error', error.response?.data?.message || error.message || 'Failed to load template.')
    } finally {
      updateLoading('loadTemplate', false)
    }
  }

  const getQrDataUrl = async () => {
    const response = await api.get('/certificates/qr-image', {
      params: {
        certificateId: formData.certificateId || 'PREVIEW-0001',
      },
      responseType: 'blob',
    })

    const blob = response.data
    const qrDataUrl = await toDataUrl(blob)
    return qrDataUrl
  }

  const renderResolvedCanvasImage = async () => {
    const canvas = canvasRef.current
    const fabricLib = fabricRef.current

    if (!canvas || !fabricLib) {
      throw new Error('Canvas is not initialized.')
    }

    const json = canvas.toJSON(CANVAS_CUSTOM_PROPS)

    const exportElement = document.createElement('canvas')
    exportElement.width = A4_WIDTH
    exportElement.height = A4_HEIGHT

    const staticCanvas = new fabricLib.StaticCanvas(exportElement, {
      width: A4_WIDTH,
      height: A4_HEIGHT,
      backgroundColor: '#ffffff',
    })

    await loadCanvasFromJson(staticCanvas, json)

    const replacements = {
      [PLACEHOLDER_VALUES.candidate_name]: formData.candidateName,
      [PLACEHOLDER_VALUES.course_name]: formData.courseName,
      [PLACEHOLDER_VALUES.issue_date]: formatIssueDate(formData.issueDate),
      [PLACEHOLDER_VALUES.certificate_id]: formData.certificateId || 'AUTO-GENERATED',
    }

    const visitObject = (object) => {
      if (isTextObject(object) && typeof object.text === 'string') {
        object.set('text', replacePlaceholderText(object.text, replacements))
      }

      if (typeof object.getObjects === 'function') {
        object.getObjects().forEach(visitObject)
      }
    }

    staticCanvas.getObjects().forEach(visitObject)

    const qrTarget = staticCanvas
      .getObjects()
      .find(
        (object) =>
          object?.placeholderKey === PLACEHOLDER_VALUES.qr_code || object?.truecertType === 'qr-placeholder',
      )

    if (qrTarget) {
      const qrDataUrl = await getQrDataUrl()
      const qrImage = await loadFabricImageFromUrl(fabricLib, qrDataUrl)
      const bounds = qrTarget.getBoundingRect(true, true)
      const centerPoint = qrTarget.getCenterPoint()

      qrImage.set({
        left: centerPoint.x,
        top: centerPoint.y,
        originX: 'center',
        originY: 'center',
        angle: qrTarget.angle || 0,
        selectable: false,
        evented: false,
      })

      const ratio = Math.min((bounds.width - 8) / (qrImage.width || 1), (bounds.height - 8) / (qrImage.height || 1))
      qrImage.scale(Math.max(ratio, 0.05))

      staticCanvas.remove(qrTarget)
      staticCanvas.add(qrImage)
    }

    staticCanvas.renderAll()

    const dataUrl = staticCanvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2,
    })

    staticCanvas.dispose()

    return dataUrl
  }

  const generateCertificate = async () => {
    const requiredFields = ['candidateName', 'courseName', 'issueDate', 'issuerName']
    const missingField = requiredFields.find((key) => !String(formData[key] || '').trim())

    if (missingField) {
      pushToast('error', 'Please complete candidate name, course, issue date, and issuer name.')
      return
    }

    updateLoading('generate', true)
    setCreatedCertificate(null)

    try {
      const generatedDataUrl = await renderResolvedCanvasImage()
      const generatedBlob = await fetch(generatedDataUrl).then((response) => response.blob())
      const generatedFile = new File([generatedBlob], `certificate_${Date.now()}.png`, {
        type: 'image/png',
      })

      const formPayload = new FormData()
      formPayload.append('candidateName', formData.candidateName)
      formPayload.append('certificateTitle', formData.certificateTitle)
      formPayload.append('courseName', formData.courseName)
      formPayload.append('issueDate', formData.issueDate)
      formPayload.append('issuerName', formData.issuerName)
      formPayload.append('templateName', formData.templateName)
      formPayload.append('templateJson', JSON.stringify(canvasRef.current.toJSON(CANVAS_CUSTOM_PROPS)))
      formPayload.append('generatedImage', generatedFile)

      if (selectedTemplateId) {
        formPayload.append('templateId', selectedTemplateId)
      }

      if (formData.certificateId.trim()) {
        formPayload.append('certificateId', formData.certificateId.trim())
      }

      if (formData.expiryDate.trim()) {
        formPayload.append('expiryDate', formData.expiryDate)
      }

      if (formData.grade.trim()) {
        formPayload.append('grade', formData.grade)
      }

      if (formData.description.trim()) {
        formPayload.append('description', formData.description)
      }

      if (assetFilesByRole.logo) {
        formPayload.append('logo', assetFilesByRole.logo)
      }

      if (assetFilesByRole.signature) {
        formPayload.append('signature', assetFilesByRole.signature)
      }

      if (assetFilesByRole.seal) {
        formPayload.append('seal', assetFilesByRole.seal)
      }

      if (assetFilesByRole.watermark) {
        formPayload.append('watermark', assetFilesByRole.watermark)
      }

      if (assetFilesByRole.backgroundImage) {
        formPayload.append('backgroundImage', assetFilesByRole.backgroundImage)
      }

      const response = await api.post('/certificates/create', formPayload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      setCreatedCertificate(response.data.certificate)
      pushToast('success', 'Certificate generated and uploaded successfully.')
    } catch (error) {
      pushToast('error', error.response?.data?.message || 'Certificate generation failed.')
    } finally {
      updateLoading('generate', false)
    }
  }

  useEffect(() => {
    snapToGridRef.current = snapToGrid
  }, [snapToGrid])

  useEffect(() => {
    setFormData((previous) => ({
      ...previous,
      issuerName: previous.issuerName || user?.name || '',
    }))
  }, [user?.name])

  useEffect(() => {
    let disposed = false

    const initCanvas = async () => {
      try {
        const fabricModule = await import('fabric')
        const fabricLib = fabricModule.fabric || fabricModule

        if (disposed || !canvasElementRef.current) {
          return
        }

        const canvas = new fabricLib.Canvas(canvasElementRef.current, {
          width: A4_WIDTH,
          height: A4_HEIGHT,
          backgroundColor: '#ffffff',
          preserveObjectStacking: true,
          selection: true,
        })

        canvasRef.current = canvas
        fabricRef.current = fabricLib

        const onSelectionChange = () => {
          syncSelectedState()
        }

        const onObjectMoving = (event) => {
          const target = event?.target
          if (!target || !snapToGridRef.current || target.isLocked) {
            return
          }

          target.set({
            left: Math.round((target.left || 0) / GRID_SIZE) * GRID_SIZE,
            top: Math.round((target.top || 0) / GRID_SIZE) * GRID_SIZE,
          })
        }

        canvas.on('selection:created', onSelectionChange)
        canvas.on('selection:updated', onSelectionChange)
        canvas.on('selection:cleared', onSelectionChange)
        canvas.on('object:modified', onSelectionChange)
        canvas.on('object:moving', onObjectMoving)

        seedStarterCanvas(canvas, fabricLib)
        syncSelectedState()
        refreshTemplates()
      } catch {
        pushToast('error', 'Failed to initialize certificate builder canvas.')
      }
    }

    initCanvas()

    const onKeyDown = (event) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      if (event.key === 'Delete' || event.key === 'Backspace') {
        const canvas = canvasRef.current
        const activeObject = canvas?.getActiveObject()

        if (activeObject) {
          event.preventDefault()
          canvas.remove(activeObject)
          canvas.discardActiveObject()
          canvas.requestRenderAll()
          syncSelectedState()
        }
      }
    }

    globalThis.addEventListener('keydown', onKeyDown)

    return () => {
      disposed = true
      globalThis.removeEventListener('keydown', onKeyDown)

      toastTimeoutsRef.current.forEach((timer) => clearTimeout(timer))
      toastTimeoutsRef.current = []

      if (canvasRef.current) {
        canvasRef.current.dispose()
        canvasRef.current = null
      }
    }
    // This effect intentionally runs once to bootstrap Fabric and keyboard handlers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isGenerateDisabled = useMemo(
    () => loading.generate || loading.loadTemplate || loading.saveTemplate,
    [loading.generate, loading.loadTemplate, loading.saveTemplate],
  )

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-brand-700">Certificate Studio</p>
          <h1 className="text-3xl font-bold text-slate-900">Create Certificate Builder</h1>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={saveTemplate}
            disabled={loading.saveTemplate}
            className="inline-flex items-center gap-2 rounded-xl border border-brand-300 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaSave />
            {loading.saveTemplate ? 'Saving...' : 'Save Template'}
          </button>

          <button
            type="button"
            onClick={generateCertificate}
            disabled={isGenerateDisabled}
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <FaFileImage />
            {loading.generate ? 'Generating...' : 'Generate Certificate'}
          </button>
        </div>
      </div>

      <section className="glass-panel rounded-2xl p-4 md:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Template Name</span>
            <input
              type="text"
              value={formData.templateName}
              onChange={(event) => setFormData((previous) => ({ ...previous, templateName: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-600"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Certificate Title</span>
            <input
              type="text"
              value={formData.certificateTitle}
              onChange={(event) => setFormData((previous) => ({ ...previous, certificateTitle: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-600"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Candidate Name</span>
            <input
              type="text"
              value={formData.candidateName}
              onChange={(event) => setFormData((previous) => ({ ...previous, candidateName: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-600"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Course</span>
            <input
              type="text"
              value={formData.courseName}
              onChange={(event) => setFormData((previous) => ({ ...previous, courseName: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-600"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Issue Date</span>
            <input
              type="date"
              value={formData.issueDate}
              onChange={(event) => setFormData((previous) => ({ ...previous, issueDate: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-600"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Expiry Date (Optional)</span>
            <input
              type="date"
              value={formData.expiryDate}
              onChange={(event) => setFormData((previous) => ({ ...previous, expiryDate: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-600"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Certificate ID (Optional)</span>
            <input
              type="text"
              value={formData.certificateId}
              onChange={(event) => setFormData((previous) => ({ ...previous, certificateId: event.target.value }))}
              placeholder="AUTO OR CUSTOM"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-600"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Issuer Name</span>
            <input
              type="text"
              value={formData.issuerName}
              onChange={(event) => setFormData((previous) => ({ ...previous, issuerName: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-600"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Grade (Optional)</span>
            <input
              type="text"
              value={formData.grade}
              onChange={(event) => setFormData((previous) => ({ ...previous, grade: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-600"
            />
          </label>

          <label className="block md:col-span-2 xl:col-span-4">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Description (Optional)</span>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(event) => setFormData((previous) => ({ ...previous, description: event.target.value }))}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-600"
              placeholder="Add context, achievements, specialization, or remarks."
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={selectedTemplateId}
            onChange={(event) => setSelectedTemplateId(event.target.value)}
            className="min-w-[220px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-brand-600"
          >
            <option value="">Select saved template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.templateName}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadTemplate}
            disabled={!selectedTemplateId || loading.loadTemplate}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading.loadTemplate ? 'Loading template...' : 'Load Template'}
          </button>

          <button
            type="button"
            onClick={refreshTemplates}
            disabled={loading.templates}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading.templates ? 'Refreshing...' : 'Refresh List'}
          </button>

          <button
            type="button"
            onClick={resetCanvas}
            className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
          >
            Reset Starter Layout
          </button>
        </div>
      </section>

      <section className="grid gap-4 2xl:grid-cols-[18rem,minmax(0,1fr),19rem]">
        <aside className="glass-panel rounded-2xl p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Elements</h2>
          <div className="mt-3 grid gap-2">
            <button
              type="button"
              onClick={() => addTextObject('CERTIFICATE OF COMPLETION', { fontSize: 52, fontWeight: '700' })}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FaTextHeight /> Add Heading
            </button>
            <button
              type="button"
              onClick={() => addTextObject('Add your text here', { fontSize: 28 })}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FaTextHeight /> Add Text
            </button>
            <button
              type="button"
              onClick={() => addTextObject(PLACEHOLDER_VALUES.candidate_name, { fontSize: 44, fontWeight: '700', placeholderKey: PLACEHOLDER_VALUES.candidate_name })}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Add Candidate Name Placeholder
            </button>
            <button
              type="button"
              onClick={() => addTextObject(PLACEHOLDER_VALUES.course_name, { fontSize: 32, fontWeight: '700', placeholderKey: PLACEHOLDER_VALUES.course_name })}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Add Course Placeholder
            </button>
            <button
              type="button"
              onClick={() => addTextObject(`Issued on ${PLACEHOLDER_VALUES.issue_date}`, { fontSize: 20, placeholderKey: PLACEHOLDER_VALUES.issue_date })}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Add Date Placeholder
            </button>
            <button
              type="button"
              onClick={() => addTextObject(`ID: ${PLACEHOLDER_VALUES.certificate_id}`, { fontSize: 20, placeholderKey: PLACEHOLDER_VALUES.certificate_id })}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Add Certificate ID Placeholder
            </button>
            <button
              type="button"
              onClick={addQrPlaceholder}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FaQrcode /> Add QR Code
            </button>
            <button
              type="button"
              onClick={() => handlePickAsset('logo')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FaImage /> Add Logo
            </button>
            <button
              type="button"
              onClick={() => handlePickAsset('signature')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FaSignature /> Add Signature
            </button>
            <button
              type="button"
              onClick={() => handlePickAsset('seal')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FaRegCircle /> Add Seal
            </button>
            <button
              type="button"
              onClick={addBorder}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FaRegSquare /> Add Border
            </button>
            <button
              type="button"
              onClick={addSealPlaceholder}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FaPalette /> Add Seal Placeholder
            </button>
            <button
              type="button"
              onClick={addShape}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FaRegSquare /> Add Shape
            </button>
            <button
              type="button"
              onClick={addDividerLine}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FaMinus /> Add Divider Line
            </button>
            <button
              type="button"
              onClick={() => handlePickAsset('watermark')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FaUpload /> Add Watermark
            </button>
            <button
              type="button"
              onClick={() => handlePickAsset('backgroundImage')}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <FaUpload /> Add Background Image
            </button>
          </div>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(event) => handleAssetSelected('logo', event)}
          />
          <input
            ref={signatureInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(event) => handleAssetSelected('signature', event)}
          />
          <input
            ref={sealInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(event) => handleAssetSelected('seal', event)}
          />
          <input
            ref={watermarkInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(event) => handleAssetSelected('watermark', event)}
          />
          <input
            ref={backgroundInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            className="hidden"
            onChange={(event) => handleAssetSelected('backgroundImage', event)}
          />
        </aside>

        <div className="glass-panel rounded-2xl p-3 md:p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-slate-700">Certificate Canvas (A4 Landscape)</p>
            <p className="text-xs text-slate-500">{A4_WIDTH} x {A4_HEIGHT}</p>
          </div>

          <div className="overflow-auto rounded-xl border border-slate-200 bg-slate-100 p-4">
            <div className="mx-auto w-fit rounded-md bg-white p-3 shadow-[0_22px_45px_-30px_rgba(15,23,42,0.7)]">
              <canvas ref={canvasElementRef} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-600">
            <span className="rounded-md bg-slate-100 px-2.5 py-1">Drag</span>
            <span className="rounded-md bg-slate-100 px-2.5 py-1">Resize</span>
            <span className="rounded-md bg-slate-100 px-2.5 py-1">Rotate</span>
            <span className="rounded-md bg-slate-100 px-2.5 py-1">Duplicate</span>
            <span className="rounded-md bg-slate-100 px-2.5 py-1">Layering</span>
            <span className="rounded-md bg-slate-100 px-2.5 py-1">Snap to Grid</span>
          </div>
        </div>

        <aside className="glass-panel rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Properties</h2>
            <button
              type="button"
              onClick={() => setSnapToGrid((previous) => !previous)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${
                snapToGrid ? 'bg-brand-100 text-brand-700' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {snapToGrid ? 'Snap: ON' : 'Snap: OFF'}
            </button>
          </div>

          {selectedState ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={duplicateSelectedObject}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <FaClone /> Duplicate
                </button>
                <button
                  type="button"
                  onClick={deleteSelectedObject}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-300 bg-rose-50 px-2 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                >
                  <FaTrash /> Delete
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={toggleLockSelectedObject}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {selectedState.isLocked ? <FaLockOpen /> : <FaLock />} {selectedState.isLocked ? 'Unlock' : 'Lock'}
                </button>
                <button
                  type="button"
                  onClick={() => moveLayer('front')}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <FaLayerGroup /> Bring Front
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => moveLayer('forward')}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Move Forward
                </button>
                <button
                  type="button"
                  onClick={() => moveLayer('backward')}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Move Backward
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => moveLayer('back')}
                  className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Send to Back
                </button>
                <button
                  type="button"
                  onClick={() =>
                    updateSelectedObject((object, fabricLib) => {
                      if (object.shadow) {
                        object.set('shadow', null)
                        return
                      }

                      if (fabricLib?.Shadow) {
                        object.set(
                          'shadow',
                          new fabricLib.Shadow({
                            color: 'rgba(15,23,42,0.25)',
                            blur: 8,
                            offsetX: 3,
                            offsetY: 3,
                          }),
                        )
                        return
                      }

                      object.set('shadow', {
                        color: 'rgba(15,23,42,0.25)',
                        blur: 8,
                        offsetX: 3,
                        offsetY: 3,
                      })
                    })
                  }
                  className="rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  {selectedState.hasShadow ? 'Remove Shadow' : 'Add Shadow'}
                </button>
              </div>

              {selectedState.isText && (
                <>
                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Font Family</span>
                    <select
                      value={selectedState.fontFamily}
                      onChange={(event) =>
                        updateSelectedObject((object) => {
                          object.set('fontFamily', event.target.value)
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700"
                    >
                      {FONT_OPTIONS.map((font) => (
                        <option key={font} value={font}>
                          {font}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Font Size</span>
                      <input
                        type="range"
                        min="10"
                        max="140"
                        value={selectedState.fontSize}
                        onChange={(event) =>
                          updateSelectedObject((object) => {
                            object.set('fontSize', Number(event.target.value))
                          })
                        }
                        className="w-full"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Weight</span>
                      <select
                        value={selectedState.fontWeight}
                        onChange={(event) =>
                          updateSelectedObject((object) => {
                            object.set('fontWeight', event.target.value)
                          })
                        }
                        className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700"
                      >
                        <option value="normal">Normal</option>
                        <option value="500">Medium</option>
                        <option value="700">Bold</option>
                        <option value="900">Heavy</option>
                      </select>
                    </label>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Text Color</span>
                      <input
                        type="color"
                        value={selectedState.textColor}
                        onChange={(event) =>
                          updateSelectedObject((object) => {
                            object.set('fill', event.target.value)
                          })
                        }
                        className="h-10 w-full rounded-lg border border-slate-300"
                      />
                    </label>

                    <label className="block">
                      <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Background</span>
                      <input
                        type="color"
                        value={selectedState.backgroundColor}
                        onChange={(event) =>
                          updateSelectedObject((object) => {
                            if (isTextObject(object)) {
                              object.set('backgroundColor', event.target.value)
                              return
                            }

                            if (object.type === 'line') {
                              object.set('stroke', event.target.value)
                              return
                            }

                            object.set('fill', event.target.value)
                          })
                        }
                        className="h-10 w-full rounded-lg border border-slate-300"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Text Align</span>
                    <select
                      value={selectedState.textAlign}
                      onChange={(event) =>
                        updateSelectedObject((object) => {
                          object.set('textAlign', event.target.value)
                        })
                      }
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </label>
                </>
              )}

              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Width</span>
                  <input
                    type="number"
                    min="1"
                    value={selectedState.width}
                    onChange={(event) => updateDimensions(Number(event.target.value), null)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Height</span>
                  <input
                    type="number"
                    min="1"
                    value={selectedState.height}
                    onChange={(event) => updateDimensions(null, Number(event.target.value))}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-sm text-slate-700"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Opacity</span>
                <input
                  type="range"
                  min="0.05"
                  max="1"
                  step="0.01"
                  value={selectedState.opacity}
                  onChange={(event) =>
                    updateSelectedObject((object) => {
                      object.set('opacity', Number(event.target.value))
                    })
                  }
                  className="w-full"
                />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">Rotation</span>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  value={selectedState.rotation}
                  onChange={(event) =>
                    updateSelectedObject((object) => {
                      object.rotate(Number(event.target.value))
                    })
                  }
                  className="w-full"
                />
              </label>
            </div>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-sm text-slate-600">
              Select any canvas object to edit typography, color, dimensions, rotation, layers, lock state, and effects.
            </p>
          )}

          <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            Tip: Press <span className="font-semibold">Delete</span> to remove selected object quickly.
          </div>
        </aside>
      </section>

      {createdCertificate && (
        <section className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-700">Certificate issued successfully.</p>
          <p className="mt-1 text-sm text-emerald-800">
            ID: <strong>{createdCertificate.certificateId}</strong>
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              to={`/verify/${createdCertificate.certificateId}`}
              target="_blank"
              className="rounded-lg border border-emerald-400 px-3 py-2 text-sm font-semibold text-emerald-700"
            >
              Open Verification Page
            </Link>
            <Link to="/certificates" className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">
              View All Certificates
            </Link>
          </div>
        </section>
      )}

      <div className="pointer-events-none fixed right-4 top-4 z-[9999] flex w-[min(340px,calc(100vw-1rem))] flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto rounded-lg border px-3 py-2 text-sm font-semibold shadow-soft ${
              toast.type === 'error'
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-emerald-200 bg-emerald-50 text-emerald-700'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CreateCertificatePage
