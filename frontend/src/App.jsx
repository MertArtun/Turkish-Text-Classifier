import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = 'http://localhost:8000'

// Örnek metinler - farklı kategorilerden
const SAMPLE_TEXTS = {
  ekonomi: [
    "Merkez Bankası faiz kararını açıkladı. Ekonomik göstergeler olumlu sinyaller veriyor.",
    "Borsa İstanbul'da yükseliş trendi devam ediyor. Yatırımcılar temkinli yaklaşım sergiliyor.",
    "Enflasyon rakamları beklentilerin altında kaldı. Uzmanlar düşüş trendinin süreceğini öngörüyor."
  ],
  spor: [
    "Galatasaray Şampiyonlar Ligi'nde önemli bir galibiyete imza attı.",
    "Milli takım hazırlıklarına devam ediyor. Teknik direktör yeni taktikler deniyor.",
    "Transfer dönemi hareketli geçiyor. Büyük kulüpler önemli transferlere imza atıyor."
  ],
  teknoloji: [
    "Yapay zeka teknolojileri günlük hayatımızı değiştirmeye devam ediyor.",
    "Yeni mobil uygulama kullanıcılardan büyük ilgi görüyor. İndirme sayıları rekor kırıyor.",
    "Siber güvenlik önlemleri artırılıyor. Uzmanlar yeni tehditlere karşı uyarıda bulunuyor."
  ],
  siyaset: [
    "Cumhurbaşkanı önemli açıklamalarda bulundu. Yeni politikalar değerlendiriliyor.",
    "Meclis'te önemli bir tasarı görüşülüyor. Partiler farklı görüşler ortaya koyuyor.",
    "Yerel seçim hazırlıkları devam ediyor. Adaylar kampanyalarını yoğunlaştırıyor."
  ],
  saglik: [
    "Sağlık Bakanlığı yeni tedavi yöntemlerini açıkladı. Hasta memnuniyeti artıyor.",
    "Koronavirüs vaka sayıları düşüş gösteriyor. Uzmanlar normalleşme sürecini değerlendiriyor.",
    "Yeni hastane projeleri hayata geçiriliyor. Sağlık altyapısı güçleniyor."
  ]
}

const BATCH_SAMPLES = [
  "Merkez Bankası faiz kararını açıkladı.",
  "Galatasaray Şampiyonlar Ligi'nde galip geldi.",
  "Yapay zeka teknolojileri gelişiyor.",
  "Cumhurbaşkanı önemli açıklamalarda bulundu.",
  "Sağlık Bakanlığı yeni tedaviler açıkladı."
]

function App() {
  const [models, setModels] = useState([])
  const [selectedModel, setSelectedModel] = useState('bert512')
  const [text, setText] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [labels, setLabels] = useState([])
  const [compareMode, setCompareMode] = useState(false)
  const [secondModel, setSecondModel] = useState('modernbert2048')
  const [compareResults, setCompareResults] = useState(null)
  const [batchMode, setBatchMode] = useState(false)
  const [batchTexts, setBatchTexts] = useState('')
  const [batchResults, setBatchResults] = useState(null)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  // Modelleri yükle
  useEffect(() => {
    fetch(`${API_BASE}/models`)
      .then(res => res.json())
      .then(data => {
        setModels(data.models || [])
        if (data.models && data.models.length > 0) {
          setSelectedModel(data.models[0])
        }
      })
      .catch(err => {
        console.error('Modeller yüklenirken hata:', err)
        setError('Modeller yüklenemedi')
      })
  }, [])

  // Seçili model değiştiğinde label'ları yükle
  useEffect(() => {
    if (selectedModel) {
      fetch(`${API_BASE}/labels?model=${selectedModel}`)
        .then(res => res.json())
        .then(data => {
          setLabels(data.labels || [])
        })
        .catch(err => {
          console.error('Label\'lar yüklenirken hata:', err)
          setLabels([])
        })
    }
  }, [selectedModel])

  // Dark mode effect
  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
    if (darkMode) {
      document.body.classList.add('dark-mode')
    } else {
      document.body.classList.remove('dark-mode')
    }
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const handlePredict = async () => {
    // Input validation
    if (batchMode) {
      if (!batchTexts.trim()) {
        setError('Lütfen en az bir metin girin')
        return
      }
    } else {
      if (!text.trim()) {
        setError('Lütfen bir metin girin')
        return
      }
    }

    setLoading(true)
    setError(null)
    setResult(null)
    setCompareResults(null)
    setBatchResults(null)

    try {
      if (batchMode) {
        // Batch mode
        const textsArray = batchTexts.split('\n').filter(t => t.trim()).map(t => t.trim())
        
        if (textsArray.length === 0) {
          setError('Lütfen en az bir metin girin')
          setLoading(false)
          return
        }

        const response = await fetch(`${API_BASE}/predict/batch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            texts: textsArray,
            model: selectedModel
          })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        setBatchResults({
          texts: textsArray,
          results: data,
          model: selectedModel
        })
      } else if (compareMode) {
        // Karşılaştırma modu - iki modeli de çağır
        const [response1, response2] = await Promise.all([
          fetch(`${API_BASE}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, model: selectedModel })
          }),
          fetch(`${API_BASE}/predict`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: text, model: secondModel })
          })
        ])

        if (!response1.ok || !response2.ok) {
          throw new Error(`HTTP ${response1.status} / ${response2.status}`)
        }

        const [data1, data2] = await Promise.all([
          response1.json(),
          response2.json()
        ])

        setCompareResults({
          model1: { name: selectedModel, result: data1 },
          model2: { name: secondModel, result: data2 }
        })
      } else {
        // Normal mod - tek model
        const response = await fetch(`${API_BASE}/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text, model: selectedModel })
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()
        setResult(data)
      }
    } catch (err) {
      console.error('Tahmin hatası:', err)
      setError('Tahmin yapılırken hata oluştu: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setText('')
    setBatchTexts('')
    setResult(null)
    setCompareResults(null)
    setBatchResults(null)
    setError(null)
  }

  const handleSampleText = (category) => {
    const samples = SAMPLE_TEXTS[category]
    const randomSample = samples[Math.floor(Math.random() * samples.length)]
    
    if (batchMode) {
      setBatchTexts(BATCH_SAMPLES.join('\n'))
    } else {
      setText(randomSample)
    }
    
    // Sonuçları temizle
    setResult(null)
    setCompareResults(null)
    setBatchResults(null)
    setError(null)
  }

  const handleRandomSample = () => {
    const categories = Object.keys(SAMPLE_TEXTS)
    const randomCategory = categories[Math.floor(Math.random() * categories.length)]
    handleSampleText(randomCategory)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-text">
            <h1>🇹🇷 TR News Classifier</h1>
            <p>Türkçe haber metni sınıflandırması - BERT modelleri</p>
          </div>
          <button 
            onClick={toggleDarkMode}
            className="theme-toggle"
            aria-label="Tema değiştir"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>
        </div>
      </header>

      <main className="app-main">
        <div className="input-section">
          <div className="mode-toggles">
            <div className="mode-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={compareMode}
                  onChange={(e) => setCompareMode(e.target.checked)}
                  disabled={loading || batchMode}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">
                  {compareMode ? '⚖️ Karşılaştırma Modu' : '🔍 Tek Model Modu'}
                </span>
              </label>
            </div>
            
            <div className="mode-toggle">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={batchMode}
                  onChange={(e) => setBatchMode(e.target.checked)}
                  disabled={loading || compareMode}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">
                  {batchMode ? '📝 Toplu Tahmin' : '📄 Tek Metin'}
                </span>
              </label>
            </div>
          </div>

          <div className={`model-selectors ${compareMode ? 'compare-mode' : ''}`}>
            <div className="model-selector">
              <label htmlFor="model-select">
                {compareMode ? 'Model 1:' : 'Model Seçin:'}
              </label>
              <select 
                id="model-select"
                value={selectedModel} 
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={loading}
              >
                {models.map(model => (
                  <option key={model} value={model}>
                    {model.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {compareMode && (
              <div className="model-selector">
                <label htmlFor="model-select-2">Model 2:</label>
                <select 
                  id="model-select-2"
                  value={secondModel} 
                  onChange={(e) => setSecondModel(e.target.value)}
                  disabled={loading}
                >
                  {models.map(model => (
                    <option key={model} value={model}>
                      {model.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

                    <div className="text-input">
            <label htmlFor={batchMode ? "batch-text-area" : "text-area"}>
              {batchMode ? 'Metinleri Girin (her satırda bir metin):' : 'Metin Girin:'}
            </label>
            
            {batchMode ? (
              <textarea
                id="batch-text-area"
                value={batchTexts}
                onChange={(e) => setBatchTexts(e.target.value)}
                placeholder="Her satıra bir metin yazın:&#10;Merkez Bankası faiz kararını açıkladı.&#10;İstanbul'da trafik yoğunluğu devam ediyor.&#10;Yeni teknoloji şirketleri hızla büyüyor."
                rows={8}
                disabled={loading}
              />
            ) : (
              <textarea
                id="text-area"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Sınıflandırmak istediğiniz Türkçe haber metnini buraya yazın..."
                rows={6}
                disabled={loading}
              />
            )}
            
            <div className="char-count">
              {batchMode ? (
                <>
                  {batchTexts.split('\n').filter(t => t.trim()).length} metin, {batchTexts.length} karakter
                </>
              ) : (
                <>
                  {text.length} karakter
                </>
              )}
            </div>
          </div>

          <div className="sample-texts">
            <h4>💡 Hızlı Test için Örnek Metinler:</h4>
            <div className="sample-buttons">
              <button 
                onClick={() => handleSampleText('ekonomi')}
                disabled={loading}
                className="sample-btn ekonomi"
              >
                💰 Ekonomi
              </button>
              <button 
                onClick={() => handleSampleText('spor')}
                disabled={loading}
                className="sample-btn spor"
              >
                ⚽ Spor
              </button>
              <button 
                onClick={() => handleSampleText('teknoloji')}
                disabled={loading}
                className="sample-btn teknoloji"
              >
                💻 Teknoloji
              </button>
              <button 
                onClick={() => handleSampleText('siyaset')}
                disabled={loading}
                className="sample-btn siyaset"
              >
                🏛️ Siyaset
              </button>
              <button 
                onClick={() => handleSampleText('saglik')}
                disabled={loading}
                className="sample-btn saglik"
              >
                🏥 Sağlık
              </button>
              <button 
                onClick={handleRandomSample}
                disabled={loading}
                className="sample-btn random"
              >
                🎲 Rastgele
              </button>
            </div>
            <p className="sample-hint">
              {batchMode 
                ? "Butona tıklayarak örnek metinleri toplu test için yükleyin"
                : "Butona tıklayarak o kategoriden rastgele bir örnek metin yükleyin"
              }
            </p>
          </div>

          <div className="buttons">
            <button 
              onClick={handlePredict} 
              disabled={loading || (batchMode ? !batchTexts.trim() : !text.trim())}
              className="predict-btn"
            >
              {loading ? '⏳ Analiz Ediliyor...' : (batchMode ? '📊 Toplu Tahmin Et' : '🔍 Tahmin Et')}
            </button>
            <button 
              onClick={handleClear} 
              disabled={loading}
              className="clear-btn"
            >
              🗑️ Temizle
        </button>
          </div>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        {result && !compareMode && (
          <div className="result-section">
            <h3>📊 Tahmin Sonucu</h3>
            <div className="result-card">
              <div className="main-result">
                <div className="label">
                  <strong>Kategori:</strong> {result.label}
                </div>
                <div className="score">
                  <strong>Güven:</strong> {(result.score * 100).toFixed(1)}%
                </div>
              </div>
              
              {result.probs && (
                <div className="probabilities">
                  <h4>🏆 Top Kategoriler:</h4>
                  <div className="prob-bars">
                    {result.probs
                      .map((prob, index) => ({
                        prob,
                        index,
                        label: labels[index] || `Kategori ${index}`
                      }))
                      .sort((a, b) => b.prob - a.prob)
                      .slice(0, 5)
                      .map(({ prob, index, label }, rank) => (
                        <div key={index} className={`prob-item ${rank === 0 ? 'top-prediction' : ''}`}>
                          <div className="prob-label">
                            <span className="rank-badge">#{rank + 1}</span>
                            <span className="label-text">{label}</span>
                          </div>
                          <div className="prob-bar">
                            <div 
                              className="prob-fill"
                              style={{ width: `${prob * 100}%` }}
                            ></div>
                            <span className="prob-value">
                              {(prob * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {compareResults && compareMode && (
          <div className="compare-section">
            <h3>⚖️ Model Karşılaştırması</h3>
            <div className="compare-grid">
              <div className="compare-card">
                <h4>🔵 {compareResults.model1.name.toUpperCase()}</h4>
                <div className="main-result">
                  <div className="label">
                    <strong>Kategori:</strong> {compareResults.model1.result.label}
                  </div>
                  <div className="score">
                    <strong>Güven:</strong> {(compareResults.model1.result.score * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="probabilities">
                  <div className="prob-bars">
                    {compareResults.model1.result.probs
                      ?.map((prob, index) => ({
                        prob,
                        index,
                        label: labels[index] || `Kategori ${index}`
                      }))
                      .sort((a, b) => b.prob - a.prob)
                      .slice(0, 3)
                      .map(({ prob, index, label }, rank) => (
                        <div key={index} className={`prob-item ${rank === 0 ? 'top-prediction' : ''}`}>
                          <div className="prob-label">
                            <span className="rank-badge">#{rank + 1}</span>
                            <span className="label-text">{label}</span>
                          </div>
                          <div className="prob-bar">
                            <div 
                              className="prob-fill"
                              style={{ width: `${prob * 100}%` }}
                            ></div>
                            <span className="prob-value">
                              {(prob * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="vs-divider">
                <span>VS</span>
              </div>

              <div className="compare-card">
                <h4>🔴 {compareResults.model2.name.toUpperCase()}</h4>
                <div className="main-result">
                  <div className="label">
                    <strong>Kategori:</strong> {compareResults.model2.result.label}
                  </div>
                  <div className="score">
                    <strong>Güven:</strong> {(compareResults.model2.result.score * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="probabilities">
                  <div className="prob-bars">
                    {compareResults.model2.result.probs
                      ?.map((prob, index) => ({
                        prob,
                        index,
                        label: labels[index] || `Kategori ${index}`
                      }))
                      .sort((a, b) => b.prob - a.prob)
                      .slice(0, 3)
                      .map(({ prob, index, label }, rank) => (
                        <div key={index} className={`prob-item ${rank === 0 ? 'top-prediction' : ''}`}>
                          <div className="prob-label">
                            <span className="rank-badge">#{rank + 1}</span>
                            <span className="label-text">{label}</span>
                          </div>
                          <div className="prob-bar">
                            <div 
                              className="prob-fill"
                              style={{ width: `${prob * 100}%` }}
                            ></div>
                            <span className="prob-value">
                              {(prob * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="winner-announcement">
              {compareResults.model1.result.score > compareResults.model2.result.score ? (
                <div className="winner">
                  🏆 <strong>{compareResults.model1.name.toUpperCase()}</strong> daha emin! 
                  ({((compareResults.model1.result.score - compareResults.model2.result.score) * 100).toFixed(1)}% fark)
                </div>
              ) : compareResults.model2.result.score > compareResults.model1.result.score ? (
                <div className="winner">
                  🏆 <strong>{compareResults.model2.name.toUpperCase()}</strong> daha emin! 
                  ({((compareResults.model2.result.score - compareResults.model1.result.score) * 100).toFixed(1)}% fark)
                </div>
              ) : (
                <div className="tie">🤝 İki model de eşit güvende!</div>
              )}
            </div>
          </div>
        )}

        {batchResults && batchMode && (
          <div className="batch-section">
            <h3>📊 Toplu Tahmin Sonuçları</h3>
            <div className="batch-summary">
              <div className="summary-stats">
                <div className="stat-item">
                  <span className="stat-label">Toplam Metin:</span>
                  <span className="stat-value">{batchResults.texts.length}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Model:</span>
                  <span className="stat-value">{batchResults.model.toUpperCase()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Ortalama Güven:</span>
                  <span className="stat-value">
                    {(batchResults.results.reduce((sum, r) => sum + r.score, 0) / batchResults.results.length * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="batch-results-table">
              <div className="table-header">
                <div className="header-cell">Metin</div>
                <div className="header-cell">Kategori</div>
                <div className="header-cell">Güven</div>
                <div className="header-cell">Top-3</div>
              </div>
              
              {batchResults.texts.map((textItem, index) => {
                const result = batchResults.results[index]
                const topProbs = result.probs
                  ?.map((prob, idx) => ({
                    prob,
                    label: labels[idx] || `Kategori ${idx}`
                  }))
                  .sort((a, b) => b.prob - a.prob)
                  .slice(0, 3) || []

                return (
                  <div key={index} className="table-row">
                    <div className="cell text-cell">
                      <span className="text-preview">
                        {textItem.length > 60 ? textItem.substring(0, 60) + '...' : textItem}
                      </span>
                    </div>
                    <div className="cell category-cell">
                      <span className="category-badge">
                        {result.label}
                      </span>
                    </div>
                    <div className="cell score-cell">
                      <span className={`score-badge ${result.score > 0.8 ? 'high' : result.score > 0.6 ? 'medium' : 'low'}`}>
                        {(result.score * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="cell probs-cell">
                      <div className="mini-probs">
                        {topProbs.map((item, idx) => (
                          <div key={idx} className="mini-prob-item">
                            <span className="mini-prob-label">{item.label}</span>
                            <span className="mini-prob-value">{(item.prob * 100).toFixed(0)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="category-distribution">
              <h4>📈 Kategori Dağılımı</h4>
              <div className="distribution-chart">
                {(() => {
                  const categoryCount = {}
                  batchResults.results.forEach(result => {
                    categoryCount[result.label] = (categoryCount[result.label] || 0) + 1
                  })
                  
                  return Object.entries(categoryCount)
                    .sort(([,a], [,b]) => b - a)
                    .map(([category, count]) => (
                      <div key={category} className="distribution-item">
                        <div className="distribution-label">{category}</div>
                        <div className="distribution-bar">
                          <div 
                            className="distribution-fill"
                            style={{ width: `${(count / batchResults.texts.length) * 100}%` }}
                          ></div>
                          <span className="distribution-count">{count} ({((count / batchResults.texts.length) * 100).toFixed(0)}%)</span>
                        </div>
                      </div>
                    ))
                })()}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Powered by FastAPI + Transformers + React</p>
      </footer>
      </div>
  )
}

export default App