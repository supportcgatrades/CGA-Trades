export interface CountryConfig {
  name: string;
  flag: string;
  names: string[];
}

const buildNames = (firsts: string[], lasts: string[]): string[] => {
  const result: string[] = [];
  for (const f of firsts) {
    for (const l of lasts) {
      result.push(`${f} ${l}`);
    }
  }
  return result;
};

export const COUNTRIES: { [key: string]: CountryConfig } = {
  nigeria: {
    name: "Nigeria",
    flag: "🇳🇬",
    names: buildNames(
      [
        "Tunde", "Femi", "Biyi", "Segun", "Babajide", "Temilade", "Mariam", "Suleiman", "Adewale", "Grace",
        "Emmanuel", "Blessing", "Samuel", "Peace", "Caleb", "Chinedu", "Emeka", "Ngozi", "Chioma", "Daniel",
        "David", "Chidi", "Uche", "Rita", "Halima", "Sani", "Zainab", "Bashir", "Ismaila", "Fatima"
      ],
      [
        "Balogun", "Olayinka", "Adedeji", "Lawal", "Bello", "Jimoh", "Okonkwo", "Nwosu", "Ani", "Okechukwu",
        "Ibrahim", "Abubakar", "Yusuf", "Ahmed", "Usman", "Ekpo", "George", "Daniel", "Abiola", "Oloyede",
        "Salami", "Gbadamosi", "Ezenwa", "Chukwu", "Nnadi", "Adebayo", "Falana", "Bakare", "Daramola", "Ajayi"
      ]
    )
  },
  japan: {
    name: "Japan",
    flag: "🇯🇵",
    names: buildNames(
      [
        "Kaito", "Takuya", "Haruto", "Yuto", "Sota", "Yuki", "Hiroshi", "Kenji", "Daiki", "Ryota",
        "Yuka", "Mei", "Sakura", "Himari", "Aoi", "Hana", "Yui", "Rio", "Ichika", "Minoru",
        "Shinji", "Satoshi", "Daigo", "Takashi", "Asuka", "Naoki", "Rei", "Chiyo", "Kazuo", "Arata"
      ],
      [
        "Sato", "Suzuki", "Takahashi", "Tanaka", "Watanabe", "Ito", "Yamamoto", "Nakamura", "Kobayashi", "Kato",
        "Yoshida", "Yamada", "Sasaki", "Yamaguchi", "Saito", "Kimura", "Mori", "Hayashi", "Shimizu", "Yamazaki",
        "Ikeda", "Hashimoto", "Abe", "Inoue", "Maeda", "Fujita", "Nakajima", "Seki", "Goto", "Okada"
      ]
    )
  },
  brazil: {
    name: "Brazil",
    flag: "🇧🇷",
    names: buildNames(
      [
        "Gabriel", "Lucas", "Matheus", "Pedro", "Thiago", "Joao", "Felipe", "Bruno", "Gustavo", "Rodrigo",
        "Douglas", "Rafael", "Andre", "Ana", "Maria", "Julia", "Beatriz", "Leticia", "Amanda", "Gabriela",
        "Mariana", "Fernanda", "Juliana", "Camila", "Larissa", "Luana", "Aline", "Patricia", "Fabio", "Ricardo"
      ],
      [
        "Silva", "Santos", "Oliveira", "Souza", "Rodrigues", "Ferreira", "Alves", "Pereira", "Lima", "Gomes",
        "Costa", "Ribeiro", "Martins", "Carvalho", "Almeida", "Pinto", "Rocha", "Teixeira", "Mendes", "Barros",
        "Cardoso", "Moreira", "Nunes", "Vieira", "Castro", "Dias", "Barbosa", "Araujo", "Cardoso", "Borges"
      ]
    )
  },
  india: {
    name: "India",
    flag: "🇮🇳",
    names: buildNames(
      [
        "Aarav", "Arjun", "Aditya", "Vihaan", "Krishna", "Sai", "Ishaan", "Pranav", "Kabir", "Rohan",
        "Rahul", "Ananya", "Diya", "Ishita", "Kiara", "Meera", "Neha", "Shreya", "Tanvi", "Amit",
        "Rajesh", "Suresh", "Vikram", "Shyam", "Divya", "Priya", "Karan", "Anoop", "Sanjay", "Vijay"
      ],
      [
        "Sharma", "Kumar", "Singh", "Patel", "Chawla", "Joshi", "Mehta", "Nair", "Reddy", "Rao",
        "Prasad", "Iyer", "Gupta", "Sen", "Chatterjee", "Mukherjee", "Roy", "Das", "Deshmukh", "Kulkarni",
        "Choudhury", "Verma", "Pandey", "Mishra", "Dubey", "Banerjee", "Bose", "Menon", "Bhat", "Pathak"
      ]
    )
  },
  germany: {
    name: "Germany",
    flag: "🇩🇪",
    names: buildNames(
      [
        "Lukas", "Maximilian", "Jakob", "Jonas", "Alexander", "Leon", "Paul", "Ben", "Noah", "Emil",
        "Marie", "Sophie", "Maria", "Mia", "Emma", "Hannah", "Emilia", "Anna", "Lea", "Felix",
        "David", "Tim", "Sebastian", "Philipp", "Laura", "Sarah", "Julia", "Katharina", "Lisa", "Melanie"
      ],
      [
        "Müller", "Schmidt", "Schneider", "Fischer", "Weber", "Meyer", "Wagner", "Becker", "Schulz", "Hoffmann",
        "Schäfer", "Koch", "Bauer", "Richter", "Klein", "Wolf", "Neumann", "Schwarz", "Zimmermann", "Braun",
        "Krüger", "Hofmann", "Hartmann", "Lange", "Schmitt", "Werner", "Schmitz", "Krause", "Meier", "Lehmann"
      ]
    )
  },
  united_kingdom: {
    name: "United Kingdom",
    flag: "🇬🇧",
    names: buildNames(
      [
        "Oliver", "Jack", "Harry", "Charlie", "Thomas", "George", "James", "William", "Alfie", "Joshua",
        "Henry", "Arthur", "Fred", "Edward", "Albert", "Oscar", "Albie", "Teddy", "Archie", "Leo",
        "Theo", "Tommy", "Freddie", "Isaac", "Connor", "Max", "Jude", "Emily", "Olivia", "Lily"
      ],
      [
        "Smith", "Jones", "Williams", "Brown", "Taylor", "Davies", "Wilson", "Evans", "Thomas", "Roberts",
        "Johnson", "Lewis", "Walker", "Wood", "Robinson", "Watson", "Hughes", "White", "Green", "Hall",
        "Martin", "Jackson", "Clarke", "Ward", "Turner", "Carter", "Simpson", "Mitchell", "Morrison", "Cox"
      ]
    )
  },
  united_states: {
    name: "United States",
    flag: "🇺🇸",
    names: buildNames(
      [
        "Liam", "Noah", "Oliver", "Elijah", "William", "James", "Benjamin", "Lucas", "Henry", "Alexander",
        "Mason", "Michael", "Ethan", "Daniel", "Jacob", "Logan", "Jackson", "Levi", "Sebastian", "Mateo",
        "Jack", "Owen", "Theodore", "Samuel", "Wyatt", "John", "David", "Emma", "Olivia", "Ava"
      ],
      [
        "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson",
        "Martinez", "Anderson", "Taylor", "Thomas", "Hernandez", "Moore", "Martin", "Jackson", "Thompson", "White",
        "Lopez", "Lee", "Gonzalez", "Harris", "Clark", "Lewis", "Robinson", "Walker", "Young", "Allen"
      ]
    )
  },
  canada: {
    name: "Canada",
    flag: "🇨🇦",
    names: buildNames(
      [
        "Ethan", "Liam", "William", "Lucas", "Logan", "Benjamin", "Noah", "Jacob", "James", "Robert",
        "John", "David", "Joseph", "Charles", "Thomas", "Daniel", "Paul", "Patrick", "Samuel", "Olivier",
        "Felix", "Alexandre", "Mathieu", "Jonathan", "Nicolas", "Maxime", "Emma", "Olivia", "Chloe", "Emily"
      ],
      [
        "Brooks", "Tremblay", "Roy", "Gagnon", "Cote", "Bouchard", "Gagne", "Lefebvre", "Landry", "Mercer",
        "Campbell", "Smith", "Brown", "Wilson", "Macdonald", "Fraser", "Belanger", "Fortin", "Pelletier", "Nadeau",
        "Hebert", "Lapointe", "Simard", "Ouellet", "Larouche", "Lavoie", "Dube", "Villeneuve", "Fournier", "Morin"
      ]
    )
  },
  australia: {
    name: "Australia",
    flag: "🇦🇺",
    names: buildNames(
      [
        "Mason", "Oliver", "Noah", "Jack", "William", "Leo", "Lucas", "Thomas", "Henry", "Charlie",
        "James", "Harry", "Hudson", "Hunter", "Eli", "Cooper", "Archie", "Alexander", "Samuel", "Ethan",
        "Christian", "Liam", "Benjamin", "Daniel", "Matthew", "Timothy", "Andrew", "Charlotte", "Amelia", "Mia"
      ],
      [
        "Clarke", "Smith", "Jones", "Williams", "Brown", "Wilson", "Taylor", "Morton", "Kelly", "Johnston",
        "Davies", "Singh", "Nguyen", "Patel", "Wright", "Cox", "Jenkins", "Morris", "Wood", "Hall",
        "Ward", "Green", "Abbott", "Fisher", "Howard", "Hughes", "Carter", "Walker", "Nolan", "Barker"
      ]
    )
  },
  bangladesh: {
    name: "Bangladesh",
    flag: "🇧🇩",
    names: buildNames(
      [
        "Tamim", "Mushfiq", "Taskin", "Shoriful", "Taijul", "Mehidy", "Litton", "Soumya", "Towhid", "Najmul",
        "Zakir", "Shahadat", "Nurul", "Afif", "Hasan", "Khaled", "Ebadot", "Nayeem", "Abu", "Rubel",
        "Shafiul", "Saif", "Mosaddek", "Anamul", "Nasir", "Imrul", "Jahurul", "Shahriar", "Habib", "Amin"
      ],
      [
        "Rahman", "Iqbal", "Hasan", "Ahmed", "Islam", "Hossain", "Riyad", "Miraz", "Sarkar", "Hridoy",
        "Shanto", "Joy", "Ali", "Miah", "Kazi", "Munshi", "Chowdhury", "Patwari", "Bhuiyan", "Uddin",
        "Molla", "Sikder", "Akand", "Sheikh", "Siddique", "Talukder", "Howlader", "Dewan", "Talha", "Zaman"
      ]
    )
  },
  south_africa: {
    name: "South Africa",
    flag: "🇿🇦",
    names: buildNames(
      [
        "Sipho", "Thabo", "Zolani", "Bongani", "Sibusiso", "Jabulani", "Mandla", "Nkosana", "Zola", "Lerato",
        "Bongi", "Nomusa", "Temba", "Pieter", "Johan", "Andre", "Francois", "Gerrit", "Barend", "Willem",
        "Frikkie", "Schalk", "Dirk", "Gareth", "Kagiso", "Lungi", "Keshav", "Heinrich", "Quinton", "Aiden"
      ],
      [
        "Zuma", "Nkosi", "Mahlangu", "Khumalo", "Mthethwa", "Dlamini", "Ndlovu", "Ntuli", "Sibiya", "Mokwena",
        "Mokoena", "Cele", "Mthembu", "Botha", "De Wet", "Pretorius", "Coetzee", "Kruger", "Nel", "du Plessis",
        "Burger", "Jansen", "Boucher", "Joubert", "Wilkinson", "Naidoo", "Rabada", "Ngidi", "Bavuma", "Maharaj"
      ]
    )
  },
  kenya: {
    name: "Kenya",
    flag: "🇰🇪",
    names: buildNames(
      [
        "Brian", "John", "Kevin", "Peter", "David", "James", "Michael", "Eliud", "Paul", "Bernard",
        "Evans", "Moses", "Joseph", "Silas", "Daniel", "Patrick", "Alex", "Simon", "Stephen", "Benson",
        "Geofrey", "Anthony", "Charles", "Francis", "Samuel", "Mary", "Beatrice", "Grace", "Faith", "Ruth"
      ],
      [
        "Mwangi", "Otieno", "Omondi", "Onyango", "Odhiambo", "Ochieng", "Okoth", "Kiprop", "Kipruto", "Kipkoech",
        "Wafula", "Makokha", "Simiyu", "Wambua", "Musyoka", "Mutua", "Wanjiku", "Kamau", "Njoroge", "Ndwiga",
        "Gicheru", "Maina", "Kariuki", "Nderitu", "Gichuru", "Kuria", "Muriithi", "Maina", "Waweru", "Karanja"
      ]
    )
  },
  uganda: {
    name: "Uganda",
    flag: "🇺🇬",
    names: buildNames(
      [
        "Moses", "Florence", "Sarah", "Joseph", "John", "Grace", "Robert", "Charles", "Richard", "David",
        "Patrick", "James", "Peter", "Mary", "Margaret", "Elizabeth", "Harriet", "Susan", "Joyce", "Isma",
        "Stephen", "Ronald", "Denis", "Andrew", "William", "Arthur", "Nicholas", "Brian", "Paul", "Christopher"
      ],
      [
        "Kigozi", "Kateregga", "Namubiru", "Nsubuga", "Mukasa", "Mugisha", "Kizza", "Byaruhanga", "Ochieng", "Okello",
        "Oryem", "Ssewankambo", "Mayanja", "Nakintu", "Namaganda", "Nabakooza", "Nabosa", "Atim", "Acan", "Lule",
        "Wasswa", "Kato", "Ssemwogerere", "Mwesigwa", "Kaboyo", "Musoke", "Ssenyonga", "Masembe", "Mugerwa", "Opio"
      ]
    )
  },
  tanzania: {
    name: "Tanzania",
    flag: "🇹🇿",
    names: buildNames(
      [
        "Juma", "Halima", "Asha", "Said", "Salama", "Daudi", "Baraka", "Neema", "Rehema", "Mwajuma",
        "Ali", "Anna", "Amina", "Ibrahim", "John", "Mwita", "Abdallah", "Ramadhani", "Hamisi", "Shabani",
        "Selemani", "Yusufu", "Kassim", "Hussein", "Yahaya", "Bakari", "Fatuma", "Mariamu", "Khadija", "Mwanahamis"
      ],
      [
        "Kikwete", "Hassan", "Kawawa", "Salim", "Sokoine", "Mrema", "Shibuda", "Zitto", "Lema", "Mkapa",
        "Massanja", "Malecela", "Magufuli", "Kapama", "Nyerere", "Chacha", "Ally", "Salum", "Juma", "Bakari",
        "Athumani", "Rashidi", "Shaban", "Omari", "Kibwana", "Makame", "Abeid", "Khalfan", "Khamis", "Seif"
      ]
    )
  },
  cameroon: {
    name: "Cameroon",
    flag: "🇨🇲",
    names: buildNames(
      [
        "Samuel", "Roger", "Rigobert", "Vincent", "Eric", "Frank", "Toko", "Nicolas", "Christian", "Ambroise",
        "Pierre", "Francois", "Patrick", "Geremi", "Jacques", "Clinton", "Georges", "Jean", "Alex", "Joel",
        "Stephane", "Landry", "Aurelien", "Benoit", "Sebastien", "Idress", "Charles", "Guy", "Michael", "Adolo"
      ],
      [
        "Eto", "Milla", "Song", "Aboubakar", "Choupo", "Anguissa", "Ekambi", "N'Koulou", "Bassogog", "Oyongo",
        "Kunde", "Biyik", "Mboma", "Wome", "Njitap", "Songoo", "N'Jie", "Mandjeck", "Makoun", "Matip",
        "Mbia", "N'Guemo", "Chedjou", "Assou", "Bassong", "Kameni", "Itandje", "Assembe", "Ngadeu", "Teikeu"
      ]
    )
  },
  egypt: {
    name: "Egypt",
    flag: "🇪🇬",
    names: buildNames(
      [
        "Mohamed", "Ahmed", "Mahmoud", "Ali", "Mustafa", "Osama", "Ibrahim", "Amr", "Omar", "Khaled",
        "Tarek", "Sherif", "Yasser", "Hany", "Adel", "Wael", "Essam", "Hosny", "Emad", "Sayed"
      ],
      [
        "Salah", "Hegazi", "Trezeguet", "Shenawy", "Gabal", "Hamdy", "Fatouh", "Elneny", "Sulaya", "Marmoush",
        "Hamed", "Ashour", "Ramzy", "Emam", "Gomaa", "Hadary", "Hassan", "Zaki", "Kamel", "Meteb"
      ]
    )
  },
  singapore: {
    name: "Singapore",
    flag: "🇸🇬",
    names: buildNames(
      [
        "Ryan", "Rachel", "Amanda", "Kenneth", "Adrian", "Marcus", "Cheryl", "Michelle", "Benjamin", "David",
        "Farhan", "Syazwan", "Hariss", "Safuwan", "Shakir", "Shahril", "Khairul", "Baihakki", "Karthik", "Vignesh"
      ],
      [
        "Tan", "Lim", "Wong", "Goh", "Teo", "Seah", "Neo", "Low", "Kheng", "Cheong",
        "Buhari", "Harun", "Baharudin", "Hamzah", "Ishak", "Amri", "Khaizan", "Raj", "Ravichandran", "Sunny"
      ]
    )
  },
  netherlands: {
    name: "Netherlands",
    flag: "🇳🇱",
    names: buildNames(
      [
        "Jan", "Willem", "Johannes", "Cornelis", "Hendrik", "Pieter", "Gerrit", "Dirk", "Thomas", "Martijn",
        "Sander", "Bas", "Daan", "Luuk", "Sem", "Milan", "Levi", "Lucas", "Thijs", "Bram"
      ],
      [
        "de Jong", "de Vries", "van de Berg", "van Dijk", "Bakker", "Janssen", "Visser", "Smit", "Meijer", "de Graaf",
        "de Cock", "van Dongen", "Mulder", "Peters", "de Wilde", "Bos", "Dekker", "Vos", "Brouwer", "de Ruiter"
      ]
    )
  },
  sweden: {
    name: "Sweden",
    flag: "🇸🇪",
    names: buildNames(
      [
        "Lars", "Anders", "Mikael", "Johan", "Per", "Erik", "Jan", "Peter", "Karl", "Thomas",
        "Olof", "Sven", "Nils", "Bo", "Bengt", "Victor", "Emil", "Alexander", "Robin", "Ludwig"
      ],
      [
        "Andersson", "Johansson", "Karlsson", "Nilsson", "Eriksson", "Larsson", "Olsson", "Persson", "Svensson", "Gustafsson",
        "Hansson", "Jönsson", "Pettersson", "Petersson", "Magnusson", "Lindelöf", "Forsberg", "Isak", "Olsen", "Augustinsson"
      ]
    )
  },
  switzerland: {
    name: "Switzerland",
    flag: "🇨🇭",
    names: buildNames(
      [
        "Beat", "Urs", "Reto", "Christian", "Daniel", "Thomas", "Stefan", "Markus", "Martin", "Andreas",
        "Peter", "Michael", "Werner", "Hans", "Jean", "Pierre", "Francois", "Philippe", "Laurent", "Stephane"
      ],
      [
        "Müller", "Meier", "Schmid", "Keller", "Weber", "Berger", "Huber", "Gerber", "Baumann", "Fischer",
        "Frei", "Suter", "Wenger", "Staub", "Egger", "Luthy", "Giger", "Glarner", "Kolly", "Riesen"
      ]
    )
  }
};

export const ACTION_WEIGHTS = [
  { action: "joined", weight: 18 },
  { action: "checked_in", weight: 20 },
  { action: "deposited", weight: 22 },
  { action: "invested", weight: 18 },
  { action: "claimed_reward", weight: 12 },
  { action: "withdrawn", weight: 8 },
  { action: "activated_investment", weight: 2 }
];

export const DEPOSIT_AMOUNTS = [
  { value: 80, weight: 25 },
  { value: 150, weight: 20 },
  { value: 450, weight: 18 },
  { value: 1200, weight: 15 },
  { value: 2500, weight: 12 },
  { value: 8000, weight: 7 },
  { value: 25000, weight: 2 },
  { value: 72000, weight: 1 }
];

export const WITHDRAW_AMOUNTS = [
  { value: 15, weight: 30 },
  { value: 30, weight: 25 },
  { value: 120, weight: 20 },
  { value: 350, weight: 15 },
  { value: 1500, weight: 7 },
  { value: 4800, weight: 2 },
  { value: 12500, weight: 1 }
];

export const INVESTMENT_AMOUNTS = [
  { value: 2500, weight: 30 },
  { value: 5000, weight: 25 },
  { value: 10000, weight: 20 },
  { value: 22000, weight: 15 },
  { value: 50000, weight: 7 },
  { value: 70000, weight: 2 },
  { value: 100000, weight: 1 }
];

export const REWARD_AMOUNTS = [
  { value: 25, weight: 40 },
  { value: 85, weight: 30 },
  { value: 240, weight: 18 },
  { value: 850, weight: 9 },
  { value: 4500, weight: 2.5 },
  { value: 32000, weight: 0.4 },
  { value: 646000, weight: 0.1 }
];
