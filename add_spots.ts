import { query, getOne } from './database/db.js';

const spots = [
  // FRANCE - NORD AU SUD
  { name: "La Torche (Bretagne)", lat: 47.838, lng: -4.349, diff: "Intermédiaire", desc: "Longue plage exposée à la houle. Vague constante et puissante." },
  { name: "Lacanau - Océan (Gironde)", lat: 44.996, lng: -1.201, diff: "Intermédiaire", desc: "Plage mythique aux vagues régulières." },
  { name: "Capbreton - La Piste", lat: 43.633, lng: -1.448, diff: "Avancé", desc: "Shorbreak puissant offrant des tubes renommés." },
  { name: "Hossegor - La Gravière", lat: 43.669, lng: -1.439, diff: "Avancé", desc: "Vagues de classe mondiale, épaisses et tubulaires." },
  { name: "Seignosse - Les Estagnots", lat: 43.684, lng: -1.438, diff: "Intermédiaire", desc: "Bancs de sable de grande qualité." },
  { name: "Biarritz - La Côte des Basques", lat: 43.479, lng: -1.567, diff: "Débutant", desc: "Le berceau du surf en Europe, idéal pour le longboard." },
  { name: "Guéthary - Parlementia", lat: 43.424, lng: -1.609, diff: "Avancé", desc: "Vague de gros très longue au large." },
  { name: "Hendaye", lat: 43.374, lng: -1.776, diff: "Débutant", desc: "Baie protégée, spots d'initiation parfaits." },
  
  // MAROC - NORD AU SUD
  { name: "Tanger - Achakar", lat: 35.764, lng: -5.938, diff: "Intermédiaire", desc: "Magnifique vue et vagues douces près des grottes d'Hercule." },
  { name: "Kenitra - Mehdia", lat: 34.259, lng: -6.671, diff: "Intermédiaire", desc: "Le plus vieux spot de surf du Maroc." },
  { name: "Rabat - Plage des Oudayas", lat: 34.032, lng: -6.837, diff: "Débutant", desc: "Plage urbaine abritée derrière la muraille antique." },
  { name: "Bouznika", lat: 33.805, lng: -7.149, diff: "Intermédiaire", desc: "Baie abritée offrant de belles droites." },
  { name: "Casablanca - Ain Diab", lat: 33.593, lng: -7.674, diff: "Débutant", desc: "Grand beach break facile d'accès." },
  { name: "Dar Bouazza", lat: 33.531, lng: -7.828, diff: "Avancé", desc: "Reef point break puissant." },
  { name: "Safi - Ras Sidi Bouzid", lat: 32.321, lng: -9.262, diff: "Avancé", desc: "Une droite tubulaire considérée comme l'un des meilleurs spots d'Afrique." },
  { name: "Essaouira", lat: 31.498, lng: -9.761, diff: "Débutant", desc: "Plage très exposée au vent, idéal tôt le matin pour les débutants." },
  { name: "Sidi Kaouki", lat: 31.352, lng: -9.795, diff: "Intermédiaire", desc: "Beach break très exposé qui capte la moindre houle." },
  { name: "Imsouane - La Baie", lat: 30.841, lng: -9.825, diff: "Débutant", desc: "La plus longue vague du Maroc, paradis du longboard." },
  { name: "Imsouane - La Cathédrale", lat: 30.842, lng: -9.828, diff: "Avancé", desc: "Point break puissant, creux et rapide." },
  { name: "Taghazout - Anchor Point", lat: 30.544, lng: -9.714, diff: "Avancé", desc: "La droite la plus célèbre du Monde Arabe." },
  { name: "Taghazout - Hash Point", lat: 30.542, lng: -9.711, diff: "Intermédiaire", desc: "Vague rapide, bonne option de repli." },
  { name: "Taghazout - Panoramas", lat: 30.539, lng: -9.704, diff: "Débutant", desc: "Droite sur fond de sable finissant sur le reef." },
  { name: "Tamraght - Banana Beach", lat: 30.509, lng: -9.680, diff: "Intermédiaire", desc: "Vague située à l'embouchure d'une rivière." },
  { name: "Agadir - Anza", lat: 30.438, lng: -9.641, diff: "Intermédiaire", desc: "Spot très constant qui fonctionne souvent quand Taghazout est plat." },
  { name: "Tifnit", lat: 30.198, lng: -9.640, diff: "Avancé", desc: "Village de pêcheurs offrant des pics creux sur les bancs de sable." },
  { name: "Mirleft", lat: 29.575, lng: -10.043, diff: "Intermédiaire", desc: "Secteur magnifique avec plusieurs plages et vagues de bonne qualité." },
  { name: "Sidi Ifni", lat: 29.380, lng: -10.174, diff: "Débutant", desc: "Spot très régulier aux longues droites face au port ancien." },
  { name: "Dakhla - Foum Labouir", lat: 23.714, lng: -15.952, diff: "Avancé", desc: "Spot sauvage aux portes du désert offrant une superbe droite au vent off-shore." },
  { name: "Dakhla - Oum Labouir", lat: 23.714, lng: -15.952, diff: "Avancé", desc: "Section réputée pour ses compétitions internationales de glisse." }
];

async function run() {
  try {
    console.log("Starting spots injection...");
    let addedCount = 0;
    
    for (const s of spots) {
      // Check if spot already exists
      const exists = await getOne("SELECT id FROM spots WHERE name = $1", [s.name]);
      if (!exists) {
        await query(
          "INSERT INTO spots (name, description, lat, lng, image_url, difficulty, suggestion_type, is_active) VALUES ($1, $2, $3, $4, $5, $6, 'general', true)",
          [
            s.name, 
            s.desc, 
            s.lat, 
            s.lng, 
            "https://images.unsplash.com/photo-1502680390469-be75c86b636f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80", 
            s.diff
          ]
        );
        addedCount++;
        console.log(`+ Added: ${s.name}`);
      } else {
        console.log(`- Skipped: ${s.name} (already exists)`);
      }
    }
    
    console.log(`Successfully completed! Added ${addedCount} new spots.`);
  } catch(e) {
    console.error("Error inserting spots:", e);
  } finally {
    process.exit(0);
  }
}

run();
