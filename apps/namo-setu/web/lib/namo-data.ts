import {
  BedDouble,
  Bell,
  CalendarCheck,
  HeartHandshake,
  LayoutDashboard,
  Map,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

export const navItems = [
  { href: "/", label: "Landing", icon: LayoutDashboard },
  { href: "/search", label: "Temple Search", icon: Search },
  { href: "/booking", label: "Booking", icon: CalendarCheck },
  { href: "/donation", label: "Donation", icon: HeartHandshake },
  { href: "/accommodation", label: "Accommodation", icon: BedDouble },
  { href: "/travel", label: "Travel Planner", icon: Map },
  { href: "/profile", label: "Profile", icon: UserRound },
  { href: "/dashboard", label: "Dashboard", icon: Bell },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
] as const;

export const heroImage =
  "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1800&q=80";

export const templeDetails = {
  timings: [
    { pooja: "Morning darshan", time: "05:00 - 11:30" },
    { pooja: "Afternoon break", time: "11:30 - 12:30" },
    { pooja: "Evening darshan", time: "12:30 - 22:30" },
  ],
  festivals: [
    { name: "Shravan Somvar", date: "Jul-Aug", description: "Most sacred month for Lord Shiva", duration: "1 month" },
    { name: "Mahashivratri", date: "Feb-Mar", description: "Great Night of Lord Shiva", duration: "1 day" },
    { name: "Dev Deepawali", date: "Nov", description: "Festival of Lights at Varanasi", duration: "3 days" },
  ],
  events: [
    { name: "Morning Aarti", type: "Daily", date: "Every day", time: "05:30", description: "Sacred morning ritual" },
    { name: "Evening Aarti", type: "Daily", date: "Every day", time: "19:00", description: "Sacred evening ritual" },
    { name: "Special Pujas", type: "Weekly", date: "Monday", time: "Varies", description: "Special Monday pujas" },
  ],
  attractions: [
    { name: "Dashashwamedh Ghat", distance: "0.5 km", description: "Famous for Ganga Aarti", category: "Ghat" },
    { name: "Annapurna Temple", distance: "1.2 km", description: "Temple of Goddess Annapurna", category: "Temple" },
    { name: "Manikarnika Heritage Walk", distance: "0.8 km", description: "Historical walking tour", category: "Heritage" },
  ],
  reviews: [
    { name: "Aarav Sharma", rating: 5, text: "Slot confirmation and QR entry made the visit calm despite heavy evening crowds." },
    { name: "Meera Iyer", rating: 5, text: "The guide handled accessibility and prasad pickup beautifully for our parents." },
  ],
};

export const temples = [
  {
    id: "kashi-vishwanath",
    name: "Shri Kashi Vishwanath",
    deity: "Lord Shiva",
    city: "Varanasi",
    state: "Uttar Pradesh",
    category: "Jyotirlinga",
    rating: 4.9,
    reviews: 18420,
    reviewCount: 18420,
    userReviews: templeDetails.reviews,
    distance: "2.4 km from Varanasi Junction",
    crowd: "High",
    dailyVisitors: 50000,
    image: heroImage,
    darshan: "05:00 - 22:30",
    nextSlot: "Today 18:30",
    bestTimeToVisit: "October to March",
    dressCode: "Traditional Indian attire preferred",
    estimatedTime: "2-3 hours",
    address: "Vishwanath Gali, Varanasi, Uttar Pradesh 221001",
    phone: "+91-542-2312345",
    website: "www.shrikashivishwanath.org",
    email: "info@shrikashivishwanath.org",
    architecture: "North Indian Nagara style",
    significance: "One of the 12 Jyotirlingas",
    builtIn: "18th century",
    amenities: ["Shoe storage", "Prasad counter", "Drinking water", "Wheelchair access"],
    timings: templeDetails.timings,
    festivals: templeDetails.festivals,
    events: templeDetails.events,
    nearbyAttractions: templeDetails.attractions,
    description:
      "A flagship Shiva pilgrimage route with managed darshan slots, verified puja packages, nearby ghats, and guided old-city walks.",
    highlights: ["Sugam darshan", "Ganga aarti route", "Senior-friendly support", "Verified pandits"],
    festival: "Shravan Somvar",
    latitude: 25.3109,
    longitude: 83.0107,
  },
  {
    id: "mahakaleshwar",
    name: "Mahakaleshwar Jyotirlinga",
    deity: "Lord Shiva",
    city: "Ujjain",
    state: "Madhya Pradesh",
    category: "Jyotirlinga",
    rating: 4.8,
    reviews: 12980,
    reviewCount: 12980,
    userReviews: templeDetails.reviews,
    distance: "1.8 km from Ujjain Junction",
    crowd: "Medium",
    dailyVisitors: 30000,
    image: "https://images.unsplash.com/photo-1598091383021-15ddea10925d?auto=format&fit=crop&w=1400&q=80",
    darshan: "04:00 - 23:00",
    nextSlot: "Tomorrow 06:00",
    bestTimeToVisit: "October to March",
    dressCode: "Traditional Indian attire preferred",
    estimatedTime: "2-3 hours",
    address: "Mahakal Temple Road, Ujjain, Madhya Pradesh 456001",
    phone: "+91-734-2523456",
    website: "www.mahakaleshwar.org",
    email: "info@mahakaleshwar.org",
    architecture: "Bhumija style",
    significance: "One of the 12 Jyotirlingas",
    builtIn: "4th-5th century",
    amenities: ["Shoe storage", "Prasad counter", "Drinking water", "Wheelchair access"],
    timings: templeDetails.timings,
    festivals: [
      { name: "Mahashivratri", date: "Feb-Mar", description: "Great Night of Lord Shiva", duration: "1 day" },
      { name: "Kartik Purnima", date: "Nov", description: "Sacred full moon day", duration: "1 day" },
      { name: "Shravan Month", date: "Jul-Aug", description: "Most sacred month", duration: "1 month" },
    ],
    events: [
      { name: "Bhasma Aarti", type: "Daily", date: "Every day", time: "04:00", description: "Sacred bhasma aarti ritual" },
      { name: "Morning Aarti", type: "Daily", date: "Every day", time: "06:00", description: "Morning prayer ritual" },
      { name: "Evening Aarti", type: "Daily", date: "Every day", time: "19:00", description: "Evening prayer ritual" },
    ],
    nearbyAttractions: [
      { name: "Ram Ghat", distance: "1.5 km", description: "Sacred river bank", category: "Ghat" },
      { name: "Kal Bhairav Temple", distance: "2.0 km", description: "Temple of fierce deity", category: "Temple" },
      { name: "Harsiddhi Temple", distance: "1.8 km", description: "Ancient Shakti temple", category: "Temple" },
    ],
    description:
      "A sacred Ujjain itinerary centered on bhasma aarti, temple corridors, nearby riverfront access, and curated family stays.",
    highlights: ["Bhasma aarti", "Family rooms", "Local guide", "Festival alerts"],
    festival: "Mahashivratri",
    latitude: 23.1828,
    longitude: 75.7682,
  },
  {
    id: "meenakshi-amman",
    name: "Meenakshi Amman Temple",
    deity: "Meenakshi and Sundareswarar",
    city: "Madurai",
    state: "Tamil Nadu",
    category: "Shakti",
    rating: 4.8,
    reviews: 15360,
    reviewCount: 15360,
    userReviews: templeDetails.reviews,
    distance: "1.2 km from Madurai Junction",
    crowd: "Medium",
    dailyVisitors: 25000,
    image: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1400&q=80",
    darshan: "05:00 - 21:30",
    nextSlot: "Today 20:00",
    bestTimeToVisit: "October to March",
    dressCode: "Traditional Indian attire preferred",
    estimatedTime: "2-3 hours",
    address: "Madurai Main Road, Madurai, Tamil Nadu 625001",
    phone: "+91-452-2345678",
    website: "www.meenakshi.org",
    email: "info@meenakshi.org",
    architecture: "Dravidian style",
    significance: "One of the Shakti Peethas",
    builtIn: "16th century",
    amenities: ["Shoe storage", "Prasad counter", "Drinking water", "Wheelchair access"],
    timings: templeDetails.timings,
    festivals: [
      { name: "Chithirai Thiruvizha", date: "Apr-May", description: "Celestial wedding festival", duration: "12 days" },
      { name: "Navratri", date: "Oct", description: "Nine nights of goddess worship", duration: "9 days" },
      { name: "Pongal", date: "Jan", description: "Harvest festival", duration: "4 days" },
    ],
    events: [
      { name: "Morning Aarti", type: "Daily", date: "Every day", time: "05:30", description: "Sacred morning ritual" },
      { name: "Evening Aarti", type: "Daily", date: "Every day", time: "19:00", description: "Sacred evening ritual" },
      { name: "Ther Festival", type: "Annual", date: "Apr-May", time: "Varies", description: "Chariot festival" },
    ],
    nearbyAttractions: [
      { name: "Thirumalai Nayak Palace", distance: "1.5 km", description: "Historic palace", category: "Heritage" },
      { name: "Gandhi Museum", distance: "2.0 km", description: "Museum dedicated to Gandhi", category: "Museum" },
      { name: "Vandiyur Mariamman Teppakulam", distance: "3.0 km", description: "Sacred tank", category: "Temple" },
    ],
    description:
      "A heritage-rich temple visit with multilingual guide support, cultural routes, festival reminders, and prasad logistics.",
    highlights: ["Heritage walk", "Tamil guide", "Prasad desk", "Art corridor"],
    festival: "Chithirai Thiruvizha",
    latitude: 9.9195,
    longitude: 78.1193,
  },
] as const;

export const darshanSlots = [
  { time: "05:30", label: "Mangala darshan", availability: 18, status: "Fast filling" },
  { time: "11:00", label: "Midday darshan", availability: 64, status: "Available" },
  { time: "18:30", label: "Evening darshan", availability: 9, status: "Fast filling" },
] as const;

export const pujaPackages = [
  { name: "Rudrabhishek", duration: "45 min", price: "₹1,100", pandit: "Pandit Om Mishra" },
  { name: "Mahamrityunjaya Jaap", duration: "90 min", price: "₹2,500", pandit: "Pandit Ravi Shastri" },
  { name: "Family Sankalp Puja", duration: "60 min", price: "₹1,800", pandit: "Pandit Nilesh Tiwari" },
] as const;

export const donationCauses = [
  { title: "Annadan Seva", amount: "₹501", detail: "Meals for pilgrims and temple volunteers." },
  { title: "Gau Seva", amount: "₹1,100", detail: "Daily fodder and care support." },
  { title: "Temple Maintenance", amount: "₹2,100", detail: "Cleanliness, lamps, and queue facilities." },
] as const;

export const stays = [
  { name: "Setu Pilgrim Rooms", type: "Dharamshala", price: "₹900", distance: "0.7 km", rooms: "12 rooms" },
  { name: "Ganga View Guest House", type: "Guest House", price: "₹2,400", distance: "1.1 km", rooms: "8 rooms" },
  { name: "Kashi Family Residency", type: "Hotel", price: "₹3,800", distance: "2.0 km", rooms: "18 rooms" },
] as const;

export const travelPlan = [
  { day: "Day 1", title: "Arrival and evening darshan", stops: ["Hotel check-in", "Kashi Vishwanath", "Ganga aarti"] },
  { day: "Day 2", title: "Puja and heritage walk", stops: ["Rudrabhishek", "Old city guide", "Local prasad pickup"] },
  { day: "Day 3", title: "Nearby temple circuit", stops: ["Annapurna Temple", "Sarnath route", "Departure transfer"] },
] as const;

export const aiAssistants = [
  { title: "Temple Recommendation", icon: Sparkles, text: "Matches temples by deity, city, crowd level, and travel pace." },
  { title: "Spiritual Guide", icon: Sparkles, text: "Answers rituals, dress guidance, darshan windows, and prasad questions." },
  { title: "Voice Assistant", icon: Sparkles, text: "Hands-free trip help for pilgrims on the move." },
  { title: "Festival Reminder", icon: Sparkles, text: "Flags upcoming festivals and booking windows." },
] as const;

export const dashboardStats = [
  ["Darshan bookings", "248", "+18%"],
  ["Puja bookings", "96", "+12%"],
  ["Donations", "₹8.4L", "+24%"],
  ["Trip plans", "172", "+31%"],
] as const;

export const namoData = {
  navItems,
  heroImage,
  temples,
  templeDetails,
  darshanSlots,
  pujaPackages,
  donationCauses,
  stays,
  travelPlan,
  aiAssistants,
  dashboardStats,
};
