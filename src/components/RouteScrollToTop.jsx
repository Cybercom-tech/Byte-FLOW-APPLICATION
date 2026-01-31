import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

function RouteScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  return null
}

export default RouteScrollToTop


