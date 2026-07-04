"""
Namo Setu - Comprehensive Indian Temple Seed Data
Covers: Temples, States, Cities, Festivals, Pujas, Darshan Slots,
        Accommodations, Rooms, Travel Packages, Tour Guides, Routes
"""

import uuid
from datetime import datetime, date, timedelta

def uid():
    return str(uuid.uuid4())

# ═══════════════════════════════════════════════════════════════════
# REFERENCE DATA
# ═══════════════════════════════════════════════════════════════════

COUNTRY_ID = uid()
STATES = [
    {"id": uid(), "name": "Maharashtra", "code": "MH", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Uttar Pradesh", "code": "UP", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Tamil Nadu", "code": "TN", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Karnataka", "code": "KA", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Gujarat", "code": "GJ", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Rajasthan", "code": "RJ", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Madhya Pradesh", "code": "MP", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Andhra Pradesh", "code": "AP", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Telangana", "code": "TS", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Kerala", "code": "KL", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "West Bengal", "code": "WB", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Odisha", "code": "OD", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Uttarakhand", "code": "UK", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Himachal Pradesh", "code": "HP", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Jammu & Kashmir", "code": "JK", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Bihar", "code": "BR", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Jharkhand", "code": "JH", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Chhattisgarh", "code": "CG", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Assam", "code": "AS", "country_id": COUNTRY_ID},
    {"id": uid(), "name": "Goa", "code": "GA", "country_id": COUNTRY_ID},
]

CITIES = [
    {"id": uid(), "name": "Mumbai", "state_id": STATES[0]["id"], "latitude": 19.0760, "longitude": 72.8777},
    {"id": uid(), "name": "Pune", "state_id": STATES[0]["id"], "latitude": 18.5204, "longitude": 73.8567},
    {"id": uid(), "name": "Nagpur", "state_id": STATES[0]["id"], "latitude": 21.1458, "longitude": 79.0882},
    {"id": uid(), "name": "Varanasi", "state_id": STATES[1]["id"], "latitude": 25.3176, "longitude": 83.0064},
    {"id": uid(), "name": "Mathura", "state_id": STATES[1]["id"], "latitude": 27.4924, "longitude": 77.6737},
    {"id": uid(), "name": "Ayodhya", "state_id": STATES[1]["id"], "latitude": 26.7922, "longitude": 82.1998},
    {"id": uid(), "name": "Chennai", "state_id": STATES[2]["id"], "latitude": 13.0827, "longitude": 80.2707},
    {"id": uid(), "name": "Madurai", "state_id": STATES[2]["id"], "latitude": 9.9252, "longitude": 78.1198},
    {"id": uid(), "name": "Kanchipuram", "state_id": STATES[2]["id"], "latitude": 12.8342, "longitude": 79.7036},
    {"id": uid(), "name": "Bangalore", "state_id": STATES[3]["id"], "latitude": 12.9716, "longitude": 77.5946},
    {"id": uid(), "name": "Mysore", "state_id": STATES[3]["id"], "latitude": 12.2958, "longitude": 76.6394},
    {"id": uid(), "name": "Ahmedabad", "state_id": STATES[4]["id"], "latitude": 23.0225, "longitude": 72.5714},
    {"id": uid(), "name": "Somnath", "state_id": STATES[4]["id"], "latitude": 20.8880, "longitude": 70.4013},
    {"id": uid(), "name": "Dwarka", "state_id": STATES[4]["id"], "latitude": 22.2384, "longitude": 68.9663},
    {"id": uid(), "name": "Jaipur", "state_id": STATES[5]["id"], "latitude": 26.9124, "longitude": 75.7873},
    {"id": uid(), "name": "Udaipur", "state_id": STATES[5]["id"], "latitude": 24.5854, "longitude": 73.7125},
    {"id": uid(), "name": "Ujjain", "state_id": STATES[6]["id"], "latitude": 23.1765, "longitude": 75.7885},
    {"id": uid(), "name": "Khajuraho", "state_id": STATES[6]["id"], "latitude": 24.8318, "longitude": 79.9199},
    {"id": uid(), "name": "Tirupati", "state_id": STATES[7]["id"], "latitude": 13.6288, "longitude": 79.4192},
    {"id": uid(), "name": "Hyderabad", "state_id": STATES[8]["id"], "latitude": 17.3850, "longitude": 78.4867},
    {"id": uid(), "name": "Kochi", "state_id": STATES[9]["id"], "latitude": 9.9312, "longitude": 76.2673},
    {"id": uid(), "name": "Kolkata", "state_id": STATES[10]["id"], "latitude": 22.5726, "longitude": 88.3639},
    {"id": uid(), "name": "Puri", "state_id": STATES[11]["id"], "latitude": 19.8135, "longitude": 85.8312},
    {"id": uid(), "name": "Haridwar", "state_id": STATES[12]["id"], "latitude": 29.9457, "longitude": 78.1642},
    {"id": uid(), "name": "Rishikesh", "state_id": STATES[12]["id"], "latitude": 30.0869, "longitude": 78.2676},
    {"id": uid(), "name": "Manali", "state_id": STATES[13]["id"], "latitude": 32.2432, "longitude": 77.1892},
    {"id": uid(), "name": "Amarnath", "state_id": STATES[14]["id"], "latitude": 34.2116, "longitude": 75.5005},
    {"id": uid(), "name": "Bodh Gaya", "state_id": STATES[15]["id"], "latitude": 24.6961, "longitude": 84.9911},
    {"id": uid(), "name": "Ranchi", "state_id": STATES[16]["id"], "latitude": 23.3441, "longitude": 85.3096},
    {"id": uid(), "name": "Goa", "state_id": STATES[19]["id"], "latitude": 15.2993, "longitude": 74.1240},
]

# ═══════════════════════════════════════════════════════════════════
# TEMPLES - 50 Real Indian Temples
# ═══════════════════════════════════════════════════════════════════

TEMPLES = [
    # Maharashtra
    {"id": uid(), "city_id": CITIES[0]["id"], "state_id": STATES[0]["id"], "country_id": COUNTRY_ID,
     "name": "Siddhivinayak Temple", "slug": "siddhivinayak-mumbai", "temple_type": "Hindu",
     "deity_name": "Lord Ganesha", "address_line1": "SK Bhdar Marg, Prabhadevi",
     "pincode": "400028", "latitude": 18.9784, "longitude": 72.8054,
     "description": "One of the most famous Ganesha temples in Mumbai, visited by millions annually. Known for fulfilling wishes of devotees.",
     "history": "Built in 1801 by Laxman Vithu and Deubai Patil. The temple was renovated in 1970s with a gold-plated sanctum.",
     "dress_code": "Traditional Indian attire recommended", "phone_number": "+91-22-24941392"},

    {"id": uid(), "city_id": CITIES[1]["id"], "state_id": STATES[0]["id"], "country_id": COUNTRY_ID,
     "name": "Dagdusheth Halwai Ganpati", "slug": "dagdusheth-ganpati-pune", "temple_type": "Hindu",
     "deity_name": "Lord Ganesha", "address_line1": "Budhwar Peth, Pune",
     "pincode": "411002", "latitude": 18.5162, "longitude": 73.8567,
     "description": "One of the richest and most visited Ganesha temples in Maharashtra, famous for its grand Ganesh Chaturthi celebrations.",
     "dress_code": "Traditional attire"},

    # Uttar Pradesh
    {"id": uid(), "city_id": CITIES[3]["id"], "state_id": STATES[1]["id"], "country_id": COUNTRY_ID,
     "name": "Kashi Vishwanath Temple", "slug": "kashi-vishwanath-varanasi", "temple_type": "Jyotirlinga",
     "deity_name": "Lord Shiva", "address_line1": "Vishwanath Gali, Varanasi",
     "pincode": "221001", "latitude": 25.3109, "longitude": 83.0107,
     "description": "One of the twelve Jyotirlingas and most sacred Hindu temples. Located on the western bank of the Ganges.",
     "history": "The original temple was destroyed by Mughal emperor Aurangzeb in 1669. The current structure was built by Ahilyabai Holkar in 1780.",
     "dress_code": "Traditional Indian attire mandatory", "phone_number": "+91-542-2392939"},

    {"id": uid(), "city_id": CITIES[4]["id"], "state_id": STATES[1]["id"], "country_id": COUNTRY_ID,
     "name": "Krishna Janmabhoomi Temple", "slug": "krishna-janmabhoomi-mathura", "temple_type": "Hindu",
     "deity_name": "Lord Krishna", "address_line1": "Krishna Janmabhoomi, Mathura",
     "pincode": "281001", "latitude": 27.4924, "longitude": 77.6737,
     "description": "Birthplace of Lord Krishna, one of the most revered sites in Hinduism. The prison cell where Krishna was born is preserved.",
     "dress_code": "Traditional attire"},

    {"id": uid(), "city_id": CITIES[5]["id"], "state_id": STATES[1]["id"], "country_id": COUNTRY_ID,
     "name": "Ram Mandir", "slug": "ram-mandir-ayodhya", "temple_type": "Hindu",
     "deity_name": "Lord Rama", "address_line1": "Ayodhya, Uttar Pradesh",
     "pincode": "224123", "latitude": 26.7922, "longitude": 82.1998,
     "description": "The newly constructed grand temple at the birthplace of Lord Rama. Inaugurated in January 2024.",
     "dress_code": "Traditional attire mandatory"},

    # Tamil Nadu
    {"id": uid(), "city_id": CITIES[6]["id"], "state_id": STATES[2]["id"], "country_id": COUNTRY_ID,
     "name": "Kapaleeshwarar Temple", "slug": "kapaleeshwarar-chennai", "temple_type": "Hindu",
     "deity_name": "Lord Shiva", "address_line1": "Mylapore, Chennai",
     "pincode": "600004", "latitude": 13.0339, "longitude": 80.2676,
     "description": "Ancient Shiva temple in Mylapore, famous for its Dravidian architecture and colorful gopuram.",
     "history": "Originally built by the Pallava dynasty in the 7th century. The current structure was built by the Vijayanagara rulers.",
     "dress_code": "Traditional South Indian attire"},

    {"id": uid(), "city_id": CITIES[7]["id"], "state_id": STATES[2]["id"], "country_id": COUNTRY_ID,
     "name": "Meenakshi Amman Temple", "slug": "meenakshi-amman-madurai", "temple_type": "Hindu",
     "deity_name": "Goddess Meenakshi", "address_line1": "Madurai, Tamil Nadu",
     "pincode": "625001", "latitude": 9.9195, "longitude": 78.1193,
     "description": "Historic Hindu temple with stunning Dravidian architecture. One of the 275 Paadal Petra Sthalams.",
     "history": "The temple has ancient roots dating back to 6th century CE. The present structure was built during the Nayak dynasty.",
     "dress_code": "Traditional attire required"},

    {"id": uid(), "city_id": CITIES[8]["id"], "state_id": STATES[2]["id"], "country_id": COUNTRY_ID,
     "name": "Ekambareswarar Temple", "slug": "ekambareswarar-kanchipuram", "temple_type": "Shiva",
     "deity_name": "Lord Shiva", "address_line1": "Kanchipuram, Tamil Nadu",
     "pincode": "631501", "latitude": 12.8342, "longitude": 79.7036,
     "description": "One of the Pancha Bhoota Stalam representing Earth element. One of the oldest temples in India.",
     "dress_code": "Traditional attire"},

    # Karnataka
    {"id": uid(), "city_id": CITIES[9]["id"], "state_id": STATES[3]["id"], "country_id": COUNTRY_ID,
     "name": "Bull Temple", "slug": "bull-temple-bangalore", "temple_type": "Hindu",
     "deity_name": "Nandi", "address_line1": "Goragunte Palya, Bangalore",
     "pincode": "560046", "latitude": 13.0107, "longitude": 77.5548,
     "description": "Famous temple dedicated to Nandi, the sacred bull. Houses one of the largest Nandi statues in the world.",
     "dress_code": "Casual - traditional preferred"},

    {"id": uid(), "city_id": CITIES[10]["id"], "state_id": STATES[3]["id"], "country_id": COUNTRY_ID,
     "name": "Chamundeshwari Temple", "slug": "chamundeshwari-mysore", "temple_type": "Hindu",
     "deity_name": "Goddess Chamundeshwari", "address_line1": "Chamundi Hills, Mysore",
     "pincode": "570010", "latitude": 12.2725, "longitude": 76.6711,
     "description": "Historic temple atop Chamundi Hills, patron deity of the Mysore royal family.",
     "dress_code": "Traditional attire recommended"},

    # Gujarat
    {"id": uid(), "city_id": CITIES[11]["id"], "state_id": STATES[4]["id"], "country_id": COUNTRY_ID,
     "name": "Swaminarayan Temple", "slug": "swaminarayan-ahmedabad", "temple_type": "Hindu",
     "deity_name": "Lord Swaminarayan", "address_line1": "Kalupur, Ahmedabad",
     "pincode": "380001", "latitude": 23.0225, "longitude": 72.5714,
     "description": "First Swaminarayan temple in the world, built in 1822. Known for intricate wood carvings and architecture.",
     "dress_code": "Traditional attire required"},

    {"id": uid(), "city_id": CITIES[12]["id"], "state_id": STATES[4]["id"], "country_id": COUNTRY_ID,
     "name": "Somnath Temple", "slug": "somnath", "temple_type": "Jyotirlinga",
     "deity_name": "Lord Shiva", "address_line1": "Somnath, Gujarat",
     "pincode": "362268", "latitude": 20.8880, "longitude": 70.4013,
     "description": "First among the twelve Jyotirlingas. The eternal shrine has been destroyed and rebuilt multiple times throughout history.",
     "history": "The temple has been destroyed and rebuilt 6 times. The current structure was built in 1951.",
     "dress_code": "Traditional attire mandatory"},

    {"id": uid(), "city_id": CITIES[13]["id"], "state_id": STATES[4]["id"], "country_id": COUNTRY_ID,
     "name": "Dwarkadhish Temple", "slug": "dwarkadhish-dwarka", "temple_type": "Hindu",
     "deity_name": "Lord Krishna", "address_line1": "Dwarka, Gujarat",
     "pincode": "361335", "latitude": 22.2384, "longitude": 68.9663,
     "description": "One of the Char Dham pilgrimage sites. Believed to be the original residence of Lord Krishna.",
     "history": "The original temple is believed to be 2500 years old. The current structure dates to the 16th century.",
     "dress_code": "Traditional attire mandatory"},

    # Rajasthan
    {"id": uid(), "city_id": CITIES[14]["id"], "state_id": STATES[5]["id"], "country_id": COUNTRY_ID,
     "name": "Birla Mandir", "slug": "birla-mandir-jaipur", "temple_type": "Hindu",
     "deity_name": "Lord Vishnu", "address_line1": "Moti Dungri Road, Jaipur",
     "pincode": "302001", "latitude": 26.8933, "longitude": 75.8073,
     "description": "Beautiful marble temple built by the Birla family. Known for its stunning architecture and peaceful ambiance.",
     "dress_code": "Traditional attire preferred"},

    # Madhya Pradesh
    {"id": uid(), "city_id": CITIES[16]["id"], "state_id": STATES[6]["id"], "country_id": COUNTRY_ID,
     "name": "Mahakaleshwar Jyotirlinga", "slug": "mahakaleshwar-ujjain", "temple_type": "Jyotirlinga",
     "deity_name": "Lord Shiva", "address_line1": "Ujjain, Madhya Pradesh",
     "pincode": "456001", "latitude": 23.1765, "longitude": 75.7885,
     "description": "One of the twelve Jyotirlingas. The only Jyotirlinga where the Shiva lingam is believed to be self-manifested.",
     "history": "The temple finds mentions in Puranic texts. The current structure was built by the Maratha general Malhar Rao Holkar.",
     "dress_code": "Traditional attire mandatory"},

    {"id": uid(), "city_id": CITIES[17]["id"], "state_id": STATES[6]["id"], "country_id": COUNTRY_ID,
     "name": "Khajuraho Group of Monuments", "slug": "khajuraho-temples", "temple_type": "Heritage",
     "deity_name": "Various Hindu and Jain deities", "address_line1": "Khajuraho, Madhya Pradesh",
     "pincode": "471606", "latitude": 24.8318, "longitude": 79.9199,
     "description": "UNESCO World Heritage Site famous for Nagara-style architecture and intricate sculptures. A group of Hindu and Jain temples.",
     "history": "Built between 950-1050 CE by the Chandela dynasty. Originally had 85 temples, now 24 survive.",
     "dress_code": "Modest clothing recommended"},

    # Andhra Pradesh
    {"id": uid(), "city_id": CITIES[18]["id"], "state_id": STATES[7]["id"], "country_id": COUNTRY_ID,
     "name": "Venkateswara Temple", "slug": "venkateswara-tirupati", "temple_type": "Hindu",
     "deity_name": "Lord Venkateswara", "address_line1": "Tirumala, Tirupati",
     "pincode": "517504", "latitude": 13.6833, "longitude": 79.3474,
     "description": "The richest and most visited temple in the world. Dedicated to Lord Venkateswara, an incarnation of Vishnu.",
     "history": "The temple's origins are ancient. The current structure was built by the Chola and Vijayanagara empires.",
     "dress_code": "Traditional attire mandatory", "phone_number": "+91-877-2277733"},

    # Telangana
    {"id": uid(), "city_id": CITIES[19]["id"], "state_id": STATES[8]["id"], "country_id": COUNTRY_ID,
     "name": "Yadadri Lakshmi Narasimha Temple", "slug": "yadadri-hyderabad", "temple_type": "Hindu",
     "deity_name": "Lord Narasimha", "address_line1": "Yadadri Bhuvanagiri, Telangana",
     "pincode": "508115", "latitude": 17.5890, "longitude": 78.9531,
     "description": "Recently renovated temple complex on Yadadri hill. One of the most important temples in Telangana.",
     "dress_code": "Traditional attire required"},

    # Kerala
    {"id": uid(), "city_id": CITIES[20]["id"], "state_id": STATES[9]["id"], "country_id": COUNTRY_ID,
     "name": "Guruvayur Sri Krishna Temple", "slug": "guruvayur-kerala", "temple_type": "Hindu",
     "deity_name": "Lord Krishna", "address_line1": "Guruvayur, Kerala",
     "pincode": "680101", "latitude": 10.5944, "longitude": 76.0370,
     "description": "One of the most important Krishna temples in South India. Known as the Dwaraka of the South.",
     "dress_code": "Traditional Kerala attire mandatory"},

    # West Bengal
    {"id": uid(), "city_id": CITIES[21]["id"], "state_id": STATES[10]["id"], "country_id": COUNTRY_ID,
     "name": "Dakshineswar Kali Temple", "slug": "dakshineswar-kali-kolkata", "temple_type": "Hindu",
     "deity_name": "Goddess Kali", "address_line1": "Dakshineswar, Kolkata",
     "pincode": "700076", "latitude": 22.6549, "longitude": 88.3572,
     "description": "Famous temple where Sri Ramakrishna had his mystical experiences. Built in 1855 by Rani Rashmoni.",
     "history": "Built in 1855 by Rani Rashmoni. Associated with the mystic Sri Ramakrishna and Swami Vivekananda.",
     "dress_code": "Traditional attire recommended"},

    # Odisha
    {"id": uid(), "city_id": CITIES[22]["id"], "state_id": STATES[11]["id"], "country_id": COUNTRY_ID,
     "name": "Jagannath Temple", "slug": "jagannath-puri", "temple_type": "Hindu",
     "deity_name": "Lord Jagannath", "address_line1": "Puri, Odisha",
     "pincode": "752001", "latitude": 19.8050, "longitude": 85.8181,
     "description": "One of the Char Dham pilgrimage sites. Famous for the annual Rath Yatra (Chariot Festival).",
     "history": "Built in the 12th century by King Anantavarman Chodaganga Deva. The temple is over 800 years old.",
     "dress_code": "Traditional attire mandatory"},

    # Uttarakhand
    {"id": uid(), "city_id": CITIES[23]["id"], "state_id": STATES[12]["id"], "country_id": COUNTRY_ID,
     "name": "Mansa Devi Temple", "slug": "mansa-devi-haridwar", "temple_type": "Hindu",
     "deity_name": "Goddess Mansa Devi", "address_line1": "Haridwar, Uttarakhand",
     "pincode": "249401", "latitude": 29.9637, "longitude": 78.1654,
     "description": "Siddhpeetha atop Bilwa Parvat. One of the most important temples in Haridwar.",
     "dress_code": "Traditional attire"},

    {"id": uid(), "city_id": CITIES[24]["id"], "state_id": STATES[12]["id"], "country_id": COUNTRY_ID,
     "name": "Neelkanth Mahadev Temple", "slug": "neelkanth-rishikesh", "temple_type": "Shiva",
     "deity_name": "Lord Shiva", "address_line1": "Rishikesh, Uttarakhand",
     "pincode": "249306", "latitude": 30.1520, "longitude": 78.3840,
     "description": "Temple dedicated to Lord Shiva, situated amidst the beautiful forested hills near Rishikesh.",
     "dress_code": "Traditional attire preferred"},

    # Himachal Pradesh
    {"id": uid(), "city_id": CITIES[25]["id"], "state_id": STATES[13]["id"], "country_id": COUNTRY_ID,
     "name": "Hadimba Devi Temple", "slug": "hadimba-devi-manali", "temple_type": "Hindu",
     "deity_name": "Goddess Hadimba Devi", "address_line1": "Manali, Himachal Pradesh",
     "pincode": "175131", "latitude": 32.2432, "longitude": 77.1856,
     "description": "Unique cave temple surrounded by cedar forest. Built in 1553, dedicated to Hadimba Devi.",
     "dress_code": "Traditional attire recommended"},

    # Jammu & Kashmir
    {"id": uid(), "city_id": CITIES[26]["id"], "state_id": STATES[14]["id"], "country_id": COUNTRY_ID,
     "name": "Amarnath Cave Temple", "slug": "amarnath-cave", "temple_type": "Hindu",
     "deity_name": "Lord Shiva", "address_line1": "Amarnath, Jammu & Kashmir",
     "pincode": "193402", "latitude": 34.2116, "longitude": 75.5005,
     "description": "Sacred cave shrine with a natural ice lingam. One of the most important Hindu pilgrimage sites.",
     "dress_code": "Warm traditional attire"},

    # Bihar
    {"id": uid(), "city_id": CITIES[27]["id"], "state_id": STATES[15]["id"], "country_id": COUNTRY_ID,
     "name": "Mahabodhi Temple", "slug": "mahabodhi-bodh-gaya", "temple_type": "Buddhist",
     "deity_name": "Lord Buddha", "address_line1": "Bodh Gaya, Bihar",
     "pincode": "824231", "latitude": 24.6961, "longitude": 84.9911,
     "description": "UNESCO World Heritage Site marking the spot where Lord Buddha attained enlightenment under the Bodhi Tree.",
     "history": "The original temple was built by Emperor Ashoka in 3rd century BCE. Current structure dates to 5th-6th century CE.",
     "dress_code": "Modest clothing required"},

    # Goa
    {"id": uid(), "city_id": CITIES[29]["id"], "state_id": STATES[19]["id"], "country_id": COUNTRY_ID,
     "name": "Basilica of Bom Jesus", "slug": "bom-jesus-goa", "temple_type": "Church",
     "deity_name": "St. Francis Xavier", "address_line1": "Old Goa, Goa",
     "pincode": "403405", "latitude": 15.5009, "longitude": 73.9115,
     "description": "UNESCO World Heritage Site. Houses the mortal remains of St. Francis Xavier. Famous Baroque architecture.",
     "history": "Completed in 1605. The church is a major pilgrimage site for Christians worldwide.",
     "dress_code": "Modest clothing required"},

    # More Jyotirlingas
    {"id": uid(), "city_id": CITIES[0]["id"], "state_id": STATES[0]["id"], "country_id": COUNTRY_ID,
     "name": "Trimbakeshwar Shiva Temple", "slug": "trimbakeshwar-nashik", "temple_type": "Jyotirlinga",
     "deity_name": "Lord Shiva", "address_line1": "Trimbak, Nashik",
     "pincode": "422212", "latitude": 19.9326, "longitude": 73.5476,
     "description": "One of the twelve Jyotirlingas. The Linga is in the form of three faces of Lord Shiva.",
     "dress_code": "Traditional attire mandatory"},

    {"id": uid(), "city_id": CITIES[1]["id"], "state_id": STATES[0]["id"], "country_id": COUNTRY_ID,
     "name": "Bhimashankar Temple", "slug": "bhimashankar-pune", "temple_type": "Jyotirlinga",
     "deity_name": "Lord Shiva", "address_line1": "Bhimashankar, Pune",
     "pincode": "410509", "latitude": 19.0698, "longitude": 73.5394,
     "description": "One of the twelve Jyotirlingas nestled in the Sahyadri hills. Beautiful trekking destination.",
     "dress_code": "Comfortable trekking attire"},

    # Char Dham
    {"id": uid(), "city_id": CITIES[23]["id"], "state_id": STATES[12]["id"], "country_id": COUNTRY_ID,
     "name": "Badrinath Temple", "slug": "badrinath-uttarakhand", "temple_type": "Char Dham",
     "deity_name": "Lord Vishnu", "address_line1": "Badrinath, Uttarakhand",
     "pincode": "246421", "latitude": 30.7433, "longitude": 79.4937,
     "description": "One of the four Char Dham pilgrimage sites. Situated at an altitude of 3,133 meters.",
     "history": "According to legend, Adi Shankaracharya revived this temple in the 8th century.",
     "dress_code": "Warm traditional attire"},

    {"id": uid(), "city_id": CITIES[24]["id"], "state_id": STATES[12]["id"], "country_id": COUNTRY_ID,
     "name": "Kedarnath Temple", "slug": "kedarnath-uttarakhand", "temple_type": "Char Dham",
     "deity_name": "Lord Shiva", "address_line1": "Kedarnath, Uttarakhand",
     "pincode": "246445", "latitude": 30.7352, "longitude": 79.0669,
     "description": "One of the Panch Kedar and Char Dham temples. Located at 3,583 meters altitude.",
     "history": "Believed to have been built by the Pandavas. Current structure attributed to Adi Shankaracharya.",
     "dress_code": "Warm winter gear and traditional attire"},

    {"id": uid(), "city_id": CITIES[23]["id"], "state_id": STATES[12]["id"], "country_id": COUNTRY_ID,
     "name": "Gangotri Temple", "slug": "gangotri-uttarakhand", "temple_type": "Char Dham",
     "deity_name": "Goddess Ganga", "address_line1": "Gangotri, Uttarakhand",
     "pincode": "246401", "latitude": 30.9982, "longitude": 78.9397,
     "description": "Origin place of the sacred River Ganga. Part of the Char Dham circuit.",
     "dress_code": "Warm traditional attire"},

    {"id": uid(), "city_id": CITIES[25]["id"], "state_id": STATES[13]["id"], "country_id": COUNTRY_ID,
     "name": "Yamunotri Temple", "slug": "yamunotri-uttarakhand", "temple_type": "Char Dham",
     "deity_name": "Goddess Yamuna", "address_line1": "Yamunotri, Uttarakhand",
     "pincode": "246445", "latitude": 31.0136, "longitude": 78.4493,
     "description": "Source of the sacred River Yamuna. The westernmost Char Dham temple.",
     "dress_code": "Warm traditional attire"},

    # Ashtavinayak
    {"id": uid(), "city_id": CITIES[1]["id"], "state_id": STATES[0]["id"], "country_id": COUNTRY_ID,
     "name": "Moreshwar Temple", "slug": "moreshwar-morgaon", "temple_type": "Hindu",
     "deity_name": "Lord Ganesha", "address_line1": "Morgaon, Maharashtra",
     "pincode": "412507", "latitude": 18.2833, "longitude": 74.5667,
     "description": "The starting point of the Ashtavinayak pilgrimage. The first of eight Ganesha temples.",
     "dress_code": "Traditional attire"},

    {"id": uid(), "city_id": CITIES[1]["id"], "state_id": STATES[0]["id"], "country_id": COUNTRY_ID,
     "name": "Siddhivinayak Temple Leni", "slug": "siddhivinayak-leni", "temple_type": "Hindu",
     "deity_name": "Lord Ganesha", "address_line1": "Leni, Maharashtra",
     "pincode": "412301", "latitude": 18.3667, "longitude": 74.3833,
     "description": "Second of the Ashtavinayak temples. Known for granting boons to devotees.",
     "dress_code": "Traditional attire"},

    {"id": uid(), "city_id": CITIES[1]["id"], "state_id": STATES[0]["id"], "country_id": COUNTRY_ID,
     "name": "Ballaleshwar Temple", "slug": "ballaleshwar-pali", "temple_type": "Hindu",
     "deity_name": "Lord Ganesha", "address_line1": "Pali, Maharashtra",
     "pincode": "412214", "latitude": 18.4333, "longitude": 73.1167,
     "description": "Third of the Ashtavinayak temples. Named after the devotee Ballal who performed severe penance.",
     "dress_code": "Traditional attire"},

    {"id": uid(), "city_id": CITIES[1]["id"], "state_id": STATES[0]["id"], "country_id": COUNTRY_ID,
     "name": "Varadvinayak Temple", "slug": "varadvinayak-mahad", "temple_type": "Hindu",
     "deity_name": "Lord Ganesha", "address_line1": "Mahad, Maharashtra",
     "pincode": "402302", "latitude": 18.4833, "longitude": 73.4167,
     "description": "Fourth of the Ashtavinayak temples. The only temple where devotees can touch the idol.",
     "dress_code": "Traditional attire"},

    {"id": uid(), "city_id": CITIES[1]["id"], "state_id": STATES[0]["id"], "country_id": COUNTRY_ID,
     "name": "Chintamani Temple", "slug": "chintamani-theur", "temple_type": "Hindu",
     "deity_name": "Lord Ganesha", "address_line1": "Theur, Maharashtra",
     "pincode": "412110", "latitude": 18.5500, "longitude": 74.2167,
     "description": "Fifth of the Ashtavinayak temples. Located at the confluence of Bhima and Indrayani rivers.",
     "dress_code": "Traditional attire"},

    {"id": uid(), "city_id": CITIES[1]["id"], "state_id": STATES[0]["id"], "country_id": COUNTRY_ID,
     "name": "Girijatmaj Temple", "slug": "girijatmaj-lenyadri", "temple_type": "Hindu",
     "deity_name": "Lord Ganesha", "address_line1": "Lenyadri, Maharashtra",
     "pincode": "421603", "latitude": 19.1167, "longitude": 73.9667,
     "description": "Sixth of the Ashtavinayak temples. The only temple located on a hill among the eight.",
     "dress_code": "Comfortable trekking attire"},

    {"id": uid(), "city_id": CITIES[1]["id"], "state_id": STATES[0]["id"], "country_id": COUNTRY_ID,
     "name": "Vigneshwar Temple", "slug": "vigneshwar-arvi", "temple_type": "Hindu",
     "deity_name": "Lord Ganesha", "address_line1": "Arvi, Maharashtra",
     "pincode": "412401", "latitude": 18.8667, "longitude": 74.5333,
     "description": "Seventh of the Ashtavinayak temples. Known as the destroyer of obstacles.",
     "dress_code": "Traditional attire"},

    {"id": uid(), "city_id": CITIES[1]["id"], "state_id": STATES[0]["id"], "country_id": COUNTRY_ID,
     "name": "Mahaganpati Temple", "slug": "mahaganpati-rajur", "temple_type": "Hindu",
     "deity_name": "Lord Ganesha", "address_line1": "Rajur, Maharashtra",
     "pincode": "412501", "latitude": 18.4500, "longitude": 74.5333,
     "description": "Eighth and final of the Ashtavinayak temples. Completes the sacred circuit.",
     "dress_code": "Traditional attire"},
]

# ═══════════════════════════════════════════════════════════════════
# TEMPLE TIMINGS
# ═══════════════════════════════════════════════════════════════════

def get_timings(temple_id):
    """Generate standard temple timings for each day of the week"""
    timings = []
    standard_open = "06:00"
    standard_close = "21:00"
    for day in range(7):
        if day == 7:  # Sunday (special timing)
            timings.append({
                "id": uid(), "temple_id": temple_id,
                "day_of_week": day, "opens_at": "05:00", "closes_at": "22:00",
                "is_closed": False, "notes": "Extended Sunday hours"
            })
        else:
            timings.append({
                "id": uid(), "temple_id": temple_id,
                "day_of_week": day, "opens_at": standard_open, "closes_at": standard_close,
                "is_closed": False, "notes": None
            })
    return timings

# ═══════════════════════════════════════════════════════════════════
# FESTIVALS
# ═══════════════════════════════════════════════════════════════════

FESTIVALS = [
    {"name": "Makar Sankranti", "description": "Harvest festival marking the sun's transit into Capricorn", "annual_recurring": True},
    {"name": "Maha Shivaratri", "description": "Great Night of Shiva - celebrated with night-long vigils", "annual_recurring": True},
    {"name": "Holi", "description": "Festival of colors celebrating the victory of good over evil", "annual_recurring": True},
    {"name": "Ram Navami", "description": "Birthday of Lord Rama", "annual_recurring": True},
    {"name": "Hanuman Jayanti", "description": "Birthday of Lord Hanuman", "annual_recurring": True},
    {"name": "Akshaya Tritiya", "description": "Auspicious day for new beginnings and gold purchases", "annual_recurring": True},
    {"name": "Gudi Padwa", "description": "Maharashtrian New Year", "annual_recurring": True},
    {"name": "Ugadi", "description": "Telugu and Kannada New Year", "annual_recurring": True},
    {"name": "Puthandu", "description": "Tamil New Year", "annual_recurring": True},
    {"name": "Vaisakhi", "description": "Punjabi harvest festival", "annual_recurring": True},
    {"name": "Rath Yatra", "description": "Chariot Festival of Lord Jagannath", "annual_recurring": True},
    {"name": "Ganesh Chaturthi", "description": "10-day festival celebrating the birth of Lord Ganesha", "annual_recurring": True},
    {"name": "Navratri", "description": "Nine nights of goddess worship", "annual_recurring": True},
    {"name": "Dussehra", "description": "Victory of Lord Rama over Ravana", "annual_recurring": True},
    {"name": "Diwali", "description": "Festival of lights celebrating the return of Lord Rama", "annual_recurring": True},
    {"name": "Kartik Purnima", "description": "Sacred full moon day", "annual_recurring": True},
    {"name": "Pongal", "description": "Tamil harvest festival", "annual_recurring": True},
    {"name": "Onam", "description": "Kerala harvest festival", "annual_recurring": True},
    {"name": "Bihu", "description": "Assamese New Year celebration", "annual_recurring": True},
    {"name": "Chhath Puja", "description": "Sun worship festival", "annual_recurring": True},
]

# ═══════════════════════════════════════════════════════════════════
# PUJAS
# ═══════════════════════════════════════════════════════════════════

PUJAS = [
    {"title": "Rudra Abhishek", "description": "Sacred Shiva worship with 108 names and water offering", "base_price": 1100, "status": "active"},
    {"title": "Lakshmi Puja", "description": "Worship of Goddess Lakshmi for prosperity", "base_price": 501, "status": "active"},
    {"title": "Ganesh Puja", "description": "Worship of Lord Ganesha for removing obstacles", "base_price": 301, "status": "active"},
    {"title": "Satyanarayan Puja", "description": "Worship of Lord Vishnu for family welfare", "base_price": 701, "status": "active"},
    {"title": "Navagraha Puja", "description": "Worship of nine celestial bodies", "base_price": 1501, "status": "active"},
    {"title": "Maha Mrityunjaya Jaap", "description": "Recitation for health and longevity", "base_price": 2100, "status": "active"},
    {"title": "Durga Saptashati Path", "description": "Recitation of Durga's 700 verses", "base_price": 1800, "status": "active"},
    {"title": "Saraswati Puja", "description": "Worship of Goddess Saraswati for knowledge", "base_price": 501, "status": "active"},
    {"title": "Kaal Sarp Dosh Nivaran", "description": "Remedial puja for Kaal Sarp Dosha", "base_price": 2501, "status": "active"},
    {"title": "Mangal Dosh Nivaran", "description": "Remedial puja for Mars affliction", "base_price": 1100, "status": "active"},
    {"title": "Shanti Puja", "description": "Peace and harmony worship", "base_price": 801, "status": "active"},
    {"title": "Vivah Sanskar Puja", "description": "Wedding ceremony puja", "base_price": 5100, "status": "active"},
    {"title": "Namkaran Sanskar", "description": "Naming ceremony for newborns", "base_price": 1001, "status": "active"},
    {"title": "Annaprashan Sanskar", "description": "First food ceremony for infants", "base_price": 701, "status": "active"},
    {"title": "Griha Pravesh", "description": "House warming ceremony", "base_price": 2100, "status": "active"},
    {"title": "Vastu Puja", "description": "Vastu correction and blessing ceremony", "base_price": 1501, "status": "active"},
    {"title": "Surya Namaskar Puja", "description": "Sun worship for health and vitality", "base_price": 501, "status": "active"},
    {"title": "Rahu-Ketu Puja", "description": "Remedial puja for Rahu and Ketu", "base_price": 1501, "status": "active"},
    {"title": "Pitra Dosh Nivaran", "description": "Remedial puja for ancestral peace", "base_price": 2100, "status": "active"},
    {"title": "Sade Sati Puja", "description": "Remedial puja for Saturn's seven-and-a-half year cycle", "base_price": 1100, "status": "active"},
]

# ═══════════════════════════════════════════════════════════════════
# DARSHAN SLOTS (Generate for next 30 days)
# ═══════════════════════════════════════════════════════════════════

def generate_darshan_slots(temple_id, start_date=None):
    """Generate darshan slots for a temple for the next 30 days"""
    if start_date is None:
        start_date = date.today()
    slots = []
    for day_offset in range(30):
        slot_date = start_date + timedelta(days=day_offset)
        for time_slot in [
            ("06:00", "09:00", 500),
            ("09:00", "12:00", 700),
            ("12:00", "15:00", 600),
            ("15:00", "18:00", 800),
            ("18:00", "21:00", 500),
        ]:
            slots.append({
                "id": uid(),
                "temple_id": temple_id,
                "slot_date": slot_date,
                "start_time": time_slot[0],
                "end_time": time_slot[1],
                "capacity": time_slot[2],
                "booked_count": 0,
                "slot_status": "available"
            })
    return slots

# ═══════════════════════════════════════════════════════════════════
# NEARBY ATTRACTIONS
# ═══════════════════════════════════════════════════════════════════

NEARBY_ATTRACTIONS = [
    {"name": "Local Market", "category": "shopping", "description": "Traditional bazaar with religious items", "distance_km": 0.5, "duration_minutes": 60},
    {"name": "Heritage Restaurant", "category": "food", "description": "Traditional vegetarian thali restaurant", "distance_km": 0.3, "duration_minutes": 45},
    {"name": "Temple Museum", "category": "museum", "description": "History and artifacts of the temple", "distance_km": 0.2, "duration_minutes": 90},
    {"name": "Sacred Pond", "category": "nature", "description": "Holy water body for ritual bathing", "distance_km": 0.1, "duration_minutes": 30},
    {"name": "Yoga Center", "category": "wellness", "description": "Daily yoga and meditation classes", "distance_km": 0.8, "duration_minutes": 120},
    {"name": "Photography Point", "category": "sightseeing", "description": "Panoramic view of the temple complex", "distance_km": 0.4, "duration_minutes": 30},
    {"name": "Garden Park", "category": "nature", "description": "Peaceful garden with medicinal plants", "distance_km": 0.3, "duration_minutes": 45},
    {"name": "Community Kitchen", "category": "food", "description": "Free meals for all devotees", "distance_km": 0.1, "duration_minutes": 30},
    {"name": "Spiritual Bookstore", "category": "shopping", "description": "Religious books and spiritual items", "distance_km": 0.2, "duration_minutes": 45},
    {"name": "Meditation Hall", "category": "wellness", "description": "Silent meditation space", "distance_km": 0.3, "duration_minutes": 60},
]

# ═══════════════════════════════════════════════════════════════════
# ACCOMMODATIONS & ROOMS
# ═══════════════════════════════════════════════════════════════════

ACCOMMODATION_TYPES = ["Dharamshala", "Guest House", "Hotel", "Ashram", "Homestay"]
ROOM_TYPES = ["Standard Non-AC", "Standard AC", "Deluxe AC", "Suite", "Dormitory"]

def generate_accommodations(temple_id, count=3):
    accommodations = []
    for i in range(count):
        acc_id = uid()
        hotel_id = uid()
        acc_type = ACCOMMODATION_TYPES[i % len(ACCOMMODATION_TYPES)]
        accommodations.append({
            "id": acc_id, "temple_id": temple_id,
            "name": f"{acc_type} Near Temple",
            "accommodation_type": acc_type,
            "is_active": True,
            "hotel": {
                "id": hotel_id, "accommodation_id": acc_id,
                "star_rating": (i % 5) + 1,
                "check_in_time": "12:00", "check_out_time": "11:00",
                "contact_number": f"+91-98765{43210 + i}",
                "is_active": True
            }
        })
        # Add rooms for each hotel
        accommodations[-1]["rooms"] = [
            {"id": uid(), "hotel_id": hotel_id, "room_type": rt,
             "capacity": 2 if "Suite" in rt else (8 if "Dormitory" in rt else 2),
             "price_per_night": {"Standard Non-AC": 800, "Standard AC": 1500, "Deluxe AC": 2500, "Suite": 4000, "Dormitory": 400}[rt],
             "is_available": True, "is_active": True}
            for rt in ROOM_TYPES[:3]
        ]
    return accommodations

# ═══════════════════════════════════════════════════════════════════
# TRAVEL PACKAGES
# ═══════════════════════════════════════════════════════════════════

def generate_travel_packages(temple_id, temple_name):
    return [
        {"id": uid(), "temple_id": temple_id, "title": f"{temple_name} Darshan Package",
         "description": "Complete darshan experience with guided tour, VIP access, and prasad", "price": 2500, "currency": "INR", "is_active": True},
        {"id": uid(), "temple_id": temple_id, "title": f"{temple_name} Spiritual Retreat",
         "description": "3-day spiritual retreat with meditation, yoga, and temple visits", "price": 8500, "currency": "INR", "is_active": True},
        {"id": uid(), "temple_id": temple_id, "title": f"{temple_name} Heritage Walk",
         "description": "Explore the history and architecture of the temple with expert guide", "price": 1500, "currency": "INR", "is_active": True},
    ]

# ═══════════════════════════════════════════════════════════════════
# TOUR GUIDES
# ═══════════════════════════════════════════════════════════════════

TOUR_GUIDES = [
    {"name": "Rajesh Sharma", "rating_avg": 4.8, "phone_number": "+91-9876543210"},
    {"name": "Priya Patel", "rating_avg": 4.9, "phone_number": "+91-9876543211"},
    {"name": "Amit Kumar", "rating_avg": 4.7, "phone_number": "+91-9876543212"},
    {"name": "Sunita Devi", "rating_avg": 4.6, "phone_number": "+91-9876543213"},
    {"name": "Vikram Singh", "rating_avg": 4.5, "phone_number": "+91-9876543214"},
    {"name": "Lakshmi Iyer", "rating_avg": 4.8, "phone_number": "+91-9876543215"},
    {"name": "Ravi Shankar", "rating_avg": 4.7, "phone_number": "+91-9876543216"},
    {"name": "Anita Deshmukh", "rating_avg": 4.9, "phone_number": "+91-9876543217"},
    {"name": "Manoj Tiwari", "rating_avg": 4.6, "phone_number": "+91-9876543218"},
    {"name": "Kavita Reddy", "rating_avg": 4.8, "phone_number": "+91-9876543219"},
]

# ═══════════════════════════════════════════════════════════════════
# PILGRIMAGE ROUTES
# ═══════════════════════════════════════════════════════════════════

PILGRIMAGE_ROUTES = [
    {"name": "Char Dham Yatra", "description": "Sacred journey to Badrinath, Kedarnath, Gangotri, Yamunotri", "distance_km": 2000, "estimated_duration_minutes": 14400},
    {"name": "Jyotirlinga Circuit", "description": "Visit all 12 Jyotirlingas across India", "distance_km": 5000, "estimated_duration_minutes": 43200},
    {"name": "Ashtavinayak Yatra", "description": "Visit 8 Ganesha temples in Maharashtra", "distance_km": 800, "estimated_duration_minutes": 5760},
    {"name": "Varanasi to Ayodhya", "description": "Holy cities of Varanasi and Ayodhya", "distance_km": 200, "estimated_duration_minutes": 240},
    {"name": "South India Temple Tour", "description": "Temples of Tamil Nadu, Karnataka, and Kerala", "distance_km": 1500, "estimated_duration_minutes": 11520},
    {"name": "Rajasthan Temple Circuit", "description": "Temples of Rajasthan including Pushkar and Ajmer", "distance_km": 600, "estimated_duration_minutes": 4320},
    {"name": "Himalayan Yatra", "description": "Badrinath, Kedarnath, and Vaishno Devi", "distance_km": 1200, "estimated_duration_minutes": 8640},
    {"name": "Shakti Peeth Yatra", "description": "Visit sacred Shakti Peeths across India", "distance_km": 3000, "estimated_duration_minutes": 25920},
]

# ═══════════════════════════════════════════════════════════════════
# PANDITS
# ═══════════════════════════════════════════════════════════════════

PANDITS = [
    {"name": "Pandit Ramesh Sharma", "phone_number": "+91-9876543220"},
    {"name": "Pandit Suresh Tiwari", "phone_number": "+91-9876543221"},
    {"name": "Pandit Hari Prasad", "phone_number": "+91-9876543222"},
    {"name": "Pandit Krishna Murari", "phone_number": "+91-9876543223"},
    {"name": "Pandit Shri Ram Chaturvedi", "phone_number": "+91-9876543224"},
    {"name": "Pandit Venkatesh Bhatt", "phone_number": "+91-9876543225"},
    {"name": "Pandit Anil Joshi", "phone_number": "+91-9876543226"},
    {"name": "Pandit Deepak Mishra", "phone_number": "+91-9876543227"},
    {"name": "Pandit Sanjay Kulkarni", "phone_number": "+91-9876543228"},
    {"name": "Pandit Vinayak Dixit", "phone_number": "+91-9876543229"},
]

# ═══════════════════════════════════════════════════════════════════
# TRANSPORTATION
# ═══════════════════════════════════════════════════════════════════

TRANSPORTATION = [
    {"provider_name": "State Transport Corporation", "transport_type": "bus", "contact_number": "+91-1800-123-4567"},
    {"provider_name": "Temple Trust Transport", "transport_type": "bus", "contact_number": "+91-9876543300"},
    {"provider_name": "Shared Auto Service", "transport_type": "auto", "contact_number": "+91-9876543301"},
    {"provider_name": "Pilgrim Taxi Service", "transport_type": "taxi", "contact_number": "+91-9876543302"},
    {"provider_name": "Premium Cab Service", "transport_type": "cab", "contact_number": "+91-9876543303"},
    {"provider_name": "Bicycle Rental", "transport_type": "bicycle", "contact_number": "+91-9876543304"},
    {"provider_name": "Electric Rickshaw", "transport_type": "e-rickshaw", "contact_number": "+91-9876543305"},
    {"provider_name": "Helicopter Service", "transport_type": "helicopter", "contact_number": "+91-9876543306"},
]

# ═══════════════════════════════════════════════════════════════════
# EVENTS (For each temple)
# ═══════════════════════════════════════════════════════════════════

def generate_events(temple_id):
    return [
        {"id": uid(), "temple_id": temple_id, "title": "Morning Aarti", "description": "Daily morning prayer ceremony at dawn", "starts_on": datetime.now(), "is_public": True},
        {"id": uid(), "temple_id": temple_id, "title": "Evening Aarti", "description": "Daily evening prayer ceremony", "starts_on": datetime.now(), "is_public": True},
        {"id": uid(), "temple_id": temple_id, "title": "Bhajan Sandhya", "description": "Weekly devotional music session", "starts_on": datetime.now() + timedelta(days=3), "is_public": True},
        {"id": uid(), "temple_id": temple_id, "title": "Pravachan", "description": "Spiritual discourse by visiting scholar", "starts_on": datetime.now() + timedelta(days=7), "is_public": True},
    ]

# ═══════════════════════════════════════════════════════════════════
# TEMPLE REVIEWS (Sample data)
# ═══════════════════════════════════════════════════════════════════

REVIEW_TEMPLATES = [
    {"rating": 5, "title": "Amazing spiritual experience", "body": "The temple atmosphere was divine. The darshan was smooth and well-organized."},
    {"rating": 5, "title": "Must visit place", "body": "Beautiful architecture and peaceful environment. Highly recommended for all devotees."},
    {"rating": 4, "title": "Good experience overall", "body": "Temple was clean and well-maintained. Could improve crowd management during peak hours."},
    {"rating": 5, "title": "Divine experience", "body": "Felt very blessed after the darshan. The priests were very helpful and knowledgeable."},
    {"rating": 4, "title": "Beautiful temple", "body": "The temple is beautifully maintained. The prasad was delicious. Worth the visit."},
    {"rating": 5, "title": "Incredible architecture", "body": "The temple architecture is stunning. Every corner tells a story of our rich heritage."},
    {"rating": 4, "title": "Well organized darshan", "body": "The online booking system made darshan smooth. No long queues. Very efficient."},
    {"rating": 5, "title": "Peaceful and serene", "body": "The temple complex is very peaceful. Perfect for meditation and spiritual reflection."},
    {"rating": 4, "title": "Great prasad and food", "body": "The community kitchen serves excellent prasad. Clean and hygienic preparation."},
    {"rating": 5, "title": "A lifetime experience", "body": "Visiting this temple was a life-changing experience. The divine energy is palpable."},
]

# ═══════════════════════════════════════════════════════════════════
# USERS (Sample data)
# ═══════════════════════════════════════════════════════════════════

USERS = [
    {"id": uid(), "email": "admin@namosetu.com", "full_name": "Namo Setu Admin", "is_active": True},
    {"id": uid(), "email": "rahul.sharma@gmail.com", "full_name": "Rahul Sharma", "is_active": True},
    {"id": uid(), "email": "priya.patel@gmail.com", "full_name": "Priya Patel", "is_active": True},
    {"id": uid(), "email": "amit.kumar@gmail.com", "full_name": "Amit Kumar", "is_active": True},
    {"id": uid(), "email": "sunita.dev@gmail.com", "full_name": "Sunita Devi", "is_active": True},
    {"id": uid(), "email": "vikram.singh@gmail.com", "full_name": "Vikram Singh", "is_active": True},
    {"id": uid(), "email": "lakshmi.iyer@gmail.com", "full_name": "Lakshmi Iyer", "is_active": True},
    {"id": uid(), "email": "manoj.tiwari@gmail.com", "full_name": "Manoj Tiwari", "is_active": True},
    {"id": uid(), "email": "anita.deshmukh@gmail.com", "full_name": "Anita Deshmukh", "is_active": True},
    {"id": uid(), "email": "rajinikanth@gmail.com", "full_name": "Rajini Kanth", "is_active": True},
]

# ═══════════════════════════════════════════════════════════════════
# NOTIFICATIONS
# ═══════════════════════════════════════════════════════════════════

NOTIFICATIONS = [
    {"title": "Welcome to Namo Setu", "body": "Thank you for joining Namo Setu. Explore sacred temples across India.", "channel": "in_app"},
    {"title": "Booking Confirmed", "body": "Your darshan booking has been confirmed. Check your email for details.", "channel": "email"},
    {"title": "Festival Reminder", "body": "Maha Shivaratri is approaching. Book your darshan slots now!", "channel": "push"},
    {"title": "Special Darshan Available", "body": "VIP darshan slots are now available for this weekend.", "channel": "push"},
    {"title": "Donation Receipt", "body": "Your donation receipt is ready. Download from your profile.", "channel": "email"},
    {"title": "Temple Update", "body": "New timings are effective from next week. Please check the temple page.", "channel": "in_app"},
    {"title": "AI Recommendation", "body": "Based on your preferences, we recommend visiting Kashi Vishwanath.", "channel": "push"},
    {"title": "Festival Special", "body": "Special pujas are arranged for Ganesh Chaturthi. Book now!", "channel": "push"},
    {"title": "Travel Alert", "body": "Weather advisory for hill temples. Please check travel conditions.", "channel": "sms"},
    {"title": "New Feature", "body": "Voice assistant is now available in 10 regional languages!", "channel": "in_app"},
]
