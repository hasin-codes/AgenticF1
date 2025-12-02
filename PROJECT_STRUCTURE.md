# F1 Telemetry Analysis - Project Structure

## 📁 Root Directory
```
f1-tele/
├── 📂 .git/                      # Git version control
├── 📂 .next/                     # Next.js build output (auto-generated)
├── 📂 node_modules/              # Dependencies (auto-generated)
│
├── 📂 app/                       # Next.js App Router
│   ├── favicon.ico               # App favicon
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── 📂 components/                # React components
│   ├── 📂 ui/                    # shadcn/ui components
│   │   ├── avatar.tsx            # Avatar component
│   │   ├── button.tsx            # Button component
│   │   ├── dialog.tsx            # Dialog component
│   │   ├── dropdown-menu.tsx     # Dropdown menu component
│   │   ├── expandable-screen.tsx # Expandable screen component
│   │   ├── input.tsx             # Input component
│   │   ├── scroll-area.tsx       # Scroll area component
│   │   ├── select.tsx            # Select component
│   │   ├── separator.tsx         # Separator component
│   │   ├── sheet.tsx             # Sheet component
│   │   ├── sidebar.tsx           # Sidebar component
│   │   ├── skeleton.tsx          # Skeleton component
│   │   ├── textarea.tsx          # Textarea component
│   │   └── tooltip.tsx           # Tooltip component
│   │
│   ├── 📂 features/              # Feature-specific components
│   │   └── (empty directory)     # Placeholder for feature components
│   │
│   ├── 📂 kokonutui/             # KokonutUI components
│   │   ├── ai-prompt.tsx         # AI prompt input
│   │   ├── anthropic.tsx         # Anthropic branding
│   │   ├── anthropic-dark.tsx    # Anthropic dark branding
│   │   ├── gemini.tsx            # Gemini branding
│   │   └── profile-dropdown.tsx  # KokonutUI profile dropdown
│   │
│   ├── 📂 smoothui/              # SmoothUI components
│   │   └── 📂 basic-dropdown/
│   │       └── index.tsx         # Basic dropdown component
│   │
│   ├── app-sidebar.tsx           # Main application sidebar
│   ├── chat-interface.tsx        # Chat interface component
│   ├── profile-dropdown.tsx      # User profile dropdown
│   ├── telemetry-panel.tsx       # Telemetry panel component
│   └── top-bar.tsx               # Top navigation bar
│
├── 📂 hooks/                     # Custom React hooks
│   ├── use-auto-resize-textarea.ts # Auto-resizing textarea
│   └── use-mobile.ts             # Mobile detection hook
│
├── 📂 lib/                       # Utilities and configurations
│   └── utils.ts                  # Utility functions
│
├── 📂 public/                    # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── 📄 .gitignore                 # Git ignore rules
├── 📄 README.md                  # Project documentation
├── 📄 PROJECT_STRUCTURE.md       # Project structure documentation
├── 📄 components.json            # shadcn/ui configuration
├── 📄 eslint.config.mjs          # ESLint configuration
├── 📄 next.config.ts             # Next.js configuration
├── 📄 package.json               # Dependencies and scripts
├── 📄 package-lock.json          # Locked dependency versions
├── 📄 postcss.config.mjs         # PostCSS configuration
└── 📄 tsconfig.json              # TypeScript configuration
```

## 🎨 Design System

### **Typography**
- **Headings**: Geist Sans (variable font)
- **Body**: Geist Sans (variable font)
- **Mono**: Geist Mono (variable font)

### **Color Palette** (Apple-inspired)
- **Background**: Pure white/black (theme-dependent)
- **Surfaces**: Refined grays with transparency
- **Text**: High contrast foreground
- **Primary**: Apple Blue (#0a84ff)
- **Destructive**: Apple Red (#ff453a)

### **Components**
- **Glassmorphism**: Backdrop blur with semi-transparent surfaces
- **shadcn/ui**: Production-ready accessible components
- **Floaty Design**: Elevated components with shadows

## 🏗️ Architecture

### **Technology Stack**
- **Framework**: Next.js 16 (App Router)
- **UI**: React 19
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui + Radix UI

### **Application Structure**
- **Dashboard Layout**: Main application interface with sidebar
- **Component-based Organization**: Components grouped by functionality
- **Type Safety**: Comprehensive TypeScript definitions
- **Responsive Design**: Mobile-first approach

### **Main Features**
1. **Sidebar**: Navigation and chat history
2. **Top Bar**: Context controls
3. **Chat Interface**: AI-powered F1 analysis
4. **Telemetry Panel**: Data visualization & charts

### **Key Files**
- `app/page.tsx` - Main page
- `app/layout.tsx` - Root layout with fonts
- `app/globals.css` - Design system & theme
- `components/app-sidebar.tsx` - Sidebar component
- `components/chat-interface.tsx` - Chat interface
- `components/telemetry-panel.tsx` - Telemetry panel
- `lib/utils.ts` - Utility functions

## 📊 Data Flow

### **Telemetry Data**
- Telemetry panel component in `components/telemetry-panel.tsx`
- Visualization components to be added in `components/features/`

### **Chat Interface**
- Chat interface component in `components/chat-interface.tsx`
- AI integration through `components/kokonutui/ai-prompt.tsx`

### **State Management**
- Local component state with React hooks
- No global state management (currently)
- Props drilling for shared state

## 🚀 Development Guidelines

### **Component Organization**
- Feature-based grouping for better maintainability
- Separation of layout and feature components
- Vendor components isolated in separate directory

### **Type Safety**
- Comprehensive TypeScript definitions
- Interface exports for all data structures
- Strict type checking enabled

### **Styling Approach**
- Utility-first with Tailwind CSS
- Component variants with class-variance-authority
- Consistent design tokens in CSS variables

### **Performance Considerations**
- Code splitting with dynamic imports
- Optimized images with Next.js Image component
- Efficient re-renders with React.memo where appropriate
