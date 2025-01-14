import {
  FilesetResolver,
  GestureRecognizer,
} from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision/vision_bundle.js'

import 'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js'

import OpenAI from 'openai'

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

const video = document.getElementById('webcam')
const canvasElement = document.getElementById('output_canvas')
const videoCtx = canvasElement.getContext('2d')
const gameView = document.getElementById('gameView')
const webcamButton = document.getElementById('webcamButton')
const promptDisplay = document.getElementById('promptDisplay')

// Game Logic
const GameStates = {
  NOT_STARTED: 'notStarted',
  STARTED: 'started',
  COMPLETED: 'completed',
}
let gameState = GameStates.NOT_STARTED
let frame = 1

let prompt = null

async function llmGuess(imageDataURL, followQuestion, frame) {
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
  })
  const guess = response.choices[0].message.content
  console.log(guess, prompt, 'correct?', guess === prompt)
  if (guess.toLowerCase() === prompt.toLowerCase()) {
    resultPopup.style.display = 'block'
    resultText.innerHTML = `You won with ${23 - frame / 60} seconds remaining!`
    console.log('YOU WIN')
    gameState = GameStates.COMPLETED
  }
  doodleGuessElement.innerHTML = "LLM's Guess: " + guess
}

const resetGame = () => {
  resultPopup.style.display = 'none'
  frame = 1

  gameState = GameStates.NOT_STARTED
  console.log('resetted game')

  videoCtx.clearRect(0, 0, canvasElement.width, canvasElement.height)
  
  doodleGuessElement.innerHTML = "LLM's Guess:"
  promptDisplay.innerHTML = 'Drawing your item...'
  setTimeout(() => {
    const randomIndex = Math.floor(Math.random() * prompts.length)
    prompt = prompts[randomIndex]
    promptDisplay.innerHTML = `Try to draw a ${prompt} !`
    
  }, 2500);

}

// MEDIAPIPE MODEL
let gestureRecognizer = null
let runningMode = 'IMAGE'
let webcamRunning = false
const radius = 10
const strokes = []
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

const prompts = [
  'aircraft carrier',
  'airplane',
  'alarm clock',
  'ambulance',
  'angel',
  'animal migration',
  'ant',
  'anvil',
  'apple',
  'arm',
  'asparagus',
  'axe',
  'backpack',
  'banana',
  'bandage',
  'barn',
  'baseball',
  'baseball bat',
  'basket',
  'basketball',
  'bat',
  'bathtub',
  'beach',
  'bear',
  'beard',
  'bed',
  'bee',
  'belt',
  'bench',
  'bicycle',
  'binoculars',
  'bird',
  'birthday cake',
  'blackberry',
  'blueberry',
  'book',
  'boomerang',
  'bottlecap',
  'bowtie',
  'bracelet',
  'brain',
  'bread',
  'bridge',
  'broccoli',
  'broom',
  'bucket',
  'bulldozer',
  'bus',
  'bush',
  'butterfly',
  'cactus',
  'cake',
  'calculator',
  'calendar',
  'camel',
  'camera',
  'camouflage',
  'campfire',
  'candle',
  'cannon',
  'canoe',
  'car',
  'carrot',
  'castle',
  'cat',
  'ceiling fan',
  'cello',
  'cell phone',
  'chair',
  'chandelier',
  'church',
  'circle',
  'clarinet',
  'clock',
  'cloud',
  'coffee cup',
  'compass',
  'computer',
  'cookie',
  'cooler',
  'couch',
  'cow',
  'crab',
  'crayon',
  'crocodile',
  'crown',
  'cruise ship',
  'cup',
  'diamond',
  'dishwasher',
  'diving board',
  'dog',
  'dolphin',
  'donut',
  'door',
  'dragon',
  'dresser',
  'drill',
  'drums',
  'duck',
  'dumbbell',
  'ear',
  'elbow',
  'elephant',
  'envelope',
  'eraser',
  'eye',
  'eyeglasses',
  'face',
  'fan',
  'feather',
  'fence',
  'finger',
  'fire hydrant',
  'fireplace',
  'firetruck',
  'fish',
  'flamingo',
  'flashlight',
  'flip flops',
  'floor lamp',
  'flower',
  'flying saucer',
  'foot',
  'fork',
  'frog',
  'frying pan',
  'garden',
  'garden hose',
  'giraffe',
  'goatee',
  'golf club',
  'grapes',
  'grass',
  'guitar',
  'hamburger',
  'hammer',
  'hand',
  'harp',
  'hat',
  'headphones',
  'hedgehog',
  'helicopter',
  'helmet',
  'hexagon',
  'hockey puck',
  'hockey stick',
  'horse',
  'hospital',
  'hot air balloon',
  'hot dog',
  'hot tub',
  'hourglass',
  'house',
  'house plant',
  'hurricane',
  'ice cream',
  'jacket',
  'jail',
  'kangaroo',
  'key',
  'keyboard',
  'knee',
  'knife',
  'ladder',
  'lantern',
  'laptop',
  'leaf',
  'leg',
  'light bulb',
  'lighter',
  'lighthouse',
  'lightning',
  'line',
  'lion',
  'lipstick',
  'lobster',
  'lollipop',
  'mailbox',
  'map',
  'marker',
  'matches',
  'megaphone',
  'mermaid',
  'microphone',
  'microwave',
  'monkey',
  'moon',
  'mosquito',
  'motorbike',
  'mountain',
  'mouse',
  'moustache',
  'mouth',
  'mug',
  'mushroom',
  'nail',
  'necklace',
  'nose',
  'ocean',
  'octagon',
  'octopus',
  'onion',
  'oven',
  'owl',
  'paintbrush',
  'paint can',
  'palm tree',
  'panda',
  'pants',
  'paper clip',
  'parachute',
  'parrot',
  'passport',
  'peanut',
  'pear',
  'peas',
  'pencil',
  'penguin',
  'piano',
  'pickup truck',
  'picture frame',
  'pig',
  'pillow',
  'pineapple',
  'pizza',
  'pliers',
  'police car',
  'pond',
  'pool',
  'popsicle',
  'postcard',
  'potato',
  'power outlet',
  'purse',
  'rabbit',
  'raccoon',
  'radio',
  'rain',
  'rainbow',
  'rake',
  'remote control',
  'rhinoceros',
  'rifle',
  'river',
  'roller coaster',
  'rollerskates',
  'sailboat',
  'sandwich',
  'saw',
  'saxophone',
  'school bus',
  'scissors',
  'scorpion',
  'screwdriver',
  'sea turtle',
  'see saw',
  'shark',
  'sheep',
  'shoe',
  'shorts',
  'shovel',
  'sink',
  'skateboard',
  'skull',
  'skyscraper',
  'sleeping bag',
  'smiley face',
  'snail',
  'snake',
  'snorkel',
  'snowflake',
  'snowman',
  'soccer ball',
  'sock',
  'speedboat',
  'spider',
  'spoon',
  'spreadsheet',
  'square',
  'squiggle',
  'squirrel',
  'stairs',
  'star',
  'steak',
  'stereo',
  'stethoscope',
  'stitches',
  'stop sign',
  'stove',
  'strawberry',
  'streetlight',
  'string bean',
  'submarine',
  'suitcase',
  'sun',
  'swan',
  'sweater',
  'swing set',
  'sword',
  'syringe',
  'table',
  'teapot',
  'teddy-bear',
  'telephone',
  'television',
  'tennis racquet',
  'tent',
  'The Eiffel Tower',
  'The Great Wall of China',
  'The Mona Lisa',
  'tiger',
  'toaster',
  'toe',
  'toilet',
  'tooth',
  'toothbrush',
  'toothpaste',
  'tornado',
  'tractor',
  'traffic light',
  'train',
  'tree',
  'triangle',
  'trombone',
  'truck',
  'trumpet',
  't-shirt',
  'umbrella',
  'underwear',
  'van',
  'vase',
  'violin',
  'washing machine',
  'watermelon',
  'waterslide',
  'whale',
  'wheel',
  'windmill',
  'wine bottle',
  'wine glass',
  'wristwatch',
  'yoga',
  'zebra',
  'zigzag',
]

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
      runGame()
    })
  })
}

let lastVideoTime = -1
let results = undefined


async function runGame() {
  canvasElement.style.width = video.videoWidth
  canvasElement.style.height = video.videoHeight
  canvasElement.width = video.videoWidth
  canvasElement.height = video.videoHeight

  if (runningMode === 'IMAGE') {
    runningMode = 'VIDEO'
    await gestureRecognizer.setOptions({ runningMode: 'VIDEO' })
  }

  if (gameState !== GameStates.COMPLETED) {
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

    // LLM guesses every 2 seconds
    if (frame >= 180 && frame % 120 == 0) {
      const base64String = canvasElement.toDataURL('image/jpeg')
      llmGuess(
        canvasElement.toDataURL('image/jpeg'),
        'Guess what this doodle is from one of the 345 categories from Quick Draw. Reply with "Blank" when the image is one color. Only reply with the category name. Ignore color of doodle.',
        frame
      )
    }

    // starting couting down when 3 seconds has passed
    if (180 <= frame && frame <= 60 * 23 && frame % 60 == 0) {
      promptDisplay.innerHTML = `${23 - frame / 60}`
    }

    // Time's UP
    if (frame >= 60 * 5) {
      console.log('game over')
      resultPopup.style.display = 'block'
      resultText.innerHTML = `Time's up!`
      gameState = GameStates.COMPLETED
    }
  }

  if (webcamRunning === true) {
    window.requestAnimationFrame(runGame)
    frame += 1
  }
}

restartButton.addEventListener('click', resetGame)
