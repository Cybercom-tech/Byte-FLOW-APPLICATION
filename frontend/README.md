# ByteFlow Innovations - React Website

This is the React version of the ByteFlow Innovations website, converted from a static HTML/CSS/JS website.

## Features

- 🚀 Modern React with Vite
- 📱 Responsive design with Bootstrap
- 🎨 Smooth animations with AOS (Animate On Scroll)
- 🧭 React Router for multi-page navigation
- 📝 Form handling with React hooks
- ⚡ Fast development and build with Vite

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. Clone the repository or navigate to the project directory

2. Install dependencies:
```bash
npm install
```

## Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Building for Production

Build the production version:
```bash
npm run build
```

The built files will be in the `dist` directory.

Preview the production build:
```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Header.jsx      # Navigation header
│   ├── Footer.jsx      # Footer component
│   ├── ScrollTop.jsx   # Scroll to top button
│   ├── Preloader.jsx   # Loading preloader
│   └── sections/       # Page sections
│       ├── Hero.jsx
│       ├── About.jsx
│       ├── Features.jsx
│       ├── Services.jsx
│       ├── FAQ.jsx
│       ├── Contact.jsx
│       └── ...
├── pages/              # Page components
│   ├── Home.jsx
│   └── CallCentre.jsx
├── App.jsx             # Main app component
└── main.jsx            # Entry point
```

## Assets

The original assets (images, CSS, vendor files) are located in the `public/assets` directory. They are served statically and can be referenced directly in the code.

## Form Handling

Forms are currently set up to submit to `/forms/contact.php` and `/forms/newsletter.php`. You'll need to:

1. Set up a backend API endpoint to handle form submissions
2. Update the form submission handlers in the components to point to your API
3. Or use a service like Formspree, EmailJS, or similar

## Dependencies

- **react** & **react-dom**: React framework
- **react-router-dom**: Client-side routing
- **bootstrap**: CSS framework
- **bootstrap-icons**: Icon library
- **aos**: Animate on scroll library
- **swiper**: Touch slider (if needed)
- **@purecounter/purecounter**: Counter animations

## Notes

- The original PHP forms need to be replaced with API endpoints or form handling services
- All vendor libraries are included as npm packages where possible
- The CSS from `assets/css/main.css` is still used and should be copied to `public/assets/css/main.css`
- Images should be copied from the original `assets/img` to `public/assets/img`
- Vendor files should be copied from `assets/vendor` to `public/assets/vendor`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Same as the original template license.

## Credits

Created by Nimra Khan and Laiba Ishtiaq
Original template: LeadPage by BootstrapMade

