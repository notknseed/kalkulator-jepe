import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import Head from 'next/head'

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
  const [darkMode, setDarkMode] = useState(false)

  // Load dark mode preference from localStorage
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode !== null) {
      setDarkMode(JSON.parse(savedDarkMode))
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setDarkMode(prefersDark)
    }
  }, [])

  // Save dark mode preference to localStorage (only after initial load)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', JSON.stringify(darkMode))
    }
  }, [darkMode])

  const toggleDarkMode = useCallback(() => {
    setDarkMode(!darkMode)
  }, [darkMode])

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
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
  }, [])

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
      return
    }

    if (!formData.totalSupply || formData.totalSupply === '') {
      setResult({
        success: false,
        errors: ['Max Supply harus diisi']
      })
      setLoading(false)
      return
    }

    if (!formData.userAllocation || formData.userAllocation === '') {
      setResult({
        success: false,
        errors: ['Alokasi kamu harus diisi']
      })
      setLoading(false)
      return
    }

    if (!formData.targetValue || formData.targetValue === '') {
      setResult({
        success: false,
        errors: ['Target value harus diisi']
      })
      setLoading(false)
      return
    }

    if (formData.calculationMode === 'Market Cap' && (!formData.circulatingSupply || formData.circulatingSupply === '')) {
      setResult({
        success: false,
        errors: ['Initial Supply harus diisi untuk perhitungan Market Cap']
      })
      setLoading(false)
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
    } catch (error) {
      console.error('Error:', error)
      setResult({
        success: false,
        errors: ['Terjadi kesalahan saat menghitung. Silakan coba lagi.']
      })
    } finally {
      setLoading(false)
    }
  }, [formData])

  return (
    <>
      <Head>
        <title>Kalkulator Jepe - Web App</title>
        <meta name="description" content="Aplikasi dukun airdrop buat ngitung seberapa jepe airdrop kamu" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`min-h-screen transition-colors duration-300 ${
        darkMode 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
          : 'bg-gradient-to-br from-gray-50 to-gray-100'
      }`}>
        <div className="container mx-auto px-4 py-8">
          {/* Dark Mode Toggle */}
          <div className="flex justify-end mb-4">
            <button
              onClick={toggleDarkMode}
              className={`p-3 rounded-full transition-all duration-300 ${
                darkMode 
                  ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' 
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              } shadow-lg`}
              title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {darkMode ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>

          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 gradient-text">
              Kalkulator Jepe
            </h1>
            <p className={`text-xl ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
              Aplikasi dukun airdrop buat ngitung seberapa jepe airdrop kamu
            </p>
          </div>

          {/* Form */}
          <div className={`max-w-4xl mx-auto rounded-2xl shadow-xl p-8 mb-8 transition-colors duration-300 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-8">
                {/* Left Column - Token Info */}
                <div className="space-y-6">
                  <h3 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Info Token</h3>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Nama Token (Ticker)
                    </label>
                    <input
                      type="text"
                      name="tokenName"
                      value={formData.tokenName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-300 ${
                        darkMode 
                          ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' 
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                      placeholder="Contoh: BTC, ETH"
                      required
                    />
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Max Supply
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="totalSupply"
                      value={formData.totalSupply}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-300 ${
                        darkMode 
                          ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' 
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                      placeholder="Contoh: 1000000000"
                      required
                    />
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatNumber(formData.totalSupply)} token
                    </p>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Alokasi Kamu
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      name="userAllocation"
                      value={formData.userAllocation}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-300 ${
                        darkMode 
                          ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' 
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                      placeholder="Contoh: 10000"
                      required
                    />
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatNumber(formData.userAllocation)} token
                    </p>
                  </div>
                </div>

                {/* Right Column - Valuation */}
                <div className="space-y-6">
                  <h3 className={`text-2xl font-semibold mb-4 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>Target Valuasi</h3>
                  
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Mode Perhitungan
                    </label>
                    <select
                      name="calculationMode"
                      value={formData.calculationMode}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-300 ${
                        darkMode 
                          ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' 
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                    >
                      <option value="FDV">FDV (Fully Diluted Valuation)</option>
                      <option value="Market Cap">Market Cap</option>
                    </select>
                  </div>

                  <div>
                    <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      Target {formData.calculationMode} ($)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      name="targetValue"
                      value={formData.targetValue}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors duration-300 ${
                        darkMode 
                          ? 'border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400' 
                          : 'border-gray-300 bg-white text-gray-900'
                      }`}
                      placeholder="Contoh: 100000000"
                      required
                    />
                    <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatCurrency(formData.targetValue)}
                    </p>
                  </div>

                  {formData.calculationMode === 'Market Cap' && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                        Initial Supply
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        name="circulatingSupply"
                        value={formData.circulatingSupply}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                        style={{ 
                          color: '#1f2937 !important',
                          backgroundColor: 'white !important',
                          WebkitTextFillColor: '#1f2937 !important',
                          opacity: 1
                        }}
                        placeholder="Contoh: 200000000"
                        required
                      />
                      <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {formatNumber(formData.circulatingSupply)} token
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full gradient-bg-purple text-white font-bold py-4 px-8 rounded-lg text-lg shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Menghitung...' : 'Klik Untuk Menghitung'}
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
                  <div className="gradient-bg-green text-white p-8 rounded-2xl shadow-xl text-center">
                    <h2 className="text-3xl font-bold mb-4">
                      {formatCurrency(result.allocation_value!)}
                    </h2>
                    <p className="text-xl leading-relaxed">
                      {result.moonsheet?.message}
                    </p>
                  </div>

                  {/* Details */}
                  <div className={`rounded-2xl shadow-xl p-8 calculation-result transition-colors duration-300 ${
                    darkMode ? 'bg-gray-800 dark-mode' : 'bg-white'
                  }`}>
                    <h3 
                      className={`text-2xl font-bold mb-6 ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}
                      style={darkMode ? {
                        color: 'rgb(243, 244, 246) !important',
                        WebkitTextFillColor: 'rgb(243, 244, 246) !important'
                      } : {}}
                    >📋 Detail Perhitungan</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span 
                            className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                            style={darkMode ? {
                              color: 'rgb(209, 213, 219) !important',
                              WebkitTextFillColor: 'rgb(209, 213, 219) !important'
                            } : {}}
                          >Max Supply:</span>
                          <span 
                            className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}
                            style={darkMode ? {
                              color: 'rgb(243, 244, 246) !important',
                              WebkitTextFillColor: 'rgb(243, 244, 246) !important'
                            } : {}}
                          >{formatNumber(formData.totalSupply)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span 
                            className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                            style={darkMode ? {
                              color: 'rgb(209, 213, 219) !important',
                              WebkitTextFillColor: 'rgb(209, 213, 219) !important'
                            } : {}}
                          >Alokasi Kamu:</span>
                          <span 
                            className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}
                            style={darkMode ? {
                              color: 'rgb(243, 244, 246) !important',
                              WebkitTextFillColor: 'rgb(243, 244, 246) !important'
                            } : {}}
                          >{formatNumber(formData.userAllocation)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span 
                            className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                            style={darkMode ? {
                              color: 'rgb(209, 213, 219) !important',
                              WebkitTextFillColor: 'rgb(209, 213, 219) !important'
                            } : {}}
                          >Target {result.calculation_mode}:</span>
                          <span 
                            className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}
                            style={darkMode ? {
                              color: 'rgb(243, 244, 246) !important',
                              WebkitTextFillColor: 'rgb(243, 244, 246) !important'
                            } : {}}
                          >{formatCurrency(formData.targetValue)}</span>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span 
                            className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                            style={darkMode ? {
                              color: 'rgb(209, 213, 219) !important',
                              WebkitTextFillColor: 'rgb(209, 213, 219) !important'
                            } : {}}
                          >Harga per Token:</span>
                          <span 
                            className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}
                            style={darkMode ? {
                              color: 'rgb(243, 244, 246) !important',
                              WebkitTextFillColor: 'rgb(243, 244, 246) !important'
                            } : {}}
                          >{formatTokenPrice(result.token_price!)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span 
                            className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                            style={darkMode ? {
                              color: 'rgb(209, 213, 219) !important',
                              WebkitTextFillColor: 'rgb(209, 213, 219) !important'
                            } : {}}
                          >Nilai Alokasi:</span>
                          <span 
                            className={`font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}
                            style={darkMode ? {
                              color: 'rgb(52, 211, 153) !important',
                              WebkitTextFillColor: 'rgb(52, 211, 153) !important'
                            } : {}}
                          >{formatCurrency(result.allocation_value!)}</span>
                        </div>
                        {result.fdv_value && (
                          <div className="flex justify-between">
                            <span 
                              className={`font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}
                              style={darkMode ? {
                                color: 'rgb(209, 213, 219) !important',
                                WebkitTextFillColor: 'rgb(209, 213, 219) !important'
                              } : {}}
                            >FDV:</span>
                            <span 
                              className={`font-bold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}
                              style={darkMode ? {
                                color: 'rgb(243, 244, 246) !important',
                                WebkitTextFillColor: 'rgb(243, 244, 246) !important'
                              } : {}}
                            >{formatCurrency(result.fdv_value)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className={`rounded-2xl p-8 transition-colors duration-300 ${
                  darkMode 
                    ? 'bg-red-900/50 border border-red-800' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <h3 className={`text-xl font-bold mb-4 ${
                    darkMode ? 'text-red-300' : 'text-red-800'
                  }`}>❌ Ada yang salah nih!</h3>
                  <ul className="space-y-2">
                    {result.errors?.map((error, index) => (
                      <li key={index} className={darkMode ? 'text-red-400' : 'text-red-700'}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer */}
          <div className="max-w-4xl mx-auto mt-8">
            <div className={`rounded-2xl p-6 transition-colors duration-300 ${
              darkMode 
                ? 'bg-yellow-900/50 border border-yellow-800' 
                : 'bg-yellow-50 border border-yellow-200'
            }`}>
              <p className={darkMode ? 'text-yellow-300' : 'text-yellow-800'}>
                ⚠️ <strong>Disclaimer:</strong> Ini cuma estimasi berdasarkan data yang kamu masukin. 
                Harga token asli bisa beda jauh karena kondisi market dan faktor lainnya. 
                Jangan jadiin patokan, ya! 🙏
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className={`text-center mt-8 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <p>Dibuat dengan Next.js + FastAPI | Salam jepe! 🚀</p>
          </div>
        </div>
      </div>
    </>
  )
}