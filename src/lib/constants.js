export const DEPTS = {
  "971": { name: "Guadeloupe", lat: 16.265, lng: -61.551, r: 80000 },
  "972": { name: "Martinique", lat: 14.636, lng: -61.024, r: 60000 },
  "973": { name: "Guyane", lat: 4.937, lng: -52.326, r: 150000 },
  "974": { name: "La Réunion", lat: -21.115, lng: 55.536, r: 60000 }
};

export const B2B_CATS = [
  "hôtel",
  "restaurant",
  "centre commercial",
  "concessionnaire automobile",
  "supermarché",
  "clinique",
  "location voiture",
  "pharmacie",
  "station service",
  "bureau études",
  "électricien",
  "architecte",
  "garage automobile"
];

export const COPRO_CATS = [
  "syndic de copropriété",
  "administrateur de biens",
  "gestionnaire immobilier",
  "gestion immobilière",
  "agence immobilière gestion",
  "cabinet syndic"
];

export const PLACES_API_URL = "https://places.googleapis.com/v1/places:searchText";

export const FIELD_MASK = "places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.internationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount";
