import { useEffect, useState } from 'react'

function Preloader() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 200)

    return () => clearTimeout(timer)
  }, [])

  if (!isLoading) return null

  return <div id="preloader"></div>
}

export default Preloader

