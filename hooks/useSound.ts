import { useCallback } from 'react'

// Simple 8-bit sound effects using Web Audio API
export function useSound() {
  const playBeep = useCallback((frequency: number = 440, duration: number = 100) => {
    if (typeof window === 'undefined') return
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      oscillator.type = 'square' // Square wave for that 8-bit sound
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime)
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000)
      
      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + duration / 1000)
    } catch (error) {
      console.log('Sound playback not supported')
    }
  }, [])

  const playClick = useCallback(() => {
    playBeep(600, 50)
  }, [playBeep])

  const playSuccess = useCallback(() => {
    setTimeout(() => playBeep(523, 100), 0)    // C5
    setTimeout(() => playBeep(659, 100), 100)  // E5
    setTimeout(() => playBeep(784, 100), 200)  // G5
    setTimeout(() => playBeep(1047, 200), 300) // C6
  }, [playBeep])

  const playError = useCallback(() => {
    setTimeout(() => playBeep(200, 100), 0)
    setTimeout(() => playBeep(150, 200), 100)
  }, [playBeep])

  const playHover = useCallback(() => {
    playBeep(800, 30)
  }, [playBeep])

  const playJackpot = useCallback(() => {
    // Slot machine jackpot sound sequence
    setTimeout(() => playBeep(440, 80), 0)     // A4
    setTimeout(() => playBeep(523, 80), 100)   // C5
    setTimeout(() => playBeep(659, 80), 200)   // E5
    setTimeout(() => playBeep(784, 80), 300)   // G5
    setTimeout(() => playBeep(880, 80), 400)   // A5
    setTimeout(() => playBeep(1047, 80), 500)  // C6
    setTimeout(() => playBeep(1319, 100), 600) // E6
    setTimeout(() => playBeep(1568, 150), 750) // G6
    setTimeout(() => playBeep(1760, 200), 900) // A6 - finale
  }, [playBeep])

  return {
    playClick,
    playSuccess,
    playError,
    playHover,
    playBeep,
    playJackpot
  }
}