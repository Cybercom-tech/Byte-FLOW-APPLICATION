// Shared course data with detailed information
export const coursesData = [
  { 
    id: 1, 
    title: 'Artificial Intelligence', 
    level: 'Advanced', 
    category: 'Artificial Intelligence', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 2500,
    badge: 'Bestseller',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop',
    price: 8999,
    originalPrice: 14999,
    description: 'This AI course covers fundamental concepts and advanced techniques, including neural networks and machine learning algorithms. Students will engage with real-world case studies and hands-on projects, providing practical experience and deepening their understanding of AI applications and technologies.',
    learnings: [
      'Master AI fundamentals and advanced techniques',
      'Understand neural networks and machine learning algorithms',
      'Build real-world AI applications',
      'Work with popular AI frameworks and tools',
      'Implement deep learning models'
    ],
    sections: [
      { 
        title: 'Introduction to AI', 
        lectures: 5, 
        duration: '45min',
        items: [
          { title: 'What is Artificial Intelligence?', duration: '10:30', type: 'video' },
          { title: 'History of AI', duration: '8:15', type: 'video' },
          { title: 'AI Applications in Real World', duration: '12:45', type: 'video' },
          { title: 'Introduction Quiz', duration: '10:00', type: 'quiz' },
          { title: 'Resources and Materials', duration: '3:30', type: 'resource' }
        ]
      },
      { 
        title: 'Machine Learning Basics', 
        lectures: 8, 
        duration: '90min',
        items: [
          { title: 'Introduction to Machine Learning', duration: '12:20', type: 'video' },
          { title: 'Supervised Learning', duration: '15:45', type: 'video' },
          { title: 'Unsupervised Learning', duration: '12:30', type: 'video' },
          { title: 'Reinforcement Learning', duration: '10:15', type: 'video' },
          { title: 'ML Algorithms Overview', duration: '18:30', type: 'video' },
          { title: 'Hands-on Practice', duration: '15:20', type: 'video' },
          { title: 'Machine Learning Quiz', duration: '5:00', type: 'quiz' },
          { title: 'Assignment: Build Your First Model', duration: '3:00', type: 'assignment' }
        ]
      },
      { 
        title: 'Neural Networks', 
        lectures: 10, 
        duration: '120min',
        items: [
          { title: 'Introduction to Neural Networks', duration: '15:30', type: 'video' },
          { title: 'Neuron Structure', duration: '12:15', type: 'video' },
          { title: 'Activation Functions', duration: '10:45', type: 'video' },
          { title: 'Backpropagation', duration: '18:20', type: 'video' },
          { title: 'Deep Neural Networks', duration: '15:10', type: 'video' },
          { title: 'Convolutional Neural Networks', duration: '20:30', type: 'video' },
          { title: 'Recurrent Neural Networks', duration: '15:25', type: 'video' },
          { title: 'Practical Implementation', duration: '10:15', type: 'video' },
          { title: 'Neural Networks Quiz', duration: '3:00', type: 'quiz' },
          { title: 'Project: Image Classification', duration: '2:00', type: 'assignment' }
        ]
      },
      { 
        title: 'Deep Learning', 
        lectures: 12, 
        duration: '150min',
        items: [
          { title: 'Deep Learning Fundamentals', duration: '15:45', type: 'video' },
          { title: 'TensorFlow Introduction', duration: '12:30', type: 'video' },
          { title: 'PyTorch Basics', duration: '12:15', type: 'video' },
          { title: 'Building Deep Learning Models', duration: '20:20', type: 'video' },
          { title: 'Training Deep Networks', duration: '18:45', type: 'video' },
          { title: 'Optimization Techniques', duration: '15:30', type: 'video' },
          { title: 'Regularization Methods', duration: '12:10', type: 'video' },
          { title: 'Transfer Learning', duration: '15:25', type: 'video' },
          { title: 'Advanced Architectures', duration: '18:15', type: 'video' },
          { title: 'Real-world Applications', duration: '10:30', type: 'video' },
          { title: 'Deep Learning Quiz', duration: '5:00', type: 'quiz' },
          { title: 'Final Project', duration: '8:00', type: 'assignment' }
        ]
      },
      { 
        title: 'AI Applications', 
        lectures: 7, 
        duration: '85min',
        items: [
          { title: 'Natural Language Processing', duration: '15:30', type: 'video' },
          { title: 'Computer Vision', duration: '12:45', type: 'video' },
          { title: 'Speech Recognition', duration: '10:20', type: 'video' },
          { title: 'Robotics and AI', duration: '15:15', type: 'video' },
          { title: 'AI in Healthcare', duration: '12:30', type: 'video' },
          { title: 'AI in Business', duration: '15:40', type: 'video' },
          { title: 'Course Conclusion', duration: '6:20', type: 'video' }
        ]
      }
    ],
    totalLectures: 42,
    totalDuration: '9hr 30min',
    lastUpdated: '2025-01-15',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'Basic programming knowledge (Python recommended)',
      'Understanding of mathematics and statistics',
      'A computer with internet access',
      'Willingness to learn and practice'
    ],
    fullDescription: 'This comprehensive AI course is designed for both beginners and intermediate learners who want to master artificial intelligence. You will start with the fundamentals and progress to advanced topics including neural networks, deep learning, and real-world AI applications. The course includes hands-on projects, case studies, and practical exercises to ensure you gain real-world skills.'
  },
  { 
    id: 2, 
    title: 'Big Data Analytics', 
    level: 'Intermediate', 
    category: 'Data Science', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 5432,
    badge: null,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
    price: 7999,
    originalPrice: 12999,
    description: 'This Big Data Analytics course introduces core concepts and advanced techniques for analyzing large datasets. Participants will explore real-world case studies and engage in hands-on projects, gaining practical skills in data processing, visualization, and deriving actionable insights from complex data sources.',
    learnings: [
      'Master Big Data Analytics concepts and techniques',
      'Learn data processing and visualization',
      'Analyze large datasets effectively',
      'Use popular Big Data tools and frameworks',
      'Derive actionable insights from complex data'
    ],
    sections: [
      { 
        title: 'Introduction to Big Data', 
        lectures: 6, 
        duration: '50min',
        items: [
          { title: 'What is Big Data?', duration: '8:15', type: 'video' },
          { title: 'Big Data Characteristics', duration: '7:30', type: 'video' },
          { title: 'Big Data Technologies Overview', duration: '10:20', type: 'video' },
          { title: 'Hadoop Ecosystem', duration: '12:45', type: 'video' },
          { title: 'Introduction Quiz', duration: '8:00', type: 'quiz' },
          { title: 'Resources and Setup', duration: '3:50', type: 'resource' }
        ]
      },
      { 
        title: 'Data Processing', 
        lectures: 8, 
        duration: '95min',
        items: [
          { title: 'Data Collection Methods', duration: '11:20', type: 'video' },
          { title: 'Data Cleaning Techniques', duration: '13:15', type: 'video' },
          { title: 'ETL Processes', duration: '12:30', type: 'video' },
          { title: 'MapReduce Fundamentals', duration: '15:45', type: 'video' },
          { title: 'Spark Processing', duration: '14:20', type: 'video' },
          { title: 'Stream Processing', duration: '12:10', type: 'video' },
          { title: 'Data Processing Quiz', duration: '10:00', type: 'quiz' },
          { title: 'Hands-on Exercise', duration: '6:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Data Visualization', 
        lectures: 7, 
        duration: '80min',
        items: [
          { title: 'Visualization Principles', duration: '10:30', type: 'video' },
          { title: 'Creating Charts and Graphs', duration: '12:15', type: 'video' },
          { title: 'Dashboard Design', duration: '11:45', type: 'video' },
          { title: 'Interactive Visualizations', duration: '13:20', type: 'video' },
          { title: 'Tools: Tableau and Power BI', duration: '14:30', type: 'video' },
          { title: 'Visualization Best Practices', duration: '10:40', type: 'video' },
          { title: 'Visualization Project', duration: '7:00', type: 'assignment' }
        ]
      },
      { 
        title: 'Advanced Analytics', 
        lectures: 9, 
        duration: '110min',
        items: [
          { title: 'Predictive Analytics', duration: '13:15', type: 'video' },
          { title: 'Machine Learning for Big Data', duration: '14:20', type: 'video' },
          { title: 'Statistical Analysis', duration: '12:30', type: 'video' },
          { title: 'Time Series Analysis', duration: '11:45', type: 'video' },
          { title: 'Clustering and Classification', duration: '13:50', type: 'video' },
          { title: 'Text Analytics', duration: '12:15', type: 'video' },
          { title: 'Real-time Analytics', duration: '11:30', type: 'video' },
          { title: 'Advanced Analytics Quiz', duration: '15:00', type: 'quiz' },
          { title: 'Analytics Case Study', duration: '6:15', type: 'assignment' }
        ]
      },
      { 
        title: 'Real-world Projects', 
        lectures: 6, 
        duration: '75min',
        items: [
          { title: 'Project 1: E-commerce Analytics', duration: '14:20', type: 'video' },
          { title: 'Project 2: Social Media Analysis', duration: '13:45', type: 'video' },
          { title: 'Project 3: Financial Data Analysis', duration: '15:30', type: 'video' },
          { title: 'Project 4: IoT Data Processing', duration: '12:15', type: 'video' },
          { title: 'Final Project Guidance', duration: '11:50', type: 'video' },
          { title: 'Course Completion', duration: '7:20', type: 'video' }
        ]
      }
    ],
    totalLectures: 36,
    totalDuration: '8hr 10min',
    lastUpdated: '2025-01-10',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'Basic knowledge of data analysis',
      'Familiarity with Python or R',
      'A computer with internet access',
      'Interest in data-driven decision making'
    ],
    fullDescription: 'Learn how to analyze and process large datasets using modern Big Data tools and techniques. This course covers everything from data collection to advanced analytics, helping you become proficient in Big Data Analytics.'
  },
  { 
    id: 3, 
    title: '3D Animations, VR & Simulation', 
    level: 'Intermediate', 
    category: 'Animation & VR', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 890,
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=250&fit=crop',
    price: 8499,
    originalPrice: 13999,
    description: 'This course on 3D Animations, VR, and Simulation covers essential techniques for creating immersive digital experiences. Participants will explore advanced 3D modeling, animation, and virtual reality technologies, supported by real-world case studies and hands-on projects to develop skills in designing and implementing engaging simulations and interactive environments.',
    learnings: [
      'Master 3D modeling and animation techniques',
      'Create immersive VR experiences',
      'Build interactive simulations',
      'Use industry-standard 3D software',
      'Design engaging virtual environments'
    ],
    sections: [
      { 
        title: '3D Modeling Basics', 
        lectures: 7, 
        duration: '60min',
        items: [
          { title: 'Introduction to 3D Modeling', duration: '8:30', type: 'video' },
          { title: '3D Software Overview', duration: '7:15', type: 'video' },
          { title: 'Basic Shapes and Primitives', duration: '9:20', type: 'video' },
          { title: 'Modeling Techniques', duration: '11:45', type: 'video' },
          { title: 'Texturing Basics', duration: '10:30', type: 'video' },
          { title: 'Lighting Fundamentals', duration: '8:40', type: 'video' },
          { title: '3D Modeling Exercise', duration: '4:40', type: 'assignment' }
        ]
      },
      { 
        title: 'Animation Techniques', 
        lectures: 9, 
        duration: '100min',
        items: [
          { title: 'Animation Principles', duration: '12:15', type: 'video' },
          { title: 'Keyframe Animation', duration: '11:30', type: 'video' },
          { title: 'Character Animation', duration: '13:20', type: 'video' },
          { title: 'Motion Graphics', duration: '10:45', type: 'video' },
          { title: 'Rigging and Skinning', duration: '12:50', type: 'video' },
          { title: 'Animation Timing', duration: '9:30', type: 'video' },
          { title: 'Particle Systems', duration: '11:15', type: 'video' },
          { title: 'Animation Quiz', duration: '10:00', type: 'quiz' },
          { title: 'Animation Project', duration: '9:15', type: 'assignment' }
        ]
      },
      { 
        title: 'VR Development', 
        lectures: 8, 
        duration: '90min',
        items: [
          { title: 'VR Fundamentals', duration: '10:20', type: 'video' },
          { title: 'VR Hardware Overview', duration: '9:15', type: 'video' },
          { title: 'Unity VR Setup', duration: '12:30', type: 'video' },
          { title: 'VR Interactions', duration: '11:45', type: 'video' },
          { title: 'VR Navigation', duration: '10:50', type: 'video' },
          { title: 'VR UI/UX Design', duration: '12:20', type: 'video' },
          { title: 'VR Performance Optimization', duration: '11:10', type: 'video' },
          { title: 'VR Project', duration: '11:30', type: 'assignment' }
        ]
      },
      { 
        title: 'Simulation Design', 
        lectures: 6, 
        duration: '70min',
        items: [
          { title: 'Simulation Concepts', duration: '11:20', type: 'video' },
          { title: 'Physics Simulations', duration: '12:45', type: 'video' },
          { title: 'Environmental Simulations', duration: '11:30', type: 'video' },
          { title: 'Real-time Simulations', duration: '13:15', type: 'video' },
          { title: 'Simulation Tools', duration: '10:40', type: 'video' },
          { title: 'Simulation Project', duration: '10:30', type: 'assignment' }
        ]
      },
      { 
        title: 'Advanced Projects', 
        lectures: 5, 
        duration: '65min',
        items: [
          { title: 'Project 1: 3D Game Environment', duration: '14:20', type: 'video' },
          { title: 'Project 2: Animated Short Film', duration: '13:45', type: 'video' },
          { title: 'Project 3: VR Experience', duration: '15:30', type: 'video' },
          { title: 'Project 4: Simulation Scene', duration: '12:15', type: 'video' },
          { title: 'Portfolio Presentation', duration: '9:10', type: 'video' }
        ]
      }
    ],
    totalLectures: 35,
    totalDuration: '7hr 25min',
    lastUpdated: '2025-01-08',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'Basic computer skills',
      'Creative mindset',
      'A computer with graphics capabilities',
      'VR headset (optional but recommended)'
    ],
    fullDescription: 'Dive into the world of 3D animations, virtual reality, and simulations. This course teaches you how to create stunning 3D models, animate them, and build immersive VR experiences.'
  },
  { 
    id: 4, 
    title: 'Ethical Hacking: Beginner to Advanced', 
    level: 'Intermediate', 
    category: 'Cybersecurity', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 890,
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=250&fit=crop',
    price: 9499,
    originalPrice: 15999,
    description: 'Learn the fundamentals of ethical hacking and penetration testing from scratch. This Cyber Security course covers essential principles and advanced techniques for protecting digital assets. Participants will study threat detection, risk management, and defensive strategies through real-world case studies and hands-on projects.',
    learnings: [
      'Master ethical hacking techniques',
      'Learn penetration testing methodologies',
      'Understand cybersecurity fundamentals',
      'Identify and mitigate security threats',
      'Protect digital assets effectively'
    ],
    sections: [
      { 
        title: 'Ethical Hacking Basics', 
        lectures: 6, 
        duration: '55min',
        items: [
          { title: 'Introduction to Ethical Hacking', duration: '9:15', type: 'video' },
          { title: 'Legal and Ethical Framework', duration: '8:30', type: 'video' },
          { title: 'Hacking Methodologies', duration: '10:20', type: 'video' },
          { title: 'Information Gathering', duration: '9:45', type: 'video' },
          { title: 'Vulnerability Assessment', duration: '10:50', type: 'video' },
          { title: 'Ethics and Legal Quiz', duration: '6:20', type: 'quiz' }
        ]
      },
      { 
        title: 'Network Security', 
        lectures: 8, 
        duration: '95min',
        items: [
          { title: 'Network Fundamentals', duration: '11:30', type: 'video' },
          { title: 'Network Scanning', duration: '12:15', type: 'video' },
          { title: 'Firewall Configuration', duration: '10:45', type: 'video' },
          { title: 'Intrusion Detection Systems', duration: '11:20', type: 'video' },
          { title: 'VPN and Secure Communication', duration: '13:30', type: 'video' },
          { title: 'Wireless Security', duration: '12:40', type: 'video' },
          { title: 'Network Security Quiz', duration: '10:00', type: 'quiz' },
          { title: 'Network Security Lab', duration: '13:00', type: 'assignment' }
        ]
      },
      { 
        title: 'Penetration Testing', 
        lectures: 10, 
        duration: '120min',
        items: [
          { title: 'Penetration Testing Overview', duration: '11:15', type: 'video' },
          { title: 'Reconnaissance Techniques', duration: '12:30', type: 'video' },
          { title: 'Scanning and Enumeration', duration: '13:20', type: 'video' },
          { title: 'Exploitation Methods', duration: '14:45', type: 'video' },
          { title: 'Post-Exploitation', duration: '12:15', type: 'video' },
          { title: 'Privilege Escalation', duration: '11:30', type: 'video' },
          { title: 'Maintaining Access', duration: '10:20', type: 'video' },
          { title: 'Reporting and Documentation', duration: '9:45', type: 'video' },
          { title: 'Penetration Testing Quiz', duration: '12:00', type: 'quiz' },
          { title: 'Penetration Test Project', duration: '13:00', type: 'assignment' }
        ]
      },
      { 
        title: 'Web Application Security', 
        lectures: 7, 
        duration: '85min',
        items: [
          { title: 'Web Application Vulnerabilities', duration: '12:20', type: 'video' },
          { title: 'SQL Injection', duration: '13:45', type: 'video' },
          { title: 'Cross-Site Scripting (XSS)', duration: '12:30', type: 'video' },
          { title: 'Authentication and Session Management', duration: '11:15', type: 'video' },
          { title: 'OWASP Top 10', duration: '14:20', type: 'video' },
          { title: 'Web Security Tools', duration: '10:30', type: 'video' },
          { title: 'Web Security Project', duration: '10:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Advanced Techniques', 
        lectures: 9, 
        duration: '110min',
        items: [
          { title: 'Advanced Exploitation', duration: '13:15', type: 'video' },
          { title: 'Social Engineering', duration: '12:30', type: 'video' },
          { title: 'Malware Analysis', duration: '14:20', type: 'video' },
          { title: 'Cryptography for Security', duration: '11:45', type: 'video' },
          { title: 'Incident Response', duration: '13:30', type: 'video' },
          { title: 'Forensics Basics', duration: '12:15', type: 'video' },
          { title: 'Security Architecture', duration: '11:20', type: 'video' },
          { title: 'Advanced Security Quiz', duration: '15:00', type: 'quiz' },
          { title: 'Final Security Project', duration: '6:05', type: 'assignment' }
        ]
      }
    ],
    totalLectures: 40,
    totalDuration: '9hr 5min',
    lastUpdated: '2025-01-12',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'Basic computer and networking knowledge',
      'Understanding of operating systems',
      'A computer with internet access',
      'Ethical mindset and legal awareness'
    ],
    fullDescription: 'Learn ethical hacking from scratch and become a cybersecurity expert. This course covers everything from basic security concepts to advanced penetration testing techniques.'
  },
  { 
    id: 5, 
    title: 'Digital Marketing and SEO', 
    level: 'Beginner', 
    category: 'Marketing', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 2100,
    badge: null,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
    price: 5999,
    originalPrice: 9999,
    description: 'This Digital Marketing and SEO course covers key strategies for online visibility and engagement. Participants will explore advanced techniques in search engine optimization, content marketing, and data analytics through real-world case studies and hands-on projects, equipping them with practical skills to enhance digital presence and drive traffic.',
    learnings: [
      'Master digital marketing strategies',
      'Learn SEO techniques and best practices',
      'Understand content marketing',
      'Use analytics to measure success',
      'Drive traffic and engagement'
    ],
    sections: [
      { 
        title: 'Digital Marketing Fundamentals', 
        lectures: 5, 
        duration: '45min',
        items: [
          { title: 'Introduction to Digital Marketing', duration: '9:15', type: 'video' },
          { title: 'Digital Marketing Channels', duration: '8:30', type: 'video' },
          { title: 'Marketing Strategy Development', duration: '10:20', type: 'video' },
          { title: 'Target Audience Analysis', duration: '9:45', type: 'video' },
          { title: 'Fundamentals Quiz', duration: '7:10', type: 'quiz' }
        ]
      },
      { 
        title: 'SEO Basics', 
        lectures: 7, 
        duration: '70min',
        items: [
          { title: 'SEO Fundamentals', duration: '10:30', type: 'video' },
          { title: 'Keyword Research', duration: '11:15', type: 'video' },
          { title: 'On-Page SEO', duration: '10:45', type: 'video' },
          { title: 'Off-Page SEO', duration: '9:30', type: 'video' },
          { title: 'Technical SEO', duration: '11:20', type: 'video' },
          { title: 'SEO Tools and Analytics', duration: '9:15', type: 'video' },
          { title: 'SEO Practice Exercise', duration: '8:05', type: 'assignment' }
        ]
      },
      { 
        title: 'Content Marketing', 
        lectures: 6, 
        duration: '60min',
        items: [
          { title: 'Content Strategy', duration: '10:20', type: 'video' },
          { title: 'Content Creation', duration: '11:30', type: 'video' },
          { title: 'Blog Writing', duration: '9:45', type: 'video' },
          { title: 'Video Content', duration: '10:15', type: 'video' },
          { title: 'Content Distribution', duration: '9:30', type: 'video' },
          { title: 'Content Marketing Project', duration: '9:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Social Media Marketing', 
        lectures: 5, 
        duration: '50min',
        items: [
          { title: 'Social Media Platforms Overview', duration: '10:15', type: 'video' },
          { title: 'Facebook Marketing', duration: '10:30', type: 'video' },
          { title: 'Instagram Marketing', duration: '9:45', type: 'video' },
          { title: 'LinkedIn Marketing', duration: '10:20', type: 'video' },
          { title: 'Social Media Campaign', duration: '9:10', type: 'assignment' }
        ]
      },
      { 
        title: 'Analytics and Optimization', 
        lectures: 4, 
        duration: '40min',
        items: [
          { title: 'Google Analytics Setup', duration: '10:30', type: 'video' },
          { title: 'Marketing Metrics', duration: '11:15', type: 'video' },
          { title: 'Campaign Optimization', duration: '9:45', type: 'video' },
          { title: 'Final Marketing Project', duration: '8:30', type: 'assignment' }
        ]
      }
    ],
    totalLectures: 27,
    totalDuration: '5hr 25min',
    lastUpdated: '2025-01-05',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'No prior experience required',
      'Basic computer skills',
      'A computer with internet access',
      'Interest in marketing and digital media'
    ],
    fullDescription: 'Start your journey in digital marketing and SEO. Learn how to create effective marketing campaigns, optimize for search engines, and drive traffic to your website.'
  },
  { 
    id: 6, 
    title: 'Advance Python', 
    level: 'Advanced', 
    category: 'Programming', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 3200,
    badge: 'Bestseller',
    image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=250&fit=crop',
    price: 7499,
    originalPrice: 12499,
    description: 'This Advanced Python course delves into complex programming concepts and techniques, including data structures, algorithms, and performance optimization. Participants will tackle real-world problems through hands-on projects and case studies, enhancing their skills in writing efficient, scalable Python code for advanced applications and solutions.',
    learnings: [
      'Master advanced Python concepts',
      'Learn data structures and algorithms',
      'Understand performance optimization',
      'Build scalable Python applications',
      'Work with advanced Python libraries'
    ],
    sections: [
      { 
        title: 'Advanced Python Concepts', 
        lectures: 8, 
        duration: '90min',
        items: [
          { title: 'Decorators and Closures', duration: '11:30', type: 'video' },
          { title: 'Generators and Iterators', duration: '12:15', type: 'video' },
          { title: 'Context Managers', duration: '10:45', type: 'video' },
          { title: 'Metaclasses', duration: '11:20', type: 'video' },
          { title: 'Advanced OOP Concepts', duration: '13:30', type: 'video' },
          { title: 'Functional Programming', duration: '12:40', type: 'video' },
          { title: 'Advanced Concepts Quiz', duration: '10:00', type: 'quiz' },
          { title: 'Practice Exercises', duration: '8:00', type: 'assignment' }
        ]
      },
      { 
        title: 'Data Structures', 
        lectures: 7, 
        duration: '80min',
        items: [
          { title: 'Advanced Lists and Tuples', duration: '11:15', type: 'video' },
          { title: 'Dictionaries and Sets', duration: '12:30', type: 'video' },
          { title: 'Collections Module', duration: '11:45', type: 'video' },
          { title: 'Custom Data Structures', duration: '13:20', type: 'video' },
          { title: 'Tree Structures', duration: '12:15', type: 'video' },
          { title: 'Graph Data Structures', duration: '11:30', type: 'video' },
          { title: 'Data Structures Project', duration: '7:25', type: 'assignment' }
        ]
      },
      { 
        title: 'Algorithms', 
        lectures: 9, 
        duration: '100min',
        items: [
          { title: 'Sorting Algorithms', duration: '12:30', type: 'video' },
          { title: 'Searching Algorithms', duration: '11:15', type: 'video' },
          { title: 'Graph Algorithms', duration: '13:45', type: 'video' },
          { title: 'Dynamic Programming', duration: '14:20', type: 'video' },
          { title: 'Greedy Algorithms', duration: '11:30', type: 'video' },
          { title: 'Backtracking', duration: '12:15', type: 'video' },
          { title: 'Algorithm Complexity', duration: '10:45', type: 'video' },
          { title: 'Algorithm Quiz', duration: '10:00', type: 'quiz' },
          { title: 'Algorithm Implementation', duration: '4:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Performance Optimization', 
        lectures: 6, 
        duration: '70min',
        items: [
          { title: 'Profiling and Benchmarking', duration: '12:30', type: 'video' },
          { title: 'Memory Optimization', duration: '11:45', type: 'video' },
          { title: 'Caching Strategies', duration: '12:15', type: 'video' },
          { title: 'Concurrency and Parallelism', duration: '13:20', type: 'video' },
          { title: 'Cython and Performance', duration: '11:30', type: 'video' },
          { title: 'Optimization Project', duration: '8:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Advanced Projects', 
        lectures: 5, 
        duration: '60min',
        items: [
          { title: 'Project 1: Web Scraper', duration: '13:15', type: 'video' },
          { title: 'Project 2: Data Pipeline', duration: '12:30', type: 'video' },
          { title: 'Project 3: API Development', duration: '14:20', type: 'video' },
          { title: 'Project 4: Machine Learning App', duration: '12:45', type: 'video' },
          { title: 'Final Project Review', duration: '7:10', type: 'video' }
        ]
      }
    ],
    totalLectures: 35,
    totalDuration: '7hr 40min',
    lastUpdated: '2025-01-14',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'Intermediate Python knowledge',
      'Understanding of programming fundamentals',
      'A computer with Python installed',
      'Willingness to solve complex problems'
    ],
    fullDescription: 'Take your Python skills to the next level. This advanced course covers complex programming concepts, algorithms, and performance optimization techniques.'
  },
  { 
    id: 7, 
    title: 'Graphic Designing', 
    level: 'Beginner', 
    category: 'Design', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 1800,
    badge: null,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop',
    price: 5499,
    originalPrice: 8999,
    description: 'This Graphic Designing course covers fundamental and advanced design principles, including layout, typography, and visual communication. Participants will engage in hands-on projects and real-world case studies to develop practical skills in creating compelling graphics and visual content, mastering tools and techniques for effective design solutions.',
    learnings: [
      'Master graphic design principles',
      'Learn typography and layout',
      'Use design software effectively',
      'Create compelling visual content',
      'Understand visual communication'
    ],
    sections: [
      { 
        title: 'Design Fundamentals', 
        lectures: 6, 
        duration: '55min',
        items: [
          { title: 'Introduction to Graphic Design', duration: '9:15', type: 'video' },
          { title: 'Design Principles', duration: '10:30', type: 'video' },
          { title: 'Visual Hierarchy', duration: '9:45', type: 'video' },
          { title: 'Balance and Composition', duration: '10:20', type: 'video' },
          { title: 'Design Tools Overview', duration: '8:30', type: 'video' },
          { title: 'Design Fundamentals Quiz', duration: '7:20', type: 'quiz' }
        ]
      },
      { 
        title: 'Typography', 
        lectures: 5, 
        duration: '45min',
        items: [
          { title: 'Typography Basics', duration: '9:15', type: 'video' },
          { title: 'Font Selection', duration: '8:45', type: 'video' },
          { title: 'Type Hierarchy', duration: '9:30', type: 'video' },
          { title: 'Typography in Design', duration: '10:20', type: 'video' },
          { title: 'Typography Exercise', duration: '7:10', type: 'assignment' }
        ]
      },
      { 
        title: 'Layout Design', 
        lectures: 7, 
        duration: '65min',
        items: [
          { title: 'Layout Principles', duration: '9:30', type: 'video' },
          { title: 'Grid Systems', duration: '10:15', type: 'video' },
          { title: 'Page Layout', duration: '9:45', type: 'video' },
          { title: 'Responsive Design', duration: '10:30', type: 'video' },
          { title: 'Layout Tools', duration: '8:20', type: 'video' },
          { title: 'Layout Design Quiz', duration: '9:00', type: 'quiz' },
          { title: 'Layout Project', duration: '8:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Color Theory', 
        lectures: 4, 
        duration: '40min',
        items: [
          { title: 'Color Fundamentals', duration: '10:15', type: 'video' },
          { title: 'Color Schemes', duration: '9:30', type: 'video' },
          { title: 'Color Psychology', duration: '10:45', type: 'video' },
          { title: 'Color Application', duration: '9:30', type: 'assignment' }
        ]
      },
      { 
        title: 'Design Projects', 
        lectures: 5, 
        duration: '50min',
        items: [
          { title: 'Project 1: Logo Design', duration: '10:30', type: 'video' },
          { title: 'Project 2: Poster Design', duration: '11:15', type: 'video' },
          { title: 'Project 3: Brand Identity', duration: '10:45', type: 'video' },
          { title: 'Project 4: Portfolio Design', duration: '10:20', type: 'video' },
          { title: 'Final Project Review', duration: '7:10', type: 'video' }
        ]
      }
    ],
    totalLectures: 27,
    totalDuration: '4hr 35min',
    lastUpdated: '2025-01-03',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'No prior experience required',
      'Creative mindset',
      'A computer with design software',
      'Interest in visual arts'
    ],
    fullDescription: 'Learn graphic design from the ground up. Master design principles, typography, and visual communication to create stunning graphics.'
  },
  { 
    id: 8, 
    title: 'Project Management', 
    level: 'Intermediate', 
    category: 'Management', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 1200,
    badge: null,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop',
    price: 6999,
    originalPrice: 11499,
    description: 'This Project Management course covers essential methodologies and techniques for planning, executing, and overseeing projects. Participants will explore key concepts like risk management, scheduling, and team collaboration through real-world case studies and hands-on projects, equipping them with practical skills to manage projects efficiently and achieve successful outcomes.',
    learnings: [
      'Master project management methodologies',
      'Learn risk management techniques',
      'Understand scheduling and planning',
      'Improve team collaboration',
      'Deliver projects successfully'
    ],
    sections: [
      { 
        title: 'Project Management Basics', 
        lectures: 6, 
        duration: '60min',
        items: [
          { title: 'Introduction to Project Management', duration: '10:15', type: 'video' },
          { title: 'Project Lifecycle', duration: '9:30', type: 'video' },
          { title: 'Project Manager Role', duration: '10:45', type: 'video' },
          { title: 'Project Scope', duration: '10:20', type: 'video' },
          { title: 'Stakeholder Management', duration: '9:45', type: 'video' },
          { title: 'Basics Quiz', duration: '9:25', type: 'quiz' }
        ]
      },
      { 
        title: 'Planning and Scheduling', 
        lectures: 7, 
        duration: '75min',
        items: [
          { title: 'Project Planning Fundamentals', duration: '11:15', type: 'video' },
          { title: 'Work Breakdown Structure', duration: '10:30', type: 'video' },
          { title: 'Gantt Charts', duration: '11:45', type: 'video' },
          { title: 'Critical Path Method', duration: '10:20', type: 'video' },
          { title: 'Resource Planning', duration: '11:30', type: 'video' },
          { title: 'Scheduling Tools', duration: '10:15', type: 'video' },
          { title: 'Planning Exercise', duration: '10:05', type: 'assignment' }
        ]
      },
      { 
        title: 'Risk Management', 
        lectures: 5, 
        duration: '55min',
        items: [
          { title: 'Risk Identification', duration: '11:20', type: 'video' },
          { title: 'Risk Assessment', duration: '10:45', type: 'video' },
          { title: 'Risk Mitigation Strategies', duration: '11:30', type: 'video' },
          { title: 'Risk Monitoring', duration: '10:15', type: 'video' },
          { title: 'Risk Management Plan', duration: '11:10', type: 'assignment' }
        ]
      },
      { 
        title: 'Team Collaboration', 
        lectures: 6, 
        duration: '65min',
        items: [
          { title: 'Team Building', duration: '11:15', type: 'video' },
          { title: 'Communication Strategies', duration: '10:45', type: 'video' },
          { title: 'Conflict Resolution', duration: '11:30', type: 'video' },
          { title: 'Virtual Teams', duration: '10:20', type: 'video' },
          { title: 'Collaboration Tools', duration: '10:50', type: 'video' },
          { title: 'Team Collaboration Exercise', duration: '10:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Project Execution', 
        lectures: 4, 
        duration: '45min',
        items: [
          { title: 'Execution Phase', duration: '11:30', type: 'video' },
          { title: 'Monitoring and Control', duration: '11:15', type: 'video' },
          { title: 'Change Management', duration: '11:45', type: 'video' },
          { title: 'Project Closure', duration: '10:30', type: 'video' }
        ]
      }
    ],
    totalLectures: 28,
    totalDuration: '5hr 40min',
    lastUpdated: '2025-01-11',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'Basic understanding of business processes',
      'Leadership interest',
      'A computer with internet access',
      'Willingness to learn management skills'
    ],
    fullDescription: 'Become an effective project manager. Learn essential methodologies, risk management, and team collaboration techniques to deliver successful projects.'
  },
  { 
    id: 9, 
    title: 'The Web Developer Bootcamp 2024', 
    level: 'Intermediate', 
    category: 'Web Development', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 1200,
    badge: null,
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop',
    price: 8999,
    originalPrice: 14999,
    description: 'Become a full-stack developer with just one course. Master modern web development using React, HTML, CSS, JavaScript, Node.js and more. Learn component-based architecture, state management, routing, and building responsive user interfaces. This course includes hands-on projects to build real-world applications.',
    learnings: [
      'Master full-stack web development',
      'Learn React, Node.js, and modern frameworks',
      'Build responsive web applications',
      'Understand component-based architecture',
      'Deploy web applications'
    ],
    sections: [
      { 
        title: 'HTML & CSS Fundamentals', 
        lectures: 8, 
        duration: '90min',
        items: [
          { title: 'HTML Basics', duration: '11:30', type: 'video' },
          { title: 'HTML Structure', duration: '10:45', type: 'video' },
          { title: 'CSS Fundamentals', duration: '12:15', type: 'video' },
          { title: 'CSS Selectors', duration: '11:20', type: 'video' },
          { title: 'Layout with Flexbox', duration: '12:30', type: 'video' },
          { title: 'CSS Grid', duration: '11:45', type: 'video' },
          { title: 'Responsive Design', duration: '10:20', type: 'video' },
          { title: 'HTML/CSS Project', duration: '10:15', type: 'assignment' }
        ]
      },
      { 
        title: 'JavaScript Basics', 
        lectures: 10, 
        duration: '110min',
        items: [
          { title: 'JavaScript Introduction', duration: '11:15', type: 'video' },
          { title: 'Variables and Data Types', duration: '10:30', type: 'video' },
          { title: 'Functions', duration: '12:45', type: 'video' },
          { title: 'Control Flow', duration: '11:20', type: 'video' },
          { title: 'Arrays and Objects', duration: '12:30', type: 'video' },
          { title: 'DOM Manipulation', duration: '13:15', type: 'video' },
          { title: 'Events', duration: '11:45', type: 'video' },
          { title: 'Async JavaScript', duration: '12:20', type: 'video' },
          { title: 'JavaScript Quiz', duration: '10:00', type: 'quiz' },
          { title: 'JavaScript Project', duration: '4:00', type: 'assignment' }
        ]
      },
      { 
        title: 'React Development', 
        lectures: 12, 
        duration: '140min',
        items: [
          { title: 'React Introduction', duration: '12:15', type: 'video' },
          { title: 'Components and JSX', duration: '11:30', type: 'video' },
          { title: 'Props and State', duration: '12:45', type: 'video' },
          { title: 'React Hooks', duration: '13:20', type: 'video' },
          { title: 'Event Handling', duration: '11:15', type: 'video' },
          { title: 'Conditional Rendering', duration: '10:45', type: 'video' },
          { title: 'Lists and Keys', duration: '11:30', type: 'video' },
          { title: 'Forms in React', duration: '12:20', type: 'video' },
          { title: 'React Router', duration: '13:45', type: 'video' },
          { title: 'State Management', duration: '12:30', type: 'video' },
          { title: 'React Quiz', duration: '10:00', type: 'quiz' },
          { title: 'React Project', duration: '8:45', type: 'assignment' }
        ]
      },
      { 
        title: 'Node.js Backend', 
        lectures: 9, 
        duration: '100min',
        items: [
          { title: 'Node.js Introduction', duration: '11:30', type: 'video' },
          { title: 'NPM and Modules', duration: '10:45', type: 'video' },
          { title: 'Express.js Basics', duration: '12:15', type: 'video' },
          { title: 'Routing', duration: '11:20', type: 'video' },
          { title: 'Middleware', duration: '12:30', type: 'video' },
          { title: 'Database Integration', duration: '13:15', type: 'video' },
          { title: 'API Development', duration: '12:45', type: 'video' },
          { title: 'Authentication', duration: '11:30', type: 'video' },
          { title: 'Backend Project', duration: '4:30', type: 'assignment' }
        ]
      },
      { 
        title: 'Full-Stack Projects', 
        lectures: 7, 
        duration: '85min',
        items: [
          { title: 'Project 1: Todo App', duration: '12:30', type: 'video' },
          { title: 'Project 2: Blog Platform', duration: '13:15', type: 'video' },
          { title: 'Project 3: E-commerce Site', duration: '14:20', type: 'video' },
          { title: 'Project 4: Social Media App', duration: '13:45', type: 'video' },
          { title: 'Deployment', duration: '12:15', type: 'video' },
          { title: 'Best Practices', duration: '11:30', type: 'video' },
          { title: 'Final Project', duration: '8:05', type: 'assignment' }
        ]
      }
    ],
    totalLectures: 46,
    totalDuration: '10hr 5min',
    lastUpdated: '2025-01-13',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'Basic computer skills',
      'No prior programming experience required',
      'A computer with internet access',
      'Willingness to learn and practice'
    ],
    fullDescription: 'Become a full-stack web developer in one comprehensive course. Learn everything from HTML/CSS to React and Node.js, and build real-world applications.'
  },
  { 
    id: 10, 
    title: 'Complete AWS Cloud Practitioner Guide', 
    level: 'Intermediate', 
    category: 'Cloud Computing', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 2500,
    badge: 'Bestseller',
    image: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=250&fit=crop',
    price: 8499,
    originalPrice: 13999,
    description: 'A foundational course for anyone looking to start their career in cloud computing with AWS. Comprehensive AWS cloud computing course covering core services, architecture patterns, and best practices. Learn to design, deploy, and manage scalable cloud infrastructure. Includes hands-on labs with EC2, S3, Lambda, and other AWS services.',
    learnings: [
      'Master AWS cloud computing',
      'Learn core AWS services',
      'Design scalable cloud architecture',
      'Deploy and manage cloud infrastructure',
      'Prepare for AWS certification'
    ],
    sections: [
      { 
        title: 'AWS Fundamentals', 
        lectures: 7, 
        duration: '80min',
        items: [
          { title: 'Introduction to AWS', duration: '11:30', type: 'video' },
          { title: 'AWS Console Navigation', duration: '10:45', type: 'video' },
          { title: 'AWS Regions and Availability Zones', duration: '12:15', type: 'video' },
          { title: 'IAM Basics', duration: '11:20', type: 'video' },
          { title: 'EC2 Fundamentals', duration: '12:30', type: 'video' },
          { title: 'S3 Storage', duration: '11:45', type: 'video' },
          { title: 'AWS Fundamentals Quiz', duration: '10:35', type: 'quiz' }
        ]
      },
      { 
        title: 'Core AWS Services', 
        lectures: 10, 
        duration: '120min',
        items: [
          { title: 'EC2 Deep Dive', duration: '13:15', type: 'video' },
          { title: 'S3 Advanced Features', duration: '12:30', type: 'video' },
          { title: 'RDS Database Services', duration: '13:45', type: 'video' },
          { title: 'Lambda Functions', duration: '12:20', type: 'video' },
          { title: 'VPC Networking', duration: '13:30', type: 'video' },
          { title: 'CloudFront CDN', duration: '11:45', type: 'video' },
          { title: 'Elastic Beanstalk', duration: '12:15', type: 'video' },
          { title: 'Route 53 DNS', duration: '11:30', type: 'video' },
          { title: 'Core Services Quiz', duration: '10:00', type: 'quiz' },
          { title: 'Services Lab', duration: '9:50', type: 'assignment' }
        ]
      },
      { 
        title: 'Cloud Architecture', 
        lectures: 8, 
        duration: '95min',
        items: [
          { title: 'Architecture Principles', duration: '12:30', type: 'video' },
          { title: 'High Availability', duration: '12:15', type: 'video' },
          { title: 'Scalability Patterns', duration: '13:45', type: 'video' },
          { title: 'Load Balancing', duration: '12:20', type: 'video' },
          { title: 'Auto Scaling', duration: '11:30', type: 'video' },
          { title: 'Architecture Design', duration: '13:15', type: 'video' },
          { title: 'Cost Optimization', duration: '11:45', type: 'video' },
          { title: 'Architecture Project', duration: '8:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Security and Compliance', 
        lectures: 6, 
        duration: '70min',
        items: [
          { title: 'Security Best Practices', duration: '12:30', type: 'video' },
          { title: 'IAM Advanced', duration: '12:15', type: 'video' },
          { title: 'Encryption', duration: '11:45', type: 'video' },
          { title: 'Security Groups', duration: '11:30', type: 'video' },
          { title: 'Compliance Standards', duration: '12:20', type: 'video' },
          { title: 'Security Lab', duration: '9:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Advanced Topics', 
        lectures: 5, 
        duration: '60min',
        items: [
          { title: 'Serverless Architecture', duration: '12:45', type: 'video' },
          { title: 'Container Services', duration: '13:15', type: 'video' },
          { title: 'Monitoring and Logging', duration: '12:30', type: 'video' },
          { title: 'Disaster Recovery', duration: '12:20', type: 'video' },
          { title: 'Certification Preparation', duration: '9:10', type: 'video' }
        ]
      }
    ],
    totalLectures: 36,
    totalDuration: '8hr 5min',
    lastUpdated: '2025-01-16',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'Basic understanding of IT concepts',
      'Interest in cloud computing',
      'A computer with internet access',
      'AWS free tier account (optional)'
    ],
    fullDescription: 'Start your cloud computing journey with AWS. Learn core services, architecture patterns, and best practices to become an AWS cloud practitioner.'
  },
  { 
    id: 11, 
    title: 'Machine Learning Fundamentals', 
    level: 'Advanced', 
    category: 'Artificial Intelligence', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 5432,
    badge: null,
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=250&fit=crop',
    price: 9499,
    originalPrice: 15999,
    description: 'Dive deep into machine learning algorithms, supervised and unsupervised learning, neural networks, and deep learning. This course covers practical implementation using popular frameworks like TensorFlow and scikit-learn, with real-world projects to build predictive models and AI applications.',
    learnings: [
      'Master machine learning algorithms',
      'Understand supervised and unsupervised learning',
      'Build predictive models',
      'Work with TensorFlow and scikit-learn',
      'Apply ML to real-world problems'
    ],
    sections: [
      { 
        title: 'ML Fundamentals', 
        lectures: 8, 
        duration: '95min',
        items: [
          { title: 'Introduction to Machine Learning', duration: '12:30', type: 'video' },
          { title: 'ML vs Traditional Programming', duration: '11:15', type: 'video' },
          { title: 'Types of Machine Learning', duration: '12:45', type: 'video' },
          { title: 'ML Workflow', duration: '13:20', type: 'video' },
          { title: 'Data Preprocessing', duration: '12:15', type: 'video' },
          { title: 'Feature Engineering', duration: '11:30', type: 'video' },
          { title: 'ML Tools and Libraries', duration: '12:20', type: 'video' },
          { title: 'ML Fundamentals Quiz', duration: '9:45', type: 'quiz' }
        ]
      },
      { 
        title: 'Supervised Learning', 
        lectures: 10, 
        duration: '120min',
        items: [
          { title: 'Supervised Learning Overview', duration: '12:15', type: 'video' },
          { title: 'Linear Regression', duration: '13:30', type: 'video' },
          { title: 'Logistic Regression', duration: '12:45', type: 'video' },
          { title: 'Decision Trees', duration: '13:20', type: 'video' },
          { title: 'Random Forests', duration: '12:30', type: 'video' },
          { title: 'Support Vector Machines', duration: '13:45', type: 'video' },
          { title: 'Naive Bayes', duration: '11:15', type: 'video' },
          { title: 'Model Evaluation', duration: '12:20', type: 'video' },
          { title: 'Cross-Validation', duration: '11:30', type: 'video' },
          { title: 'Supervised Learning Project', duration: '7:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Unsupervised Learning', 
        lectures: 7, 
        duration: '85min',
        items: [
          { title: 'Unsupervised Learning Overview', duration: '12:30', type: 'video' },
          { title: 'Clustering Algorithms', duration: '13:15', type: 'video' },
          { title: 'K-Means Clustering', duration: '12:45', type: 'video' },
          { title: 'Hierarchical Clustering', duration: '12:20', type: 'video' },
          { title: 'Dimensionality Reduction', duration: '13:30', type: 'video' },
          { title: 'PCA', duration: '12:15', type: 'video' },
          { title: 'Unsupervised Learning Project', duration: '8:25', type: 'assignment' }
        ]
      },
      { 
        title: 'Neural Networks', 
        lectures: 9, 
        duration: '110min',
        items: [
          { title: 'Neural Networks Introduction', duration: '12:45', type: 'video' },
          { title: 'Perceptrons', duration: '12:15', type: 'video' },
          { title: 'Multilayer Perceptrons', duration: '13:30', type: 'video' },
          { title: 'Backpropagation', duration: '13:45', type: 'video' },
          { title: 'Activation Functions', duration: '12:20', type: 'video' },
          { title: 'Optimization Algorithms', duration: '12:30', type: 'video' },
          { title: 'Regularization', duration: '11:45', type: 'video' },
          { title: 'Neural Networks Quiz', duration: '10:00', type: 'quiz' },
          { title: 'Neural Network Project', duration: '7:50', type: 'assignment' }
        ]
      },
      { 
        title: 'ML Projects', 
        lectures: 6, 
        duration: '75min',
        items: [
          { title: 'Project 1: Classification', duration: '13:15', type: 'video' },
          { title: 'Project 2: Regression', duration: '13:30', type: 'video' },
          { title: 'Project 3: Image Recognition', duration: '14:20', type: 'video' },
          { title: 'Project 4: Natural Language Processing', duration: '13:45', type: 'video' },
          { title: 'Model Deployment', duration: '11:30', type: 'video' },
          { title: 'Final ML Project', duration: '8:20', type: 'assignment' }
        ]
      }
    ],
    totalLectures: 40,
    totalDuration: '9hr 5min',
    lastUpdated: '2025-01-17',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'Intermediate Python knowledge',
      'Understanding of statistics',
      'A computer with Python installed',
      'Interest in AI and machine learning'
    ],
    fullDescription: 'Master machine learning from fundamentals to advanced techniques. Learn to build predictive models and apply ML to real-world problems.'
  },
  { 
    id: 12, 
    title: 'Docker & Kubernetes: The Practical Guide', 
    level: 'Intermediate', 
    category: 'DevOps', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 876,
    badge: 'Bestseller',
    image: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=250&fit=crop',
    price: 7999,
    originalPrice: 12999,
    description: 'Build, test, and deploy applications with Docker and Kubernetes on AWS. Learn DevOps practices, continuous integration, and continuous deployment pipelines. Master Docker, Kubernetes, Jenkins, and Git workflows. This course teaches you how to automate software delivery, improve deployment frequency, and achieve faster time to market.',
    learnings: [
      'Master Docker containerization',
      'Learn Kubernetes orchestration',
      'Understand CI/CD pipelines',
      'Automate software delivery',
      'Deploy applications effectively'
    ],
    sections: [
      { 
        title: 'Docker Basics', 
        lectures: 7, 
        duration: '80min',
        items: [
          { title: 'Introduction to Docker', duration: '11:30', type: 'video' },
          { title: 'Docker Installation', duration: '10:45', type: 'video' },
          { title: 'Docker Images', duration: '12:15', type: 'video' },
          { title: 'Docker Containers', duration: '11:20', type: 'video' },
          { title: 'Dockerfile', duration: '12:30', type: 'video' },
          { title: 'Docker Commands', duration: '11:45', type: 'video' },
          { title: 'Docker Basics Lab', duration: '9:35', type: 'assignment' }
        ]
      },
      { 
        title: 'Docker Advanced', 
        lectures: 6, 
        duration: '70min',
        items: [
          { title: 'Docker Compose', duration: '12:30', type: 'video' },
          { title: 'Docker Networks', duration: '11:45', type: 'video' },
          { title: 'Docker Volumes', duration: '12:15', type: 'video' },
          { title: 'Multi-stage Builds', duration: '11:30', type: 'video' },
          { title: 'Docker Best Practices', duration: '12:20', type: 'video' },
          { title: 'Advanced Docker Lab', duration: '9:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Kubernetes Fundamentals', 
        lectures: 9, 
        duration: '105min',
        items: [
          { title: 'Kubernetes Introduction', duration: '12:45', type: 'video' },
          { title: 'Kubernetes Architecture', duration: '13:15', type: 'video' },
          { title: 'Pods and Containers', duration: '12:30', type: 'video' },
          { title: 'Services', duration: '11:45', type: 'video' },
          { title: 'Deployments', duration: '13:20', type: 'video' },
          { title: 'ConfigMaps and Secrets', duration: '12:15', type: 'video' },
          { title: 'Scaling and Autoscaling', duration: '12:30', type: 'video' },
          { title: 'Kubernetes Quiz', duration: '10:00', type: 'quiz' },
          { title: 'Kubernetes Lab', duration: '7:20', type: 'assignment' }
        ]
      },
      { 
        title: 'CI/CD Pipelines', 
        lectures: 7, 
        duration: '85min',
        items: [
          { title: 'CI/CD Concepts', duration: '12:30', type: 'video' },
          { title: 'Jenkins Setup', duration: '13:15', type: 'video' },
          { title: 'GitHub Actions', duration: '12:45', type: 'video' },
          { title: 'GitLab CI/CD', duration: '12:20', type: 'video' },
          { title: 'Pipeline Automation', duration: '13:30', type: 'video' },
          { title: 'Testing in CI/CD', duration: '11:45', type: 'video' },
          { title: 'CI/CD Project', duration: '9:35', type: 'assignment' }
        ]
      },
      { 
        title: 'DevOps Best Practices', 
        lectures: 5, 
        duration: '60min',
        items: [
          { title: 'Infrastructure as Code', duration: '12:45', type: 'video' },
          { title: 'Monitoring and Logging', duration: '13:15', type: 'video' },
          { title: 'Security in DevOps', duration: '12:30', type: 'video' },
          { title: 'DevOps Culture', duration: '12:20', type: 'video' },
          { title: 'Final DevOps Project', duration: '9:10', type: 'assignment' }
        ]
      }
    ],
    totalLectures: 34,
    totalDuration: '7hr 40min',
    lastUpdated: '2025-01-09',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'Basic understanding of software development',
      'Familiarity with command line',
      'A computer with Docker installed',
      'Interest in DevOps practices'
    ],
    fullDescription: 'Learn Docker and Kubernetes to containerize and orchestrate your applications. Master DevOps practices and CI/CD pipelines.'
  },
  { 
    id: 13, 
    title: 'Database Design and SQL', 
    level: 'Beginner', 
    category: 'Database', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 2100,
    badge: null,
    image: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=250&fit=crop',
    price: 5999,
    originalPrice: 9999,
    description: 'Learn database design principles, SQL querying, normalization, and database administration. This course covers both relational and NoSQL databases, teaching you how to design efficient database schemas, write complex queries, and optimize database performance for real-world applications.',
    learnings: [
      'Master database design principles',
      'Learn SQL querying',
      'Understand normalization',
      'Design efficient database schemas',
      'Optimize database performance'
    ],
    sections: [
      { 
        title: 'Database Fundamentals', 
        lectures: 6, 
        duration: '55min',
        items: [
          { title: 'Introduction to Databases', duration: '9:15', type: 'video' },
          { title: 'Database Types', duration: '9:30', type: 'video' },
          { title: 'Relational Databases', duration: '10:20', type: 'video' },
          { title: 'NoSQL Databases', duration: '9:45', type: 'video' },
          { title: 'Database Management Systems', duration: '9:30', type: 'video' },
          { title: 'Database Fundamentals Quiz', duration: '7:20', type: 'quiz' }
        ]
      },
      { 
        title: 'SQL Basics', 
        lectures: 8, 
        duration: '90min',
        items: [
          { title: 'SQL Introduction', duration: '11:30', type: 'video' },
          { title: 'SELECT Statements', duration: '12:15', type: 'video' },
          { title: 'WHERE Clauses', duration: '11:45', type: 'video' },
          { title: 'JOINs', duration: '13:20', type: 'video' },
          { title: 'Aggregate Functions', duration: '12:30', type: 'video' },
          { title: 'GROUP BY and HAVING', duration: '11:15', type: 'video' },
          { title: 'Subqueries', duration: '12:45', type: 'video' },
          { title: 'SQL Basics Practice', duration: '5:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Advanced SQL', 
        lectures: 7, 
        duration: '80min',
        items: [
          { title: 'Window Functions', duration: '12:30', type: 'video' },
          { title: 'CTEs (Common Table Expressions)', duration: '11:45', type: 'video' },
          { title: 'Stored Procedures', duration: '12:15', type: 'video' },
          { title: 'Triggers', duration: '11:30', type: 'video' },
          { title: 'Views', duration: '10:45', type: 'video' },
          { title: 'Transactions', duration: '11:20', type: 'video' },
          { title: 'Advanced SQL Project', duration: '10:35', type: 'assignment' }
        ]
      },
      { 
        title: 'Database Design', 
        lectures: 6, 
        duration: '70min',
        items: [
          { title: 'Entity Relationship Modeling', duration: '12:30', type: 'video' },
          { title: 'Normalization', duration: '13:15', type: 'video' },
          { title: 'Database Schemas', duration: '12:20', type: 'video' },
          { title: 'Indexing', duration: '11:45', type: 'video' },
          { title: 'Foreign Keys and Constraints', duration: '12:30', type: 'video' },
          { title: 'Database Design Project', duration: '8:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Database Optimization', 
        lectures: 5, 
        duration: '60min',
        items: [
          { title: 'Query Optimization', duration: '12:45', type: 'video' },
          { title: 'Index Optimization', duration: '12:30', type: 'video' },
          { title: 'Performance Tuning', duration: '13:15', type: 'video' },
          { title: 'Database Maintenance', duration: '12:20', type: 'video' },
          { title: 'Final Database Project', duration: '9:10', type: 'assignment' }
        ]
      }
    ],
    totalLectures: 32,
    totalDuration: '6hr 35min',
    lastUpdated: '2025-01-04',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'No prior database experience required',
      'Basic computer skills',
      'A computer with internet access',
      'Willingness to learn SQL'
    ],
    fullDescription: 'Learn database design and SQL from scratch. Master querying, normalization, and database optimization techniques.'
  },
  { 
    id: 14, 
    title: 'Mobile App Development', 
    level: 'Intermediate', 
    category: 'Mobile Development', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 1800,
    badge: null,
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=250&fit=crop',
    price: 8999,
    originalPrice: 14999,
    description: 'Build cross-platform mobile applications using modern frameworks like React Native or Flutter. Learn mobile UI/UX design, API integration, state management, and app deployment. Create fully functional mobile apps for both iOS and Android platforms through hands-on projects.',
    learnings: [
      'Master mobile app development',
      'Learn React Native or Flutter',
      'Build cross-platform apps',
      'Understand mobile UI/UX design',
      'Deploy apps to app stores'
    ],
    sections: [
      { 
        title: 'Mobile Development Basics', 
        lectures: 6, 
        duration: '70min',
        items: [
          { title: 'Introduction to Mobile Development', duration: '12:15', type: 'video' },
          { title: 'Native vs Cross-platform', duration: '11:30', type: 'video' },
          { title: 'Mobile App Architecture', duration: '12:45', type: 'video' },
          { title: 'Development Environment Setup', duration: '11:20', type: 'video' },
          { title: 'Mobile Design Principles', duration: '12:30', type: 'video' },
          { title: 'Basics Quiz', duration: '10:20', type: 'quiz' }
        ]
      },
      { 
        title: 'React Native/Flutter', 
        lectures: 10, 
        duration: '120min',
        items: [
          { title: 'React Native Introduction', duration: '13:15', type: 'video' },
          { title: 'Flutter Introduction', duration: '12:30', type: 'video' },
          { title: 'Components and Widgets', duration: '13:45', type: 'video' },
          { title: 'State Management', duration: '12:20', type: 'video' },
          { title: 'Navigation', duration: '13:30', type: 'video' },
          { title: 'Forms and Input', duration: '12:15', type: 'video' },
          { title: 'Styling', duration: '11:45', type: 'video' },
          { title: 'Platform-specific Code', duration: '12:30', type: 'video' },
          { title: 'Framework Quiz', duration: '10:00', type: 'quiz' },
          { title: 'Framework Project', duration: '9:10', type: 'assignment' }
        ]
      },
      { 
        title: 'UI/UX Design', 
        lectures: 7, 
        duration: '85min',
        items: [
          { title: 'Mobile UI Design', duration: '12:30', type: 'video' },
          { title: 'User Experience', duration: '13:15', type: 'video' },
          { title: 'Touch Interactions', duration: '12:45', type: 'video' },
          { title: 'Responsive Design', duration: '12:20', type: 'video' },
          { title: 'Accessibility', duration: '11:30', type: 'video' },
          { title: 'Design Systems', duration: '13:30', type: 'video' },
          { title: 'UI/UX Project', duration: '9:10', type: 'assignment' }
        ]
      },
      { 
        title: 'API Integration', 
        lectures: 6, 
        duration: '75min',
        items: [
          { title: 'REST API Basics', duration: '12:45', type: 'video' },
          { title: 'API Calls', duration: '13:15', type: 'video' },
          { title: 'Authentication', duration: '12:30', type: 'video' },
          { title: 'Error Handling', duration: '12:20', type: 'video' },
          { title: 'Data Caching', duration: '13:30', type: 'video' },
          { title: 'API Integration Project', duration: '11:20', type: 'assignment' }
        ]
      },
      { 
        title: 'App Deployment', 
        lectures: 5, 
        duration: '60min',
        items: [
          { title: 'App Store Preparation', duration: '13:15', type: 'video' },
          { title: 'iOS Deployment', duration: '12:30', type: 'video' },
          { title: 'Android Deployment', duration: '13:45', type: 'video' },
          { title: 'App Updates', duration: '12:20', type: 'video' },
          { title: 'Final App Deployment', duration: '8:10', type: 'assignment' }
        ]
      }
    ],
    totalLectures: 34,
    totalDuration: '7hr 50min',
    lastUpdated: '2025-01-07',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'Basic programming knowledge',
      'Understanding of JavaScript',
      'A computer with development tools',
      'Interest in mobile development'
    ],
    fullDescription: 'Build cross-platform mobile apps with React Native or Flutter. Learn mobile UI/UX design and deploy your apps to app stores.'
  },
  { 
    id: 15, 
    title: 'UI/UX Design', 
    level: 'Beginner', 
    category: 'Design', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 3200,
    badge: null,
    image: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop',
    price: 6499,
    originalPrice: 10999,
    description: 'Master user interface and user experience design principles. Learn wireframing, prototyping, user research, and design thinking. This course covers tools like Figma and Adobe XD, teaching you how to create intuitive and visually appealing digital experiences that users love.',
    learnings: [
      'Master UI/UX design principles',
      'Learn wireframing and prototyping',
      'Understand user research',
      'Use design tools effectively',
      'Create intuitive digital experiences'
    ],
    sections: [
      { 
        title: 'UI/UX Fundamentals', 
        lectures: 6, 
        duration: '60min',
        items: [
          { title: 'Introduction to UI/UX', duration: '10:15', type: 'video' },
          { title: 'User-Centered Design', duration: '10:30', type: 'video' },
          { title: 'Design Thinking', duration: '10:45', type: 'video' },
          { title: 'Usability Principles', duration: '10:20', type: 'video' },
          { title: 'Information Architecture', duration: '10:30', type: 'video' },
          { title: 'UI/UX Fundamentals Quiz', duration: '8:20', type: 'quiz' }
        ]
      },
      { 
        title: 'User Research', 
        lectures: 5, 
        duration: '50min',
        items: [
          { title: 'Research Methods', duration: '10:30', type: 'video' },
          { title: 'User Interviews', duration: '10:15', type: 'video' },
          { title: 'Surveys and Questionnaires', duration: '10:20', type: 'video' },
          { title: 'User Personas', duration: '10:45', type: 'video' },
          { title: 'User Journey Mapping', duration: '8:10', type: 'assignment' }
        ]
      },
      { 
        title: 'Wireframing', 
        lectures: 6, 
        duration: '65min',
        items: [
          { title: 'Wireframing Basics', duration: '11:15', type: 'video' },
          { title: 'Low-Fidelity Wireframes', duration: '10:30', type: 'video' },
          { title: 'High-Fidelity Wireframes', duration: '11:45', type: 'video' },
          { title: 'Wireframing Tools', duration: '11:20', type: 'video' },
          { title: 'Wireframing Best Practices', duration: '10:45', type: 'video' },
          { title: 'Wireframing Project', duration: '9:25', type: 'assignment' }
        ]
      },
      { 
        title: 'Prototyping', 
        lectures: 7, 
        duration: '75min',
        items: [
          { title: 'Prototyping Basics', duration: '11:30', type: 'video' },
          { title: 'Interactive Prototypes', duration: '12:15', type: 'video' },
          { title: 'Prototype Testing', duration: '11:45', type: 'video' },
          { title: 'Prototyping Tools', duration: '12:30', type: 'video' },
          { title: 'Animation in Prototypes', duration: '11:20', type: 'video' },
          { title: 'Prototype Iteration', duration: '10:45', type: 'video' },
          { title: 'Prototyping Project', duration: '4:35', type: 'assignment' }
        ]
      },
      { 
        title: 'Design Tools', 
        lectures: 5, 
        duration: '55min',
        items: [
          { title: 'Figma Introduction', duration: '11:30', type: 'video' },
          { title: 'Adobe XD', duration: '11:15', type: 'video' },
          { title: 'Sketch', duration: '11:45', type: 'video' },
          { title: 'Design System Creation', duration: '12:20', type: 'video' },
          { title: 'Design Tools Project', duration: '8:10', type: 'assignment' }
        ]
      }
    ],
    totalLectures: 29,
    totalDuration: '5hr 45min',
    lastUpdated: '2025-01-06',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'No prior design experience required',
      'Creative mindset',
      'A computer with design software',
      'Interest in user-centered design'
    ],
    fullDescription: 'Learn UI/UX design from the ground up. Master design principles, user research, and prototyping to create user-friendly digital experiences.'
  },
  { 
    id: 16, 
    title: 'JavaScript Fundamentals', 
    level: 'Beginner', 
    category: 'Web Development', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 4551,
    badge: null,
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=400&h=250&fit=crop',
    price: 5499,
    originalPrice: 8999,
    description: 'Comprehensive JavaScript course covering ES6+, asynchronous programming, DOM manipulation, and modern JavaScript features. Learn to build interactive web applications, work with APIs, and understand JavaScript fundamentals essential for any web developer. Includes practical projects and coding exercises.',
    learnings: [
      'Master JavaScript fundamentals',
      'Learn ES6+ features',
      'Understand asynchronous programming',
      'Work with DOM manipulation',
      'Build interactive web applications'
    ],
    sections: [
      { 
        title: 'JavaScript Basics', 
        lectures: 8, 
        duration: '90min',
        items: [
          { title: 'JavaScript Introduction', duration: '11:30', type: 'video' },
          { title: 'Variables and Data Types', duration: '12:15', type: 'video' },
          { title: 'Operators', duration: '11:45', type: 'video' },
          { title: 'Control Flow', duration: '12:30', type: 'video' },
          { title: 'Functions', duration: '13:20', type: 'video' },
          { title: 'Arrays', duration: '12:15', type: 'video' },
          { title: 'Objects', duration: '11:30', type: 'video' },
          { title: 'JavaScript Basics Quiz', duration: '4:35', type: 'quiz' }
        ]
      },
      { 
        title: 'ES6+ Features', 
        lectures: 7, 
        duration: '80min',
        items: [
          { title: 'Arrow Functions', duration: '12:30', type: 'video' },
          { title: 'Template Literals', duration: '11:15', type: 'video' },
          { title: 'Destructuring', duration: '12:45', type: 'video' },
          { title: 'Spread Operator', duration: '11:30', type: 'video' },
          { title: 'Modules', duration: '12:20', type: 'video' },
          { title: 'Classes', duration: '12:45', type: 'video' },
          { title: 'ES6+ Features Quiz', duration: '6:35', type: 'quiz' }
        ]
      },
      { 
        title: 'DOM Manipulation', 
        lectures: 6, 
        duration: '70min',
        items: [
          { title: 'DOM Introduction', duration: '12:30', type: 'video' },
          { title: 'Selecting Elements', duration: '12:15', type: 'video' },
          { title: 'Modifying Elements', duration: '12:45', type: 'video' },
          { title: 'Event Listeners', duration: '13:20', type: 'video' },
          { title: 'Dynamic Content', duration: '12:30', type: 'video' },
          { title: 'DOM Project', duration: '6:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Async Programming', 
        lectures: 5, 
        duration: '60min',
        items: [
          { title: 'Callbacks', duration: '12:30', type: 'video' },
          { title: 'Promises', duration: '13:15', type: 'video' },
          { title: 'Async/Await', duration: '13:45', type: 'video' },
          { title: 'Fetch API', duration: '12:20', type: 'video' },
          { title: 'Async Programming Project', duration: '8:10', type: 'assignment' }
        ]
      },
      { 
        title: 'JavaScript Projects', 
        lectures: 4, 
        duration: '50min',
        items: [
          { title: 'Project 1: Calculator', duration: '13:15', type: 'video' },
          { title: 'Project 2: Todo App', duration: '13:30', type: 'video' },
          { title: 'Project 3: Weather App', duration: '14:20', type: 'video' },
          { title: 'Final JavaScript Project', duration: '8:55', type: 'assignment' }
        ]
      }
    ],
    totalLectures: 30,
    totalDuration: '6hr 10min',
    lastUpdated: '2025-01-18',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'No prior programming experience required',
      'Basic computer skills',
      'A computer with internet access',
      'A code editor (VS Code recommended)'
    ],
    fullDescription: 'Learn JavaScript from scratch. Master fundamentals, ES6+ features, and build interactive web applications.'
  },
  { 
    id: 17, 
    title: 'Python for Data Science and ML Bootcamp', 
    level: 'Intermediate', 
    category: 'Data Science', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 5432,
    badge: null,
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
    price: 8499,
    originalPrice: 13999,
    description: 'Master Python for data science, machine learning, and data visualization with hands-on projects. Learn data science fundamentals using Python, including data cleaning, analysis, visualization, and statistical modeling. This course covers pandas, NumPy, matplotlib, and scikit-learn to analyze real datasets.',
    learnings: [
      'Master Python for data science',
      'Learn data analysis and visualization',
      'Understand machine learning with Python',
      'Work with pandas and NumPy',
      'Build data science projects'
    ],
    sections: [
      { 
        title: 'Python Basics for Data Science', 
        lectures: 7, 
        duration: '85min',
        items: [
          { title: 'Python for Data Science', duration: '12:30', type: 'video' },
          { title: 'NumPy Basics', duration: '12:15', type: 'video' },
          { title: 'Data Structures', duration: '12:45', type: 'video' },
          { title: 'Data Loading', duration: '12:20', type: 'video' },
          { title: 'Data Cleaning', duration: '13:30', type: 'video' },
          { title: 'Python Libraries', duration: '12:45', type: 'video' },
          { title: 'Basics Quiz', duration: '9:15', type: 'quiz' }
        ]
      },
      { 
        title: 'Data Analysis with Pandas', 
        lectures: 9, 
        duration: '110min',
        items: [
          { title: 'Pandas Introduction', duration: '13:15', type: 'video' },
          { title: 'DataFrames', duration: '13:30', type: 'video' },
          { title: 'Data Selection', duration: '12:45', type: 'video' },
          { title: 'Data Filtering', duration: '12:30', type: 'video' },
          { title: 'Data Aggregation', duration: '13:20', type: 'video' },
          { title: 'Data Transformation', duration: '12:15', type: 'video' },
          { title: 'Merging Data', duration: '13:45', type: 'video' },
          { title: 'Time Series Analysis', duration: '12:30', type: 'video' },
          { title: 'Pandas Project', duration: '7:50', type: 'assignment' }
        ]
      },
      { 
        title: 'Data Visualization', 
        lectures: 6, 
        duration: '75min',
        items: [
          { title: 'Matplotlib Basics', duration: '13:15', type: 'video' },
          { title: 'Seaborn', duration: '13:30', type: 'video' },
          { title: 'Plotting Types', duration: '13:45', type: 'video' },
          { title: 'Customization', duration: '12:20', type: 'video' },
          { title: 'Interactive Visualizations', duration: '12:30', type: 'video' },
          { title: 'Visualization Project', duration: '10:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Machine Learning', 
        lectures: 8, 
        duration: '95min',
        items: [
          { title: 'Scikit-learn Introduction', duration: '12:45', type: 'video' },
          { title: 'Classification', duration: '13:15', type: 'video' },
          { title: 'Regression', duration: '12:30', type: 'video' },
          { title: 'Model Evaluation', duration: '12:20', type: 'video' },
          { title: 'Feature Selection', duration: '12:45', type: 'video' },
          { title: 'Model Tuning', duration: '13:30', type: 'video' },
          { title: 'ML Pipeline', duration: '12:15', type: 'video' },
          { title: 'ML Project', duration: '6:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Data Science Projects', 
        lectures: 5, 
        duration: '65min',
        items: [
          { title: 'Project 1: Data Analysis', duration: '13:45', type: 'video' },
          { title: 'Project 2: Predictive Modeling', duration: '14:20', type: 'video' },
          { title: 'Project 3: Data Visualization', duration: '13:30', type: 'video' },
          { title: 'Project 4: End-to-End Analysis', duration: '14:15', type: 'video' },
          { title: 'Final Data Science Project', duration: '9:10', type: 'assignment' }
        ]
      }
    ],
    totalLectures: 35,
    totalDuration: '7hr 50min',
    lastUpdated: '2025-01-19',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'Basic Python knowledge',
      'Understanding of mathematics',
      'A computer with Python installed',
      'Interest in data science'
    ],
    fullDescription: 'Master Python for data science and machine learning. Learn to analyze data, create visualizations, and build ML models.'
  },
  { 
    id: 18, 
    title: 'Blockchain Development', 
    level: 'Advanced', 
    category: 'Programming', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 890,
    badge: 'New',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop',
    price: 9999,
    originalPrice: 16999,
    description: 'Explore blockchain technology, smart contracts, and decentralized applications. Learn Solidity programming, Ethereum development, and DeFi concepts. Build your own blockchain applications and smart contracts through hands-on projects, preparing you for the future of decentralized technology.',
    learnings: [
      'Master blockchain technology',
      'Learn smart contract development',
      'Understand DeFi concepts',
      'Build decentralized applications',
      'Work with Ethereum and Solidity'
    ],
    sections: [
      { 
        title: 'Blockchain Fundamentals', 
        lectures: 6, 
        duration: '70min',
        items: [
          { title: 'Introduction to Blockchain', duration: '12:30', type: 'video' },
          { title: 'Blockchain Architecture', duration: '12:15', type: 'video' },
          { title: 'Cryptography Basics', duration: '12:45', type: 'video' },
          { title: 'Consensus Mechanisms', duration: '13:20', type: 'video' },
          { title: 'Blockchain Networks', duration: '12:30', type: 'video' },
          { title: 'Blockchain Fundamentals Quiz', duration: '7:20', type: 'quiz' }
        ]
      },
      { 
        title: 'Smart Contracts', 
        lectures: 8, 
        duration: '95min',
        items: [
          { title: 'Smart Contracts Introduction', duration: '12:45', type: 'video' },
          { title: 'Ethereum Platform', duration: '13:15', type: 'video' },
          { title: 'Smart Contract Lifecycle', duration: '12:30', type: 'video' },
          { title: 'Gas and Transactions', duration: '12:20', type: 'video' },
          { title: 'Smart Contract Security', duration: '13:45', type: 'video' },
          { title: 'Testing Smart Contracts', duration: '12:15', type: 'video' },
          { title: 'Deploying Smart Contracts', duration: '13:30', type: 'video' },
          { title: 'Smart Contracts Project', duration: '5:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Solidity Programming', 
        lectures: 9, 
        duration: '110min',
        items: [
          { title: 'Solidity Basics', duration: '13:15', type: 'video' },
          { title: 'Data Types', duration: '12:45', type: 'video' },
          { title: 'Functions and Modifiers', duration: '13:30', type: 'video' },
          { title: 'Events and Logs', duration: '12:20', type: 'video' },
          { title: 'Inheritance', duration: '13:45', type: 'video' },
          { title: 'Libraries', duration: '12:15', type: 'video' },
          { title: 'Advanced Patterns', duration: '13:30', type: 'video' },
          { title: 'Solidity Quiz', duration: '10:00', type: 'quiz' },
          { title: 'Solidity Project', duration: '5:20', type: 'assignment' }
        ]
      },
      { 
        title: 'DeFi Concepts', 
        lectures: 7, 
        duration: '85min',
        items: [
          { title: 'DeFi Introduction', duration: '13:15', type: 'video' },
          { title: 'DeFi Protocols', duration: '13:30', type: 'video' },
          { title: 'Decentralized Exchanges', duration: '13:45', type: 'video' },
          { title: 'Lending and Borrowing', duration: '12:30', type: 'video' },
          { title: 'Yield Farming', duration: '12:45', type: 'video' },
          { title: 'DeFi Security', duration: '12:20', type: 'video' },
          { title: 'DeFi Project', duration: '7:35', type: 'assignment' }
        ]
      },
      { 
        title: 'Blockchain Projects', 
        lectures: 5, 
        duration: '65min',
        items: [
          { title: 'Project 1: Token Contract', duration: '14:20', type: 'video' },
          { title: 'Project 2: DApp Development', duration: '14:45', type: 'video' },
          { title: 'Project 3: DeFi Application', duration: '14:30', type: 'video' },
          { title: 'Project 4: NFT Marketplace', duration: '13:15', type: 'video' },
          { title: 'Final Blockchain Project', duration: '8:10', type: 'assignment' }
        ]
      }
    ],
    totalLectures: 35,
    totalDuration: '8hr 5min',
    lastUpdated: '2025-01-20',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'Intermediate programming knowledge',
      'Understanding of cryptography',
      'A computer with development tools',
      'Interest in blockchain technology'
    ],
    fullDescription: 'Learn blockchain development from fundamentals to advanced concepts. Build smart contracts and decentralized applications.'
  },
  { 
    id: 19, 
    title: 'CompTIA Security+ (SY0-601) Complete Course', 
    level: 'Intermediate', 
    category: 'Cybersecurity', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 4551,
    badge: null,
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=250&fit=crop',
    price: 8999,
    originalPrice: 14999,
    description: 'Everything you need to pass the CompTIA Security+ exam on your first attempt. Advanced network security course covering firewalls, intrusion detection systems, VPNs, and secure network architecture. Learn to protect networks from threats, implement security policies, and conduct security audits.',
    learnings: [
      'Master CompTIA Security+ concepts',
      'Learn network security',
      'Understand security policies',
      'Prepare for Security+ certification',
      'Protect networks effectively'
    ],
    sections: [
      { 
        title: 'Security Fundamentals', 
        lectures: 8, 
        duration: '95min',
        items: [
          { title: 'Security+ Exam Overview', duration: '12:30', type: 'video' },
          { title: 'Security Concepts', duration: '13:15', type: 'video' },
          { title: 'Threats and Vulnerabilities', duration: '12:45', type: 'video' },
          { title: 'Cryptography', duration: '13:30', type: 'video' },
          { title: 'Identity and Access Management', duration: '12:20', type: 'video' },
          { title: 'Security Controls', duration: '12:45', type: 'video' },
          { title: 'Risk Management', duration: '13:15', type: 'video' },
          { title: 'Security Fundamentals Quiz', duration: '5:20', type: 'quiz' }
        ]
      },
      { 
        title: 'Network Security', 
        lectures: 10, 
        duration: '120min',
        items: [
          { title: 'Network Security Basics', duration: '13:15', type: 'video' },
          { title: 'Firewalls', duration: '13:30', type: 'video' },
          { title: 'Intrusion Detection Systems', duration: '12:45', type: 'video' },
          { title: 'VPNs', duration: '13:20', type: 'video' },
          { title: 'Wireless Security', duration: '12:30', type: 'video' },
          { title: 'Network Segmentation', duration: '13:45', type: 'video' },
          { title: 'Network Monitoring', duration: '12:15', type: 'video' },
          { title: 'Secure Protocols', duration: '13:30', type: 'video' },
          { title: 'Network Security Quiz', duration: '10:00', type: 'quiz' },
          { title: 'Network Security Lab', duration: '6:30', type: 'assignment' }
        ]
      },
      { 
        title: 'Security Policies', 
        lectures: 7, 
        duration: '85min',
        items: [
          { title: 'Security Policy Development', duration: '13:15', type: 'video' },
          { title: 'Compliance Frameworks', duration: '13:30', type: 'video' },
          { title: 'Incident Response', duration: '13:45', type: 'video' },
          { title: 'Business Continuity', duration: '12:30', type: 'video' },
          { title: 'Disaster Recovery', duration: '12:45', type: 'video' },
          { title: 'Security Awareness', duration: '12:20', type: 'video' },
          { title: 'Security Policies Project', duration: '7:35', type: 'assignment' }
        ]
      },
      { 
        title: 'Security Audits', 
        lectures: 6, 
        duration: '70min',
        items: [
          { title: 'Security Assessment', duration: '12:45', type: 'video' },
          { title: 'Vulnerability Scanning', duration: '13:15', type: 'video' },
          { title: 'Penetration Testing', duration: '13:30', type: 'video' },
          { title: 'Security Auditing Tools', duration: '12:20', type: 'video' },
          { title: 'Audit Reporting', duration: '12:30', type: 'video' },
          { title: 'Security Audit Lab', duration: '6:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Exam Preparation', 
        lectures: 5, 
        duration: '60min',
        items: [
          { title: 'Exam Objectives Review', duration: '13:15', type: 'video' },
          { title: 'Practice Exams', duration: '13:30', type: 'video' },
          { title: 'Test-Taking Strategies', duration: '12:45', type: 'video' },
          { title: 'Key Concepts Summary', duration: '13:20', type: 'video' },
          { title: 'Final Exam Preparation', duration: '7:10', type: 'assignment' }
        ]
      }
    ],
    totalLectures: 36,
    totalDuration: '8hr 10min',
    lastUpdated: '2025-01-21',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'Basic IT knowledge',
      'Understanding of networking',
      'A computer with internet access',
      'Interest in cybersecurity'
    ],
    fullDescription: 'Prepare for CompTIA Security+ certification. Learn network security, security policies, and pass the exam on your first attempt.'
  },
  { 
    id: 20, 
    title: 'Content Marketing Strategy', 
    level: 'Beginner', 
    category: 'Marketing', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 2100,
    badge: null,
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
    price: 5499,
    originalPrice: 8999,
    description: 'Master content marketing strategies to engage audiences and drive business growth. Learn content creation, SEO optimization, social media marketing, email campaigns, and analytics. This course teaches you how to develop effective content strategies that convert visitors into customers.',
    learnings: [
      'Master content marketing strategies',
      'Learn content creation',
      'Understand SEO optimization',
      'Use social media marketing',
      'Measure marketing success'
    ],
    sections: [
      { 
        title: 'Content Marketing Basics', 
        lectures: 5, 
        duration: '45min',
        items: [
          { title: 'Introduction to Content Marketing', duration: '9:15', type: 'video' },
          { title: 'Content Strategy', duration: '9:30', type: 'video' },
          { title: 'Content Planning', duration: '9:45', type: 'video' },
          { title: 'Target Audience', duration: '9:20', type: 'video' },
          { title: 'Content Marketing Basics Quiz', duration: '7:10', type: 'quiz' }
        ]
      },
      { 
        title: 'Content Creation', 
        lectures: 6, 
        duration: '60min',
        items: [
          { title: 'Blog Writing', duration: '10:30', type: 'video' },
          { title: 'Video Content', duration: '10:45', type: 'video' },
          { title: 'Infographics', duration: '10:15', type: 'video' },
          { title: 'Podcasts', duration: '10:20', type: 'video' },
          { title: 'Content Formats', duration: '9:30', type: 'video' },
          { title: 'Content Creation Project', duration: '9:20', type: 'assignment' }
        ]
      },
      { 
        title: 'SEO Optimization', 
        lectures: 5, 
        duration: '50min',
        items: [
          { title: 'SEO for Content', duration: '10:30', type: 'video' },
          { title: 'Keyword Research', duration: '10:45', type: 'video' },
          { title: 'On-Page SEO', duration: '10:20', type: 'video' },
          { title: 'Content Optimization', duration: '10:15', type: 'video' },
          { title: 'SEO Project', duration: '8:10', type: 'assignment' }
        ]
      },
      { 
        title: 'Social Media Marketing', 
        lectures: 4, 
        duration: '40min',
        items: [
          { title: 'Social Media Strategy', duration: '10:30', type: 'video' },
          { title: 'Content Distribution', duration: '10:45', type: 'video' },
          { title: 'Engagement Tactics', duration: '10:20', type: 'video' },
          { title: 'Social Media Project', duration: '8:25', type: 'assignment' }
        ]
      },
      { 
        title: 'Analytics and Measurement', 
        lectures: 3, 
        duration: '35min',
        items: [
          { title: 'Content Analytics', duration: '12:15', type: 'video' },
          { title: 'ROI Measurement', duration: '12:30', type: 'video' },
          { title: 'Final Content Marketing Project', duration: '10:15', type: 'assignment' }
        ]
      }
    ],
    totalLectures: 23,
    totalDuration: '4hr 10min',
    lastUpdated: '2025-01-02',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'No prior marketing experience required',
      'Basic computer skills',
      'A computer with internet access',
      'Interest in marketing and content creation'
    ],
    fullDescription: 'Learn content marketing from the ground up. Master content creation, SEO, and social media marketing to grow your business.'
  },
  { 
    id: 21, 
    title: 'Agile and Scrum Mastery', 
    level: 'Intermediate', 
    category: 'Management', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 1200,
    badge: null,
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=250&fit=crop',
    price: 6999,
    originalPrice: 11499,
    description: 'Master Agile methodologies and Scrum framework for effective project management. Learn sprint planning, daily standups, retrospectives, and agile principles. This course prepares you for Scrum Master certification and teaches you how to lead agile teams to deliver value faster.',
    learnings: [
      'Master Agile methodologies',
      'Learn Scrum framework',
      'Understand sprint planning',
      'Lead agile teams effectively',
      'Prepare for Scrum Master certification'
    ],
    sections: [
      { 
        title: 'Agile Fundamentals', 
        lectures: 6, 
        duration: '65min',
        items: [
          { title: 'Introduction to Agile', duration: '11:15', type: 'video' },
          { title: 'Agile Manifesto', duration: '10:45', type: 'video' },
          { title: 'Agile Principles', duration: '11:30', type: 'video' },
          { title: 'Agile Methodologies', duration: '11:20', type: 'video' },
          { title: 'Agile vs Waterfall', duration: '11:45', type: 'video' },
          { title: 'Agile Fundamentals Quiz', duration: '8:25', type: 'quiz' }
        ]
      },
      { 
        title: 'Scrum Framework', 
        lectures: 7, 
        duration: '80min',
        items: [
          { title: 'Scrum Introduction', duration: '12:30', type: 'video' },
          { title: 'Scrum Roles', duration: '12:15', type: 'video' },
          { title: 'Scrum Events', duration: '13:45', type: 'video' },
          { title: 'Sprint', duration: '12:20', type: 'video' },
          { title: 'Scrum Artifacts', duration: '13:30', type: 'video' },
          { title: 'Scrum Values', duration: '12:15', type: 'video' },
          { title: 'Scrum Framework Quiz', duration: '3:15', type: 'quiz' }
        ]
      },
      { 
        title: 'Sprint Planning', 
        lectures: 5, 
        duration: '55min',
        items: [
          { title: 'Sprint Planning Basics', duration: '11:30', type: 'video' },
          { title: 'Product Backlog', duration: '11:45', type: 'video' },
          { title: 'Sprint Backlog', duration: '11:20', type: 'video' },
          { title: 'User Stories', duration: '12:15', type: 'video' },
          { title: 'Sprint Planning Exercise', duration: '8:10', type: 'assignment' }
        ]
      },
      { 
        title: 'Team Leadership', 
        lectures: 6, 
        duration: '70min',
        items: [
          { title: 'Scrum Master Role', duration: '12:30', type: 'video' },
          { title: 'Servant Leadership', duration: '12:15', type: 'video' },
          { title: 'Facilitation', duration: '12:45', type: 'video' },
          { title: 'Conflict Resolution', duration: '12:20', type: 'video' },
          { title: 'Team Coaching', duration: '12:30', type: 'video' },
          { title: 'Leadership Exercise', duration: '8:20', type: 'assignment' }
        ]
      },
      { 
        title: 'Certification Preparation', 
        lectures: 4, 
        duration: '50min',
        items: [
          { title: 'Certification Overview', duration: '13:15', type: 'video' },
          { title: 'Exam Preparation', duration: '13:30', type: 'video' },
          { title: 'Practice Questions', duration: '13:45', type: 'video' },
          { title: 'Final Certification Prep', duration: '9:10', type: 'assignment' }
        ]
      }
    ],
    totalLectures: 28,
    totalDuration: '6hr 20min',
    lastUpdated: '2025-01-22',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'Basic understanding of project management',
      'Leadership interest',
      'A computer with internet access',
      'Willingness to learn Agile practices'
    ],
    fullDescription: 'Master Agile and Scrum methodologies. Learn to lead agile teams and prepare for Scrum Master certification.'
  },
  { 
    id: 22, 
    title: 'Video Editing and Production', 
    level: 'Beginner', 
    category: 'Design', 
    teacher: 'Course Instructor',
    rating: 0,
    ratingCount: 1800,
    badge: null,
    image: 'https://images.unsplash.com/photo-1533158326339-7f3cf2404354?w=400&h=250&fit=crop',
    price: 6499,
    originalPrice: 10999,
    description: 'Learn professional video editing techniques using industry-standard tools. Master video composition, color grading, audio editing, and post-production workflows. Create engaging video content for marketing, social media, and storytelling through hands-on projects and real-world scenarios.',
    learnings: [
      'Master video editing techniques',
      'Learn video composition',
      'Understand color grading',
      'Edit audio effectively',
      'Create engaging video content'
    ],
    sections: [
      { 
        title: 'Video Editing Basics', 
        lectures: 6, 
        duration: '70min',
        items: [
          { title: 'Introduction to Video Editing', duration: '12:15', type: 'video' },
          { title: 'Editing Software Overview', duration: '11:30', type: 'video' },
          { title: 'Importing and Organizing', duration: '12:45', type: 'video' },
          { title: 'Basic Editing Tools', duration: '12:20', type: 'video' },
          { title: 'Timeline Editing', duration: '12:30', type: 'video' },
          { title: 'Editing Basics Quiz', duration: '8:20', type: 'quiz' }
        ]
      },
      { 
        title: 'Video Composition', 
        lectures: 7, 
        duration: '80min',
        items: [
          { title: 'Composition Principles', duration: '12:30', type: 'video' },
          { title: 'Framing and Shots', duration: '12:15', type: 'video' },
          { title: 'Transitions', duration: '12:45', type: 'video' },
          { title: 'Cutting Techniques', duration: '13:20', type: 'video' },
          { title: 'Pacing and Rhythm', duration: '12:30', type: 'video' },
          { title: 'Storytelling', duration: '13:15', type: 'video' },
          { title: 'Composition Project', duration: '3:05', type: 'assignment' }
        ]
      },
      { 
        title: 'Color Grading', 
        lectures: 5, 
        duration: '60min',
        items: [
          { title: 'Color Theory for Video', duration: '12:45', type: 'video' },
          { title: 'Color Correction', duration: '13:15', type: 'video' },
          { title: 'Color Grading Tools', duration: '12:30', type: 'video' },
          { title: 'Color Grading Techniques', duration: '13:30', type: 'video' },
          { title: 'Color Grading Project', duration: '8:00', type: 'assignment' }
        ]
      },
      { 
        title: 'Audio Editing', 
        lectures: 4, 
        duration: '50min',
        items: [
          { title: 'Audio Fundamentals', duration: '13:15', type: 'video' },
          { title: 'Audio Mixing', duration: '13:30', type: 'video' },
          { title: 'Sound Effects', duration: '12:45', type: 'video' },
          { title: 'Audio Editing Project', duration: '10:10', type: 'assignment' }
        ]
      },
      { 
        title: 'Video Projects', 
        lectures: 5, 
        duration: '65min',
        items: [
          { title: 'Project 1: Short Film', duration: '14:20', type: 'video' },
          { title: 'Project 2: Commercial', duration: '13:45', type: 'video' },
          { title: 'Project 3: Documentary', duration: '14:30', type: 'video' },
          { title: 'Project 4: Social Media Video', duration: '13:15', type: 'video' },
          { title: 'Final Video Project', duration: '9:10', type: 'assignment' }
        ]
      }
    ],
    totalLectures: 27,
    totalDuration: '5hr 45min',
    lastUpdated: '2025-01-01',
    language: 'English',
    accessDuration: '2 Years',
    requirements: [
      'No prior video editing experience required',
      'Creative mindset',
      'A computer with video editing software',
      'Interest in video production'
    ],
    fullDescription: 'Learn professional video editing from the ground up. Master composition, color grading, and audio editing to create stunning videos.'
  }
]

