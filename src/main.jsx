import React from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'

function App(){
  return (
    <div className="app">
      <aside className="tracks">Track List (mock)</aside>
      <main className="workspace">Logic-like UI mockup placeholder</main>
      <section className="mixer">Mixer (mock)</section>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
