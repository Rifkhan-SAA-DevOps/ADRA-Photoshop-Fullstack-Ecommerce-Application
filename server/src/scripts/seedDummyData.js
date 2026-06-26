import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { TABLES, now, putItem } from "../config/db.js";

dotenv.config();

const createdAt = now();

function futureDate(days, hour = 10) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
}

async function seedProducts() {
  const products = [
    {
      id: "product_001",
      name: "Premium Photo Frame",
      slug: "premium-photo-frame-00001",
      category: "Photo frames",
      category_status: "Photo frames#active",
      description: "Modern wall photo frame for family, wedding, and studio portraits.",
      price: 2500,
      cover_image:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
      status: "active",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "product_002",
      name: "Customized Photo Mug",
      slug: "customized-photo-mug-00002",
      category: "Mugs",
      category_status: "Mugs#active",
      description: "Personalized printed mug for gifts, birthdays, and special memories.",
      price: 1800,
      cover_image:
        "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=1200&auto=format&fit=crop",
      status: "active",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "product_003",
      name: "Wedding Album Classic",
      slug: "wedding-album-classic-00003",
      category: "Wedding Album",
      category_status: "Wedding Album#offer",
      description: "Elegant wedding album package with premium photo printing.",
      price: 15000,
      cover_image:
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop",
      status: "offer",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "product_004",
      name: "Engraved Key Tag",
      slug: "engraved-key-tag-00004",
      category: "Key tag - Engrave",
      category_status: "Key tag - Engrave#active",
      description: "Creative engraved key tag with name, logo, or special message.",
      price: 650,
      cover_image:
        "https://images.unsplash.com/photo-1603575448878-868a20723f5d?q=80&w=1200&auto=format&fit=crop",
      status: "active",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "product_005",
      name: "Custom Event Banner",
      slug: "custom-event-banner-00005",
      category: "Banner",
      category_status: "Banner#active",
      description: "High-quality banner printing for events, shops, and promotions.",
      price: 4500,
      cover_image:
        "https://images.unsplash.com/photo-1505236858219-8359eb29e329?q=80&w=1200&auto=format&fit=crop",
      status: "active",
      created_at: createdAt,
      updated_at: createdAt,
    },
  ];

  for (const product of products) {
    await putItem(TABLES.products, product);
  }
}

async function seedProductImages() {
  const images = [
    {
      id: "pimg_001",
      product_id: "product_001",
      image_url:
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop",
      caption: "Photo frame display",
      created_at: createdAt,
    },
    {
      id: "pimg_002",
      product_id: "product_002",
      image_url:
        "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?q=80&w=1200&auto=format&fit=crop",
      caption: "Printed mug design",
      created_at: createdAt,
    },
    {
      id: "pimg_003",
      product_id: "product_003",
      image_url:
        "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1200&auto=format&fit=crop",
      caption: "Wedding album sample",
      created_at: createdAt,
    },
    {
      id: "pimg_004",
      product_id: "product_004",
      image_url:
        "https://images.unsplash.com/photo-1603575448878-868a20723f5d?q=80&w=1200&auto=format&fit=crop",
      caption: "Key tag sample",
      created_at: createdAt,
    },
    {
      id: "pimg_005",
      product_id: "product_005",
      image_url:
        "https://images.unsplash.com/photo-1505236858219-8359eb29e329?q=80&w=1200&auto=format&fit=crop",
      caption: "Banner print sample",
      created_at: createdAt,
    },
  ];

  for (const image of images) {
    await putItem(TABLES.productImages, image);
  }
}

async function seedServices() {
  const services = [
    {
      id: "service_001",
      title: "Wedding Photography",
      slug: "wedding-photography-00001",
      category: "Photography",
      category_status: "Photography#active",
      short_description: "Creative wedding coverage for your special day.",
      description: "Full wedding photography package with ceremony, couple shoot, family photos, and edited digital delivery.",
      price_from: 45000,
      cover_image:
        "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
      is_featured: true,
      status: "active",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "service_002",
      title: "Convocation Photography",
      slug: "convocation-photography-00002",
      category: "Convocation",
      category_status: "Convocation#active",
      short_description: "University convocation photo coverage.",
      description: "Professional graduation and convocation photography for students, families, and university events.",
      price_from: 8000,
      cover_image:
        "https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?q=80&w=1200&auto=format&fit=crop",
      is_featured: true,
      status: "active",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "service_003",
      title: "Portrait Studio Shoot",
      slug: "portrait-studio-shoot-00003",
      category: "Studio",
      category_status: "Studio#active",
      short_description: "Modern portrait photography for individuals and families.",
      description: "Creative indoor studio shoot with lighting setup, retouching, and digital delivery.",
      price_from: 6000,
      cover_image:
        "https://images.unsplash.com/photo-1504257432389-52343af06ae3?q=80&w=1200&auto=format&fit=crop",
      is_featured: false,
      status: "active",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "service_004",
      title: "Photo Editing",
      slug: "photo-editing-00004",
      category: "Editing",
      category_status: "Editing#active",
      short_description: "Photo retouching, background change, and restoration.",
      description: "Professional digital editing service for portraits, events, old photos, and product images.",
      price_from: 1000,
      cover_image:
        "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?q=80&w=1200&auto=format&fit=crop",
      is_featured: false,
      status: "active",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "service_005",
      title: "Videography Package",
      slug: "videography-package-00005",
      category: "Videography",
      category_status: "Videography#active",
      short_description: "Cinematic video coverage for events.",
      description: "Video coverage for weddings, parties, convocations, and business events with editing support.",
      price_from: 35000,
      cover_image:
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop",
      is_featured: true,
      status: "active",
      created_at: createdAt,
      updated_at: createdAt,
    },
  ];

  for (const service of services) {
    await putItem(TABLES.services, service);
  }
}

async function seedServiceImages() {
  const images = [
    {
      id: "simg_001",
      service_id: "service_001",
      image_url:
        "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1200&auto=format&fit=crop",
      caption: "Wedding photography",
      created_at: createdAt,
    },
    {
      id: "simg_002",
      service_id: "service_002",
      image_url:
        "https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?q=80&w=1200&auto=format&fit=crop",
      caption: "Convocation photography",
      created_at: createdAt,
    },
    {
      id: "simg_003",
      service_id: "service_003",
      image_url:
        "https://images.unsplash.com/photo-1504257432389-52343af06ae3?q=80&w=1200&auto=format&fit=crop",
      caption: "Portrait session",
      created_at: createdAt,
    },
    {
      id: "simg_004",
      service_id: "service_004",
      image_url:
        "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?q=80&w=1200&auto=format&fit=crop",
      caption: "Editing workspace",
      created_at: createdAt,
    },
    {
      id: "simg_005",
      service_id: "service_005",
      image_url:
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1200&auto=format&fit=crop",
      caption: "Videography package",
      created_at: createdAt,
    },
  ];

  for (const image of images) {
    await putItem(TABLES.serviceImages, image);
  }
}

async function seedEvents() {
  const events = [
    {
      id: "event_001",
      title: "University Convocation Coverage",
      slug: "university-convocation-coverage-00001",
      category: "Convocation",
      category_status: "Convocation#upcoming",
      event_date: futureDate(7, 9),
      location: "South Eastern University",
      promotional_message: "Book your convocation photo package early and save your graduation memories.",
      description: "We will provide photography, family portraits, album orders, and instant frame booking.",
      cover_image:
        "https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?q=80&w=1200&auto=format&fit=crop",
      status: "upcoming",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "event_002",
      title: "Wedding Expo Weekend",
      slug: "wedding-expo-weekend-00002",
      category: "Wedding",
      category_status: "Wedding#upcoming",
      event_date: futureDate(14, 10),
      location: "Colombo Event Hall",
      promotional_message: "Visit us for wedding album, frame, and photography offers.",
      description: "Special wedding packages and album samples will be available.",
      cover_image:
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200&auto=format&fit=crop",
      status: "upcoming",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "event_003",
      title: "School Prize Giving Photography",
      slug: "school-prize-giving-photography-00003",
      category: "School",
      category_status: "School#upcoming",
      event_date: futureDate(20, 8),
      location: "Central College Auditorium",
      promotional_message: "Professional school event coverage and printed photo packages.",
      description: "Event photography service for school celebrations and official functions.",
      cover_image:
        "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=1200&auto=format&fit=crop",
      status: "upcoming",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "event_004",
      title: "Birthday Mini Shoot Day",
      slug: "birthday-mini-shoot-day-00004",
      category: "Birthday",
      category_status: "Birthday#upcoming",
      event_date: futureDate(30, 15),
      location: "ADRA Studio",
      promotional_message: "Mini birthday shoot package with edited photos and frame offer.",
      description: "A special day for birthday portrait sessions and small family shoots.",
      cover_image:
        "https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=1200&auto=format&fit=crop",
      status: "upcoming",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "event_005",
      title: "Business Branding Shoot",
      slug: "business-branding-shoot-00005",
      category: "Business",
      category_status: "Business#upcoming",
      event_date: futureDate(45, 11),
      location: "ADRA Studio",
      promotional_message: "Professional photos for business pages, websites, and product promotions.",
      description: "Branding and profile photography for entrepreneurs and small businesses.",
      cover_image:
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop",
      status: "upcoming",
      created_at: createdAt,
      updated_at: createdAt,
    },
  ];

  for (const event of events) {
    await putItem(TABLES.events, event);
  }
}

async function seedEventImages() {
  const images = [
    {
      id: "eimg_001",
      event_id: "event_001",
      image_url:
        "https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?q=80&w=1200&auto=format&fit=crop",
      caption: "Convocation coverage",
      created_at: createdAt,
    },
    {
      id: "eimg_002",
      event_id: "event_002",
      image_url:
        "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=1200&auto=format&fit=crop",
      caption: "Wedding expo",
      created_at: createdAt,
    },
    {
      id: "eimg_003",
      event_id: "event_003",
      image_url:
        "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?q=80&w=1200&auto=format&fit=crop",
      caption: "School event",
      created_at: createdAt,
    },
    {
      id: "eimg_004",
      event_id: "event_004",
      image_url:
        "https://images.unsplash.com/photo-1531058020387-3be344556be6?q=80&w=1200&auto=format&fit=crop",
      caption: "Birthday event",
      created_at: createdAt,
    },
    {
      id: "eimg_005",
      event_id: "event_005",
      image_url:
        "https://images.unsplash.com/photo-1497366754035-f200968a6e72?q=80&w=1200&auto=format&fit=crop",
      caption: "Business shoot",
      created_at: createdAt,
    },
  ];

  for (const image of images) {
    await putItem(TABLES.eventImages, image);
  }
}

async function seedBookings() {
  const bookings = [
    {
      id: "booking_001",
      event_id: "event_001",
      event_title: "University Convocation Coverage",
      customer_name: "Fathima Rifka",
      email: "rifka@example.com",
      phone: "+94771234567",
      service_needed: "Convocation photography",
      message: "I need individual and family photos after the ceremony.",
      status: "new",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "booking_002",
      event_id: "event_002",
      event_title: "Wedding Expo Weekend",
      customer_name: "Mohammed Azeem",
      email: "azeem@example.com",
      phone: "+94779876543",
      service_needed: "Wedding album package",
      message: "Please share wedding album package details.",
      status: "new",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "booking_003",
      event_id: "event_003",
      event_title: "School Prize Giving Photography",
      customer_name: "Nimal Perera",
      email: "nimal@example.com",
      phone: "+94770001122",
      service_needed: "School event coverage",
      message: "Need full event photography for school prize giving.",
      status: "contacted",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "booking_004",
      event_id: "event_004",
      event_title: "Birthday Mini Shoot Day",
      customer_name: "Ayesha Khan",
      email: "ayesha@example.com",
      phone: "+94775551234",
      service_needed: "Birthday shoot",
      message: "Need a mini shoot for my daughter.",
      status: "new",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "booking_005",
      event_id: "event_005",
      event_title: "Business Branding Shoot",
      customer_name: "Sahan Silva",
      email: "sahan@example.com",
      phone: "+94774443322",
      service_needed: "Business branding photos",
      message: "Need photos for my website and LinkedIn.",
      status: "completed",
      created_at: createdAt,
      updated_at: createdAt,
    },
  ];

  for (const booking of bookings) {
    await putItem(TABLES.bookings, booking);
  }
}

async function seedContacts() {
  const contacts = [
    {
      id: "contact_001",
      name: "Hafsa",
      email: "hafsa@example.com",
      phone: "+94771110001",
      service_type: "Photo frames",
      message: "I want to know frame sizes and prices.",
      status: "new",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "contact_002",
      name: "Imran",
      email: "imran@example.com",
      phone: "+94771110002",
      service_type: "Mugs",
      message: "Can you print a photo on a mug?",
      status: "new",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "contact_003",
      name: "Rizana",
      email: "rizana@example.com",
      phone: "+94771110003",
      service_type: "Wedding Album",
      message: "Please send album package details.",
      status: "contacted",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "contact_004",
      name: "Kavindu",
      email: "kavindu@example.com",
      phone: "+94771110004",
      service_type: "Banner",
      message: "Need banner design and printing.",
      status: "new",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "contact_005",
      name: "Farzana",
      email: "farzana@example.com",
      phone: "+94771110005",
      service_type: "Portrait Studio Shoot",
      message: "Need a family portrait session.",
      status: "completed",
      created_at: createdAt,
      updated_at: createdAt,
    },
  ];

  for (const contact of contacts) {
    await putItem(TABLES.contacts, contact);
  }
}

async function seedReviews() {
  const reviews = [
    {
      id: "review_001",
      product_id: "product_001",
      customer_name: "Nusra",
      rating: 5,
      comment: "Beautiful frame quality and very neat finishing.",
      is_approved: true,
      approval_status: "approved",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "review_002",
      product_id: "product_002",
      customer_name: "Fazil",
      rating: 4,
      comment: "Mug print quality was good and delivery was fast.",
      is_approved: true,
      approval_status: "approved",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "review_003",
      product_id: "product_003",
      customer_name: "Rifka",
      rating: 5,
      comment: "The album design looked premium and elegant.",
      is_approved: false,
      approval_status: "pending",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "review_004",
      product_id: "product_004",
      customer_name: "Azeem",
      rating: 5,
      comment: "Nice engraved key tag. Good gift idea.",
      is_approved: false,
      approval_status: "pending",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "review_005",
      product_id: "product_005",
      customer_name: "Siva",
      rating: 4,
      comment: "Banner colors were bright and attractive.",
      is_approved: true,
      approval_status: "approved",
      created_at: createdAt,
      updated_at: createdAt,
    },
  ];

  for (const review of reviews) {
    await putItem(TABLES.reviews, review);
  }
}

async function seedCustomers() {
  const customers = [
    {
      id: "customer_001",
      name: "Fathima Rifka",
      email: "rifka@example.com",
      phone: "+94771234567",
      address: "Colombo, Sri Lanka",
      notes: "Interested in convocation photography.",
      status: "active",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "customer_002",
      name: "Mohammed Azeem",
      email: "azeem@example.com",
      phone: "+94779876543",
      address: "Kandy, Sri Lanka",
      notes: "Asked about wedding album package.",
      status: "active",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "customer_003",
      name: "Hafsa",
      email: "hafsa@example.com",
      phone: "+94771110001",
      address: "Galle, Sri Lanka",
      notes: "Interested in photo frames.",
      status: "active",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "customer_004",
      name: "Imran",
      email: "imran@example.com",
      phone: "+94771110002",
      address: "Batticaloa, Sri Lanka",
      notes: "Interested in customized mugs.",
      status: "active",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "customer_005",
      name: "Sahan Silva",
      email: "sahan@example.com",
      phone: "+94774443322",
      address: "Colombo, Sri Lanka",
      notes: "Business branding photo inquiry.",
      status: "active",
      created_at: createdAt,
      updated_at: createdAt,
    },
  ];

  for (const customer of customers) {
    await putItem(TABLES.customers, customer);
  }
}

async function seedSettings() {
  const settings = [
    {
      id: "business_profile",
      business_name: "ADRA Photography Studio",
      phone: "+94770000000",
      email: "info@adra.com",
      address: "Colombo, Sri Lanka",
      whatsapp: "+94770000000",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "social_links",
      facebook: "https://facebook.com/adra",
      instagram: "https://instagram.com/adra",
      tiktok: "https://tiktok.com/@adra",
      youtube: "https://youtube.com/@adra",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "homepage_stats",
      moments: "500+",
      events: "50+",
      rating: "4.9",
      customers: "300+",
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "notification_settings",
      admin_phone: "+94770000000",
      enable_sms: false,
      enable_email: true,
      created_at: createdAt,
      updated_at: createdAt,
    },
    {
      id: "theme_settings",
      primary_color: "pink",
      secondary_color: "violet",
      mode: "dark",
      created_at: createdAt,
      updated_at: createdAt,
    },
  ];

  for (const setting of settings) {
    await putItem(TABLES.settings, setting);
  }
}

async function main() {
  console.log("Seeding dummy data...");

  
  await seedProducts();
  await seedProductImages();
  await seedServices();
  await seedServiceImages();
  await seedEvents();
  await seedEventImages();
  await seedBookings();
  await seedContacts();
  await seedReviews();
  await seedCustomers();
  await seedSettings();

  console.log("Dummy data inserted successfully.");

}

main().catch((error) => {
  console.error("Failed to seed dummy data:");
  console.error(error);
  process.exit(1);
});