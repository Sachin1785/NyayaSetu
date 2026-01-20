# NyayaSetu - Legal Research Platform

A modern, Google-inspired legal research web application built with Next.js 14, TypeScript, Tailwind CSS, and Shadcn/ui.

## 🎨 Design System

### Color Palette (Semantic Mapping)
- **Blue** (`#1A73E8`): Primary actions, citations, active states, links
- **Red** (`#EA4335`): Old/repealed laws, non-bailable tags, deletions, errors
- **Green** (`#34A853`): New laws, additions, favorable verdicts, success
- **Yellow** (`#FBBC04`): Warnings, cognizable badges, highlights
- **Background**: Pure White (`#FFFFFF`)
- **Borders**: Light Gray (`#E2E8F0`)
- **Text Primary**: Dark Gray (`#1F2937`)
- **Text Secondary**: Medium Gray (`#6B7280`)

## 🚀 Features

- ✅ **Dashboard/Home Page** - Hero search with quick action cards
- ✅ **Research Chat Interface** - 60-40 split layout with AI-powered responses
- ✅ **Comparator View** - Side-by-side IPC vs BNS comparison
- ✅ **Documents Page** - Upload and analyze legal documents
- ✅ **Case Law Database** - Browse recent judgments
- ✅ **Settings Page** - User preferences and configuration
- ✅ **Responsive Design** - Mobile, tablet, and desktop support
- ✅ **Persistent Sidebar** - Fixed navigation with active states
- ✅ **Citation Badges** - Hover cards with full legal text
- ✅ **Severity Badges** - Color-coded (Non-Bailable, Cognizable, etc.)

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Shadcn/ui
- **Icons**: Lucide React
- **Fonts**: Inter (Google Fonts)

## 📦 Installation & Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

```bash
# Build for production
npm run build

# Start production server
npm start
```

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with sidebar
│   ├── page.tsx                # Home/Dashboard page
│   ├── research/
│   │   └── page.tsx            # Research chat interface
│   ├── comparator/
│   │   └── page.tsx            # Law comparison page
│   ├── documents/
│   │   └── page.tsx            # Document analysis page
│   ├── case-law/
│   │   └── page.tsx            # Case law database
│   └── settings/
│       └── page.tsx            # Settings page
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx         # Navigation sidebar
│   │   └── Header.tsx          # Top header with breadcrumbs
│   ├── research/
│   │   ├── CitationBadge.tsx   # Law citation with hover
│   │   └── CaseLawCard.tsx     # Case law display card
│   ├── comparator/
│   │   └── ComparatorView.tsx  # Split comparison view
│   └── ui/                     # Shadcn components
└── lib/
    └── utils.ts                # Utility functions
```

## 🎯 Key Components

### Sidebar
- Fixed left navigation (240px width)
- Active state highlighting
- Responsive mobile drawer
- Google-style multicolor logo

### Header
- Sticky breadcrumb navigation
- Mobile menu toggle
- User avatar
- Responsive design

### Research Chat
- 60-40 split layout (chat + comparator)
- Citation badges with hover cards
- Severity badges (Non-Bailable, Cognizable)
- Collapsible sections
- Fixed input at bottom

### Comparator View
- Resizable split panels
- Color-coded sections (Red = Old, Green = New)
- Tab-based view modes
- Highlighting for additions/deletions

## 🎨 Shadcn Components Used

- Button
- Input
- Card
- Badge
- Tabs
- Hover Card
- Resizable Panels
- Separator
- Scroll Area
- Label

## 📱 Responsive Breakpoints

- **Desktop** (1280px+): Full two-column layout
- **Tablet** (768px-1279px): Stacked columns, collapsible sidebar
- **Mobile** (<768px): Single column, hamburger menu

## 🎭 Animations

- Card hover lift effect
- Shadow transitions
- Button press states
- Smooth menu transitions
- Border color transitions on focus

## 🌐 Routes

- `/` - Home/Dashboard
- `/research?q=<query>` - Research chat
- `/comparator` - Law comparison
- `/documents` - Document analysis
- `/case-law` - Case law database
- `/settings` - User settings

## 🎨 Design Principles

1. **Whitespace First** - Clean white backgrounds with crisp borders
2. **Card-Based Layout** - Everything lives in subtle shadow cards
3. **Semantic Color Coding** - Google colors used functionally
4. **Typography** - 600-700 weight headings, 400 weight body
5. **Micro-interactions** - Smooth transitions and hover effects

## 📝 License

MIT
