# Game Developer Portfolio Website

A modern, responsive portfolio website specifically designed for game developers. Built with pure HTML, CSS, and JavaScript, featuring dynamic content management through JSON.

## 🎮 Features

### Main Portfolio Page

- Responsive navigation with smooth scrolling
- Dynamic hero section
- About me with key statistics
- Skills showcase with animated cards
- Work history timeline
- Project showcase with filtering
- Social media links
- Mobile-friendly design

### Game Project Pages

- Detailed project information
- Media gallery with images and videos
- Technical specifications
- Store links integration
- System requirements
- Feature lists

## 🔧 Technical Details

### Structure

```
hatem-mehana/
├── index.html          # Main portfolio page
├── page.html          # Individual game showcase page
├── main.css          # Main portfolio styles
├── page.css          # Game page styles
├── app.js            # Application logic
├── data.json         # Content management
└── README.md         # Documentation
```

### Technologies Used

- HTML5
- CSS3 (with CSS Variables)
- Vanilla JavaScript
- Ion Icons for icons
- JSON for content management

### Ion Icons Usage

All icons in `data.json` correspond directly to [Ion Icons](https://ionic.io/ionicons) names. Examples include:

- `logo-github`
- `logo-linkedin`
- `logo-twitter`
- `logo-youtube`
- `game-controller`
- `code-slash`
- `browsers`
- `terminal`
- `settings`
- `calendar`
- `person`
- `mail`
- `chevron-forward`
- `menu`
- `close`

To use an icon, ensure the name in `data.json` matches exactly with Ion Icons' naming convention.

## 📝 Content Management

All content is managed through `data.json` with the following sections:

```json
{
  "hero": {}, // Hero section content
  "about": {}, // About section with bio and stats
  "skills": [], // Skills and expertise
  "work": [], // Work history
  "showcase": {}, // Project portfolio
  "social": [] // Social media links
}
```

### Adding a New Project

Add to the `showcase.projects` array in `data.json`:

```json
{
  "name": "Project Name",
  "category": "Studio Name",
  "image": "path/to/image.jpg",
  "description": "Project description",
  "tags": ["Unity", "3D", "C#"],
  "type": "Full Game",
  "videoUrl": "youtube-embed-url",
  "gallery": ["image1.jpg", "image2.jpg"],
  "about": [
    {
      "type": "paragraph",
      "title": "Overview",
      "content": "Project details..."
    }
  ]
}
```

## 🎨 Customization

### Colors

Edit CSS variables in `:root`:

```css
:root {
  --color-primary: #1e9bd9;
  --color-primary-hover: #1894b0;
  --color-background: #000;
  --color-text: #fff;
}
```

### Typography

```css
:root {
  --font-family-primary: Arial, sans-serif;
  --font-size-xs: 0.8rem;
  --font-size-hero: 64px;
}
```

## 📱 Responsive Breakpoints

- Desktop: 1200px+
- Laptop: 1024px
- Tablet: 768px
- Mobile: 480px

## 💻 Setup

1. Clone the repository
2. Update `data.json` with your information
3. Replace placeholder images
4. Deploy to your hosting service

## 🖼️ Screenshots

1. Main Portfolio View
2. Project Details Page
3. Mobile Responsive View

## 🤝 Credits

Designed and developed by [Louay Rahali](https://www.facebook.com/louay.rahali.55)

## 📄 License

This project is open source and available under the MIT License.

## 📞 Support

For support or questions, please open an issue in the repository.

```

This README provides:
- Clear project overview
- Feature list
- Technical details
- Setup instructions
- Customization guide
- Content management explanation
- Responsive design information
- Credits and licensing

It's formatted for easy reading on GitHub and includes emojis for visual organization.
```
