import {
  HandLandmarker,
  FilesetResolver,
  GestureRecognizer,
} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js'

import 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'

// Get the button element
const button = document.getElementById('clickButton')

// Add a click event listener to the button
button.addEventListener('click', () => {
  // Get the message element and set its text content
  const message = document.getElementById('message')
  message.textContent = 'Button clicked! Welcome to my website.'
})

let handLandmarker = null
let gestureRecognizer = null
let runningMode = 'IMAGE'
let enableWebcamButton = null
let webcamRunning = false
const radius = 10
const strokes = []
let strokeCoors = []

const loadModels = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  )

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '../public/models/hand_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: runningMode,
  })

  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '../public/models/gesture_recognizer.task',
      delegate: 'GPU',
    },
    runningMode: runningMode,
    min_hand_detection_confidence: 0.85,
  })
}
loadModels()

/********************************************************************
// Demo 1: Grab a bunch of images from the page and detection them
// upon click.
********************************************************************/

const imageContainers = document.getElementsByClassName('detectOnClick')

for (let i = 0; i < imageContainers.length; i++) {
  imageContainers[i].children[0].addEventListener('click', handleClick)
}

async function handleClick(event) {
  if (!handLandmarker) {
    console.log('Wait for handLandmarker to load before clicking!')
    return
  }

  if (runningMode === 'VIDEO') {
    runningMode = 'IMAGE'
    await handLandmarker.setOptions({ runningMode: 'IMAGE' })
  }
  // Remove all landmarks drawed before
  const allCanvas = event.target.parentNode.getElementsByClassName('canvas')
  for (var i = allCanvas.length - 1; i >= 0; i--) {
    const n = allCanvas[i]
    n.parentNode.removeChild(n)
  }

  const handLandmarkerResult = handLandmarker.detect(event.target)
  const canvas = document.createElement('canvas')
  canvas.setAttribute('class', 'canvas')
  canvas.setAttribute('width', event.target.naturalWidth + 'px')
  canvas.setAttribute('height', event.target.naturalHeight + 'px')
  canvas.style =
    'left: 0px;' +
    'top: 0px;' +
    'width: ' +
    event.target.width +
    'px;' +
    'height: ' +
    event.target.height +
    'px;'

  event.target.parentNode.appendChild(canvas)
  const cxt = canvas.getContext('2d')
  for (const landmarks of handLandmarkerResult.landmarks) {
    cxt.fillStyle = 'red'
    for (const { x, y } of landmarks) {
      // console.log('drawing on ', x * event.target.width, y * event.target.height)
      cxt.fillRect(
        x * event.target.naturalWidth - radius,
        y * event.target.naturalHeight - radius,
        radius,
        radius
      )
    }
    // drawConnectors(cxt, landmarks, HandLandmarker.HAND_CONNECTIONS, {
    //   color: "#00FF00",
    //   lineWidth: 5
    // });
    // drawLandmarks(cxt, landmarks, { color: "#FF0000", lineWidth: 1 });
  }
}

// Testing Canvas
const canvas = document.getElementById('drawingCanvas')
const ctx = canvas.getContext('2d')
ctx.fillStyle = 'blue'
ctx.fillRect(50, 50, 100, 100)

/********************************************************************
// Demo 2: Continuously grab image from webcam stream and detect it.
********************************************************************/

const video = document.getElementById('webcam')
const canvasElement = document.getElementById('output_canvas')
const videoCtx = canvasElement.getContext('2d')

const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia

if (hasGetUserMedia()) {
  enableWebcamButton = document.getElementById('webcamButton')
  enableWebcamButton.addEventListener('click', enableCam)
} else {
  console.warn('getUserMedia() is not supported by your browser')
}

function enableCam(event) {
  if (!gestureRecognizer) {
    console.log('Model not loaded yet')
    return
  }

  if (webcamRunning === true) {
    webcamRunning = false
    enableWebcamButton.innerText = 'ENABLE PREDICTIONS'
  } else {
    webcamRunning = true
    enableWebcamButton.innerText = 'DISABLE PREDICTIONS'
  }

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    video.srcObject = stream
    video.addEventListener('loadeddata', predictWebcam)
  })
}

let lastVideoTime = -1
let results = undefined

async function predictWebcam() {
  canvasElement.style.width = video.videoWidth
  canvasElement.style.height = video.videoHeight
  canvasElement.width = video.videoWidth
  canvasElement.height = video.videoHeight

  if (runningMode === 'IMAGE') {
    runningMode = 'VIDEO'
    await gestureRecognizer.setOptions({ runningMode: 'VIDEO' })
  }

  let startTimeMs = performance.now()

  if (lastVideoTime !== video.currentTime) {
    lastVideoTime = video.currentTime
    results = gestureRecognizer.recognizeForVideo(video, startTimeMs)
  }

  // videoCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)

  videoCtx.save()

  if (results.gestures.length > 0) {
    const gesture = results.gestures[0][0]
    const categoryName = gesture.categoryName
    const score = gesture.score
    console.log(score)

    if (categoryName == 'Pointing_Up') {
      for (const landmarks of results.landmarks) {
        const { x, y } = landmarks[8]

        strokeCoors.push({
          x: x,
          y: y,
        })

        videoCtx.strokeStyle = 'red'
        videoCtx.lineWidth = 5
        videoCtx.beginPath()

        strokeCoors.forEach((point, index) => {
          if (index === 0) {
            videoCtx.moveTo(point.x * video.videoWidth, point.y * video.videoHeight)
          } else {
            videoCtx.lineTo(point.x * video.videoWidth, point.y * video.videoHeight)
          }
        })

        videoCtx.stroke()
      }
    } else {
      if (strokeCoors.length) {
        strokes.push(strokeCoors)
        strokeCoors = []
      }
    }
  }

  // Draw Strokes
  videoCtx.strokeStyle = 'red'
  videoCtx.lineWidth = 5
  videoCtx.beginPath()

  strokes.forEach((stroke) => {
    stroke.forEach((point, index) => {
      if (index === 0) {
        videoCtx.moveTo(point.x * video.videoWidth, point.y * video.videoHeight)
      } else {
        videoCtx.lineTo(point.x * video.videoWidth, point.y * video.videoHeight)
      }
    })
  })

  videoCtx.stroke()

  videoCtx.restore()

  console.log(strokes.length)

  if (webcamRunning === true) {
    window.requestAnimationFrame(predictWebcam)
  }
}
