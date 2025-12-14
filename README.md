# 🎁 Family Gifting Registry

An AI-powered web application that helps families manage a registry of items available for gifting. Upload photos, let Google Cloud Vision AI automatically tag them, and search conversationally to find the perfect gift!

## ✨ Features

- **📸 Photo Upload**: Simple drag-and-drop interface to upload photos of items
- **🤖 AI Auto-Tagging**: Google Cloud Vision API automatically categorizes items, detects age appropriateness, and extracts keywords
- **💬 Conversational Search**: Natural language search like "What can we gift a 6-year-old?" or "Show me educational toys"
- **✏️ Manual Editing**: Admin form to refine AI-generated tags and add custom information
- **🏷️ Smart Taxonomy**: Age ranges, categories, themes, keywords, location tracking, and availability status
- **📊 Full-Text Search**: PostgreSQL-powered search with intelligent filtering

## 🏗️ Tech Stack

### Frontend
- **React** - UI framework
- **React Router** - Navigation
- **Axios** - HTTP client
- **CSS3** - Styling with modern gradients and animations

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **PostgreSQL** - Relational database with full-text search
- **Google Cloud Vision API** - Image analysis and auto-tagging
- **Multer** - File upload handling

## 📁 Project Structure

```
gifting-registry/
├── backend/
│   ├── src/
│   │   ├── config/         # Database config & migrations
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Upload middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Vision AI & search services
│   │   └── server.js       # Express server
│   ├── uploads/            # Photo storage
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API client
│   │   ├── styles/         # CSS files
│   │   ├── App.js          # Main app component
│   │   └── index.js        # Entry point
│   └── package.json
└── package.json            # Root package (monorepo)
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v13 or higher)
- Google Cloud Platform account with Vision API enabled
- Google Cloud service account credentials

### 1. Clone the Repository

```bash
git clone <repository-url>
cd gifting-registry
```

### 2. Set Up Google Cloud Vision API

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the **Cloud Vision API**
3. Create a service account and download the JSON key file
4. Save the key file in the backend directory

### 3. Set Up PostgreSQL Database

```bash
# Create database
createdb gifting_registry

# Or using psql
psql -U postgres
CREATE DATABASE gifting_registry;
\q
```

### 4. Configure Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
cp .env.example backend/.env
```

Edit `backend/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password
DB_NAME=gifting_registry

# Server
PORT=5000
NODE_ENV=development

# Google Cloud Vision API
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

### 5. Install Dependencies

```bash
# Install all dependencies (backend + frontend)
npm run install:all

# Or install separately
npm install --prefix backend
npm install --prefix frontend
```

### 6. Run Database Migrations

```bash
npm run db:migrate --prefix backend
```

### 7. Start the Application

#### Development Mode (both servers concurrently)

```bash
npm run dev
```

This starts:
- Backend API server on `http://localhost:5000`
- Frontend dev server on `http://localhost:3000`

#### Or start separately

```bash
# Terminal 1 - Backend
npm run dev:backend

# Terminal 2 - Frontend
npm run dev:frontend
```

### 8. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## 📖 Usage Guide

### Uploading Items

1. Click on **"📸 Upload Items"** tab
2. Select one or multiple photos
3. Click **"Upload & Auto-Tag"**
4. The AI will automatically analyze and tag your items
5. Review the AI-generated tags

### Searching for Gifts

1. Click on **"🔍 Search Gifts"** tab
2. Type a natural language query like:
   - "What can we gift a 6-year-old?"
   - "Show me educational toys"
   - "Gifts for grandmother"
   - "What books do we have?"
3. View the filtered results

### Managing Items

1. Click on **"📦 Browse All"** tab
2. Use filters to narrow down items
3. Click **"✏️ Edit"** to modify item details
4. Click **"🗑️ Delete"** to remove items

### Editing Item Details

You can manually refine:
- **Category**: Change the auto-detected category
- **Age Ranges**: Select multiple age appropriateness tags
- **Themes**: Add interests (educational, creative, outdoor, etc.)
- **Keywords**: Add or remove search keywords
- **Location**: Specify where the item is stored
- **Availability**: Mark as available, reserved, or gifted
- **Condition**: Set item condition (new, like-new, gently-used, vintage)
- **Notes**: Add custom notes or gift history

## 🎯 Taxonomy Reference

### Age Ranges
- `baby` (0-2 years)
- `young-child` (3-6 years)
- `older-child` (7-12 years)
- `teen` (13-17 years)
- `adult` (18+ years)
- `any-age` (universal items)

### Categories
- Toys
- Games & Puzzles
- Books
- Kitchen
- Home Decor
- Electronics
- Clothing & Accessories
- Stationery & Craft
- Sports & Outdoors
- Collectibles
- Wellness & Beauty
- Other

### Themes
- Educational
- Creative
- Outdoor
- Indoor
- Tech
- Cooking
- Reading
- Music
- Art
- Science
- Animals
- Vehicles

### Availability Status
- `available` - Ready to gift
- `reserved` - Earmarked for someone
- `gifted` - Already given away

## 🔧 API Endpoints

### Items

- `POST /api/items/upload` - Upload photos and create item
- `GET /api/items` - Get all items (with filters)
- `GET /api/items/:id` - Get single item
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Delete item
- `POST /api/items/search` - Conversational search
- `POST /api/items/:id/gift` - Record gift history

## 🎨 Key Features Explained

### AI Auto-Tagging

The Google Cloud Vision API performs:
- **Label Detection**: Identifies objects and concepts
- **Object Localization**: Detects specific objects in images
- **Text Detection**: Extracts text (for brands, book titles, etc.)
- **Color Detection**: Identifies dominant colors

This data is intelligently processed to:
- Categorize items automatically
- Estimate age appropriateness
- Generate descriptive keywords
- Detect themes and interests

### Conversational Search

The search system parses natural language queries to extract:
- Age-related keywords → filters by age range
- Category mentions → filters by category
- Theme keywords → filters by themes
- Plus full-text search across descriptions and keywords

### PostgreSQL Full-Text Search

Uses PostgreSQL's built-in capabilities:
- `tsvector` for indexed search
- Weighted search (category > keywords > description > notes)
- GIN indexes for array fields
- Automatic search vector updates via triggers

## 🛠️ Development

### Backend Scripts

```bash
npm run dev           # Start development server with nodemon
npm run start         # Start production server
npm run db:migrate    # Run database migrations
```

### Frontend Scripts

```bash
npm run start         # Start development server
npm run build         # Create production build
npm run test          # Run tests
```

## 📝 Future Enhancements

- [ ] Multi-user authentication and authorization
- [ ] Photo galleries with multiple images per item
- [ ] Gift recommendation engine
- [ ] Email notifications for reserved/gifted items
- [ ] Export functionality (CSV, PDF)
- [ ] Mobile app (React Native)
- [ ] Barcode/QR code scanning
- [ ] Integration with wish lists
- [ ] Gift history analytics and insights

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

- Google Cloud Vision API for powerful image analysis
- PostgreSQL for robust full-text search capabilities
- React community for excellent frontend tools

---

Built with ❤️ for families who love giving the perfect gifts!
