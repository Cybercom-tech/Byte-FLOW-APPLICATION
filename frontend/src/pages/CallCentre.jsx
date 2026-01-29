import { useState } from 'react'
import PageHeader from '../components/sections/PageHeader'
import CallCentreServices from '../components/sections/CallCentreServices'
import JobApplication from '../components/sections/JobApplication'
import ProjectHiring from '../components/sections/ProjectHiring'
import Contact from '../components/sections/Contact'

function CallCentre() {
  return (
    <>
      <PageHeader
        title="Call Centre Services"
        description="Professional 24/7 call centre services with multi-channel communication, advanced call routing, and real-time analytics. Our experienced team provides exceptional customer support around the clock."
        primaryButton={{ text: 'Call Centre Services', href: '#services' }}
        secondaryButton={{ text: 'Contact Us', href: '#contact' }}
      />
      <CallCentreServices />
      <JobApplication />
      <ProjectHiring />
      <Contact />
    </>
  )
}

export default CallCentre

