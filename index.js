/* global preloadImagesTmr paper1Loaded fxhash fxrand fxpreview */

//
//  4'33"
//
//  HELLO!! Code is copyright revdancatt (that's me), so no sneaky using it for your
//  NFT projects.
//  But please feel free to unpick it, and ask me questions. A quick note, this is written
//  as an artist, which is a slightly different (and more storytelling way) of writing
//  code, than if this was an engineering project. I've tried to keep it somewhat readable
//  rather than doing clever shortcuts, that are cool, but harder for people to understand.
//
//  You can find me at...
//  https://twitter.com/revdancatt
//  https://instagram.com/revdancatt
//  https://youtube.com/revdancatt
//

const ratio = 1
const startTime = new Date().getTime() // so we can figure out how long since the scene started
const maxTime = ((4 * 60) + 33) * 1000
// const maxTime = ((4 * 60) + 33) * 1000
let drawn = false
let snapshotDrawn = false
let highRes = false // display high or low res
const features = {}
let nextFrame = null

window.$fxhashFeatures = {}

//  Work out what all our features are
const makeFeatures = () => {
  // features.background = 1
  features.paperOffset = {
    paper1: {
      x: fxrand(),
      y: fxrand()
    },
    paper2: {
      x: fxrand(),
      y: fxrand()
    }
  }
  //  Set the water
  const waters = [{
    h: 353,
    s: 98,
    l: 74
  }, {
    h: 39,
    s: 100,
    l: 74
  }, {
    h: 241,
    s: 77,
    l: 87
  }, {
    h: 142,
    s: 100,
    l: 71
  }]
  const altWaters = [{
    h: 299,
    s: 99,
    l: 73
  }, {
    h: 46,
    s: 41,
    l: 50
  }, {
    h: 201,
    s: 21,
    l: 77
  }]
  features.waterChoice = Math.floor(fxrand() * waters.length)
  features.water = waters[features.waterChoice]
  if (fxrand() < 0.18) {
    features.waterChoice = Math.floor(fxrand() * altWaters.length)
    features.water = altWaters[features.waterChoice]
  }

  //  Now work out what happens every second
  const seconds = []
  for (let s = 0; s < maxTime / 1000; s++) {
    let isOn = fxrand() < 0.8
    let top = 0
    const horizon = 1 / 3 * 2 * 0.95
    const lines = []
    let oldTop = top
    while (top < horizon) {
      //  Work out how far through we are from the top to the horizon
      const percent = top / horizon
      //  The chance for an off line to turn back on decreases as we go down
      const chanceToOn = (1 - percent)
      //  The chance for an on line to turn off increases as we go down
      const chanceToOff = 0.95
      //  The size of the line we are going to move down by is 10% of the remaining distance
      const baseLineSize = Math.max(((horizon - top) / 5), 0.01)
      //  Randomly pick a line length based on the baseLineSize, make sure it always has a min value
      const stopDistance = Math.max((fxrand() * (baseLineSize / 4 * 3)) + (baseLineSize / 4), 0.01)
      //  Set the actual stop distance by adding it to the current top
      const stopPoint = Math.min(top + stopDistance, horizon)
      //  If the line is on, check to see if we are going to turn it off
      if (isOn) {
        //  If we are switching off, then turn the line off
        if (fxrand() < chanceToOff) {
          isOn = false
          // push the line into the array
          lines.push({
            start: oldTop,
            stop: stopPoint
          })
        }
      } else {
        //  If we were off, check to see if we have been turned on
        if (fxrand() < chanceToOn) {
          //  Turn us on
          isOn = true
          //  reset the oldTop to the new value
          oldTop = stopPoint
        }
      }
      //  Now move the top down to the next position
      top = stopPoint
    }
    //  Add the last line if we need to
    if (isOn) {
      lines.push({
        start: oldTop,
        stop: top
      })
    }
    seconds.push(lines)
  }
  features.seconds = seconds
}

//  Call the above make features, so we'll have the window.$fxhashFeatures available
//  for fxhash
makeFeatures()
console.table(window.$fxhashFeatures)

const init = async () => {
  //  I should add a timer to this, but really how often to people who aren't
  //  the developer resize stuff all the time. Stick it in a digital frame and
  //  have done with it!
  window.addEventListener('resize', async () => {
    //  If we do resize though, work out the new size...
    await layoutCanvas()
    //  And redraw it
    drawCanvas()
  })

  //  Now layout the canvas
  await layoutCanvas()
  //  And draw it!!
  drawCanvas()
}

const layoutCanvas = async () => {
  //  Kill the next animation frame
  window.cancelAnimationFrame(nextFrame)

  const wWidth = window.innerWidth
  const wHeight = window.innerHeight
  let cWidth = wWidth
  let cHeight = cWidth * ratio
  if (cHeight > wHeight) {
    cHeight = wHeight
    cWidth = wHeight / ratio
  }
  const canvas = document.getElementById('target')
  if (highRes) {
    canvas.height = 8192
    canvas.width = 8192 / ratio
  } else {
    canvas.width = Math.min((8192 / 2), cWidth * 2)
    canvas.height = Math.min((8192 / ratio / 2), cHeight * 2)
    //  Minimum size to be half of the high rez cersion
    if (Math.min(canvas.width, canvas.height) < 8192 / 2) {
      if (canvas.width < canvas.height) {
        canvas.height = 8192 / 2
        canvas.width = 8192 / 2 / ratio
      } else {
        canvas.width = 8192 / 2
        canvas.height = 8192 / 2 / ratio
      }
    }
  }

  canvas.style.position = 'absolute'
  canvas.style.width = `${cWidth}px`
  canvas.style.height = `${cHeight}px`
  canvas.style.left = `${(wWidth - cWidth) / 2}px`
  canvas.style.top = `${(wHeight - cHeight) / 2}px`

  const snapshot = document.getElementById('snapshot')
  snapshot.width = canvas.width
  snapshot.height = canvas.height
  snapshot.style.position = 'absolute'
  snapshot.style.width = `${cWidth}px`
  snapshot.style.height = `${cHeight}px`
  snapshot.style.left = `${(wWidth - cWidth) / 2}px`
  snapshot.style.top = `${(wHeight - cHeight) / 2}px`

  //  Re-Create the paper pattern
  const paper1 = document.createElement('canvas')
  paper1.width = canvas.width / 2
  paper1.height = canvas.height / 2
  const paper1Ctx = paper1.getContext('2d')
  await paper1Ctx.drawImage(paper1Loaded, 0, 0, 1920, 1920, 0, 0, paper1.width, paper1.height)
  features.paper1Pattern = paper1Ctx.createPattern(paper1, 'repeat')

  const paper2 = document.createElement('canvas')
  paper2.width = canvas.width / (22 / 7)
  paper2.height = canvas.height / (22 / 7)
  const paper2Ctx = paper2.getContext('2d')
  await paper2Ctx.drawImage(paper1Loaded, 0, 0, 1920, 1920, 0, 0, paper2.width, paper2.height)
  features.paper2Pattern = paper2Ctx.createPattern(paper2, 'repeat')

  drawCanvas()
}

const drawPaper = async () => {
  const targets = ['target']
  if (!snapshotDrawn) targets.push('snapshot')

  for (const target of targets) {
    // Grab all the canvas stuff
    const canvas = document.getElementById(target)
    const ctx = canvas.getContext('2d')
    const w = canvas.width
    const h = canvas.height

    //  Set the line width
    ctx.globalCompositeOperation = 'source-over'
    ctx.lineWidth = w / (maxTime / 1000) / 2
    //  Lay down the first paper texture
    ctx.fillStyle = features.paper1Pattern
    ctx.save()
    ctx.translate(-w * features.paperOffset.paper1.x, -h * features.paperOffset.paper1.y)
    ctx.fillRect(0, 0, w * 2, h * 2)
    ctx.restore()

    //  Lay down the second paper texture
    ctx.globalCompositeOperation = 'darken'
    ctx.fillStyle = features.paper2Pattern
    ctx.save()
    ctx.translate(-w * features.paperOffset.paper1.x, -h * features.paperOffset.paper1.y)
    ctx.fillRect(0, 0, w * 2, h * 2)
    ctx.restore()
    ctx.globalCompositeOperation = 'source-over'

    //  If we want to modify the colour, i.e. for riso pink, do that here
    if (features.background) {
      ctx.globalCompositeOperation = 'screen'
      ctx.fillStyle = `hsla(${features.background}, 100%, 50%, 1)`
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'source-over'
    }
  }

  if (!snapshotDrawn) {
    snapshotDrawn = true
    try {
      fxpreview()
    } catch (er) {
      console.log('No capture')
    }
  }
}

const drawCanvas = async () => {
  //  Let the preloader know that we've hit this function at least once
  drawn = true
  //  Make sure there's only one nextFrame to be called
  window.cancelAnimationFrame(nextFrame)

  // Grab all the canvas stuff
  const canvas = document.getElementById('target')
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  //  Set the line width
  ctx.globalCompositeOperation = 'source-over'
  ctx.lineWidth = w / (maxTime / 1000) / 2

  await drawPaper()

  //  Work out how far the whole process we are
  const diff = new Date().getTime() - startTime
  const percent = Math.min(diff / maxTime, 1)

  //  Make the water gradent
  ctx.globalCompositeOperation = 'multiply'
  const grd = ctx.createLinearGradient(0, h / 3 * 2, 170, h)
  grd.addColorStop(0, `hsla(${features.water.h}, ${features.water.s}%, ${features.water.l}%, 0.2)`)
  grd.addColorStop(1, `hsla(${features.water.h}, ${features.water.s}%, ${features.water.l}%, 0)`)
  ctx.fillStyle = grd
  ctx.fillRect(0, h / 3 * 2, w * percent, h / 3)

  //  Now draw the line
  ctx.globalCompositeOperation = 'source-over'
  ctx.strokeStyle = `rgba(0, 0, 0, ${1 - percent})`
  ctx.beginPath()
  ctx.moveTo(0, h / 3 * 2)
  ctx.lineTo(w * percent, h / 3 * 2)
  ctx.stroke()

  //  Now draw the decoration
  ctx.globalCompositeOperation = 'source-over'
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.0433)'
  const maxSeconds = Math.floor(maxTime / 1000)
  const second = Math.min(Math.floor(maxTime * percent / 1000), maxSeconds)
  for (let s = 0; s <= second; s++) {
    if (features.seconds[s]) {
      for (const line of features.seconds[s]) {
        ctx.beginPath()
        ctx.moveTo(w * ((s / maxSeconds) + (0.5 / maxSeconds)), line.start * h)
        ctx.lineTo(w * ((s / maxSeconds) + (0.5 / maxSeconds)), line.stop * h)
        ctx.stroke()
      }
    }
  }
  //  Now do it all over again
  nextFrame = window.requestAnimationFrame(drawCanvas)
}

const autoDownloadCanvas = async (showHash = false) => {
  const element = document.createElement('a')
  element.setAttribute('download', `4-33_${fxhash}`)
  element.style.display = 'none'
  document.body.appendChild(element)
  let imageBlob = null
  imageBlob = await new Promise(resolve => document.getElementById('target').toBlob(resolve, 'image/png'))
  element.setAttribute('href', window.URL.createObjectURL(imageBlob, {
    type: 'image/png'
  }))
  element.click()
  document.body.removeChild(element)
}

//  KEY PRESSED OF DOOM
document.addEventListener('keypress', async (e) => {
  e = e || window.event
  // Save
  if (e.key === 's') autoDownloadCanvas()

  //   Toggle highres mode
  if (e.key === 'h') {
    highRes = !highRes
    await layoutCanvas()
  }
})
//  This preloads the images so we can get access to them
// eslint-disable-next-line no-unused-vars
const preloadImages = () => {
  //  If paper1 has loaded and we haven't draw anything yet, then kick it all off
  if (paper1Loaded !== null && !drawn) {
    clearInterval(preloadImagesTmr)
    init()
  }
}
