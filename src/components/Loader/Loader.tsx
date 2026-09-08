import { useEffect, useState } from 'react'
import './Loader.scss'

const DURATION = 3000
const RADIUS = 60
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

function Loader() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frameId: ReturnType<typeof requestAnimationFrame> | null = null
    const start = performance.now()

    const animate = (time: number) => {
      const elapsed = time - start
      const nextProgress = Math.min(elapsed / DURATION, 1)

      setProgress(nextProgress)

      if (nextProgress < 1) {
        frameId = requestAnimationFrame(animate)
      }
    }

    frameId = requestAnimationFrame(animate)

    return () => {
      if (frameId !== null) {
        cancelAnimationFrame(frameId)
      }
    }
  }, [])

  const percent = Math.round(progress * 100)
  const dashOffset = CIRCUMFERENCE * (1 - progress)

  return (
    <div className='Loader'>
      <svg
        className='Loader__svg'
        width='130'
        height='130'
        viewBox='0 0 130 130'
      >
        <circle
          className='Loader__track'
          cx='65'
          cy='65'
          r={RADIUS}
        />
        <circle
          className='Loader__progress'
          cx='65'
          cy='65'
          r={RADIUS}
          style={{
            strokeDasharray: CIRCUMFERENCE,
            strokeDashoffset: dashOffset,
          }}
        />
      </svg>

      <div className='Loader__percent'>
        {percent}%
      </div>
    </div>
  )
}

export default Loader