import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import Header from './components/Header'

import BusinessList from './components/BusinessList'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <div>
        <Header/>
        <h1>Canna Hydro</h1>
      </div>
      
      <BusinessList />
    </>
  )
}

export default App
