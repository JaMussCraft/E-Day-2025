import {
  DrawingUtils,
  FilesetResolver,
  GestureRecognizer,
} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js'

import 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'

import OpenAI from 'openai'
import { prompts } from './prompts.js'

// OPENAI API
const apiKey = '1234'
const openai = new OpenAI({
  apiKey: apiKey,
  dangerouslyAllowBrowser: true,
})

const doodleGuessElement = document.getElementById('doodleGuessDisplay')
const resultPopup = document.getElementById('resultPopup')
const resultText = document.getElementById('resultText')
const restartButton = document.getElementById('restartButton')
const restartButtonControl = document.getElementById('restartButtonControl')

const explanationButton = document.getElementById('explanationButton')
const explanationSection = document.getElementById('explanationSection')

const video = document.getElementById('webcam')
const canvasElement = document.getElementById('output_canvas')
const videoCtx = canvasElement.getContext('2d')
const gameView = document.getElementById('gameView')
const webcamButton = document.getElementById('webcamButton')
const promptDisplay = document.getElementById('promptDisplay')

const gameContainer = document.getElementById('gameContainer')
const temperatureInput = document.getElementById('temperature')
const temperatureValueSpan = document.getElementById('temperatureValue')
const viewHandlandmarks = document.getElementById('viewHandlandmarks')

const colorSelect = document.getElementById('drawingColor')

// Game Logic
const GameStates = {
  NOT_STARTED: 'notStarted',
  STARTED: 'started',
  COMPLETED: 'completed',
}
let gameState = GameStates.NOT_STARTED
let startTime = null
let lastLLMTime = null // timestamp of last LLM call
let gameDuration = 20 // default is 20 seconds

let prompt = null

let temperature = 1

let showHandLandmarks = false

let strokeColor = 'red'

async function llmGuess(imageDataURL, followQuestion, elapsedTime) {
  lastLLMTime = performance.now()
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: {
              url: imageDataURL,
            },
          },
          {
            type: 'text',
            text: followQuestion,
          },
        ],
      },
    ],
    response_format: {
      type: 'text',
    },
    temperature: temperature,
  })
  const guess = response.choices[0].message.content
  console.log(guess, prompt, 'correct?', guess === prompt)
  if (guess.toLowerCase() === prompt.toLowerCase()) {
    resultPopup.style.display = 'block'
    resultText.innerHTML = `You won with ${Math.floor(gameDuration + 3 - elapsedTime)} seconds remaining!`
    console.log('YOU WIN')
    gameState = GameStates.COMPLETED
  }
  doodleGuessElement.innerHTML = "LLM's Guess: " + guess
}

const resetGame = async (delay) => {
  resultPopup.style.display = 'none'

  gameState = GameStates.STARTED
  console.log('resetted and started new game')

  videoCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
  strokes = []
  strokeCoors = []

  doodleGuessElement.innerHTML = "LLM's Guess:"
  promptDisplay.innerHTML = 'Drawing your item...'
  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * prompts.length)
    prompt = prompts[randomIndex]
    promptDisplay.innerHTML = `Try to draw a ${prompt} !`
    startTime = performance.now()
    gameState = GameStates.STARTED
    window.requestAnimationFrame(runGame)
  }, 3000)
}

// MEDIAPIPE MODEL
let gestureRecognizer = null
let runningMode = 'IMAGE'
let webcamRunning = false
const radius = 10
let strokes = []
let strokeCoors = []

const loadModels = async () => {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  )

  gestureRecognizer = await GestureRecognizer.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath: '/models/gesture_recognizer.task',
      delegate: 'GPU',
    },
    runningMode: runningMode,
    min_hand_detection_confidence: 0.85,
  })
}
loadModels()

// AIR DRAW

const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia

if (hasGetUserMedia()) {
  webcamButton.addEventListener('click', enableCam)
} else {
  console.warn('getUserMedia() is not supported by your browser')
}

function enableCam(event) {
  if (!gestureRecognizer) {
    console.log('Model not loaded yet')
    return
  }

  gameState = GameStates.STARTED
  gameView.style.display = 'flex'
  gameContainer.style.display = 'flex'
  webcamButton.style.display = 'none'

  if (webcamRunning === true) {
    webcamRunning = false
    webcamButton.innerText = 'ENABLE PREDICTIONS'
  } else {
    webcamRunning = true
    webcamButton.innerText = 'DISABLE PREDICTIONS'
  }

  // Activate the webcam stream.
  navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
    video.srcObject = stream
    video.addEventListener('loadeddata', () => {
      window.scrollTo(0, document.body.scrollHeight)
      const randomIndex = Math.floor(Math.random() * prompts.length)
      prompt = prompts[randomIndex]
      promptDisplay.innerHTML = `Try to draw a ${prompt} !`
      startTime = performance.now()
      gameState = GameStates.STARTED
      window.requestAnimationFrame(runGame)
    })
  })
}

let lastVideoTime = -1
let results = undefined

async function runGame(currentTime) {
  canvasElement.style.width = video.videoWidth
  canvasElement.style.height = video.videoHeight
  canvasElement.width = video.videoWidth
  canvasElement.height = video.videoHeight

  if (runningMode === 'IMAGE') {
    runningMode = 'VIDEO'
    await gestureRecognizer.setOptions({ runningMode: 'VIDEO' })
  }

  const elapsedTime = (currentTime - startTime) / 1000 // in seconds

  if (gameState !== GameStates.COMPLETED) {
    console.log('game logic running!')
    let startTimeMs = performance.now()

    if (lastVideoTime !== video.currentTime) {
      lastVideoTime = video.currentTime
      results = gestureRecognizer.recognizeForVideo(video, startTimeMs)
    }

    videoCtx.save()
    const drawingUtils = new DrawingUtils(videoCtx)

    if (results.gestures.length > 0) {
      const gesture = results.gestures[0][0]
      const categoryName = gesture.categoryName
      const score = gesture.score

      if (showHandLandmarks) {
        for (const landmarks of results.landmarks) {
          drawingUtils.drawConnectors(landmarks, GestureRecognizer.HAND_CONNECTIONS, {
            color: '#FFFF00',
            lineWidth: 3,
          })
          drawingUtils.drawLandmarks(landmarks, {
            color: '#FFA500',
            lineWidth: 1,
          })
        }
      }

      if (categoryName == 'Pointing_Up') {
        for (const landmarks of results.landmarks) {
          // Air Draw Strokes
          const { x, y } = landmarks[8]

          strokeCoors.push({
            x: x,
            y: y,
          })

          videoCtx.strokeStyle = strokeColor
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
    videoCtx.strokeStyle = strokeColor
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

    // LLM starts guessing after 3 seconds and guesses every 2 seconds
    const guessingInterval = 2
    if (elapsedTime > 3 && (currentTime - lastLLMTime) / 1000 >= guessingInterval) {
      const base64String = canvasElement.toDataURL('image/jpeg')
      // console.log('querying LLM...')
      llmGuess(
        canvasElement.toDataURL('image/jpeg'),
        'Guess what this doodle is from one of the 345 categories from Quick Draw. Reply with "Blank" when the image is one color. Only reply with the category name. Ignore color of doodle.',
        elapsedTime
      )
    }

    // starting couting down when 3 seconds has passed
    if (elapsedTime > 3 && elapsedTime <= gameDuration + 4) {
      promptDisplay.innerHTML = `${gameDuration + 3 - Math.floor(elapsedTime)}`
    }

    // Time's UP
    if (elapsedTime > gameDuration + 3) {
      console.log('game over')
      resultPopup.style.display = 'block'
      resultText.innerHTML = `Time's up!`
      gameState = GameStates.COMPLETED
    }
  }

  if (webcamRunning === true && gameState === GameStates.STARTED) {
    window.requestAnimationFrame(runGame)
  }
}

restartButton.addEventListener('click', resetGame)
restartButtonControl.addEventListener('click', resetGame)

temperatureInput.addEventListener('change', (e) => {
  console.log(e.target.value)
  temperature = e.target.value
  temperatureValueSpan.innerHTML = e.target.value
})

viewHandlandmarks.addEventListener('change', () => {
  showHandLandmarks = !showHandLandmarks
})

explanationButton.addEventListener('click', () => {
  explanationSection.style.display = 'block'
  resultPopup.style.display = 'none'
  window.scrollTo({
    top: 1200,
    behavior: 'smooth',
  })
  console.log('display explana')
})

colorSelect.addEventListener('change', (e) => {
  strokeColor = e.target.value
})
