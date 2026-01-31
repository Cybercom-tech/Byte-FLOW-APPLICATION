import { useEffect, useCallback } from 'react'

// Debounce utility
const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
import Hero from '../components/sections/Hero'
import About from '../components/sections/About'
import Features from '../components/sections/Features'
import Services from '../components/sections/Services'
import FAQ from '../components/sections/FAQ'
import Contact from '../components/sections/Contact'

function Home() {
  useEffect(() => {
    // Initialize PureCounter
    const initPureCounter = () => {
      const counters = document.querySelectorAll('.purecounter')
      counters.forEach(counter => {
        const end = parseInt(counter.getAttribute('data-purecounter-end')) || 0
        const duration = parseInt(counter.getAttribute('data-purecounter-duration')) || 1
        const start = parseInt(counter.getAttribute('data-purecounter-start')) || 0
        const increment = (end - start) / (duration * 60)
        let current = start
        
        const timer = setInterval(() => {
          current += increment
          if (current >= end) {
            counter.textContent = end
            clearInterval(timer)
          } else {
            counter.textContent = Math.floor(current)
          }
        }, 1000 / 60)
      })
    }

    // Initialize PureCounter using the vendor script or fallback
    const script = document.createElement('script')
    script.src = '/assets/vendor/purecounter/purecounter_vanilla.js'
    script.onload = () => {
      if (window.PureCounter) {
        new window.PureCounter()
      } else {
        initPureCounter()
      }
    }
    script.onerror = () => {
      // Fallback to manual implementation if script fails to load
      initPureCounter()
    }
    document.body.appendChild(script)
    
    return () => {
      // Cleanup
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }

    // Handle hash navigation
    const handleHashNavigation = () => {
      if (window.location.hash) {
        setTimeout(() => {
          const element = document.querySelector(window.location.hash)
          if (element) {
            const scrollMarginTop = window.getComputedStyle(element).scrollMarginTop
            window.scrollTo({
              top: element.offsetTop - parseInt(scrollMarginTop) || 0,
              behavior: 'smooth'
            })
          }
        }, 100)
      }
    }

    handleHashNavigation()
    
    // Listen for hash changes
    window.addEventListener('hashchange', handleHashNavigation)

    // Navmenu Scrollspy - debounced for better performance
    const handleScroll = debounce(() => {
      const navLinks = document.querySelectorAll('.navmenu a')
      const scrollPosition = window.scrollY + 200

      navLinks.forEach(link => {
        if (!link.hash) return
        const section = document.querySelector(link.hash)
        if (!section) return

        const sectionTop = section.offsetTop
        const sectionHeight = section.offsetHeight

        if (scrollPosition >= sectionTop && scrollPosition <= sectionTop + sectionHeight) {
          navLinks.forEach(l => l.classList.remove('active'))
          link.classList.add('active')
        }
      })
    }, 100) // Debounce scroll handler

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <Hero />
      <About />
      <Features />
      <Services />
      <FAQ />
      <Contact />
    </>
  )
}

export default Home

