const data = {
  USA: ["James Anderson", "Michael Carter", "Daniel Walker", "Ethan Brooks", "Ryan Mitchell", "Sophia Johnson", "Emily Parker", "Olivia Morgan", "Charlotte Evans", "Ava Thompson", "Benjamin Harris", "Matthew Collins", "Christopher Reed", "Nathan Cooper", "Alexander White", "Grace Wilson", "Victoria Lewis", "Madison Clark", "Abigail Scott", "Hannah Rivera"],
  UK: ["Oliver Smith", "George Williams", "Harry Brown", "Jack Taylor", "Thomas Davies", "Amelia Wilson", "Isla Johnson", "Sophie Walker", "Freya Thompson", "Charlotte Evans", "Henry Roberts", "Edward Hughes", "William Turner", "Arthur Collins", "Leo Morgan", "Emily Scott", "Jessica Parker", "Lucy Cooper", "Mia Richardson", "Ella Bennett"],
  Singapore: ["Ethan Tan", "Ryan Lim", "Daniel Wong", "Marcus Lee", "Jason Koh", "Cheryl Ong", "Rachel Tan", "Grace Lim", "Amanda Chua", "Michelle Ng", "Adrian Goh", "Brandon Teo", "Nicole Seah", "Vanessa Yeo", "Kevin Ang", "Sophia Ho", "Darren Loh", "Jasmine Quek", "Terence Yap", "Clarissa Toh"],
  China: ["Li Wei", "Wang Jun", "Chen Hao", "Zhang Lei", "Liu Yang", "Mei Lin", "Xiao Chen", "Lin Yue", "Wang Fang", "Zhao Min", "Sun Tao", "Guo Jian", "Xu Ming", "Huang Bo", "Zhou Kai", "Yang Mei", "Tang Li", "Feng Yu", "Jin Hao", "Cai Wen"],
  Tanzania: ["John Mwakyusa", "Peter Msuya", "David Mrema", "Joseph Mallya", "Emmanuel Nyerere", "Neema Joseph", "Asha Mwakipesile", "Rehema Bakari", "Zawadi Mushi", "Grace Mollel", "Michael Mosha", "Brian Mariki", "Kelvin Mtema", "Esther Kilango", "Glory Mtei", "Anna Mwakalebela", "Victor Chuwa", "Happiness Mgaya", "Frank Mbise", "Janeth Lyimo"],
  Uganda: ["Brian Kato", "Daniel Ssemanda", "Michael Mugisha", "Isaac Okello", "David Byaruhanga", "Sarah Namusoke", "Gloria Nankunda", "Mercy Atim", "Patricia Nalubega", "Ruth Achieng", "Joseph Tumusiime", "Paul Wasswa", "Ronald Ocen", "Kevin Kakooza", "Esther Nakato", "Sharon Akello", "Emmanuel Ssenyonga", "Doreen Nantongo", "Ivan Balikuddembe", "Peace Kemigisa"],
  Ghana: ["Kwame Mensah", "Kofi Asare", "Yaw Boateng", "Kojo Owusu", "Nana Ofori", "Akosua Serwaa", "Abena Nyarko", "Efua Adjei", "Ama Bonsu", "Adwoa Acheampong", "Michael Tetteh", "Daniel Opoku", "Samuel Appiah", "Prince Amoako", "Emmanuel Frimpong", "Mavis Agyeman", "Priscilla Asante", "Gloria Akuffo", "Ruth Baah", "Linda Osei"],
  Nigeria: ["Chinedu Okafor", "Oluwaseun Adeyemi", "Emeka Nwosu", "Tunde Balogun", "Sani Abdullahi", "Adaeze Obi", "Chioma Eze", "Temiloluwa Adebayo", "Aisha Bello", "Kelechi Umeh", "Ifeanyi Okeke", "Maryam Musa", "Obinna Ekwueme", "Toluwani Fashola", "Yakubu Garba", "Amarachi Nnamdi", "Yetunde Lawal", "Halima Usman", "Somto Chukwu", "Bolanle Ojo"],
  Australia: ["Liam Wilson", "Noah Taylor", "Jack Anderson", "Ethan Murphy", "Lucas Brown", "Olivia Harris", "Charlotte White", "Amelia Walker", "Sophie Martin", "Mia Thompson", "William Scott", "James Cooper", "Benjamin Hall", "Alexander Young", "Daniel King", "Emily Green", "Grace Adams", "Ella Roberts", "Chloe Baker", "Isabella Evans"],
  SouthAfrica: ["Sipho Dlamini", "Thabo Nkosi", "Sizwe Mokoena", "Lungelo Khumalo", "Mandla Zulu", "Ayanda Ndlovu", "Nomvula Sithole", "Thandeka Mthembu", "Lerato Molefe", "Zanele Buthelezi", "Brian Jacobs", "Daniel Petersen", "Michael Naidoo", "Jason van Wyk", "Ethan Botha", "Nokuthula Cele", "Amanda Daniels", "Precious Masinga", "Faith Madonsela", "Kagiso Radebe"],
  IvoryCoast: ["Kouassi Koffi", "Yao Brou", "Kone Ibrahim", "Bakary Traore", "N’Guessan Yapi", "Aminata Coulibaly", "Mariam Konate", "Awa Bamba", "Fatou Diakite", "Akissi Kouame", "Jean Kouassi", "Didier Gnahore", "Eric Drogba", "Christian Yeboah", "Franck Tano", "Clarisse Koffi", "Estelle Brou", "Viviane N’Dri", "Murielle Kouadio", "Nadia Aka"],
  Kenya: ["Brian Mwangi", "Kevin Otieno", "Samuel Kiptoo", "David Kamau", "Peter Odhiambo", "Wanjiku Njeri", "Faith Atieno", "Mercy Akinyi", "Sharon Chebet", "Lilian Jepkorir", "Daniel Mutua", "John Kiplangat", "Victor Maina", "Emmanuel Kariuki", "Ian Ouma", "Naomi Wangari", "Gloria Nyambura", "Purity Jepkosgei", "Brenda Wairimu", "Alice Nekesa"],
  Zimbabwe: ["Tawanda Moyo", "Tatenda Dube", "Blessing Ncube", "Simba Chikore", "Farai Zhou", "Rumbidzai Muchengeti", "Nyasha Sibanda", "Tariro Mlambo", "Rutendo Chirwa", "Chipo Ndlovu", "Tanaka Bhebhe", "Kudakwashe Mpofu", "Prince Hove", "Brian Marufu", "Emmanuel Gutu", "Ashley Muzenda", "Nomsa Dlamini", "Faith Zinyemba", "Precious Chari", "Melissa Chiwenga"]
};

const countryCodes = {
  USA: "US", UK: "GB", Singapore: "SG", China: "CN", Tanzania: "TZ",
  Uganda: "UG", Ghana: "GH", Nigeria: "NG", Australia: "AU",
  SouthAfrica: "ZA", IvoryCoast: "CI", Kenya: "KE", Zimbabwe: "ZW"
};

const reviewTexts = [
  "The ROI is consistent and the interface is very professional. Highly recommended for serious investors.",
  "Tavari Wave has transformed how I manage my digital assets. The neural link tech is impressive.",
  "Fast withdrawals and great support. The premium plan is a game changer.",
  "Seamless experience from signup to my first harvest. Very reliable.",
  "The security protocols give me peace of mind. A top-tier platform.",
  "Impressive yields and very transparent operations. Love the dashboard.",
  "Good platform for institutional grade returns. Highly stable.",
  "Tavari is the future of wealth management. Simple and effective.",
  "The regular plan is perfect for beginners. The daily node pulse is addictive.",
  "Exceptional service and very rewarding ROI clusters.",
  "Finally a platform that delivers on its promises. No delays.",
  "The user experience is premium. Everything works as expected.",
  "Reliable and secure. The node activation process is very smooth.",
  "Great for long term wealth building. The Elite plan is massive.",
  "Excellent support team. They guided me through my first institutional deposit.",
  "The neural trading engine is truly next-gen. Solid returns.",
  "Consistent daily earnings. Best decision I made this year.",
  "Premium interface for premium investors. Highly recommend.",
  "Tavari Wave is setting new standards in asset management.",
  "Elite security and elite performance. Best in the market."
];

const timeAgos = ["2 days ago", "1 week ago", "3 weeks ago", "1 month ago", "2 months ago", "3 months ago", "4 months ago", "5 months ago", "6 months ago", "7 months ago", "8 months ago", "9 months ago", "10 months ago", "11 months ago", "1 year ago", "2 years ago"];

const reviews = [];
let idCounter = 1;

for (const [country, names] of Object.entries(data)) {
  names.forEach((name, index) => {
    reviews.push({
      id: `${countryCodes[country].toLowerCase()}-${idCounter++}`,
      name: name,
      countryCode: countryCodes[country],
      countryName: country,
      rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
      text: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
      timeAgo: timeAgos[Math.floor(Math.random() * timeAgos.length)]
    });
  });
}

console.log(JSON.stringify(reviews, null, 2));
