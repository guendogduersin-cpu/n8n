// --- DOM Elements ---
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const inputPreview = document.getElementById('input-preview');
const previewArea = document.getElementById('preview-area');
const loader = document.getElementById('loader');
const loadingText = document.getElementById('loading-text');

const resultCanvas = document.getElementById('result-canvas');
const ctx = resultCanvas.getContext('2d');
const videoContainer = document.getElementById('video-container');
const videoScroller = document.getElementById('video-scroller');
const resultsSection = document.getElementById('results-section');

// Sections
const sectionLanding = document.getElementById('section-landing');
const sectionWorkspace = document.getElementById('section-workspace');
const sectionPricing = document.getElementById('pricing');

// Modals
const authModal = document.getElementById('auth-modal');
const videoPromptModal = document.getElementById('video-prompt-modal');
const navAuthBtn = document.getElementById('nav-auth-btn');

// --- State ---
let currentUploadedImage = null;
let isLoggedIn = false;
let currentSliderIndex = 0;

// Mock Backgrounds
const roomBackgrounds = {
    living_room: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1920',
    kitchen: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1920',
    bedroom: 'https://images.unsplash.com/photo-1616594039964-40891a909d72?auto=format&fit=crop&q=80&w=1920',
    office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920',
    empty: 'https://images.unsplash.com/photo-1594488510834-3075d3db7b05?auto=format&fit=crop&q=80&w=1920'
};

// --- Translations ---
const translations = {
    tr: {
        nav_features: "Özellikler",
        nav_pricing: "Fiyatlandırma",
        login: "Giriş Yap",
        logout: "Çıkış Yap",
        hero_title: "Hayal Et. Yükle. Dönüştür.",
        hero_desc: "Mobilya fotoğraflarınızı yapay zeka ile profesyonel yaşam alanı görsellerine dönüştürün. Saniyeler içinde etkileyici sonuçlar.",
        hero_cta: "Hemen Başla",
        feat_1_title: "Anında Dönüşüm",
        feat_1_desc: "Mobilyalarınızı saniyeler içinde yaşam alanlarına yerleştirin.",
        feat_2_title: "Akıllı Sahne",
        feat_2_desc: "Stüdyo kalitesinde ışıklandırma ve profesyonel kompozisyon.",
        feat_3_title: "Çoklu Varyasyon",
        feat_3_desc: "Farklı mekanlarda modern mobilya tarzlarını deneyimleyin.",
        showcase_title: "Yapay Zeka ile Hayalinizdeki Mekânı Yaratın",
        pricing_title: "Fiyatlandırma",
        plan_free_title: "Ücretsiz",
        plan_free_sub: "/ deneme",
        plan_free_f1: "1 Resimlik Deneme",
        plan_free_f2: "Standart Kalite",
        plan_free_f3: "Filigranlı",
        plan_free_btn: "HEMEN DENE",
        plan_starter_title: "Başlangıç",
        plan_starter_f1: "50 Kredi",
        plan_starter_f2: "HD Kalite",
        plan_starter_f3: "Filigransız",
        plan_starter_btn: "ABONE OL",
        plan_popular_title: "Popüler Paket",
        plan_popular_f1: "100 Kredi",
        plan_popular_f2: "Ultra HD 4K",
        plan_popular_f3: "Video Oluşturma",
        plan_popular_f4: "7/24 Destek",
        plan_popular_btn: "PROFESYONEL ÜYELİK",
        plan_premium_title: "Premium Paket",
        plan_premium_f1: "300 Kredi",
        plan_premium_f2: "Kurumsal API",
        plan_premium_f3: "Çoklu Kullanıcı",
        plan_premium_f4: "VIP Destek",
        plan_premium_btn: "SATIN AL",
        popular_badge: "En Çok Tercih Edilen",
        workspace_credits: "0 Kredi",
        workspace_upgrade: "Yükselt",
        workspace_myimages: "Resimlerim",
        workspace_signout: "Çıkış Yap",
        ws_intro_text: "DEKOREET, mobilya satıcılarının anında güzel yaşam alanı görselleri oluşturmasına yardımcı olmak için gelişmiş yapay zeka kullanır. Bir ürün fotoğrafı yükleyin ve saniyeler içinde profesyonel kalitede sahneler elde edin.",
        ws_upload_panel_title: "Ürün Görseli",
        ws_upload_h4: "Bir mobilya resmi yükleyin",
        ws_upload_p: "Sürükleyip bırakın veya göz atmak için tıklayın",
        ws_upload_btn: "Resim Yükle",
        ws_prompt_title: "Prompt",
        ws_video_mode_label: "Video Modu",
        ws_info_desc: "Mobilya resmi yüklediğinizde detaylı ortam açıklaması otomatik oluşturulur. Örneğin: 'uzun saksı bitkileri, soyut tablo ve geometrik halı içeren modern bir salon'",
        ws_generate_btn: "Yaşam Alanı Oluştur",
        ws_examples_link: "Örneklere Göz At",
        preview_label: "Tasarım Önizleme",
        download: "İNDİR",
        new_design: "YENİ TASARIM",
        pro_video: "Profesyonel Video Oluştur"
    },
    en: {
        nav_features: "Features",
        nav_pricing: "Pricing",
        login: "Login",
        logout: "Logout",
        hero_title: "Imagine. Upload. Transform.",
        hero_desc: "Transform your furniture photos into professional living space visuals with AI. Impressive results in seconds.",
        hero_cta: "Start Now",
        feat_1_title: "Instant Transformation",
        feat_1_desc: "Place your furniture in living spaces in seconds.",
        feat_2_title: "Smart Scene",
        feat_2_desc: "Studio quality lighting and professional composition.",
        feat_3_title: "Multiple Variations",
        feat_3_desc: "Experience modern furniture styles in different spaces.",
        showcase_title: "Create Your Dream Space with AI",
        pricing_title: "Pricing",
        plan_free_title: "Free",
        plan_free_sub: "/ trial",
        plan_free_f1: "1 Image Trial",
        plan_free_f2: "Standard Quality",
        plan_free_f3: "Watermarked",
        plan_free_btn: "TRY NOW",
        plan_starter_title: "Starter",
        plan_starter_f1: "50 Credits",
        plan_starter_f2: "HD Quality",
        plan_starter_f3: "No Watermark",
        plan_starter_btn: "SUBSCRIBE",
        plan_popular_title: "Popular Pack",
        plan_popular_f1: "100 Credits",
        plan_popular_f2: "Ultra HD 4K",
        plan_popular_f3: "Video Generation",
        plan_popular_f4: "24/7 Support",
        plan_popular_btn: "PROFESSIONAL MEMBERSHIP",
        plan_premium_title: "Premium Pack",
        plan_premium_f1: "300 Credits",
        plan_premium_f2: "Enterprise API",
        plan_premium_f3: "Multi-User",
        plan_premium_f4: "VIP Support",
        plan_premium_btn: "BUY NOW",
        popular_badge: "Most Popular",
        workspace_credits: "0 Credits",
        workspace_upgrade: "Upgrade",
        workspace_myimages: "My Images",
        workspace_signout: "Sign Out",
        ws_intro_text: "DEKOREET uses advanced AI to help furniture sellers create beautiful lifestyle images instantly. Upload a product photo and get professional-quality lifestyle scenes in seconds.",
        ws_upload_panel_title: "Product Image",
        ws_upload_h4: "Upload a furniture image",
        ws_upload_p: "Drag and drop or click to browse",
        ws_upload_btn: "Upload Image",
        ws_prompt_title: "Prompt",
        ws_video_mode_label: "Video Mode",
        ws_info_desc: "A detailed environment prompt will be automatically generated when you upload a furniture image. For example: 'a modern living room with tall potted plants, abstract wall art, and a geometric rug'",
        ws_generate_btn: "Generate Lifestyle Images",
        ws_examples_link: "See Examples",
        preview_label: "Design Preview",
        download: "DOWNLOAD",
        new_design: "NEW DESIGN",
        pro_video: "Create Professional Video"
    },
    de: {
        nav_features: "Eigenschaften",
        nav_pricing: "Preise",
        login: "Anmelden",
        logout: "Abmelden",
        hero_title: "Stellen Sie sich vor. Hochladen. Transformieren.",
        hero_desc: "Verwandeln Sie Ihre Möbel-Fotos mit KI in professionelle Wohnraum-Visualisierungen. Beeindruckende Ergebnisse in Sekunden.",
        hero_cta: "Jetzt Starten",
        feat_1_title: "Sofortige Transformation",
        feat_1_desc: "Platzieren Sie Ihre Möbel in Sekunden in Wohnräumen.",
        feat_2_title: "Intelligente Szene",
        feat_2_desc: "Studio-Lichtqualität und professionelle Komposition.",
        feat_3_title: "Mehrere Variationen",
        feat_3_desc: "Erleben Sie moderne Möbelstile in verschiedenen Räumen.",
        showcase_title: "Erschaffen Sie Ihren Traumraum mit KI",
        pricing_title: "Preise",
        plan_free_title: "Kostenlos",
        plan_free_sub: "/ Test",
        plan_free_f1: "1 Bild Testversion",
        plan_free_f2: "Standardqualität",
        plan_free_f3: "Mit Wasserzeichen",
        plan_free_btn: "JETZT TESTEN",
        plan_starter_title: "Starter",
        plan_starter_f1: "50 Credits",
        plan_starter_f2: "HD-Qualität",
        plan_starter_f3: "Kein Wasserzeichen",
        plan_starter_btn: "ABONNIEREN",
        plan_popular_title: "Beliebtes Paket",
        plan_popular_f1: "100 Credits",
        plan_popular_f2: "Ultra HD 4K",
        plan_popular_f3: "Videoerstellung",
        plan_popular_f4: "24/7 Unterstützung",
        plan_popular_btn: "PROFESSIO. MITGLIEDSCHAFT",
        plan_premium_title: "Premium Paket",
        plan_premium_f1: "300 Credits",
        plan_premium_f2: "Enterprise-API",
        plan_premium_f3: "Mehrbenutzer",
        plan_premium_f4: "VIP-Unterstützung",
        plan_premium_btn: "JETZT KAUFEN",
        popular_badge: "Am Beliebtesten",
        workspace_credits: "0 Credits",
        workspace_upgrade: "Upgrade",
        workspace_myimages: "Meine Bilder",
        workspace_signout: "Abmelden",
        ws_intro_text: "DEKOREET verwendet fortschrittliche KI, um Möbelverkäufern dabei zu helfen, sofort wunderschöne Lifestyle-Bilder zu erstellen. Laden Sie ein Produktfoto hoch und erhalten Sie in Sekundenschnelle Lifestyle-Szenen in Profi-Qualität.",
        ws_upload_panel_title: "Produktbild",
        ws_upload_h4: "Laden Sie ein Möbelbild hoch",
        ws_upload_p: "Per Drag & Drop verschieben veya zum Durchsuchen klicken",
        ws_upload_btn: "Bild hochladen",
        ws_prompt_title: "Prompt",
        ws_video_mode_label: "Videomodus",
        ws_info_desc: "Ein detaillierter Umgebungs-Prompt wird automatisch generiert, wenn Sie ein Möbelbild hochladen. Beispiel: 'ein modernes Wohnzimmer mit hohen Topfpflanzen, abstrakter Wandkunst und einem geometrischen Teppich'",
        ws_generate_btn: "Lifestyle-Bilder generieren",
        ws_examples_link: "Beispiele ansehen",
        preview_label: "Design-Vorschau",
        download: "HERUNTERLADEN",
        new_design: "NEUES DESIGN",
        pro_video: "Professionelles Video Erstellen"
    }
};

function updateLanguage(lang) {
    const t = translations[lang];
    if (!t) return;

    // Navbar
    document.getElementById('nav-features').textContent = t.nav_features;
    document.getElementById('nav-pricing').textContent = t.nav_pricing;
    if (navAuthBtn) {
        if (isLoggedIn) navAuthBtn.textContent = t.logout;
        else navAuthBtn.textContent = t.login;
    }

    // Hero
    document.getElementById('hero-title').textContent = t.hero_title;
    document.getElementById('hero-desc').textContent = t.hero_desc;
    document.getElementById('hero-cta-text').textContent = t.hero_cta;

    // Features
    const f1t = document.getElementById('feat-1-title'); if (f1t) f1t.textContent = t.feat_1_title;
    const f1d = document.getElementById('feat-1-desc'); if (f1d) f1d.textContent = t.feat_1_desc;
    const f2t = document.getElementById('feat-2-title'); if (f2t) f2t.textContent = t.feat_2_title;
    const f2d = document.getElementById('feat-2-desc'); if (f2d) f2d.textContent = t.feat_2_desc;
    const f3t = document.getElementById('feat-3-title'); if (f3t) f3t.textContent = t.feat_3_title;
    const f3d = document.getElementById('feat-3-desc'); if (f3d) f3d.textContent = t.feat_3_desc;

    // Showcase
    const showcaseTitle = document.querySelector('.seasonal-showcase .section-title');
    if (showcaseTitle) showcaseTitle.textContent = t.showcase_title;

    // Pricing
    document.getElementById('pricing-title').textContent = t.pricing_title;
    document.getElementById('plan-free-title').textContent = t.plan_free_title;
    document.getElementById('plan-free-sub').textContent = t.plan_free_sub;
    document.getElementById('plan-free-btn').textContent = t.plan_free_btn;

    document.getElementById('plan-free-f1').innerHTML = `<i class="fa-solid fa-check"></i> ${t.plan_free_f1}`;
    document.getElementById('plan-free-f2').innerHTML = `<i class="fa-solid fa-check"></i> ${t.plan_free_f2}`;
    document.getElementById('plan-free-f3').innerHTML = `<i class="fa-solid fa-check"></i> ${t.plan_free_f3}`;

    document.getElementById('plan-starter-title').textContent = t.plan_starter_title;
    document.getElementById('plan-starter-btn').textContent = t.plan_starter_btn;
    document.getElementById('plan-starter-f1').innerHTML = `<i class="fa-solid fa-check"></i> ${t.plan_starter_f1}`;
    document.getElementById('plan-starter-f2').innerHTML = `<i class="fa-solid fa-check"></i> ${t.plan_starter_f2}`;
    document.getElementById('plan-starter-f3').innerHTML = `<i class="fa-solid fa-check"></i> ${t.plan_starter_f3}`;

    document.getElementById('plan-popular-title').textContent = t.plan_popular_title;
    document.getElementById('plan-popular-btn').textContent = t.plan_popular_btn;
    document.getElementById('plan-popular-f1').innerHTML = `<i class="fa-solid fa-check"></i> ${t.plan_popular_f1}`;
    document.getElementById('plan-popular-f2').innerHTML = `<i class="fa-solid fa-check"></i> ${t.plan_popular_f2}`;
    document.getElementById('plan-popular-f3').innerHTML = `<i class="fa-solid fa-check"></i> ${t.plan_popular_f3}`;
    document.getElementById('plan-popular-f4').innerHTML = `<i class="fa-solid fa-check"></i> ${t.plan_popular_f4}`;

    document.getElementById('plan-premium-title').textContent = t.plan_premium_title;
    document.getElementById('plan-premium-btn').textContent = t.plan_premium_btn;
    document.getElementById('plan-premium-f1').innerHTML = `<i class="fa-solid fa-check"></i> ${t.plan_premium_f1}`;
    document.getElementById('plan-premium-f2').innerHTML = `<i class="fa-solid fa-check"></i> ${t.plan_premium_f2}`;
    document.getElementById('plan-premium-f3').innerHTML = `<i class="fa-solid fa-check"></i> ${t.plan_premium_f3}`;
    document.getElementById('plan-premium-f4').innerHTML = `<i class="fa-solid fa-check"></i> ${t.plan_premium_f4}`;

    document.getElementById('popular-badge').textContent = t.popular_badge;

    // Workspace
    document.getElementById('workspace-credits').textContent = t.workspace_credits;
    document.getElementById('workspace-upgrade').innerHTML = `<i class="fa-solid fa-bolt"></i> ${t.workspace_upgrade}`;
    document.getElementById('workspace-myimages').innerHTML = `<i class="fa-solid fa-images"></i> ${t.workspace_myimages}`;
    document.getElementById('workspace-signout').innerHTML = `<i class="fa-solid fa-right-from-bracket"></i> ${t.workspace_signout}`;

    document.getElementById('ws-intro-text').textContent = t.ws_intro_text;
    document.getElementById('ws-upload-panel-title').textContent = t.ws_upload_panel_title;
    document.getElementById('ws-upload-h4').textContent = t.ws_upload_h4;
    document.getElementById('ws-upload-p').textContent = t.ws_upload_p;
    document.getElementById('ws-upload-btn').textContent = t.ws_upload_btn;

    document.getElementById('ws-prompt-title').textContent = t.ws_prompt_title;
    document.getElementById('ws-video-mode-label').textContent = t.ws_video_mode_label;
    document.getElementById('ws-info-desc').textContent = t.ws_info_desc;
    document.getElementById('ws-generate-btn').textContent = t.ws_generate_btn;
    document.getElementById('ws-examples-link').innerHTML = `<i class="fa-solid fa-lightbulb"></i> ${t.ws_examples_link}`;

    // Result
    const resLabel = document.querySelector('.result-label');
    if (resLabel) resLabel.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ${t.preview_label}`;
    const resNew = document.querySelector('.btn-new');
    if (resNew) resNew.innerHTML = `<i class="fa-solid fa-plus"></i> ${t.new_design}`;
    const resSave = document.querySelector('.btn-save');
    if (resSave) resSave.innerHTML = `<i class="fa-solid fa-download"></i> ${t.download}`;
    const resVideo = document.querySelector('.btn-video-generate-premium');
    if (resVideo) resVideo.innerHTML = `<i class="fa-solid fa-film"></i> ${t.pro_video}`;
}

// Simulated Stripe Redirection
function redirectToStripe(plan) {
    const stripeUrls = {
        free: "https://buy.stripe.com/test_free_plan",
        starter: "https://buy.stripe.com/test_starter_plan",
        popular: "https://buy.stripe.com/test_popular_plan",
        premium: "https://buy.stripe.com/test_premium_plan"
    };

    // In a real app, this would redirect to a Stripe checkout session
    alert("Redirecting to Stripe checkout for " + plan + " plan...");
    window.open(stripeUrls[plan] || "https://stripe.com", "_blank");
}

// Language Selector Listener
document.getElementById('language-select')?.addEventListener('change', (e) => {
    updateLanguage(e.target.value);
});

// --- Navigation ---
function showSection(sectionId) {
    // Hide all main sections
    sectionLanding.classList.add('hidden');
    sectionWorkspace.classList.add('hidden');

    if (sectionId === 'workspace' || isLoggedIn) {
        sectionWorkspace.classList.remove('hidden');
    } else {
        sectionLanding.classList.remove('hidden');
    }

    // Update active nav links
    document.querySelectorAll('.nav-links a').forEach(a => {
        a.classList.remove('active');
    });
}

// --- Auth Functions ---
function toggleAuthModal(show) {
    if (show) authModal.classList.remove('hidden');
    else authModal.classList.add('hidden');
}

function loginSim(method) {
    isLoggedIn = true;

    // Change Nav Button to Logout
    navAuthBtn.textContent = "Çıkış Yap";
    navAuthBtn.classList.add('logged-in');
    navAuthBtn.onclick = logoutSim;

    toggleAuthModal(false);

    // Hide Landing and Pricing, Show Workspace
    sectionLanding.classList.add('hidden');
    sectionPricing.classList.add('hidden');
    sectionWorkspace.classList.remove('hidden');

    // Update credits display based on language
    const currentLang = document.getElementById('language-select').value;
    document.getElementById('workspace-credits').textContent = translations[currentLang].workspace_credits;
}

function logoutSim() {
    isLoggedIn = false;

    // Reset Nav Button
    navAuthBtn.textContent = "Giriş Yap";
    navAuthBtn.classList.remove('logged-in');
    navAuthBtn.onclick = () => toggleAuthModal(true);

    // Hide Workspace, Show Landing and Pricing
    sectionWorkspace.classList.add('hidden');
    sectionLanding.classList.remove('hidden');
    sectionPricing.classList.remove('hidden');

    // Clear current work
    clearPreview();
}

// --- Video Prompt Modal ---
function toggleVideoPromptModal(show) {
    if (show) videoPromptModal.classList.remove('hidden');
    else videoPromptModal.classList.add('hidden');
}

function generateVideoWithPrompt() {
    const prompt = document.getElementById('video-prompt').value;
    if (!prompt) {
        alert("Lütfen bir video açıklaması giriniz.");
        return;
    }

    toggleVideoPromptModal(false);

    // Simulate Video Generation
    resultsSection.classList.add('hidden');
    loader.classList.remove('hidden');
    loadingText.textContent = 'Prompt İşleniyor: "' + prompt.substring(0, 30) + '..." Video Render Ediliyor...';

    setTimeout(() => {
        loader.classList.add('hidden');
        resultsSection.classList.remove('hidden');
        videoContainer.classList.remove('hidden');
        resultCanvas.classList.add('hidden');
        videoScroller.style.backgroundImage = `url(${resultCanvas.toDataURL()})`;
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }, 3000);
}

// --- Slider Logic ---
function initSlider() {
    const items = document.querySelectorAll('.showcase-item');
    if (items.length === 0) return;

    setInterval(() => {
        items[currentSliderIndex].classList.remove('active');
        currentSliderIndex = (currentSliderIndex + 1) % items.length;
        items[currentSliderIndex].classList.add('active');
    }, 4000);
}

// --- File Handling ---
if (dropZone) {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        const f = e.dataTransfer.files[0];
        if (f) processFile(f);
    });
}

if (fileInput) {
    fileInput.addEventListener('change', (e) => { if (e.target.files[0]) processFile(e.target.files[0]); });
}

function processFile(file) {
    if (!file.type.startsWith('image/')) return alert('Sadece resim dosyası yükleyiniz.');
    const reader = new FileReader();
    reader.onload = (e) => {
        setupImage(e.target.result);
        // Simulate AI prompt generation
        document.getElementById('ai-prompt').value = "a modern living room with tall potted plants, abstract wall art, and a geometric rug";
    };
    reader.readAsDataURL(file);
}

function setupImage(src, isUrl = false) {
    const img = new Image();
    if (isUrl) img.crossOrigin = "Anonymous";

    img.onload = () => {
        currentUploadedImage = img;
        inputPreview.src = src;
        previewArea.classList.remove('hidden');
    };
    img.onerror = () => alert('Görsel yüklenemedi. (CORS veya Hatalı URL)');
    img.src = src;
}

function clearPreview() {
    inputPreview.src = '';
    previewArea.classList.add('hidden');
    currentUploadedImage = null;
    if (fileInput) fileInput.value = '';
    const promptArea = document.getElementById('ai-prompt');
    if (promptArea) promptArea.value = '';
    resultsSection.classList.add('hidden');
}

// --- Generation ---
function generateRoom() {
    if (!currentUploadedImage) return alert('Lütfen önce bir resim yükleyin.');

    const isVideoMode = document.getElementById('video-mode-checkbox').checked;
    const promptValue = document.getElementById('ai-prompt').value;

    resultsSection.classList.add('hidden');
    loader.classList.remove('hidden');

    if (isVideoMode) {
        loadingText.innerHTML = `Yapay Zeka Video Oluşturuyor...<br><small style="font-size:0.8em; color:var(--text-secondary);">Prompt: ${promptValue.substring(0, 40)}...</small>`;
    } else {
        loadingText.innerHTML = `Yapay Zeka Odanızı Hazırlıyor...<br><small style="font-size:0.8em; color:var(--text-secondary);">Prompt: ${promptValue.substring(0, 40)}...</small>`;
    }

    setTimeout(() => {
        if (isVideoMode) {
            finishVideoGeneration();
        } else {
            finishAI();
        }
    }, 2500);
}

function finishVideoGeneration() {
    loader.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    videoContainer.classList.remove('hidden');
    resultCanvas.classList.add('hidden');

    // Simulate a moving background or similar using a temporary canvas state
    const dataUrl = resultCanvas.toDataURL();
    videoScroller.style.backgroundImage = `url(${dataUrl})`;
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function finishAI() {
    loader.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    videoContainer.classList.add('hidden');
    resultCanvas.classList.remove('hidden');

    const bgImg = new Image();
    bgImg.crossOrigin = "Anonymous";
    // For now, use a random room background since the house-type dropdown was replaced by a prompt
    const bgs = Object.values(roomBackgrounds);
    bgImg.src = bgs[Math.floor(Math.random() * bgs.length)];

    bgImg.onload = () => {
        // Enforce 16:9 Aspect Ratio
        const targetWidth = 1200;
        const targetHeight = targetWidth * (9 / 16);
        resultCanvas.width = targetWidth;
        resultCanvas.height = targetHeight;

        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // Draw background fitted to 16:9 (Cover style)
        const bgScale = Math.max(targetWidth / bgImg.width, targetHeight / bgImg.height);
        const bgW = bgImg.width * bgScale;
        const bgH = bgImg.height * bgScale;
        const bgX = (targetWidth - bgW) / 2;
        const bgY = (targetHeight - bgH) / 2;
        ctx.drawImage(bgImg, bgX, bgY, bgW, bgH);

        if (currentUploadedImage) {
            const tmp = document.createElement('canvas');
            tmp.width = currentUploadedImage.width;
            tmp.height = currentUploadedImage.height;
            const tCtx = tmp.getContext('2d');
            tCtx.drawImage(currentUploadedImage, 0, 0);

            const idata = tCtx.getImageData(0, 0, tmp.width, tmp.height);
            const d = idata.data;
            for (let i = 0; i < d.length; i += 4) {
                if (d[i] > 230 && d[i + 1] > 230 && d[i + 2] > 230) d[i + 3] = 0;
            }
            tCtx.putImageData(idata, 0, 0);

            const scale = 0.5;
            const h = resultCanvas.height * scale;
            const w = h * (currentUploadedImage.width / currentUploadedImage.height);
            const x = (resultCanvas.width - w) / 2;
            const y = resultCanvas.height - h - 40;

            ctx.shadowColor = "rgba(0,0,0,0.6)";
            ctx.shadowBlur = 30;
            ctx.shadowOffsetY = 20;
            ctx.drawImage(tmp, x, y, w, h);
            ctx.shadowColor = "transparent";
        }
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    };
}

function downloadResult() {
    const link = document.createElement('a');
    link.download = `dekoreet-tasarim-${Date.now()}.png`;
    link.href = resultCanvas.toDataURL();
    link.click();
}
