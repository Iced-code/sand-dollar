import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

import UserStatus from './components/UserStatus'
import Dashboard from './components/Dashboard'

function App() {
  return <Dashboard />
  /* return (
    <div>
      <h1>Sand Dollar</h1>
      <UserStatus />
    </div>
  ); */
}

export default App
