// MiniMINDS app - kids site + parent dashboard + admin panel (Supabase-ready)
const $ = s => document.querySelector(s);
const LS = { get:(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch(e){return d}}, set:(k,v)=>localStorage.setItem(k,JSON.stringify(v)) };
let sb = null, source = "demo";
const DEFAULT_MONETIZATION = {
  ads: { enabled:false, showOnLanding:true, showInApp:false, network:"Custom", code:"", imageUrl:"", linkUrl:"", label:"Advertisement" },
  premiumCategories: "",
  plans: [
    { id:"free", name_en:"Free", name_fr:"Gratuit", price:0, currency:"USD", period:"forever", features_en:"Access to free categories\nFlashcards with audio\nQuizzes and matching games\nAds may be shown", features_fr:"Accès aux catégories gratuites\nCartes avec audio\nQuiz et jeux d'association\nPublicités possibles", is_active:true, is_popular:false },
    { id:"premium", name_en:"Premium", name_fr:"Premium", price:4.99, currency:"USD", period:"month", features_en:"All categories unlocked\nNo ads\nAll stories and songs\nNew content every month\nParent progress dashboard", features_fr:"Toutes les catégories débloquées\nAucune publicité\nToutes les histoires et chansons\nNouveau contenu chaque mois\nTableau de bord parents", is_active:true, is_popular:true }
  ],
  payments: {
    paypal: { enabled:true, email:"", link:"" },
    stripe: { enabled:false, link:"" },
    bank: { enabled:false, details:"" },
    custom: []
  }
};
function monetization(){ const m = (state.settings && state.settings.monetization) || {}; return { ads:{...DEFAULT_MONETIZATION.ads, ...(m.ads||{})}, premiumCategories:m.premiumCategories||"", plans:(m.plans&&m.plans.length?m.plans:DEFAULT_MONETIZATION.plans), payments:{ paypal:{...DEFAULT_MONETIZATION.payments.paypal, ...((m.payments||{}).paypal||{})}, stripe:{...DEFAULT_MONETIZATION.payments.stripe, ...((m.payments||{}).stripe||{})}, bank:{...DEFAULT_MONETIZATION.payments.bank, ...((m.payments||{}).bank||{})}, custom:((m.payments||{}).custom||[]) } }; }
function isPremium(){ return !!LS.get("mm_premium", false); }
function premiumCatList(){ return monetization().premiumCategories.split(",").map(s=>s.trim()).filter(Boolean); }
function adSlot(place){
  const ads = monetization().ads;
  if(!ads.enabled || isPremium()) return "";
  if(place==="landing" && !ads.showOnLanding) return "";
  if(place==="app" && !ads.showInApp) return "";
  if(ads.code) return `<div class="ad-slot"><small>${ads.label}</small><div>${ads.code}</div></div>`;
  if(ads.imageUrl) return `<div class="ad-slot"><small>${ads.label}</small><a href="${ads.linkUrl||"#/pricing"}" target="_blank" rel="sponsored noopener"><img src="${ads.imageUrl}" alt="${ads.label}" style="max-width:100%;border-radius:12px"></a></div>`;
  return `<div class="ad-slot"><small>${ads.label}</small><a href="#/pricing" style="font-size:20px;font-weight:900">⭐ MiniMINDS Premium - ${state.lang==="fr"?"Sans publicité, tout débloqué":"No ads, everything unlocked"} →</a></div>`;
}
let state = { lang: LS.get("mm_lang","en"), age: LS.get("mm_age","all"), data:null, progress: LS.get("mm_progress",{}), settings: LS.get("mm_settings",{appName:"MiniMINDS",parentPin:"1234",maintenance:false}), admin: LS.get("mm_admin",null), tab:"flash", flashIdx:0, quiz:null, match:null };

function t(){ return window.MM_STR[state.lang]; }
function nameOf(o){ return state.lang==="fr" ? o.name_fr : o.name_en; }
function wordOf(v){ return state.lang==="fr" ? v.word_fr : v.word_en; }
function otherWord(v){ return state.lang==="fr" ? v.word_en : v.word_fr; }
function toast(m){ const d=document.createElement("div"); d.className="toast"; d.textContent=m; document.body.appendChild(d); setTimeout(()=>d.remove(),2600); }
function speak(text, lang){ if(window.AndroidTTS && window.AndroidTTS.speak){ window.AndroidTTS.speak(String(text), lang==="fr"?"fr":"en"); return; } try{ speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.lang=lang==="fr"?"fr-FR":"en-US"; u.rate=.85; speechSynthesis.speak(u);}catch(e){} }
function totalStars(){ return Object.values(state.progress).reduce((a,p)=>a+(p.stars||0),0); }
function saveProgress(catId, stars, score){ const p=state.progress[catId]||{stars:0,best:0,completed:0}; p.stars=Math.max(p.stars,stars); p.best=Math.max(p.best,score||0); p.completed++; state.progress[catId]=p; LS.set("mm_progress",state.progress);
  if(sb){ sb.from("progress").insert({category_id:String(catId),stars,score:score||0,completed:true}).then(()=>{},()=>{}); } }
function celebrate(msg){ const d=document.createElement("div"); d.className="celebrate"; d.innerHTML=`<div><div style="font-size:64px">🎉</div><h2>${msg}</h2><p style="font-size:32px">⭐ ⭐ ⭐</p><button class="btn primary" onclick="this.closest('.celebrate').remove()">${t().next} ✓</button></div>`; document.body.appendChild(d); }

async function initSupabase(){
  const c = window.MINIMINDS_SUPABASE||{};
  if(c.url && c.anonKey && window.supabase){ try{ sb = window.supabase.createClient(c.url,c.anonKey); source="supabase"; }catch(e){ sb=null; } }
}
async function loadData(){
  if(sb){
    try{
      const [cats, vocab, stories, songs, badges] = await Promise.all([
        sb.from("categories").select("*").order("sort_order"), sb.from("vocabulary").select("*").order("sort_order"),
        sb.from("stories").select("*"), sb.from("songs").select("*"), sb.from("badges").select("*")]);
      if(cats.data && cats.data.length){ state.data={categories:cats.data, vocabulary:vocab.data||[], stories:stories.data||[], songs:songs.data||[], badges:badges.data||window.MM_SEED.badges}; return; }
      toast("Supabase connected - no content yet, showing demo content. Import supabase/schema.sql");
    }catch(e){ console.warn("Supabase load failed, using demo data", e); }
  }
  source = sb ? "supabase-empty" : "demo";
  state.data = LS.get("mm_content", null) || JSON.parse(JSON.stringify(window.MM_SEED));
}
function persistContent(){ if(!sb) LS.set("mm_content", state.data); }

function header(){
  const s=t();
  return `<header class="topbar"><a class="brand" href="#/app"><span class="logo">🦉</span><span><strong>Mini<span>MINDS</span></strong><small>${s.tagline}</small></span></a>
  <div class="controls">
    <button class="pill ${state.lang==='en'?'active':''}" onclick="setLang('en')">EN English</button>
    <button class="pill ${state.lang==='fr'?'active':''}" onclick="setLang('fr')">FR Français</button>
    <a class="pill" href="#/rewards">⭐ ${totalStars()} ${s.stars}</a>
    <a class="pill" href="#/parent">👨‍👩‍👧 ${s.parents}</a>
    <a class="pill" href="#/pricing">⭐ ${state.lang==="fr"?"Premium":"Premium"}</a>
  </div></header>`;
}
window.setLang = l=>{ state.lang=l; LS.set("mm_lang",l); render(); };
window.setAge = a=>{ state.age=a; LS.set("mm_age",a); render(); };

function copyrightFooter(){
  const year = new Date().getFullYear();
  return `<footer class="site-footer"><div class="wrap" style="padding-bottom:20px"><strong>MiniMINDS</strong> - ${t().tagline}<br>
  <a href="#/app">${t().learn}</a> • <a href="#/stories">${t().stories}</a> • <a href="#/songs">${t().songs}</a> • <a href="#/parent">${t().parents}</a><br>
  <small>© ${year} MiniMINDS. ${state.lang==="fr"?"Tous droits réservés.":"All rights reserved."} • ${state.lang==="fr"?"Sans publicité • Sûr pour les enfants":"No ads • Safe for kids"}<br>
  <a href="#/admin" style="font-size:12px;color:#bbb;text-decoration:none">Admin</a></small></div></footer>`;
}

function planCards(){
  const fr = state.lang==="fr"; const plans = monetization().plans.filter(p=>p.is_active!==false);
  return `<div class="grid">${plans.map(p=>{
    const price = Number(p.price||0);
    const priceTxt = price===0 ? (fr?"Gratuit":"Free") : `${price} ${p.currency||"USD"} / ${p.period||"month"}`;
    const feats = (fr ? (p.features_fr||p.features_en||"") : (p.features_en||"")).split("\n").filter(Boolean);
    return `<div class="card plan-card ${p.is_popular?"popular":""}">${p.is_popular?`<span class="badge-pop">⭐ ${fr?"Populaire":"Most Popular"}</span>`:""}<h3>${fr?(p.name_fr||p.name_en):p.name_en}</h3><div class="price">${priceTxt}</div><ul class="plan-feats">${feats.map(f=>`<li>✓ ${f}</li>`).join("")}</ul>
    ${price===0?`<a class="btn teal" href="#/app">${fr?"Commencer gratuitement":"Start Free"}</a>`:(isPremium()?`<span class="badge">✓ Premium ${fr?"actif":"active"}</span>`:`<a class="btn coral" href="#/checkout/${p.id}">${fr?"Passer Premium":"Go Premium"}</a>`)}</div>`;
  }).join("")}</div>`;
}
function pricingView(){
  const fr=state.lang==="fr";
  return header()+`<main class="wrap"><a class="btn" href="#/app">⬅ ${t().back}</a><h1 style="text-align:center">⭐ ${fr?"Tarifs MiniMINDS":"MiniMINDS Pricing"}</h1>
  <p style="text-align:center;font-weight:700">${fr?"Commencez gratuitement. Passez Premium pour tout débloquer, sans publicité.":"Start free. Go Premium to unlock everything, with no ads."}</p>
  ${planCards()}<p style="text-align:center"><small>${fr?"Paiement sécurisé via les moyens activés par l'administrateur (PayPal, carte, virement...).":"Secure payment via the methods enabled by the admin (PayPal, card, bank transfer...)."}</small></p></main>`+copyrightFooter();
}
function checkoutView(planId){
  const fr=state.lang==="fr"; const m=monetization(); const plan=m.plans.find(p=>String(p.id)===String(planId));
  if(!plan) return pricingView();
  const pay=m.payments; let methods="";
  if(pay.paypal && pay.paypal.enabled) methods+=`<div class="story"><h3>🅿️ PayPal</h3>${pay.paypal.link?`<a class="btn primary" href="${pay.paypal.link}" target="_blank" rel="noopener">${fr?"Payer avec PayPal":"Pay with PayPal"}</a>`:pay.paypal.email?`<p>${fr?"Envoyez le paiement PayPal à":"Send the PayPal payment to"}: <b>${pay.paypal.email}</b></p>`:`<p>${fr?"Lien PayPal bientôt disponible - contactez-nous.":"PayPal link coming soon - contact us."}</p>`}</div>`;
  if(pay.stripe && pay.stripe.enabled) methods+=`<div class="story"><h3>💳 ${fr?"Carte bancaire":"Card"} (Stripe)</h3>${pay.stripe.link?`<a class="btn primary" href="${pay.stripe.link}" target="_blank" rel="noopener">${fr?"Payer par carte":"Pay by Card"}</a>`:`<p>Stripe link coming soon.</p>`}</div>`;
  if(pay.bank && pay.bank.enabled) methods+=`<div class="story"><h3>🏦 ${fr?"Virement bancaire":"Bank Transfer"}</h3><pre style="white-space:pre-wrap;font-family:inherit">${pay.bank.details||""}</pre></div>`;
  (pay.custom||[]).forEach(c=>{ methods+=`<div class="story"><h3>💰 ${c.name||"Payment"}</h3>${c.instructions?`<p>${c.instructions}</p>`:""}${c.link?`<a class="btn primary" href="${c.link}" target="_blank" rel="noopener">${fr?"Payer":"Pay"}</a>`:""}</div>`; });
  if(!methods) methods=`<div class="notice">${fr?"Aucun moyen de paiement activé pour le moment. L'administrateur peut les activer dans Admin > Monetization.":"No payment method enabled yet. The admin can enable them in Admin > Monetization."}</div>`;
  return header()+`<main class="wrap"><a class="btn" href="#/pricing">⬅ ${t().back}</a><h1 style="text-align:center">⭐ ${fr?"Passer à":"Upgrade to"} ${fr?(plan.name_fr||plan.name_en):plan.name_en}</h1>
  <div class="flash"><div class="price">${Number(plan.price||0)} ${plan.currency||"USD"} / ${plan.period||"month"}</div></div>
  <h2>${fr?"Choisissez votre moyen de paiement":"Choose your payment method"}</h2>${methods}
  <div class="story"><h3>${fr?"Après le paiement":"After payment"}</h3><p>${fr?"Cliquez ci-dessous pour activer Premium sur cet appareil. Pour un abonnement payant réel, l'administrateur vérifie le paiement (PayPal/carte) avant activation définitive.":"Click below to activate Premium on this device. For real paid subscriptions, the admin verifies the payment (PayPal/card) before final activation."}</p>
  ${isPremium()?`<span class="badge">✓ Premium ${fr?"déjà actif":"already active"}</span>`:`<button class="btn coral" onclick="activatePremium()">${fr?"J'ai payé - Activer Premium":"I have paid - Activate Premium"}</button>`}</div></main>`+copyrightFooter();
}
window.activatePremium=()=>{ LS.set("mm_premium", true); toast(state.lang==="fr"?"Premium activé !":"Premium activated!"); celebrate(state.lang==="fr"?"Bienvenue Premium !":"Welcome to Premium!"); render(); };

function landingView(){
  const fr = state.lang==="fr"; const d = state.data;
  const cats = d.categories.filter(c=>c.is_active!==false).slice(0,8);
  const features = fr ? [
    ["🃏","Cartes avec audio","Des mots en français et en anglais avec prononciation audio."],
    ["🧩","Jeux amusants","Quiz et jeux d'association qui donnent envie de rejouer."],
    ["📖","Histoires et chansons","De courtes histoires bilingues lues à voix haute."],
    ["⭐","Étoiles et badges","Les enfants gagnent des récompenses à chaque progrès."],
    ["👨‍👩‍👧","Espace parents","Suivez les progrès depuis un tableau de bord protégé par PIN."],
    ["🛡️","Sûr, sans publicité","Aucune publicité, aucun chat, aucun lien externe pour les enfants."]
  ] : [
    ["🃏","Flashcards with sound","Words in French and English with tap-to-listen pronunciation."],
    ["🧩","Fun games","Quizzes and matching games kids want to play again."],
    ["📖","Stories & songs","Short bilingual stories and songs, read aloud."],
    ["⭐","Stars & badges","Kids earn rewards for every step of progress."],
    ["👨‍👩‍👧","Parent dashboard","Follow progress from a PIN-protected parent area."],
    ["🛡️","Safe, no ads","No ads, no chat, and no external links for kids."]
  ];
  return `<header class="topbar"><a class="brand" href="#/"><span class="logo">🦉</span><span><strong>Mini<span>MINDS</span></strong><small>${t().tagline}</small></span></a>
  <div class="controls"><button class="pill" onclick="document.getElementById('features').scrollIntoView({behavior:'smooth'})">${fr?"Fonctionnalités":"Features"}</button><button class="pill" onclick="document.getElementById('categories').scrollIntoView({behavior:'smooth'})">${fr?"Catégories":"Categories"}</button><a class="pill" href="#/parent">${t().parents}</a>
  <button class="pill ${state.lang==='en'?'active':''}" onclick="setLang('en')">EN</button><button class="pill ${state.lang==='fr'?'active':''}" onclick="setLang('fr')">FR</button>
  <a class="pill" href="#/pricing">⭐ ${fr?"Tarifs":"Pricing"}</a>
  <a class="btn teal" href="MiniMINDS.apk" download="MiniMINDS.apk">⬇ ${fr?"Télécharger l'APK":"Download APK"}</a>
  <a class="btn primary" href="#/app">${fr?"Commencer":"Start Learning"}</a></div></header>
  <main>
  <section class="landing-hero"><div class="mascot">🦉</div>
    <h1>${fr?"Apprendre le français et l'anglais en jouant":"Learning French & English through play"}</h1>
    <p>${fr?"MiniMINDS aide les enfants de 3 à 8 ans à découvrir les mots, les sons et les histoires dans deux langues - avec des jeux, des étoiles et zéro publicité.":"MiniMINDS helps kids aged 3-8 discover words, sounds and stories in two languages - with games, stars and zero ads."}</p>
    <p><a class="btn coral" style="font-size:20px" href="#/app">▶ ${fr?"Commencer gratuitement":"Start Learning Free"}</a> <button class="btn sun" onclick="document.getElementById('categories').scrollIntoView({behavior:'smooth'})">${fr?"Voir les catégories":"Explore Categories"}</button></p>
    <div class="stat-grid" style="max-width:760px;margin:22px auto;text-align:center">
      <div class="stat">${fr?"Catégories":"Categories"}<b>${d.categories.length}</b></div>
      <div class="stat">${fr?"Mots":"Words"}<b>${d.vocabulary.length}</b></div>
      <div class="stat">${fr?"Histoires":"Stories"}<b>${d.stories.length}</b></div>
      <div class="stat">${fr?"Âges":"Ages"}<b>3-8</b></div>
    </div></section>
  <div class="wrap">${adSlot("landing")}</div>
  <section class="wrap" id="pricing-preview"><h2 style="text-align:center">${fr?"Gratuit ou Premium ?":"Free or Premium?"}</h2>${planCards()}</section>
  <section class="wrap" id="features"><h2 style="text-align:center">${fr?"Pourquoi les familles choisissent MiniMINDS":"Why families choose MiniMINDS"}</h2>
    <div class="grid">${features.map(f=>`<div class="card"><div class="icon">${f[0]}</div><h3>${f[1]}</h3><small style="font-size:15px;color:#555">${f[2]}</small></div>`).join("")}</div></section>
  <section class="wrap" id="categories"><h2 style="text-align:center">${fr?"Que vont apprendre les enfants ?":"What will kids learn?"}</h2>
    <div class="grid">${cats.map(c=>`<a class="card" href="#/category/${c.id}"><div class="icon">${c.icon||"📚"}</div><h3>${nameOf(c)}</h3><small>${fr?c.name_en:c.name_fr}</small></a>`).join("")}</div></section>
  <section class="wrap"><h2 style="text-align:center">${fr?"Comment ça marche":"How it works"}</h2>
    <div class="grid">
      <div class="card"><div class="icon">1️⃣</div><h3>${fr?"Choisis une catégorie":"Pick a category"}</h3><small>${fr?"Animaux, couleurs, nombres et plus.":"Animals, colors, numbers and more."}</small></div>
      <div class="card"><div class="icon">2️⃣</div><h3>${fr?"Écoute et joue":"Listen & play"}</h3><small>${fr?"Cartes audio, quiz et associations.":"Audio flashcards, quizzes and matching."}</small></div>
      <div class="card"><div class="icon">3️⃣</div><h3>${fr?"Gagne des étoiles":"Earn stars"}</h3><small>${fr?"Badges et progrès suivis par les parents.":"Badges and progress parents can follow."}</small></div>
    </div></section>
  <section class="cta"><h2>${fr?"Prêt à commencer l'aventure ?":"Ready to start the adventure?"}</h2>
    <p>${fr?"Gratuit, sans inscription pour les enfants, sur téléphone, tablette et ordinateur.":"Free, no signup for kids, on phone, tablet and computer."}</p>
    <a class="btn primary" style="font-size:20px" href="#/app">▶ ${fr?"Ouvrir MiniMINDS":"Open MiniMINDS"}</a></section>
  </main>${copyrightFooter()}`;
}

function homeView(){
  const s=t(); const cats=state.data.categories.filter(c=>c.is_active!==false && (state.age==="all"||c.age_group===state.age||c.age_group==="3-8"));
  return header()+`<main class="wrap"><section class="hero"><div class="mascot">🦉</div><h1>MiniMINDS</h1><p>${s.tagline}</p>
  <div class="tabs"><button class="pill ${state.age==='all'?'active':''}" onclick="setAge('all')">${s.ageAll}</button>
  <button class="pill ${state.age==='3-5'?'active':''}" onclick="setAge('3-5')">3-5</button>
  <button class="pill ${state.age==='6-8'?'active':''}" onclick="setAge('6-8')">6-8</button>
  <a class="btn sun" href="#/stories">📖 ${s.stories}</a><a class="btn teal" href="#/songs">🎵 ${s.songs}</a><a class="btn coral" href="#/rewards">🏆 ${s.rewards}</a></div></section>
  ${state.settings.maintenance?`<div class="notice">Maintenance mode is ON (set in Admin &gt; Settings).</div>`:""}
  ${adSlot("app")}
  <h2>${s.choose}</h2><div class="grid">${cats.map(c=>{const p=state.progress[c.id]||{stars:0}; const total=state.data.vocabulary.filter(v=>v.category_id===c.id).length; const pct=total?Math.min(100,(p.stars/(total))*100):0; const locked=premiumCatList().includes(String(c.id))&&!isPremium();
    return `<a class="card" href="${locked?"#/pricing":`#/category/${c.id}`}"><div class="icon">${locked?"🔒":(c.icon||"📚")}</div><h3>${nameOf(c)}</h3><small>${state.lang==="fr"?c.name_en:c.name_fr} • ${total} • ⭐ ${p.stars}${locked?" • ⭐ Premium":""}</small><div class="progress" style="margin-top:12px"><i style="width:${pct}%"></i></div></a>`}).join("")}</div>
  <h2 style="margin-top:30px">❓ ${state.lang==="fr"?"Zone Quiz":"Quiz Zone"} (10 questions)</h2>
  <div class="tabs"><a class="btn coral" href="#/quiz/mix">🌍 ${state.lang==="fr"?"Grand Quiz Mixte":"Big Mix Quiz"}</a><a class="btn primary" href="#/quiz/alphabet">🔤 ${state.lang==="fr"?"Quiz Alphabet":"Alphabet Quiz"}</a><a class="btn teal" href="#/quiz/animals">🦁 ${state.lang==="fr"?"Quiz Animaux":"Animals Quiz"}</a><a class="btn sun" href="#/quiz/numbers">🔢 ${state.lang==="fr"?"Quiz Nombres":"Numbers Quiz"}</a><a class="btn primary" href="#/quiz/colors">🎨 ${state.lang==="fr"?"Quiz Couleurs":"Colors Quiz"}</a></div>
  <p style="text-align:center;margin-top:26px"><span class="badge"><span class="icon">🦉</span><br><b>${state.lang==="fr"?"Mimi la chouette t'encourage !":"Mimi the Owl is cheering for you!"}</b></span></p></main>` + copyrightFooter();
}

function categoryView(id){
  const s=t(); const cat=state.data.categories.find(c=>String(c.id)===String(id)); if(!cat) return header()+`<main class="wrap"><p>Not found</p></main>`;
  const words=state.data.vocabulary.filter(v=>String(v.category_id)===String(id)&&v.is_active!==false);
  let body="";
  if(state.tab==="flash"){
    const w=words[state.flashIdx%Math.max(1,words.length)];
    body = w?`<div class="flash"><div class="${w.color?'color-dot':'big'}" style="${w.color?`color:${w.color}`:''}">${w.image_url?`<img src="${w.image_url}" style="max-width:160px">`:(w.icon||"❓")}</div>
    ${w.letter?`<div style="font-size:52px;font-weight:900;color:${cat.color}">${w.letter}</div>`:""}
    <h2>${w.word_en}</h2><button class="speak" onclick="speak('${w.word_en.replace(/'/g,"\\'")}','en')">🔊 English</button>
    <h3>${w.word_fr}</h3><button class="speak" onclick="speak('${w.word_fr.replace(/'/g,"\\'")}','fr')">🔊 Français</button>
    <div style="margin-top:16px"><button class="btn primary" onclick="nextFlash(${words.length})">${s.next} ➜</button></div>
    <small>${(state.flashIdx%words.length)+1} / ${words.length}</small></div>`:`<div class="notice">No words yet. Add them in Admin.</div>`;
  } else if(state.tab==="quiz"){ body=quizView(cat,words); }
  else { body=matchView(cat,words); }
  return header()+`<main class="wrap"><a class="btn" href="#/app">⬅ ${s.back}</a><h1 style="text-align:center">${cat.icon} ${nameOf(cat)}</h1>
  <div class="tabs"><button class="pill ${state.tab==='flash'?'active':''}" onclick="setTab('flash')">🃏 ${s.flashcards}</button>
  <button class="pill ${state.tab==='quiz'?'active':''}" onclick="startQuiz('${id}')">❓ ${s.quiz}</button>
  <button class="pill ${state.tab==='match'?'active':''}" onclick="startMatch('${id}')">🧩 ${s.match}</button></div>
  <div id="feedback" class="feedback"></div>${body}</main>`;
}
window.setTab=t=>{state.tab=t;render()};
window.nextFlash=n=>{state.flashIdx=(state.flashIdx+1)%n;render()};
window.speak=speak;

function quizView(cat,words){
  if(!state.quiz||state.quiz.cat!==cat.id) startQuiz(cat.id,true);
  const q=state.quiz; if(q.done) return `<div class="flash"><div class="big">🏆</div><h2>${t().finished}</h2><p>${t().score}: ${q.score}/${q.questions.length} • ⭐ ${q.stars}</p><button class="btn primary" onclick="startQuiz('${cat.id}')">${t().playAgain}</button> <a class="btn" href="#/app">${t().back}</a></div>`;
  const cur=q.questions[q.idx];
  return `<div style="text-align:center"><p style="font-weight:900">${t().whatIs} ${state.lang==="en"?"French":"English"}?</p><div class="flash" style="padding:18px"><div class="big" style="font-size:80px;${cur.color?`color:${cur.color}`:''}">${cur.icon||"❓"}</div><h2>${wordOf(cur)}</h2><button class="speak" onclick="speak('${wordOf(cur).replace(/'/g,"\\'")}','${state.lang}')">🔊 ${t().listen}</button></div>
  <div class="options">${q.options.map(o=>`<button class="opt" onclick="answerQuiz(this,'${o.replace(/'/g,"\\'")}')">${o}</button>`).join("")}</div><p>${q.idx+1}/${q.questions.length} • ${t().score}: ${q.score}</p></div>`;
}
window.startQuiz=(id,silent)=>{ const words=id==="mix"?state.data.vocabulary:state.data.vocabulary.filter(v=>String(v.category_id)===String(id)); const qs=[...words].sort(()=>Math.random()-.5).slice(0,Math.min(10,words.length));
  state.quiz={cat:id,questions:qs,idx:0,score:0,options:[],done:false,stars:0}; pickOptions(); state.tab="quiz"; if(!silent) render(); };
function pickOptions(){ const q=state.quiz; const cur=q.questions[q.idx]; const pool=(q.cat==="mix"?state.data.vocabulary.filter(v=>v.id!==cur.id):state.data.vocabulary.filter(v=>String(v.category_id)===String(q.cat)&&v.id!==cur.id)).sort(()=>Math.random()-.5).slice(0,3);
  q.options=[otherWord(cur),...pool.map(otherWord)].sort(()=>Math.random()-.5); q.answer=otherWord(cur); }
window.answerQuiz=(el,val)=>{ const q=state.quiz; const fb=$("#feedback");
  if(val===q.answer){ el.classList.add("good"); q.score++; if(fb)fb.textContent=t().correct+" 🎉"; speak(t().correct,state.lang); }
  else { el.classList.add("bad"); if(fb)fb.textContent=t().tryAgain; }
  setTimeout(()=>{ q.idx++; if(q.idx>=q.questions.length){ q.done=true; q.stars=q.score>=Math.ceil(q.questions.length*.8)?3:q.score>=Math.ceil(q.questions.length*.5)?2:q.score>=1?1:0; saveProgress(q.cat,q.stars,q.score); celebrate(t().finished+" ⭐".repeat(q.stars)); } else pickOptions(); render(); },800); };

window.startMatch=id=>{ const words=state.data.vocabulary.filter(v=>String(v.category_id)===String(id)).slice(0,6);
  state.match={cat:id,words,imgs:[...words].sort(()=>Math.random()-.5),wordsShuffled:[...words].sort(()=>Math.random()-.5),selImg:null,selWord:null,done:[]}; state.tab="match"; render(); };
function matchView(cat,words){
  if(!state.match||state.match.cat!==cat.id) startMatch(cat.id);
  const m=state.match;
  return `<p style="text-align:center;font-weight:900">${t().tapPair}</p><div class="match-grid"><div class="match-col">${m.imgs.map(w=>`<button class="match-item ${m.done.includes(w.id)?'done':''} ${m.selImg===w.id?'sel':''}" onclick="pickImg('${w.id}')"><span style="font-size:38px;${w.color?`color:${w.color}`:''}">${w.icon||"❓"}</span></button>`).join("")}</div>
  <div class="match-col">${m.wordsShuffled.map(w=>`<button class="match-item ${m.done.includes(w.id)?'done':''} ${m.selWord===w.id?'sel':''}" onclick="pickWord('${w.id}')">${otherWord(w)}</button>`).join("")}</div></div>
  <p style="text-align:center;font-weight:900">${m.done.length}/${m.words.length}</p>`;
}
window.pickImg=id=>{state.match.selImg=id; checkMatch(); render();};
window.pickWord=id=>{state.match.selWord=id; checkMatch(); render();};
function checkMatch(){ const m=state.match; if(m&&m.selImg&&m.selWord){ if(m.selImg===m.selWord){ m.done.push(m.selImg); toast(t().correct); if(m.done.length===m.words.length){ saveProgress(m.cat,3,m.done.length); celebrate(t().finished); } } else toast(t().tryAgain); m.selImg=m.selWord=null; } }

function quizPage(id){
  const isMix=id==="mix";
  const cat=isMix?{id:"mix",icon:"🌍",name_en:"Big Mix Quiz",name_fr:"Grand Quiz Mixte"}:state.data.categories.find(c=>String(c.id)===String(id));
  if(!cat) return header()+`<main class="wrap"><p>Not found</p></main>`;
  const words=isMix?state.data.vocabulary:state.data.vocabulary.filter(v=>String(v.category_id)===String(id));
  return header()+`<main class="wrap"><a class="btn" href="#/app">⬅ ${t().back}</a><h1 style="text-align:center">${cat.icon} ${nameOf(cat)} - ${t().quiz}</h1><div id="feedback" class="feedback"></div>${quizView(cat,words)}</main>`;
}

function storiesView(){ const s=t(); return header()+`<main class="wrap"><a class="btn" href="#/app">⬅ ${s.back}</a><h1>📖 ${s.stories}</h1>${state.data.stories.map(st=>`<article class="story"><h2>${st.icon||"📖"} ${state.lang==="fr"?st.title_fr:st.title_en}</h2><p>${state.lang==="fr"?st.content_fr:st.content_en}</p><p style="color:#6C5CE7">${state.lang==="fr"?st.content_en:st.content_fr}</p><button class="speak" onclick="speak(\`${(state.lang==="fr"?st.content_fr:st.content_en).replace(/`/g,"")}\`,'${state.lang}')">🔊 ${s.readMe}</button></article>`).join("")}</main>`; }
function songsView(){ const s=t(); return header()+`<main class="wrap"><a class="btn" href="#/app">⬅ ${s.back}</a><h1>🎵 ${s.songs}</h1>${state.data.songs.map(sg=>`<article class="story"><h2>${sg.icon||"🎵"} ${state.lang==="fr"?sg.title_fr:sg.title_en}</h2><p>${state.lang==="fr"?sg.lyrics_fr:sg.lyrics_en}</p><p style="color:#6C5CE7">${state.lang==="fr"?sg.lyrics_en:sg.lyrics_fr}</p><button class="speak" onclick="speak(\`${(state.lang==="fr"?sg.lyrics_fr:sg.lyrics_en).replace(/`/g,"")}\`,'${state.lang}')">🔊 ${s.listen}</button></article>`).join("")}</main>`; }
function rewardsView(){ const s=t(); const stars=totalStars(); const earned=state.data.badges.filter(b=> stars>= (b.id==="badge1"?1:b.id==="badge2"?10:b.id==="badge3"?25:0) && (b.id!=="badge4"||Object.keys(state.progress).length>=5));
  return header()+`<main class="wrap"><a class="btn" href="#/app">⬅ ${s.back}</a><h1>🏆 ${s.rewards}</h1><div class="flash"><div class="big">⭐ ${stars}</div><p>${s.stars}</p></div><h2>Badges</h2>${earned.length?earned.map(b=>`<span class="badge"><span class="icon">${b.icon}</span><br><b>${state.lang==="fr"?b.name_fr:b.name_en}</b></span>`).join(""):`<div class="notice">${s.rewardsEmpty}</div>`}<h2>Progress</h2>${state.data.categories.map(c=>{const p=state.progress[c.id]||{stars:0};return `<div class="bar-row"><span>${c.icon} ${nameOf(c)}</span><div class="progress"><i style="width:${Math.min(100,p.stars*20)}%"></i></div><span>⭐${p.stars}</span></div>`}).join("")}</main>`; }

function parentView(){
  if(sessionStorage.getItem("mm_parent")!=="1"){
    return header()+`<main class="wrap"><div class="form-card" style="margin:30px auto"><h2>👨‍👩‍👧 ${t().parents}</h2><p>Enter Parent PIN (default: 1234 - change it in Admin Settings)</p><input id="pin" type="password" inputmode="numeric" placeholder="PIN"><button class="btn primary" onclick="checkPin()">OK</button></div></main>`;
  }
  return header()+`<main class="wrap"><a class="btn" href="#/app">⬅ ${t().back}</a><h1>👨‍👩‍👧 Parent Dashboard</h1><div class="stat-grid"><div class="stat">Total Stars<b>⭐ ${totalStars()}</b></div><div class="stat">Categories Started<b>${Object.keys(state.progress).length}</b></div><div class="stat">Lessons Completed<b>${Object.values(state.progress).reduce((a,p)=>a+(p.completed||0),0)}</b></div></div>
  <h2>Progress by category</h2>${state.data.categories.map(c=>{const p=state.progress[c.id]||{stars:0,best:0,completed:0};return `<div class="bar-row"><span>${c.icon} ${nameOf(c)}</span><div class="progress"><i style="width:${Math.min(100,p.stars*20)}%"></i></div><span>⭐${p.stars}</span></div><small>Best score: ${p.best} • Completed: ${p.completed}x</small>`}).join("")}
  <p style="margin-top:22px"><button class="btn coral" onclick="if(confirm('Reset all progress?')){localStorage.removeItem('mm_progress');location.reload()}">Reset Progress</button> <button class="btn" onclick="sessionStorage.removeItem('mm_parent');render()">Lock</button></p></main>`;
}
window.checkPin=()=>{ if($("#pin").value===String(state.settings.parentPin)){sessionStorage.setItem("mm_parent","1");render();} else toast("Wrong PIN"); };

// ---------- ADMIN ----------
const ADMIN_DEMO={email:"admin@miniminds.school",password:"demo1234"}; // Offline Demo Mode only. Supabase Mode uses your real Supabase Auth user - never commit real passwords.
function adminLoginView(err=""){
  return `<main class="wrap"><div class="form-card" style="margin:40px auto"><div style="font-size:52px">🦉</div><h1>MiniMINDS Admin</h1>
  ${source==="demo"?`<div class="notice">Demo Mode - use:<br><b>${ADMIN_DEMO.email}</b> / <b>${ADMIN_DEMO.password}</b><br><small>Add Supabase keys in supabase-config.js to use real Supabase Auth.</small></div>`:`<div class="notice">Supabase Mode: sign in with a Supabase user whose profiles.role = 'admin'.</div>`}
  ${err?`<p style="color:red;font-weight:800">${err}</p>`:""}
  <label>Email</label><input id="aemail" type="email" value="${source==='demo'?ADMIN_DEMO.email:''}"><label>Password</label><input id="apass" type="password" value="${source==='demo'?ADMIN_DEMO.password:''}">
  <button class="btn primary" onclick="doAdminLogin()">Login</button> <a class="btn" href="#/app">Kids Site</a></div></main>`;
}
window.doAdminLogin=async()=>{ const email=$("#aemail").value.trim(), pass=$("#apass").value;
  if(sb){ const {data,error}=await sb.auth.signInWithPassword({email,password:pass}); if(error){ $("#app").innerHTML=adminLoginView(error.message); return; }
    const {data:prof}=await sb.from("profiles").select("*").eq("id",data.user.id).single();
    if(!prof||prof.role!=="admin"){ await sb.auth.signOut(); $("#app").innerHTML=adminLoginView("This account is not an admin. In Supabase run: update profiles set role='admin' where email='"+email+"'"); return; }
    state.admin={email}; } else { if(email!==ADMIN_DEMO.email||pass!==ADMIN_DEMO.password){ $("#app").innerHTML=adminLoginView("Wrong demo credentials"); return; } state.admin={email}; }
  LS.set("mm_admin",state.admin); location.hash="#/admin"; render(); };
window.adminLogout=async()=>{ if(sb) await sb.auth.signOut(); state.admin=null; LS.set("mm_admin",null); location.hash="#/"; render(); };

function adminShell(content,active){
  const links=[["#/admin","📊 Dashboard"],["#/admin/categories","🗂️ Categories"],["#/admin/vocabulary","🃏 Vocabulary"],["#/admin/stories","📖 Stories"],["#/admin/songs","🎵 Songs"],["#/admin/users","👥 Users"],["#/admin/badges","🏆 Badges"],["#/admin/monetization","💰 Monetization"],["#/admin/settings","⚙️ Settings"]];
  return `<div class="admin-layout"><aside class="sidebar"><h2>🦉 MiniMINDS</h2>${links.map(l=>`<a href="${l[0]}" class="${active===l[0]?'active':''}">${l[1]}</a>`).join("")}<a href="#/app">← Kids Site</a><a href="#" onclick="adminLogout();return false">Logout (${state.admin.email})</a><p style="font-size:12px;opacity:.8;padding:8px">Backend: ${sb?"🟢 Supabase connected":"🟡 Demo Mode (localStorage)"}</p></aside><section class="admin-main">${content}</section></div>`;
}
function adminDashboard(){
  const d=state.data;
  const bars=d.categories.map(c=>{const p=state.progress[c.id]||{stars:0};return `<div class="bar-row"><span>${c.icon} ${c.name_en}</span><div class="progress"><i style="width:${Math.min(100,p.stars*20)}%"></i></div><span>⭐${p.stars}</span></div>`}).join("");
  return adminShell(`<h1>Dashboard</h1><div class="stat-grid">
  <div class="stat">Categories<b>${d.categories.length}</b></div><div class="stat">Words<b>${d.vocabulary.length}</b></div><div class="stat">Stories<b>${d.stories.length}</b></div><div class="stat">Songs<b>${d.songs.length}</b></div>
  <div class="stat">Badges<b>${d.badges.length}</b></div><div class="stat">Stars Earned (this device)<b>⭐ ${totalStars()}</b></div><div class="stat">Backend<b style="font-size:18px">${sb?"Supabase":"Demo / Local"}</b></div></div>
  <h2>Progress by category</h2>${bars}<h2>Quick actions</h2><p><a class="btn primary" href="#/admin/edit/categories/new">+ Category</a> <a class="btn teal" href="#/admin/edit/vocabulary/new">+ Word</a> <a class="btn sun" href="#/admin/edit/stories/new">+ Story</a></p>
  ${sb?"":`<div class="notice"><b>Connect Supabase:</b> 1) Create project at supabase.com 2) Run <b>supabase/schema.sql</b> in SQL Editor 3) Paste URL + anon key in <b>supabase-config.js</b> 4) Reload. Full steps in README.md</div>`}`,"#/admin");
}
function tableView(type){
  const d=state.data; let rows="", cols="";
  if(type==="categories"){ cols="<th>Icon</th><th>EN</th><th>FR</th><th>Age</th><th>Active</th><th></th>"; rows=d.categories.map(c=>`<tr><td>${c.icon}</td><td>${c.name_en}</td><td>${c.name_fr}</td><td>${c.age_group}</td><td>${c.is_active!==false?"Yes":"No"}</td><td><a href="#/admin/edit/categories/${c.id}">Edit</a> • <a href="#" onclick="delItem('categories','${c.id}');return false">Delete</a></td></tr>`).join(""); }
  if(type==="vocabulary"){ cols="<th>Icon</th><th>EN</th><th>FR</th><th>Category</th><th></th>"; rows=d.vocabulary.map(v=>`<tr><td>${v.icon||""}</td><td>${v.word_en}</td><td>${v.word_fr}</td><td>${v.category_id}</td><td><a href="#/admin/edit/vocabulary/${v.id}">Edit</a> • <a href="#" onclick="delItem('vocabulary','${v.id}');return false">Delete</a></td></tr>`).join(""); }
  if(type==="stories"){ cols="<th>Title EN</th><th>Title FR</th><th>Age</th><th></th>"; rows=d.stories.map(s=>`<tr><td>${s.title_en}</td><td>${s.title_fr}</td><td>${s.age_group}</td><td><a href="#/admin/edit/stories/${s.id}">Edit</a> • <a href="#" onclick="delItem('stories','${s.id}');return false">Delete</a></td></tr>`).join(""); }
  if(type==="songs"){ cols="<th>Title EN</th><th>Title FR</th><th></th>"; rows=d.songs.map(s=>`<tr><td>${s.title_en}</td><td>${s.title_fr}</td><td><a href="#/admin/edit/songs/${s.id}">Edit</a> • <a href="#" onclick="delItem('songs','${s.id}');return false">Delete</a></td></tr>`).join(""); }
  return adminShell(`<h1 style="text-transform:capitalize">${type}</h1><p><a class="btn primary" href="#/admin/edit/${type}/new">+ Add ${type.slice(0,-1)}</a> <input id="q" placeholder="Search..." oninput="filterTable(this.value)" style="max-width:260px;display:inline-block"></p><table id="tbl"><thead><tr>${cols}</tr></thead><tbody>${rows}</tbody></table>`,"#/admin/"+type);
}
window.filterTable=q=>{ document.querySelectorAll("#tbl tbody tr").forEach(r=>r.style.display=r.textContent.toLowerCase().includes(q.toLowerCase())?"":"none"); };

async function dbSave(table, obj, isNew){
  if(sb){ const {error}= isNew? await sb.from(table).insert(obj) : await sb.from(table).update(obj).eq("id",obj.id); if(error) throw error; await loadData(); }
  else { const arr=state.data[table]; if(isNew) arr.push(obj); else { const i=arr.findIndex(x=>String(x.id)===String(obj.id)); if(i>-1) arr[i]=obj; } persistContent(); }
}
async function dbDelete(table,id){
  if(sb){ const {error}=await sb.from(table).delete().eq("id",id); if(error) throw error; await loadData(); }
  else { state.data[table]=state.data[table].filter(x=>String(x.id)!==String(id)); persistContent(); }
}
window.delItem=async(type,id)=>{ if(!confirm("Delete this item?"))return; try{ await dbDelete(type,id); toast("Deleted"); render(); }catch(e){ toast("Error: "+e.message); } };

function editView(type,id){
  const isNew=id==="new"; const item=isNew?{}:(state.data[type].find(x=>String(x.id)===String(id))||{});
  let fields="";
  const f=(k,label,val="",ta=false)=>`<label>${label}</label>${ta?`<textarea id="f_${k}" rows="4">${val||""}</textarea>`:`<input id="f_${k}" value="${String(val??"").replace(/"/g,"&quot;")}">`}`;
  if(type==="categories") fields=f("name_en","Name EN",item.name_en)+f("name_fr","Name FR",item.name_fr)+f("icon","Icon (emoji)",item.icon)+f("color","Color",item.color||"#6C5CE7")+`<label>Age group</label><select id="f_age_group"><option ${item.age_group==="3-5"?"selected":""}>3-5</option><option ${item.age_group==="6-8"?"selected":""}>6-8</option><option ${item.age_group==="3-8"?"selected":""}>3-8</option></select>`+f("sort_order","Sort order",item.sort_order||1)+`<label>Active</label><select id="f_is_active"><option value="true" ${item.is_active!==false?"selected":""}>Yes</option><option value="false" ${item.is_active===false?"selected":""}>No</option></select>`;
  if(type==="vocabulary") fields=`<label>Category</label><select id="f_category_id">${state.data.categories.map(c=>`<option value="${c.id}" ${item.category_id===c.id?"selected":""}>${c.name_en}</option>`).join("")}</select>`+f("word_en","Word EN",item.word_en)+f("word_fr","Word FR",item.word_fr)+f("icon","Icon (emoji)",item.icon)+f("image_url","Image URL (optional)",item.image_url)+f("color","Color (for colors category)",item.color)+f("sort_order","Sort order",item.sort_order||1);
  if(type==="stories") fields=f("title_en","Title EN",item.title_en)+f("title_fr","Title FR",item.title_fr)+f("icon","Icon",item.icon)+f("age_group","Age group",item.age_group||"3-5")+f("content_en","Content EN",item.content_en,true)+f("content_fr","Content FR",item.content_fr,true)+f("audio_url","Audio URL (optional)",item.audio_url);
  if(type==="songs") fields=f("title_en","Title EN",item.title_en)+f("title_fr","Title FR",item.title_fr)+f("icon","Icon",item.icon)+f("lyrics_en","Lyrics EN",item.lyrics_en,true)+f("lyrics_fr","Lyrics FR",item.lyrics_fr,true)+f("audio_url","Audio URL (optional)",item.audio_url);
  return adminShell(`<h1>${isNew?"Add":"Edit"} ${type.slice(0,-1)}</h1><div class="form-card">${fields}<button class="btn primary" onclick="saveItem('${type}','${id}')">Save</button> <a class="btn" href="#/admin/${type}">Cancel</a><p><small>${sb?"Saving writes to Supabase table: "+type:"Demo Mode: saving to localStorage (connect Supabase for cloud)"}</small></p></div>`,"#/admin/"+type);
}
window.saveItem=async(type,id)=>{
  const val=k=>{const e=$("#f_"+k); return e?e.value.trim():"";}; const isNew=id==="new";
  let obj={id:isNew?("id"+Date.now()):id};
  if(type==="categories") obj={...obj,name_en:val("name_en"),name_fr:val("name_fr"),icon:val("icon"),color:val("color"),age_group:val("age_group"),sort_order:Number(val("sort_order")||1),is_active:val("is_active")==="true"};
  if(type==="vocabulary") obj={...obj,category_id:val("category_id"),word_en:val("word_en"),word_fr:val("word_fr"),icon:val("icon"),image_url:val("image_url")||null,color:val("color")||null,sort_order:Number(val("sort_order")||1),is_active:true};
  if(type==="stories") obj={...obj,title_en:val("title_en"),title_fr:val("title_fr"),icon:val("icon"),age_group:val("age_group"),content_en:val("content_en"),content_fr:val("content_fr"),audio_url:val("audio_url")||null};
  if(type==="songs") obj={...obj,title_en:val("title_en"),title_fr:val("title_fr"),icon:val("icon"),lyrics_en:val("lyrics_en"),lyrics_fr:val("lyrics_fr"),audio_url:val("audio_url")||null};
  if(sb && isNew) delete obj.id;
  try{ await dbSave(type,obj,isNew); toast("Saved"); location.hash="#/admin/"+type; render(); }catch(e){ toast("Error: "+e.message); }
};

function adminUsers(){ return adminShell(`<h1>Users</h1><div class="notice">${sb?"Live users come from Supabase tables: profiles + kid_profiles.":"Demo Mode: kid progress is stored on this device. Connect Supabase to see registered parents/kids."}</div><table><thead><tr><th>Type</th><th>Name / Email</th><th>Detail</th></tr></thead><tbody><tr><td>Admin</td><td>${state.admin.email}</td><td>Full access</td></tr><tr><td>Kid (this device)</td><td>Guest Kid</td><td>⭐ ${totalStars()} stars • ${Object.keys(state.progress).length} categories started</td></tr></tbody></table><h2>Badges</h2><p><a class="btn primary" href="#" onclick="addBadge();return false">+ Add Badge</a></p>${state.data.badges.map(b=>`<span class="badge"><span class="icon">${b.icon}</span><br><b>${b.name_en} / ${b.name_fr}</b><br><small>${b.condition||""}</small><br><a href="#" onclick="delItem('badges','${b.id}');return false">Delete</a></span>`).join("")}`,"#/admin/users"); }
window.addBadge=async()=>{ const name=prompt("Badge name EN?"); if(!name)return; const obj={id:"badge"+Date.now(),name_en:name,name_fr:prompt("Badge name FR?",name)||name,icon:prompt("Icon emoji?","🏅")||"🏅",condition:prompt("Condition?","")||""}; try{ if(sb){delete obj.id; await dbSave("badges",obj,true);} else {state.data.badges.push(obj); persistContent();} render(); }catch(e){toast(e.message)} };
function adminMonetization(){
  const m = monetization(); const a=m.ads, pay=m.payments;
  const sel=(cond)=>cond?"selected":"";
  const planForms = m.plans.map((p,i)=>`<div class="form-card" style="margin:12px 0;max-width:760px"><h3>Plan ${i+1}: ${p.name_en||""} ${p.is_popular?"⭐":""}</h3>
    <label>Name EN</label><input id="plan_${i}_name_en" value="${String(p.name_en||"").replace(/"/g,"&quot;")}">
    <label>Name FR</label><input id="plan_${i}_name_fr" value="${String(p.name_fr||"").replace(/"/g,"&quot;")}">
    <label>Price (0 = free)</label><input id="plan_${i}_price" type="number" step="0.01" value="${p.price||0}">
    <label>Currency</label><input id="plan_${i}_currency" value="${p.currency||"USD"}">
    <label>Period (month / year / forever)</label><input id="plan_${i}_period" value="${p.period||"month"}">
    <label>Features EN (one per line)</label><textarea id="plan_${i}_features_en" rows="4">${p.features_en||""}</textarea>
    <label>Features FR (one per line)</label><textarea id="plan_${i}_features_fr" rows="4">${p.features_fr||""}</textarea>
    <label>Active</label><select id="plan_${i}_is_active"><option value="true" ${sel(p.is_active!==false)}>Yes</option><option value="false" ${sel(p.is_active===false)}>No</option></select>
    <label>Most Popular badge</label><select id="plan_${i}_is_popular"><option value="false" ${sel(!p.is_popular)}>No</option><option value="true" ${sel(!!p.is_popular)}>Yes</option></select>
    <button class="btn coral" onclick="deletePlan(${i});return false">Delete this plan</button></div>`).join("");
  const customTxt = (pay.custom||[]).map(c=>[c.name||"",c.link||"",c.instructions||""].join(" | ")).join("\n");
  return adminShell(`<h1>💰 Monetization - Ads, Plans & Payments</h1>
  <div class="notice">Changes are saved to this browser and, when connected, to Supabase <b>app_settings</b> (key = monetization). Real payment confirmation (PayPal IPN / Stripe webhooks) needs a backend function - see supabase/monetization.sql. Current Premium on this device: <b>${isPremium()?"ACTIVE":"not active"}</b> ${isPremium()?`<button class="btn" onclick="localStorage.removeItem('mm_premium');render()">Reset Premium (test)</button>`:""}</div>

  <h2>📢 Ads</h2><div class="form-card" style="max-width:760px">
    <label>Enable ads (Premium users never see ads)</label><select id="ad_enabled"><option value="false" ${sel(!a.enabled)}>Off</option><option value="true" ${sel(a.enabled)}>On</option></select>
    <label>Show on landing page</label><select id="ad_landing"><option value="true" ${sel(a.showOnLanding)}>Yes</option><option value="false" ${sel(!a.showOnLanding)}>No</option></select>
    <label>Show inside kids app</label><select id="ad_app"><option value="false" ${sel(!a.showInApp)}>No</option><option value="true" ${sel(a.showInApp)}>Yes</option></select>
    <label>Ad network (AdSense / AdMob / Custom)</label><input id="ad_network" value="${String(a.network||"").replace(/"/g,"&quot;")}">
    <label>Ad code (paste AdSense / network HTML-JS code - admin only)</label><textarea id="ad_code" rows="4" placeholder="<script ...>">${String(a.code||"").replace(/</g,"&lt;")}</textarea>
    <label>OR Banner image URL</label><input id="ad_image" value="${String(a.imageUrl||"").replace(/"/g,"&quot;")}">
    <label>Banner link URL</label><input id="ad_link" value="${String(a.linkUrl||"").replace(/"/g,"&quot;")}">
    <small>If no code/image is set, a MiniMINDS Premium house-ad is shown. Note: ads in kids apps must comply with Google Families / COPPA rules - use only family-friendly ad networks.</small>
  </div>

  <h2>⭐ Plans (Free / Paid)</h2>${planForms}<p><button class="btn teal" onclick="addPlan()">+ Add Plan</button></p>
  <div class="form-card" style="max-width:760px"><label>Premium-locked category IDs (comma separated, e.g. body,daily,school - free users see a lock and the Pricing page)</label><input id="premium_cats" value="${m.premiumCategories||""}" placeholder="body,daily,school"></div>

  <h2>💳 Payment Methods</h2><div class="form-card" style="max-width:760px">
    <label>PayPal enabled</label><select id="pay_paypal_enabled"><option value="true" ${sel(pay.paypal.enabled)}>Yes</option><option value="false" ${sel(!pay.paypal.enabled)}>No</option></select>
    <label>PayPal email (shown if no link)</label><input id="pay_paypal_email" value="${String(pay.paypal.email||"").replace(/"/g,"&quot;")}">
    <label>PayPal payment link (PayPal.me or PayPal checkout link)</label><input id="pay_paypal_link" value="${String(pay.paypal.link||"").replace(/"/g,"&quot;")}" placeholder="https://www.paypal.com/paypalme/yourname/4.99">
    <label>Card / Stripe enabled</label><select id="pay_stripe_enabled"><option value="true" ${sel(pay.stripe.enabled)}>Yes</option><option value="false" ${sel(!pay.stripe.enabled)}>No</option></select>
    <label>Stripe Payment Link</label><input id="pay_stripe_link" value="${String(pay.stripe.link||"").replace(/"/g,"&quot;")}" placeholder="https://buy.stripe.com/...">
    <label>Bank transfer enabled</label><select id="pay_bank_enabled"><option value="true" ${sel(pay.bank.enabled)}>Yes</option><option value="false" ${sel(!pay.bank.enabled)}>No</option></select>
    <label>Bank details (shown to buyer)</label><textarea id="pay_bank_details" rows="3">${pay.bank.details||""}</textarea>
    <label>Other payment methods (one per line: Name | link | instructions)</label><textarea id="pay_custom" rows="3" placeholder="Mobile Money | https://... | Send to 06...">${customTxt}</textarea>
  </div>
  <p style="margin-top:16px"><button class="btn primary" onclick="saveMonetization()">💾 Save Monetization</button> <a class="btn sun" href="#/pricing" target="_blank">View Pricing Page</a></p>
  `,"#/admin/monetization");
}
window.addPlan=()=>{ state.settings.monetization = monetization(); state.settings.monetization.plans.push({id:"plan"+Date.now(),name_en:"New Plan",name_fr:"Nouveau plan",price:9.99,currency:"USD",period:"month",features_en:"All categories\nNo ads",features_fr:"Toutes les catégories\nAucune publicité",is_active:true,is_popular:false}); LS.set("mm_settings",state.settings); render(); };
window.deletePlan=i=>{ if(!confirm("Delete this plan?"))return; state.settings.monetization = monetization(); state.settings.monetization.plans.splice(i,1); LS.set("mm_settings",state.settings); render(); };
window.saveMonetization=async()=>{
  const v=id=>{const e=document.getElementById(id); return e?e.value.trim():"";};
  const old = monetization();
  const plans = old.plans.map((p,i)=>({ id:p.id||("plan"+i), name_en:v(`plan_${i}_name_en`), name_fr:v(`plan_${i}_name_fr`), price:Number(v(`plan_${i}_price`)||0), currency:v(`plan_${i}_currency`)||"USD", period:v(`plan_${i}_period`)||"month", features_en:v(`plan_${i}_features_en`), features_fr:v(`plan_${i}_features_fr`), is_active:v(`plan_${i}_is_active`)==="true", is_popular:v(`plan_${i}_is_popular`)==="true" }));
  const custom = v("pay_custom").split("\n").filter(Boolean).map(line=>{ const parts=line.split("|").map(s=>s.trim()); return {name:parts[0]||"Payment", link:parts[1]||"", instructions:parts[2]||""}; });
  state.settings.monetization = {
    ads:{ enabled:v("ad_enabled")==="true", showOnLanding:v("ad_landing")==="true", showInApp:v("ad_app")==="true", network:v("ad_network"), code:document.getElementById("ad_code")?document.getElementById("ad_code").value:"", imageUrl:v("ad_image"), linkUrl:v("ad_link"), label:"Advertisement" },
    premiumCategories: v("premium_cats"),
    plans,
    payments:{ paypal:{enabled:v("pay_paypal_enabled")==="true", email:v("pay_paypal_email"), link:v("pay_paypal_link")}, stripe:{enabled:v("pay_stripe_enabled")==="true", link:v("pay_stripe_link")}, bank:{enabled:v("pay_bank_enabled")==="true", details:v("pay_bank_details")}, custom }
  };
  LS.set("mm_settings", state.settings);
  await saveMonetizationToSupabase();
  toast("Monetization saved"); render();
};

function adminSettings(){ return adminShell(`<h1>Settings</h1><div class="form-card"><label>App name</label><input id="s_name" value="${state.settings.appName}"><label>Parent PIN</label><input id="s_pin" value="${state.settings.parentPin}"><label>Maintenance mode</label><select id="s_maint"><option value="false" ${!state.settings.maintenance?"selected":""}>Off</option><option value="true" ${state.settings.maintenance?"selected":""}>On</option></select><button class="btn primary" onclick="saveSettings()">Save Settings</button>
  <hr><h3>Supabase</h3><p>Status: <b>${sb?"Connected":"Not connected (Demo Mode)"}</b></p><p>Edit <b>supabase-config.js</b> with your Project URL + anon key, run <b>supabase/schema.sql</b>, then reload.</p><p><button class="btn coral" onclick="if(confirm('Reset demo content to original seed?')){localStorage.removeItem('mm_content');localStorage.removeItem('mm_progress');location.reload()}">Reset Demo Data</button></p></div>`,"#/admin/settings"); }
window.saveSettings=()=>{ state.settings={...state.settings,appName:$("#s_name").value,parentPin:$("#s_pin").value,maintenance:$("#s_maint").value==="true"}; LS.set("mm_settings",state.settings); toast("Settings saved"); render(); };

function render(){
  const hash=location.hash||"#/"; const parts=hash.replace("#/","").split("/");
  let html="";
  if(parts[0]==="admin"){
    if(!state.admin) html=adminLoginView();
    else if(parts[1]==="categories"||parts[1]==="vocabulary"||parts[1]==="stories"||parts[1]==="songs") html=tableView(parts[1]);
    else if(parts[1]==="edit") html=editView(parts[2],parts[3]);
    else if(parts[1]==="users") html=adminUsers();
    else if(parts[1]==="badges") html=adminUsers();
    else if(parts[1]==="monetization") html=adminMonetization();
    else if(parts[1]==="settings") html=adminSettings();
    else html=adminDashboard();
  }
  else if(parts[0]==="category") html=categoryView(parts[1]);
  else if(parts[0]==="quiz") html=quizPage(parts[1]);
  else if(parts[0]==="pricing") html=pricingView();
  else if(parts[0]==="checkout") html=checkoutView(parts[1]);
  else if(parts[0]==="stories") html=storiesView();
  else if(parts[0]==="songs") html=songsView();
  else if(parts[0]==="rewards") html=rewardsView();
  else if(parts[0]==="parent") html=parentView();
  else if(parts[0]==="app") html=homeView();
  else html=landingView();
  $("#app").innerHTML=html; window.scrollTo(0,0);
}
window.addEventListener("hashchange",render);
async function loadRemoteSettings(){
  if(!sb) return;
  try{
    const {data} = await sb.from("app_settings").select("*").eq("key","monetization").maybeSingle();
    if(data && data.value){ const remote = typeof data.value==="string" ? JSON.parse(data.value) : data.value; state.settings = {...state.settings, monetization: remote}; LS.set("mm_settings", state.settings); }
  }catch(e){ /* table/key not set yet - local defaults apply */ }
}
async function saveMonetizationToSupabase(){
  if(!sb) return true;
  try{
    const {error} = await sb.from("app_settings").upsert({key:"monetization", value: JSON.stringify(monetization())}, {onConflict:"key"});
    if(error) throw error; return true;
  }catch(e){ toast("Saved locally. Supabase app_settings: "+e.message); return false; }
}
(async()=>{ await initSupabase(); await loadRemoteSettings(); await loadData(); render(); })();
