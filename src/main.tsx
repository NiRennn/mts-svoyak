import { createRoot } from 'react-dom/client'
import './index.scss'
import App from './App.tsx'
import { initTelegramPlatformAndSafeArea } from './utils/telegramPlatform.ts'

initTelegramPlatformAndSafeArea();

createRoot(document.getElementById('root')!).render(
    <App />
)
