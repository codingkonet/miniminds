// MiniMINDS seed content - mirrors the Supabase tables in supabase/schema.sql
window.MM_SEED = {
  categories: [
    { id: "alphabet", name_en: "Alphabet", name_fr: "Alphabet", icon: "🔤", color: "#6C5CE7", age_group: "3-5", sort_order: 1, is_active: true },
    { id: "numbers", name_en: "Numbers", name_fr: "Les Nombres", icon: "🔢", color: "#00B894", age_group: "3-5", sort_order: 2, is_active: true },
    { id: "colors", name_en: "Colors", name_fr: "Les Couleurs", icon: "🎨", color: "#E17055", age_group: "3-5", sort_order: 3, is_active: true },
    { id: "animals", name_en: "Animals", name_fr: "Les Animaux", icon: "🦁", color: "#FDCB6E", age_group: "3-8", sort_order: 4, is_active: true },
    { id: "fruits", name_en: "Fruits & Vegetables", name_fr: "Fruits et Légumes", icon: "🍎", color: "#D63031", age_group: "3-8", sort_order: 5, is_active: true },
    { id: "body", name_en: "Body Parts", name_fr: "Le Corps", icon: "👀", color: "#0984E3", age_group: "6-8", sort_order: 6, is_active: true },
    { id: "shapes", name_en: "Shapes", name_fr: "Les Formes", icon: "⭐", color: "#E84393", age_group: "3-5", sort_order: 7, is_active: true },
    { id: "daily", name_en: "Everyday Words", name_fr: "Mots du Quotidien", icon: "🏠", color: "#00CEC9", age_group: "6-8", sort_order: 8, is_active: true }
  ],
  vocabulary: [
    // Alphabet
    ...[["A","Apple","Pomme","🍎"],["B","Ball","Ballon","⚽"],["C","Cat","Chat","🐱"],["D","Dog","Chien","🐶"],["E","Elephant","Éléphant","🐘"],["F","Fish","Poisson","🐟"],["G","Grapes","Raisin","🍇"],["H","House","Maison","🏠"]].map((v,i)=>({id:"alp"+i,category_id:"alphabet",word_en:v[1],word_fr:v[2],icon:v[3],letter:v[0],sort_order:i+1,is_active:true})),
    // Numbers
    ...[["One","Un"],["Two","Deux"],["Three","Trois"],["Four","Quatre"],["Five","Cinq"],["Six","Six"],["Seven","Sept"],["Eight","Huit"],["Nine","Neuf"],["Ten","Dix"]].map((v,i)=>({id:"num"+i,category_id:"numbers",word_en:v[0],word_fr:v[1],icon:String(i+1),sort_order:i+1,is_active:true})),
    // Colors
    ...[["Red","Rouge","#E74C3C"],["Blue","Bleu","#3498DB"],["Yellow","Jaune","#F1C40F"],["Green","Vert","#2ECC71"],["Orange","Orange","#E67E22"],["Purple","Violet","#9B59B6"],["Pink","Rose","#FD79A8"],["Black","Noir","#2D3436"]].map((v,i)=>({id:"col"+i,category_id:"colors",word_en:v[0],word_fr:v[1],icon:"●",color:v[2],sort_order:i+1,is_active:true})),
    // Animals
    ...[["Lion","Lion","🦁"],["Cat","Chat","🐱"],["Dog","Chien","🐶"],["Elephant","Éléphant","🐘"],["Monkey","Singe","🐵"],["Bird","Oiseau","🐦"],["Fish","Poisson","🐟"],["Rabbit","Lapin","🐰"]].map((v,i)=>({id:"ani"+i,category_id:"animals",word_en:v[0],word_fr:v[1],icon:v[2],sort_order:i+1,is_active:true})),
    // Fruits
    ...[["Apple","Pomme","🍎"],["Banana","Banane","🍌"],["Orange","Orange","🍊"],["Strawberry","Fraise","🍓"],["Grapes","Raisin","🍇"],["Carrot","Carotte","🥕"],["Tomato","Tomate","🍅"],["Pear","Poire","🍐"]].map((v,i)=>({id:"fru"+i,category_id:"fruits",word_en:v[0],word_fr:v[1],icon:v[2],sort_order:i+1,is_active:true})),
    // Body
    ...[["Eye","Œil","👁️"],["Ear","Oreille","👂"],["Nose","Nez","👃"],["Hand","Main","✋"],["Head","Tête","🙂"],["Foot","Pied","🦶"]].map((v,i)=>({id:"bod"+i,category_id:"body",word_en:v[0],word_fr:v[1],icon:v[2],sort_order:i+1,is_active:true})),
    // Shapes
    ...[["Circle","Cercle","⭕"],["Square","Carré","🟦"],["Triangle","Triangle","🔺"],["Star","Étoile","⭐"],["Heart","Cœur","❤️"],["Rectangle","Rectangle","▭"]].map((v,i)=>({id:"sha"+i,category_id:"shapes",word_en:v[0],word_fr:v[1],icon:v[2],sort_order:i+1,is_active:true})),
    // Daily
    ...[["Hello","Bonjour","👋"],["Thank you","Merci","🙏"],["Please","S'il te plaît","🥺"],["Yes","Oui","✅"],["No","Non","❌"],["Water","Eau","💧"],["Book","Livre","📖"],["School","École","🏫"]].map((v,i)=>({id:"day"+i,category_id:"daily",word_en:v[0],word_fr:v[1],icon:v[2],sort_order:i+1,is_active:true}))
  ],
  stories: [
    { id: "story1", title_en: "Léo the Little Lion", title_fr: "Léo le petit lion", age_group: "3-5", icon: "🦁",
      content_en: "Léo is a little lion. He lives with his mother. One morning, Léo says: Hello sun! He plays with his friend the bird. At night, his mother says: Good night, Léo!",
      content_fr: "Léo est un petit lion. Il vit avec sa maman. Un matin, Léo dit : Bonjour soleil ! Il joue avec son ami l'oiseau. Le soir, sa maman dit : Bonne nuit, Léo !" },
    { id: "story2", title_en: "The Red Ball", title_fr: "Le ballon rouge", age_group: "3-5", icon: "⚽",
      content_en: "Mia has a red ball. She plays in the garden. One, two, three... the ball jumps! Mia laughs and says: Again, again!",
      content_fr: "Mia a un ballon rouge. Elle joue dans le jardin. Un, deux, trois... le ballon saute ! Mia rit et dit : Encore, encore !" },
    { id: "story3", title_en: "At School", title_fr: "À l'école", age_group: "6-8", icon: "🏫",
      content_en: "Today is a school day. Sam takes his book and his apple. The teacher says: Hello children! Sam learns new words and makes a new friend.",
      content_fr: "Aujourd'hui, c'est l'école. Sam prend son livre et sa pomme. La maîtresse dit : Bonjour les enfants ! Sam apprend de nouveaux mots et se fait un nouvel ami." }
  ],
  songs: [
    { id: "song1", title_en: "Hello Song", title_fr: "Chanson Bonjour", icon: "🎵",
      lyrics_en: "Hello, hello, how are you? Hello, hello, I am fine, thank you!",
      lyrics_fr: "Bonjour, bonjour, comment ça va ? Bonjour, bonjour, je vais bien, merci !" },
    { id: "song2", title_en: "Numbers Song 1-10", title_fr: "Chanson des nombres 1-10", icon: "🎶",
      lyrics_en: "One, two, three, four, five, six, seven, eight, nine, ten! Sing and count again!",
      lyrics_fr: "Un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix ! Chante et compte encore !" },
    { id: "song3", title_en: "Colors Song", title_fr: "Chanson des couleurs", icon: "🌈",
      lyrics_en: "Red and blue and yellow too, green and orange, I see you!",
      lyrics_fr: "Rouge et bleu et jaune aussi, vert et orange, je te vois !" }
  ],
  badges: [
    { id: "badge1", name_en: "First Star", name_fr: "Première étoile", icon: "⭐", condition: "Earn 1 star" },
    { id: "badge2", name_en: "Super Learner", name_fr: "Super apprenant", icon: "🏆", condition: "Earn 10 stars" },
    { id: "badge3", name_en: "Word Master", name_fr: "Maître des mots", icon: "👑", condition: "Earn 25 stars" },
    { id: "badge4", name_en: "Bilingual Star", name_fr: "Star bilingue", icon: "🌟", condition: "Complete 5 categories" }
  ]
};

window.MM_STR = {
  en: { tagline:"Learn French & English by playing!", learn:"Learn", play:"Play", stories:"Stories", songs:"Songs", rewards:"My Rewards", parents:"Parents", admin:"Admin",
    choose:"Choose a category", flashcards:"Flashcards", quiz:"Quiz", match:"Matching Game", listen:"Listen", next:"Next", back:"Back home",
    correct:"Great job!", tryAgain:"Try again!", finished:"You finished!", stars:"stars", score:"Score", playAgain:"Play again",
    whatIs:"What is this in", inFrench:"French", inEnglish:"English", tapPair:"Tap an image, then tap the matching word!",
    readMe:"Read to me", ageAll:"All ages", rewardsEmpty:"Play a game to earn your first star!" },
  fr: { tagline:"Apprends le français et l'anglais en jouant !", learn:"Apprendre", play:"Jouer", stories:"Histoires", songs:"Chansons", rewards:"Mes récompenses", parents:"Parents", admin:"Admin",
    choose:"Choisis une catégorie", flashcards:"Cartes", quiz:"Quiz", match:"Jeu d'association", listen:"Écouter", next:"Suivant", back:"Retour",
    correct:"Bravo !", tryAgain:"Essaie encore !", finished:"Tu as terminé !", stars:"étoiles", score:"Score", playAgain:"Rejouer",
    whatIs:"Comment dit-on ceci en", inFrench:"français", inEnglish:"anglais", tapPair:"Touche une image, puis le mot qui correspond !",
    readMe:"Lis-moi l'histoire", ageAll:"Tous âges", rewardsEmpty:"Joue à un jeu pour gagner ta première étoile !" }
};
