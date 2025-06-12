import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import Head from 'next/head'
import { useSound } from '../hooks/useSound'

interface FormData {
  tokenName: string
  totalSupply: number | string
  userAllocation: number | string
  targetValue: number | string
  calculationMode: 'FDV' | 'Market Cap'
  circulatingSupply: number | string
}

interface CalculationResult {
  success: boolean
  token_price?: number
  allocation_value?: number
  formula?: string
  calculation_mode?: string
  fdv_value?: number
  moonsheet?: {
    message: string
    color: string
  }
  errors?: string[]
}

// Memoized formatters for better performance
const formatNumber = (value: number | string): string => {
  if (value === '' || value === null || value === undefined) return '-'
  const numValue = typeof value === 'string' ? Number(value) : value
  if (isNaN(numValue)) return '-'
  return new Intl.NumberFormat('id-ID').format(numValue)
}

const formatCurrency = (value: number | string): string => {
  if (value === '' || value === null || value === undefined) return '-'
  const numValue = typeof value === 'string' ? Number(value) : value
  if (isNaN(numValue)) return '-'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue)
}

const formatTokenPrice = (value: number): string => {
  if (isNaN(value)) return '-'
  const formatted = value.toFixed(10).replace(/\.?0+$/, '')
  return `$${formatted}`
}

export default function Home() {
  const [formData, setFormData] = useState<FormData>({
    tokenName: '',
    totalSupply: '',
    userAllocation: '',
    targetValue: '',
    calculationMode: 'FDV',
    circulatingSupply: ''
  })

  const [result, setResult] = useState<CalculationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const { playClick, playSuccess, playError, playHover } = useSound()

  // Game-like level system based on calculations
  useEffect(() => {
    if (result?.success) {
      setScore(prev => prev + 100)
      if (score >= level * 500) {
        setLevel(prev => prev + 1)
      }
    }
  }, [result, score, level])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    playClick()
    
    if (name === 'tokenName' || name === 'calculationMode') {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    } else {
      if (value === '') {
        setFormData(prev => ({
          ...prev,
          [name]: ''
        }))
      } else {
        if (name === 'userAllocation') {
          if (/^\d*\.?\d*$/.test(value)) {
            setFormData(prev => ({
              ...prev,
              [name]: value
            }))
          }
        } else {
          if (/^\d+$/.test(value)) {
            setFormData(prev => ({
              ...prev,
              [name]: value
            }))
          }
        }
      }
    }
  }, [playClick])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setResult(null)

    // Validate that all required fields are filled
    if (!formData.tokenName.trim()) {
      setResult({
        success: false,
        errors: ['Nama token harus diisi']
      })
      setLoading(false)
      playError()
      return
    }

    if (!formData.totalSupply || formData.totalSupply === '') {
      setResult({
        success: false,
        errors: ['Max Supply harus diisi']
      })
      setLoading(false)
      playError()
      return
    }

    if (!formData.userAllocation || formData.userAllocation === '') {
      setResult({
        success: false,
        errors: ['Alokasi kamu harus diisi']
      })
      setLoading(false)
      playError()
      return
    }

    if (!formData.targetValue || formData.targetValue === '') {
      setResult({
        success: false,
        errors: ['Target value harus diisi']
      })
      setLoading(false)
      playError()
      return
    }

    if (formData.calculationMode === 'Market Cap' && (!formData.circulatingSupply || formData.circulatingSupply === '')) {
      setResult({
        success: false,
        errors: ['Initial Supply harus diisi untuk perhitungan Market Cap']
      })
      setLoading(false)
      playError()
      return
    }

    try {
      const payload = {
        token_name: formData.tokenName,
        total_supply: Number(formData.totalSupply),
        user_allocation: Number(formData.userAllocation),
        target_value: Number(formData.targetValue),
        calculation_mode: formData.calculationMode,
        circulating_supply: formData.calculationMode === 'Market Cap' ? Number(formData.circulatingSupply) : null
      }

      const response = await axios.post<CalculationResult>('/api/analyze', payload)
      setResult(response.data)
      if (response.data.success) {
        playSuccess()
      }
    } catch (error) {
      playError()
      console.error('Error:', error)
      setResult({
        success: false,
        errors: ['Terjadi kesalahan saat menghitung. Silakan coba lagi.']
      })
    } finally {
      setLoading(false)
    }
  }, [formData, playError, playSuccess])

  return (
    <>
      <Head>
        <title>JEPE CALCULATOR - Retro Airdrop Game</title>
        <meta name="description" content="8-bit style airdrop calculator game" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen" style={{
        background: `
          repeating-linear-gradient(
            0deg,
            #0f0f3d,
            #0f0f3d 2px,
            #1a1a5e 2px,
            #1a1a5e 4px
          )
        `
      }}>
        <div className="starfield"></div>
        <div className="container mx-auto px-4 py-4 relative" style={{zIndex: 2}}>
          {/* Game Status Bar */}
          <div className="flex justify-between items-center mb-6 pixel-border bg-black/50 p-3">
            <div className="flex gap-8">
              <div>
                <span className="text-yellow-300">SCORE:</span>
                <span className="text-white ml-2">{score.toString().padStart(6, '0')}</span>
              </div>
              <div>
                <span className="text-cyan">LEVEL:</span>
                <span className="text-white ml-2">{level}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="pixel-coin text-2xl">💰</span>
              <span className="text-yellow-300">JEPE COINS</span>
            </div>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="pixel-title text-4xl mb-4" style={{animation: 'pixelFloat 3s ease-in-out infinite'}}>
              JEPE CALCULATOR
            </h1>
            <p className="text-cyan text-2xl" style={{animation: 'pixelBlink 1s infinite'}}>
              ▶ MASUKKAN INFO TOKEN ◀
            </p>
            <p className="text-yellow-300 text-xl mt-2">
              APLIKASI DUKUN AIRDROP BUAT NEBAK-NEBAK HARGA TOKEN BERDASARKAN TARGET FDV/MARKET CAP
            </p>
          </div>

          {/* Form */}
          <div className="max-w-4xl mx-auto pixel-border bg-black/80 p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column - Token Info */}
                <div className="space-y-6">
                  <h3 className="text-xl text-yellow-300 mb-4 uppercase" style={{letterSpacing: '2px'}}>▒▒ TOKEN INFO ▒▒</h3>
                  
                  <div>
                    <label className="block text-cyan mb-2 uppercase">
                      ▶ TOKEN NAME
                    </label>
                    <input
                      type="text"
                      name="tokenName"
                      value={formData.tokenName}
                      onChange={handleInputChange}
                      className="pixel-input w-full uppercase"
                      placeholder="ENTER TOKEN..."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-cyan mb-2 uppercase">
                      ▶ MAX SUPPLY
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="totalSupply"
                      value={formData.totalSupply}
                      onChange={handleInputChange}
                      className="pixel-input w-full"
                      placeholder="0000000000"
                      required
                    />
                    <p className="text-green text-sm mt-1">
                      [{formatNumber(formData.totalSupply)} TOKENS]
                    </p>
                  </div>

                  <div>
                    <label className="block text-cyan mb-2 uppercase">
                      ▶ YOUR ALLOCATION
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      name="userAllocation"
                      value={formData.userAllocation}
                      onChange={handleInputChange}
                      className="pixel-input w-full"
                      placeholder="0000000"
                      required
                    />
                    <p className="text-green text-sm mt-1">
                      [{formatNumber(formData.userAllocation)} TOKENS]
                    </p>
                  </div>
                </div>

                {/* Right Column - Valuation */}
                <div className="space-y-6">
                  <h3 className="text-xl text-yellow-300 mb-4 uppercase" style={{letterSpacing: '2px'}}>▒▒ VALUATION ▒▒</h3>
                  
                  <div>
                    <label className="block text-cyan mb-2 uppercase">
                      ▶ MODE SELECT
                    </label>
                    <select
                      name="calculationMode"
                      value={formData.calculationMode}
                      onChange={handleInputChange}
                      className="pixel-input w-full uppercase"
                    >
                      <option value="FDV">FDV MODE</option>
                      <option value="Market Cap">MARKET CAP MODE</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-cyan mb-2 uppercase">
                      ▶ TARGET {formData.calculationMode} ($)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="targetValue"
                      value={formData.targetValue}
                      onChange={handleInputChange}
                      className="pixel-input w-full"
                      placeholder="00000000"
                      required
                    />
                    <p className="text-green text-sm mt-1">
                      [{formatCurrency(formData.targetValue)}]
                    </p>
                  </div>

                  {formData.calculationMode === 'Market Cap' && (
                    <div>
                      <label className="block text-cyan mb-2 uppercase">
                        ▶ INITIAL SUPPLY
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        name="circulatingSupply"
                        value={formData.circulatingSupply}
                        onChange={handleInputChange}
                        className="pixel-input w-full"
                        placeholder="00000000"
                        required
                      />
                      <p className="text-green text-sm mt-1">
                        [{formatNumber(formData.circulatingSupply)} TOKENS]
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="pixel-button w-full text-lg"
                  onMouseEnter={playHover}
                >
                  {loading ? '▓▓ CALCULATING ▓▓' : '▶▶ PRESS START ◀◀'}
                </button>
              </div>
            </form>
          </div>

          {/* Results */}
          {result && (
            <div className="max-w-4xl mx-auto">
              {result.success ? (
                <div className="space-y-6">
                  {/* Moonsheet Card */}
                  <div className={`text-center ${(result.allocation_value || 0) < 10 ? 'pixel-result-box-gray' : 'pixel-result-box'}`}>
                    <div className="text-yellow-300 text-sm mb-2" style={{animation: 'pixelBlink 1.5s infinite'}}>
                      NILAI ALOKASI KAMU ADALAH:
                    </div>
                    <h2 className="text-4xl mb-4 text-green" style={{textShadow: '2px 2px 0 #00cc00'}}>
                      {formatCurrency(result.allocation_value!)}
                    </h2>
                    <p className="text-xl text-cyan">
                      {result.moonsheet?.message}
                    </p>
                  </div>

                  {/* Details */}
                  <div className="pixel-border bg-black/80 p-8">
                    <h3 className="text-xl text-yellow-300 mb-6 uppercase">
                      [░░ DETAIL STATS ░░]
                    </h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-cyan uppercase">MAX SUPPLY:</span>
                          <span className="text-white">{formatNumber(formData.totalSupply)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyan uppercase">YOUR ALLOCATION:</span>
                          <span className="text-white">{formatNumber(formData.userAllocation)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyan uppercase">TARGET {result.calculation_mode}:</span>
                          <span className="text-white">{formatCurrency(formData.targetValue)}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-cyan uppercase">TOKEN PRICE:</span>
                          <span className="text-yellow-300" style={{animation: 'pixelBlink 1.5s infinite'}}>
                            {formatTokenPrice(result.token_price!)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-cyan uppercase">YOUR VALUE:</span>
                          <span className="text-green" style={{animation: 'pixelGlow 1s ease-in-out infinite alternate'}}>
                            {formatCurrency(result.allocation_value!)}
                          </span>
                        </div>
                        {result.fdv_value && (
                          <div className="flex justify-between">
                            <span className="text-cyan uppercase">FDV:</span>
                            <span className="text-white">{formatCurrency(result.fdv_value)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="pixel-border bg-black/80 p-8" style={{borderColor: 'var(--pixel-red)'}}>
                  <h3 className="text-xl text-red mb-4 uppercase" style={{animation: 'pixelBlink 0.3s infinite'}}>
                    ❌❌ ERROR ERROR ERROR ❌❌
                  </h3>
                  <ul className="space-y-2">
                    {result.errors?.map((error, index) => (
                      <li key={index} className="text-orange">▶ {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="max-w-4xl mx-auto mt-8">
            <div className="pixel-border bg-black/80 p-6" style={{borderColor: 'var(--pixel-yellow)'}}>
              <p className="text-yellow-300 uppercase">
                ⚠️ WARNING: CALCULATION BASED ON YOUR INPUT DATA. 
                ACTUAL TOKEN PRICE MAY VARY DUE TO MARKET CONDITIONS. 
                THIS IS NOT FINANCIAL ADVICE!
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pb-4">
            <p className="text-cyan">
              CREATED WITH NEXT.JS | © 2024 JEPE CALCULATOR
            </p>
            <p className="text-gray mt-2 text-sm">
              HIGH SCORE: {score.toString().padStart(6, '0')} | THANK YOU FOR PLAYING!
            </p>
          </div>
        </div>
      </div>
    </>
  )
}