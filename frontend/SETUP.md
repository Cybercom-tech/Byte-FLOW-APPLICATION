# Setup Instructions

This document provides step-by-step instructions to set up the React project after converting from the static HTML website.

## Step 1: Copy Assets

You need to copy the assets folder from the original project to the `public` directory:

```bash
# Copy the entire assets folder to public
cp -r assets public/assets
```

Or manually copy:
- `assets/css/main.css` → `public/assets/css/main.css`
- `assets/img/` → `public/assets/img/`
- `assets/vendor/` → `public/assets/vendor/`

## Step 2: Install Dependencies

```bash
npm install
```

## Step 3: Update Form Endpoints

The forms currently point to `/forms/contact.php` and `/forms/newsletter.php`. You have several options:

### Option A: Use a Form Service (Recommended for quick setup)
- Formspree: https://formspree.io
- EmailJS: https://www.emailjs.com
- Netlify Forms: https://www.netlify.com/products/forms/

Update the form submission handlers in:
- `src/components/sections/Contact.jsx`
- `src/components/Footer.jsx`
- `src/components/sections/JobApplication.jsx`
- `src/components/sections/ProjectHiring.jsx`

### Option B: Create Backend API
Create API endpoints to handle form submissions and update the form handlers accordingly.

## Step 4: Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Step 5: Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Additional Notes

- Make sure all vendor CSS files are properly linked in `index.html`
- Check that all image paths are correct (they should reference `/assets/img/...`)
- The PureCounter library may need additional configuration if animations don't work
- Bootstrap JavaScript functionality (modals, dropdowns, etc.) should work automatically with the Bootstrap bundle

## Troubleshooting

### Images not loading
- Ensure assets are in the `public/assets` directory
- Check that image paths start with `/assets/` (leading slash is important)

### Styles not applying
- Verify `assets/css/main.css` is in `public/assets/css/main.css`
- Check that vendor CSS files are in `public/assets/vendor/`

### Forms not working
- Forms need a backend endpoint or form service
- Check browser console for errors
- Verify form submission handlers are correctly configured

### Animations not working
- Ensure AOS is initialized (done in `App.jsx`)
- Check that AOS CSS is loaded (in `index.html`)
- Verify `data-aos` attributes are on elements

