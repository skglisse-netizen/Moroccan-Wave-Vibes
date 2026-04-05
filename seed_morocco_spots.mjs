import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
dotenv.config();

const spots = [
  // Nord
  {
    name: "Malabata (Tanger)",
    description: "Beach break exposé près du phare de Malabata, fonctionnant bien avec une houle d'Ouest.",
    lat: 35.783,
    lng: -5.772,
    difficulty: "Intermédiaire",
    image_url: "https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Achakkar (Tanger)",
    description: "Point break et beach break magnifique juste au sud des Grottes d'Hercule.",
    lat: 35.759,
    lng: -5.934,
    difficulty: "Tous niveaux",
    image_url: "https://images.unsplash.com/photo-1455717739948-4cc906323101?auto=format&fit=crop&q=80&w=800"
  },
  // Kénitra / Rabat
  {
    name: "Mehdia (Kénitra)",
    description: "L'un des meilleurs beach breaks du pays, très consistant avec de longues vagues.",
    lat: 34.258,
    lng: -6.666,
    difficulty: "Tous niveaux",
    image_url: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Plage des Nations",
    description: "Vagues puissantes et creuses sur fond de sable, réservé aux jours de petite houle pour les débutants.",
    lat: 34.093,
    lng: -6.745,
    difficulty: "Intermédiaire / Expert",
    image_url: "https://images.unsplash.com/photo-1520116468816-95b69f847357?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Oudayas (Rabat)",
    description: "Spot mythique au pied de la Kasbah, protégé de la houle de Nord par la jetée.",
    lat: 34.033,
    lng: -6.836,
    difficulty: "Tous niveaux",
    image_url: "https://images.unsplash.com/photo-1537519646099-ee30c5a1845c?auto=format&fit=crop&q=80&w=800"
  },
  // Bouznika / Casa
  {
    name: "Bouznika Bay",
    description: "Plage protégée idéale pour l'apprentissage avec des vagues molles et régulières.",
    lat: 33.791,
    lng: -7.158,
    difficulty: "Débutant",
    image_url: "https://images.unsplash.com/photo-1512100356956-c1b47eaa198e?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Ain Diab (Casablanca)",
    description: "Le spot urbain par excellence, très populaire avec de nombreux peaks le long de la corniche.",
    lat: 33.597,
    lng: -7.664,
    difficulty: "Tous niveaux",
    image_url: "https://images.unsplash.com/photo-1530866495547-08ce9284252a?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Dar Bouazza",
    description: "Série de reefs et beach breaks au sud de Casa, très fréquenté par les surfeurs locaux.",
    lat: 33.521,
    lng: -7.822,
    difficulty: "Intermédiaire",
    image_url: "https://images.unsplash.com/photo-1502933691298-84013465382c?auto=format&fit=crop&q=80&w=800"
  },
  // Sud
  {
    name: "Safi - Ras el Lafa",
    description: "Une des plus longues droites au monde, tube technique et puissant sur fond de dalles.",
    lat: 32.301,
    lng: -9.245,
    difficulty: "Expert",
    image_url: "https://images.unsplash.com/photo-1470434764171-8789961ee9d1?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Sidi Kaouki (Essaouira)",
    description: "Vaste plage sauvage offrant des peaks partout, très exposé au vent (bon pour le kitesurf aussi).",
    lat: 31.352,
    lng: -9.794,
    difficulty: "Tous niveaux",
    image_url: "https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Imsouane - La Baie",
    description: "La vague la plus longue du Maroc, magique pour le longboard, peut dérouler sur 800m.",
    lat: 30.835,
    lng: -9.814,
    difficulty: "Débutant / Longboard",
    image_url: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Imsouane - Cathédrale",
    description: "Point break puissant juste à côté de la baie, offre des sessions mémorables par grosse houle.",
    lat: 30.844,
    lng: -9.824,
    difficulty: "Intermédiaire / Expert",
    image_url: "https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Anchor Point (Taghazout)",
    description: "Le spot le plus iconique du Maroc, une droite parfaite qui tient les très grosses houles.",
    lat: 30.543,
    lng: -9.691,
    difficulty: "Intermédiaire / Expert",
    image_url: "https://images.unsplash.com/photo-1414490929659-9a12b7e31907?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Killer Point (Taghazout)",
    description: "Point break puissant nommé d'après les orques que l'on y apercevait parfois.",
    lat: 30.552,
    lng: -9.702,
    difficulty: "Intermédiaire / Expert",
    image_url: "https://images.unsplash.com/photo-1469395446868-ff6a048d5bc3?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Panorama (Taghazout)",
    description: "Droite facile et longue sur fond de sable et rochers, idéale pour progresser.",
    lat: 30.531,
    lng: -9.675,
    difficulty: "Tous niveaux",
    image_url: "https://images.unsplash.com/photo-1482531007909-192ac513e7b6?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Banana Point (Tamraght)",
    description: "Droite tranquille à l'embouchure de l'oued, très appréciée des débutants.",
    lat: 30.505,
    lng: -9.638,
    difficulty: "Tous niveaux",
    image_url: "https://images.unsplash.com/photo-1520443240718-fce21901db79?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Tifnit",
    description: "Village de pêcheurs pittoresque avec des vagues sauvages et non fréquentées.",
    lat: 30.201,
    lng: -9.642,
    difficulty: "Intermédiaire",
    image_url: "https://images.unsplash.com/photo-1544211130-1793774880c1?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Mirleft - Sidi Mohammed",
    description: "Magnifique plage encastrée avec des vagues de qualité dans un cadre sauvage.",
    lat: 29.585,
    lng: -10.038,
    difficulty: "Tous niveaux",
    image_url: "https://images.unsplash.com/photo-1528150177508-7cc0c36cda5c?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Sidi Ifni",
    description: "Plusieurs beach breaks aux alentours de la ville, ambiance espagnole et brume matinale.",
    lat: 29.381,
    lng: -10.171,
    difficulty: "Tous niveaux",
    image_url: "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&q=80&w=800"
  },
  // Sahara
  {
    name: "Foum el Oued (Laâyoune)",
    description: "La plage principale de Laâyoune, offre de bons beach breaks quand la houle est là.",
    lat: 27.166,
    lng: -13.415,
    difficulty: "Tous niveaux",
    image_url: "https://images.unsplash.com/photo-1468413253725-0d5181091126?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Oum Labouir (Dakhla)",
    description: "Le spot de surf de référence à Dakhla, une droite qui déroule sur une pointe de sable.",
    lat: 23.722,
    lng: -15.945,
    difficulty: "Tous niveaux",
    image_url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=800"
  },
  {
    name: "Lassarga (Dakhla)",
    description: "Situé à la pointe de la péninsule, offre des vagues interminables et très régulières.",
    lat: 23.593,
    lng: -15.932,
    difficulty: "Tous niveaux",
    image_url: "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&q=80&w=800"
  }
];

async function seedSpots() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  
  console.log("Cleaning existing spots...");
  await client.query('DELETE FROM spots');
  
  console.log(`Inserting ${spots.length} spots...`);
  
  for (const spot of spots) {
    const queryStr = `
      INSERT INTO spots (name, description, lat, lng, difficulty, image_url, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `;
    const values = [spot.name, spot.description, spot.lat, spot.lng, spot.difficulty, spot.image_url, true];
    await client.query(queryStr, values);
    console.log(`✓ Added: ${spot.name}`);
  }
  
  console.log("Seeding completed successfully!");
  await client.end();
}

seedSpots().catch(err => {
  console.error("Error seeding spots:", err);
  process.exit(1);
});
