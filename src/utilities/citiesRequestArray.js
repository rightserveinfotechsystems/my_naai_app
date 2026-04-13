export const CITY_OPTIONS = [
  { label: 'kalmeshwar', value: 'Kalmeshwar' },
  { label: 'Karanja', value: 'Karanja' },
  { label: 'Katol', value: 'Katol' },
  { label: 'Nagpur', value: 'Nagpur' },
  { label: 'Wardha', value: 'Wardha' },
  { label: 'Warud', value: 'Warud' },
];

export const SALON_OPTIONS = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Unisex', value: 'UNISEX' },
];

export const DEFAULT_SERVICES = {
  male: [
    {
      serviceName: "Normal Hair Cut",
      price: "40",
      durationMinutes: 20,
      description: "No description"
    },
    {
      serviceName: "Stylish/Fade Hair Cut",
      price: "40",
      durationMinutes: 40,
      description: "No description"
    },
    {
      serviceName: "Kids Hair Cut",
      price: "40",
      durationMinutes: 20,
      description: "No description"
    },
    {
      serviceName: "Shaving (Normal)",
      price: "40",
      durationMinutes: 20,
      description: "No description"
    },
    {
      serviceName: "Shaving (Foam/Gel)",
      price: "40",
      durationMinutes: 40,
      description: "No description"
    },
    {
      serviceName: "Beard Trimming",
      price: "40",
      durationMinutes: 20,
      description: "No description"
    },
    {
      serviceName: "Beard Styling/Setting",
      price: "40",
      durationMinutes: 20,
      description: "No description"
    },
    {
      serviceName: "Head Massage (Oil)",
      price: "40",
      durationMinutes: 20,
      description: "No description"
    },
    {
      serviceName: "Head Massage (Cream)",
      price: "40",
      durationMinutes: 20,
      description: "No description"
    },
    {
      serviceName: "Face Massage",
      price: "40",
      durationMinutes: 20,
      description: "No description"
    },
    {
      serviceName: "Face Wash / Scrub",
      price: "40",
      durationMinutes: 20,
      description: "No description"
    },
    {
      serviceName: "Hair Color (Black)",
      price: "40",
      durationMinutes: 40,
      description: "No description"
    },
    {
      serviceName: "Hair Color (Garnier/Loreal)",
      price: "40",
      durationMinutes: 60,
      description: "No description"
    },
    {
      serviceName: "Detan / Bleach",
      price: "40",
      durationMinutes: 40,
      description: "No description"
    },
    {
      serviceName: "Normal Facial",
      price: "40",
      durationMinutes: 40,
      description: "No description"
    },
    {
      serviceName: "Gold/Diamond Facial",
      price: "40",
      durationMinutes: 60,
      description: "No description"
    },
    {
      serviceName: "Hair Straightening (Men)",
      price: "40",
      durationMinutes: 80,
      description: "No description"
    },


  ],

  female: [
    {
      serviceName: "Eyebrow Threading",
      price: "40",
      durationMinutes: 20,
      description: "No description"
    },
    {
      serviceName: "Upper Lip / Forehead",
      price: "40",
      durationMinutes: 20,
      description: "No description"
    },
    {
      serviceName: "Full Face Threading",
      price: "40",
      durationMinutes: 40,
      description: "No description"
    },
    {
      serviceName: "Hair Cut (Straight/U/V)",
      price: "40",
      durationMinutes: 20,
      description: "No description"
    },
    {
      serviceName: "Advanced Cut (Layer/Step/Bob)",
      price: "40",
      durationMinutes: 40,
      description: "No description"
    },
    {
      serviceName: "Split-ends Removal",
      price: "40",
      durationMinutes: 20,
      description: "No description"
    },
    {
      serviceName: "Waxing (Half Arms)",
      price: "40",
      durationMinutes: 20,
      description: "No description"
    },
    {
      serviceName: "Waxing (Full Arms)",
      price: "40",
      durationMinutes: 40,
      description: "No description"
    },
    {
      serviceName: "Waxing (Half/Full Legs)",
      price: "40",
      durationMinutes: 40,
      description: "No description"
    },
    {
      serviceName: "Underarms Waxing",
      price: "40",
      durationMinutes: 20,
      description: "No description"
    },
    {
      serviceName: "Full Body Waxing",
      price: "40",
      durationMinutes: 80,
      description: "No description"
    },
    {
      serviceName: "Normal Facial",
      price: "40",
      durationMinutes: 40,
      description: "No description"
    },
    {
      serviceName: "Fruit / Gold / O3+ Facial",
      price: "40",
      durationMinutes: 60,
      description: "No description"
    },
    {
      serviceName: "Face Bleach / Detan",
      price: "40",
      durationMinutes: 40,
      description: "No description"
    },
    {
      serviceName: "Clean Up",
      price: "40",
      durationMinutes: 40,
      description: "No description"
    },
    {
      serviceName: "Manicure (Hands)",
      price: "40",
      durationMinutes: 40,
      description: "No description"
    },
    {
      serviceName: "Pedicure (Legs)",
      price: "40",
      durationMinutes: 40,
      description: "No description"
    },
    {
      serviceName: "Hair Spa (Basic)",
      price: "40",
      durationMinutes: 40,
      description: "No description"
    },
    {
      serviceName: "Hair Spa (Loreal/Matrix)",
      price: "40",
      durationMinutes: 60,
      description: "No description"
    },
    {
      serviceName: "Root Touchup (Color)",
      price: "40",
      durationMinutes: 40,
      description: "No description"
    },
    {
      serviceName: "Global Hair Color",
      price: "40",
      durationMinutes: 80,
      description: "No description"
    },
    {
      serviceName: "Hair Highlighting (Streaks)",
      price: "40",
      durationMinutes: 100,
      description: "No description"
    },


  ],

  unisex: [
    // SECTION 1: MEN'S HAIR & GROOMING
    { serviceName: "Normal Hair Cut", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Stylish / Fade Cut", price: "40", durationMinutes: 40, description: "No description" },
    { serviceName: "Kids Hair Cut", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Beard Trim (Machine)", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Beard Styling (Razor)", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Clean Shave", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Head Massage (Oil/Dry)", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Men's Hair Color (Black)", price: "40", durationMinutes: 40, description: "No description" },

    // SECTION 2: THREADING & FACE
    { serviceName: "Eyebrow Threading", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Upper Lip Threading", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Forehead Threading", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Chin / Side Face Threading", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Full Face Threading", price: "40", durationMinutes: 40, description: "No description" },

    // SECTION 3: WAXING
    { serviceName: "Underarms Waxing", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Half Arms Waxing", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Full Arms Waxing", price: "40", durationMinutes: 40, description: "No description" },
    { serviceName: "Half Legs Waxing", price: "40", durationMinutes: 40, description: "No description" },
    { serviceName: "Full Legs Waxing", price: "40", durationMinutes: 40, description: "No description" },
    { serviceName: "Full Body Waxing", price: "40", durationMinutes: 80, description: "No description" },
    { serviceName: "Bikini / Brazilian Wax", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Rica Wax (Add-on)", price: "40", durationMinutes: 20, description: "No description" },

    // LADIES HAIR CUT
    { serviceName: "Split-ends Removal", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Fringes / Bangs Cut", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Straight / U / V Cut", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Layer Cut", price: "40", durationMinutes: 40, description: "No description" },
    { serviceName: "Step Cut", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Bob / Pixie Cut", price: "40", durationMinutes: 40, description: "No description" },
    { serviceName: "Advance Multi-Layer Cut", price: "40", durationMinutes: 40, description: "No description" },

    // SECTION 5: SKIN CARE & FACIALS
    { serviceName: "Face Cleanup", price: "40", durationMinutes: 40, description: "No description" },
    { serviceName: "Face Bleach", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Face Detan", price: "40", durationMinutes: 40, description: "No description" },
    { serviceName: "Fruit / Herbal Facial", price: "40", durationMinutes: 40, description: "No description" },
    { serviceName: "Gold / Silver Facial", price: "40", durationMinutes: 60, description: "No description" },
    { serviceName: "Diamond / Pearl Facial", price: "40", durationMinutes: 60, description: "No description" },
    { serviceName: "O3+ / Whitening Facial", price: "40", durationMinutes: 80, description: "No description" },
    { serviceName: "Charcoal Mask", price: "40", durationMinutes: 20, description: "No description" },

    // SECTION 6: MANICURE & PEDICURE
    { serviceName: "Manicure (Basic)", price: "40", durationMinutes: 40, description: "No description" },
    { serviceName: "Pedicure (Basic)", price: "40", durationMinutes: 40, description: "No description" },
    { serviceName: "Spa Manicure", price: "40", durationMinutes: 40, description: "No description" },
    { serviceName: "Spa Pedicure", price: "40", durationMinutes: 20, description: "No description" },

    // SECTION 7: HAIR TREATMENTS & CHEMICALS
    { serviceName: "Hair Spa (Basic)", price: "40", durationMinutes: 40, description: "No description" },
    { serviceName: "Hair Spa (Loreal/Matrix)", price: "40", durationMinutes: 60, description: "No description" },
    { serviceName: "Root Touchup (Color)", price: "40", durationMinutes: 40, description: "No description" },
    { serviceName: "Global Hair Color", price: "40", durationMinutes: 80, description: "No description" },
    { serviceName: "Highlights / Streaks", price: "40", durationMinutes: 100, description: "No description" },
    { serviceName: "Smoothening", price: "40", durationMinutes: 180, description: "No description" },
    { serviceName: "Rebonding", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Keratin Treatment", price: "40", durationMinutes: 180, description: "No description" },
    { serviceName: "Botox / Nanoplastia", price: "40", durationMinutes: 180, description: "No description" },

    // SECTION 8: MAKEUP & STYLING
    { serviceName: "Hair Styling / Ironing", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Saree Draping", price: "40", durationMinutes: 20, description: "No description" },
    { serviceName: "Light / Party Makeup", price: "40", durationMinutes: 60, description: "No description" },
    { serviceName: "Bridal Makeup", price: "40", durationMinutes: 180, description: "No description" }


  ],
};