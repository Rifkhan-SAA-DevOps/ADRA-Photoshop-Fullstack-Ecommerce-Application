# Photography Shop Website

A complete full-stack starter website for a photography shop/studio business.

## Tech Stack

- Frontend: React + Vite
- Styling: Tailwind CSS
- Animation: Framer Motion
- Backend: Node.js + Express.js
- Database: MySQL / Amazon RDS MySQL compatible
- Authentication: JWT for admin dashboard
- Image Uploads: Multer local upload storage for development
- Notifications: Optional Twilio SMS/WhatsApp notification for admin phone number

## Main Features

### Public Website

- Modern animated home page
- Responsive layout for mobile, tablet, and desktop
- Hero section with moving photography-style visuals
- Services page and service detail pages
- Products page and product detail pages
- Customer reviews for products
- Events page for upcoming events such as university convocation photography
- Event booking/request form
- Contact/service request form
- WhatsApp contact button
- Gallery page

### Admin Dashboard

- Admin login
- Dashboard count summary
- Add/edit/delete services
- Add/edit/delete products
- Add/edit/delete events
- Upload images
- View and update contact requests
- View and update event bookings
- Approve/delete customer reviews
- Update site settings such as admin phone number

## Folder Structure

```text
photography-shop-website/
├── client/              # React + Vite frontend
├── server/              # Node + Express backend
├── database/schema.sql  # MySQL/RDS database schema
├── .env.example         # Root environment sample
└── README.md
```

## How to Run Locally

### 1. Create MySQL/RDS Database

Create a database called:

```sql
CREATE DATABASE photography_shop;
```

Then run the SQL script:

```bash
mysql -u root -p photography_shop < database/schema.sql
```

For Amazon RDS, copy the RDS endpoint into `server/.env` as `DB_HOST`.

### 2. Configure Backend

```bash
cd server
cp .env.example .env
npm install
```

Edit `server/.env`:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=photography_shop
JWT_SECRET=change_this_secret
ADMIN_NOTIFY_PHONE=+947XXXXXXXX
```

### 3. Create Admin User

```bash
npm run seed:admin
```

Default seed details can be changed in `server/.env`:

```env
ADMIN_NAME=Studio Admin
ADMIN_EMAIL=admin@studio.com
ADMIN_PASSWORD=admin12345
```

### 4. Run Backend

```bash
npm run dev
```

Backend runs at:

```text
http://localhost:5000
```

### 5. Configure Frontend

Open a new terminal:

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Frontend runs at:

```text
http://localhost:5173
```

## Optional Twilio Notification Setup

The contact and booking forms save requests into the database. If Twilio settings are added, the backend can also send a notification to the admin phone number.

Add these values to `server/.env`:

```env
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM=+1XXXXXXXXXX
ADMIN_NOTIFY_PHONE=+947XXXXXXXX
```

For WhatsApp through Twilio, use WhatsApp-enabled values such as:

```env
TWILIO_FROM=whatsapp:+14155238886
ADMIN_NOTIFY_PHONE=whatsapp:+947XXXXXXXX
```

Without Twilio, the form still works and the request appears in the admin dashboard.

## Production Notes

For production deployment:

- Use Amazon RDS MySQL for the database.
- Use AWS S3 instead of local upload storage for images.
- Deploy frontend to Vercel, Netlify, or S3 + CloudFront.
- Deploy backend to Render, Railway, EC2, or Elastic Beanstalk.
- Use strong JWT secrets and strong admin passwords.
- Enable HTTPS.

## Important

This is a starter project. Before production use, add stronger validation, rate limiting, image optimization, S3 upload support, payment gateway if required, and backup policies for the database.
