import React from 'react'
import ReactDOM from 'react-dom/client'
import App,{ErrorBoundary} from './App.jsx'
import HybridApp from './HybridApp.jsx'
// ?legacy=1 renders the original production UI; default is the v5 hybrid build (hybrid-ui branch only).
const useLegacy=new URLSearchParams(window.location.search).has('legacy')
const Root=useLegacy?App:HybridApp
ReactDOM.createRoot(document.getElementById('root')).render(<React.StrictMode><ErrorBoundary><Root/></ErrorBoundary></React.StrictMode>)
