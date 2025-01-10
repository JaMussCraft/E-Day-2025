import {
  HandLandmarker,
  FilesetResolver,
  DrawingUtils,
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

let handLandmarker = undefined
let runningMode = 'IMAGE'
let enableWebcamButton
let webcamRunning = false

const createHandLandmarker = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    // path/to/wasm/root
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  )

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '../public/models/hand_landmarker.task',
    },
    runningMode: runningMode,
    numHands: 2,
  })
}

createHandLandmarker()

const drawPoint = (context, x, y, radius, color) => {
  context.fillRect(x - radius, y - radius, radius, radius)
}

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
      const radius = 50
      cxt.fillRect(x * event.target.naturalWidth - radius, y * event.target.naturalHeight - radius, radius, radius)
    }
    // drawConnectors(cxt, landmarks, HandLandmarker.HAND_CONNECTIONS, {
    //   color: "#00FF00",
    //   lineWidth: 5
    // });
    // drawLandmarks(cxt, landmarks, { color: "#FF0000", lineWidth: 1 });
  }
  console.log('demo completed')
}

// Testing Canvas
const canvas = document.getElementById('drawingCanvas')
const ctx = canvas.getContext('2d')

// Draw a square
ctx.fillStyle = 'blue'
ctx.fillRect(50, 50, 100, 100)
