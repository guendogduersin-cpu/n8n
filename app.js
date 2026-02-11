/**
 * Mobilya App - Main Logic
 * Refactored for Clean Code & Error Handling
 */

// --- Configuration & Constants ---
const CONFIG = {
    CAROUSEL_INTERVAL: 2000,
    SLIDER_INTERVAL: 4000,
    GENERATION_DELAY: 2500,
    VIDEO_GENERATION_DELAY: 3000,
    DEFAULT_ASPECT_RATIO: 9 / 16,
    CANVAS_WIDTH: 1200,
};

const STRIPE_URLS = {
    free: "https://buy.stripe.com/test_free_plan",
    starter: "https://buy.stripe.com/test_starter_plan",
    popular: "https://buy.stripe.com/test_popular_plan",
    premium: "https://buy.stripe.com/test_premium_plan"
};

const MOCK_BACKGROUNDS = {
    living_room: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&q=80&w=1920',
    kitchen: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&q=80&w=1920',
    bedroom: 'https://images.unsplash.com/photo-1616594039964-40891a909d72?auto=format&fit=crop&q=80&w=1920',
    office: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1920',
    empty: 'https://images.unsplash.com/photo-1594488510834-3075d3db7b05?auto=format&fit=crop&q=80&w=1920'
};

// --- State Management ---
const state = {
    currentUploadedImage: null,
    currentBase64: null, // Store raw Base64 string
    isLoggedIn: false,
    currentSliderIndex: 0,
    carouselIntervals: {},
    language: localStorage.getItem('language') || 'tr',
    generatedImageBase64: null, // Store generated image Base64
    currentUploadedImageFile: null // New property for storage upload
};

// --- DOM Elements ---
const dom = {
    dropZone: document.getElementById('drop-zone'),
    fileInput: document.getElementById('file-input'),
    inputPreview: document.getElementById('input-preview'),
    previewArea: document.getElementById('preview-area'),
    loader: document.getElementById('loader'),
    loadingText: document.getElementById('loading-text'),
    resultCanvas: document.getElementById('result-canvas'),
    videoContainer: document.getElementById('video-container'),
    videoScroller: document.getElementById('video-scroller'),
    resultsSection: document.getElementById('results-section'),
    sectionLanding: document.getElementById('section-landing'),
    sectionWorkspace: document.getElementById('section-workspace'),
    sectionPricing: document.getElementById('pricing'),
    authModal: document.getElementById('auth-modal'),
    videoPromptModal: document.getElementById('video-prompt-modal'),
    navAuthBtn: document.getElementById('nav-auth-btn'),
    videoModeCheckbox: document.getElementById('video-mode-checkbox'),
    promptInput: document.getElementById('ai-prompt'),
    videoPromptInput: document.getElementById('video-prompt'),
    examplesSection: document.getElementById('examples-section'),
};

const ctx = dom.resultCanvas?.getContext('2d');

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
        pro_video: "Profesyonel Video Oluştur",
        prompt_placeholder: "Bir prompt oluşturmak için görsel yükleyin",
        prompt_example: "uzun saksı bitkileri, soyut tablo ve geometrik halı içeren modern bir salon",
        video_prompt_placeholder: "Örnek: Kamera yavaşça sola dönsün, mobilyanın etrafında 360 derece hareket etsin...",
        examples_title: "İlham Veren Dönüşümler"
    },
    en: {
        nav_pricing: "Pricing",
        login: "Login",
        logout: "Logout",
        hero_title: "Imagine. Upload. Transform.",
        hero_desc: "Transform your furniture photos into professional living space visuals with AI. Impressive results in seconds.",
        hero_cta: "Start Now",
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
        pro_video: "Create Professional Video",
        prompt_placeholder: "Upload an image to generate a prompt...",
        prompt_example: "a modern living room with tall potted plants, abstract wall art, and a geometric rug",
        video_prompt_placeholder: "Example: The camera should rotate slowly to the left, move 360 degrees around the furniture...",
        examples_title: "Transforming Inspiration"
    },
    de: {
        nav_pricing: "Preise",
        login: "Anmelden",
        logout: "Abmelden",
        hero_title: "Stellen Sie sich vor. Hochladen. Transformieren.",
        hero_desc: "Verwandeln Sie Ihre Möbel-Fotos mit KI in professionelle Wohnraum-Visualisierungen. Beeindruckende Ergebnisse in Sekunden.",
        hero_cta: "Jetzt Starten",
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
        pro_video: "Professionelles Video Erstellen",
        prompt_placeholder: "Ein Bild hochladen, um einen Prompt zu generieren...",
        prompt_example: "ein modernes Wohnzimmer mit hohen Topfpflanzen, abstrakter Wandkunst und einem geometrischen Teppich",
        video_prompt_placeholder: "Beispiel: Die Kamera sollte sich langsam nach links drehen, 360 Grad um das Möbelstück bewegen...",
        examples_title: "Inspirierende Transformationen"
    }
};

// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    initHeroCarousels();
    setupEventListeners();
});

function setupEventListeners() {
    // File Handling
    if (dom.dropZone) {
        dom.dropZone.addEventListener('click', () => dom.fileInput.click());
        dom.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dom.dropZone.classList.add('dragover'); });
        dom.dropZone.addEventListener('dragleave', () => dom.dropZone.classList.remove('dragover'));
        dom.dropZone.addEventListener('drop', handleFileDrop);
    }
    dom.fileInput?.addEventListener('change', (e) => {
        if (e.target.files[0]) processFile(e.target.files[0]);
    });

    // Slider
    initSlider();
}

// --- Error Handling Utility ---
function showError(message) {
    // In a real app, this would use a toast/snackbar
    console.error(message);
    alert(message);
}

// --- Supabase Authentication Functions ---

async function simulateLogin(method) {
    if (method === 'Google') {
        await loginWithGoogle();
    } else if (method === 'Email') {
        const email = document.getElementById('email-input').value;
        const password = document.getElementById('pass-input').value;

        if (!email || !password) {
            return showError('Lütfen email ve şifre giriniz.');
        }

        await loginWithEmail(email, password);
    }
}

async function loginWithEmail(email, password) {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) throw error;

        // handleAuthSuccess will be called by auth state listener
    } catch (error) {
        showError('Giriş hatası: ' + error.message);
    }
}

async function loginWithGoogle() {
    try {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });

        if (error) throw error;
    } catch (error) {
        showError('Google girişi hatası: ' + error.message);
    }
}

async function handleRegister() {
    const email = document.getElementById('register-email-input').value;
    const password = document.getElementById('register-pass-input').value;
    const confirmPassword = document.getElementById('register-pass-confirm-input').value;

    // Validation
    if (!email || !password || !confirmPassword) {
        return showError('Lütfen tüm alanları doldurun.');
    }

    if (password.length < 6) {
        return showError('Şifre en az 6 karakter olmalıdır.');
    }

    if (password !== confirmPassword) {
        return showError('Şifreler eşleşmiyor.');
    }

    console.log('📝 Attempting to register user:', email);

    try {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin,
                data: {
                    full_name: email.split('@')[0] // Use email prefix as default name
                }
            }
        });

        if (error) {
            console.error('❌ Registration error:', error);
            throw error;
        }

        console.log('✅ Registration successful:', data);

        // Check if email confirmation is required
        if (data.user && !data.session) {
            alert('Kayıt başarılı! Lütfen e-postanızı kontrol edin ve hesabınızı onaylayın.');
            toggleRegisterModal(false);
        } else if (data.user && data.session) {
            // Auto-login if email confirmation is disabled
            alert('Kayıt başarılı! Hoş geldiniz!');
            toggleRegisterModal(false);
            // handleAuthSuccess will be called automatically by auth state listener
        }
    } catch (error) {
        console.error('❌ Registration failed:', error);

        // Provide user-friendly error messages
        let errorMessage = 'Kayıt hatası: ';

        if (error.message.includes('already registered')) {
            errorMessage += 'Bu e-posta adresi zaten kayıtlı.';
        } else if (error.message.includes('invalid email')) {
            errorMessage += 'Geçersiz e-posta adresi.';
        } else if (error.message.includes('weak password')) {
            errorMessage += 'Şifre çok zayıf. Daha güçlü bir şifre seçin.';
        } else {
            errorMessage += error.message;
        }

        showError(errorMessage);
    }
}

function toggleRegisterModal(show) {
    const modal = document.getElementById('register-modal');
    if (show) {
        modal.classList.remove('hidden');
        // Close login modal if open
        toggleAuthModal(false);
    } else {
        modal.classList.add('hidden');
        // Clear inputs
        document.getElementById('register-email-input').value = '';
        document.getElementById('register-pass-input').value = '';
        document.getElementById('register-pass-confirm-input').value = '';
    }
}


async function simulateLogout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;

        // handleLogout will be called by auth state listener
    } catch (error) {
        showError('Çıkış hatası: ' + error.message);
    }
}

function handleAuthSuccess(user) {
    console.log('User logged in:', user);

    state.isLoggedIn = true;
    currentUser = user;

    // Update UI
    dom.navAuthBtn.textContent = "Çıkış Yap";
    dom.navAuthBtn.classList.add('logged-in');
    dom.navAuthBtn.onclick = simulateLogout;

    // Hide Register button
    const registerBtn = document.getElementById('nav-register-btn');
    if (registerBtn) registerBtn.style.display = 'none';

    // Close modal
    toggleAuthModal(false);

    // Show workspace
    dom.sectionLanding.classList.add('hidden');
    dom.sectionPricing.classList.add('hidden');
    dom.examplesSection?.classList.add('hidden');
    dom.sectionWorkspace.classList.remove('hidden');

    // Load user data
    loadUserCredits();
}

function handleLogout() {
    console.log('User logged out');

    state.isLoggedIn = false;
    currentUser = null;

    // Update UI
    dom.navAuthBtn.textContent = "Giriş Yap";
    dom.navAuthBtn.classList.remove('logged-in');
    dom.navAuthBtn.onclick = () => toggleAuthModal(true);

    // Show Register button
    const registerBtn = document.getElementById('nav-register-btn');
    if (registerBtn) registerBtn.style.display = 'inline-block';

    // Show landing page
    dom.sectionWorkspace.classList.add('hidden');
    dom.sectionLanding.classList.remove('hidden');
    dom.sectionPricing.classList.remove('hidden');

    clearPreview();
}

// --- Supabase Database Operations ---

async function loadUserCredits() {
    if (!currentUser) return;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('credits')
            .eq('id', currentUser.id)
            .single();

        if (error) throw error;

        if (data) {
            const creditsEl = document.getElementById('workspace-credits');
            if (creditsEl) creditsEl.textContent = `${data.credits || 0} Kredi`;
        }
    } catch (error) {
        console.error('Kredi yükleme hatası:', error);
    }
}

async function saveGeneratedImage(imageDataUrl, prompt, isVideo = false) {
    if (!currentUser) return;

    try {
        const { data, error } = await supabase
            .from('generated_images')
            .insert({
                user_id: currentUser.id,
                generated_image_url: imageDataUrl,
                prompt: prompt,
                is_video: isVideo
            })
            .select()
            .single();

        if (error) throw error;

        console.log('Görsel kaydedildi:', data);
        return data;
    } catch (error) {
        console.error('Görsel kaydetme hatası:', error);
        showError('Görsel kaydedilemedi.');
    }
}

async function loadUserImages() {
    if (!currentUser) return [];

    try {
        const { data, error } = await supabase
            .from('generated_images')
            .select('*')
            .eq('user_id', currentUser.id)
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        return data || [];
    } catch (error) {
        console.error('Görseller yüklenemedi:', error);
        return [];
    }
}

async function updateUserCredits(newAmount) {
    if (!currentUser) return;

    try {
        const { data, error } = await supabase
            .from('profiles')
            .update({ credits: newAmount, updated_at: new Date().toISOString() })
            .eq('id', currentUser.id)
            .select()
            .single();

        if (error) throw error;

        // Update UI
        const creditsEl = document.getElementById('workspace-credits');
        if (creditsEl) creditsEl.textContent = `${newAmount} Kredi`;

        return data;
    } catch (error) {
        console.error('Kredi güncelleme hatası:', error);
    }
}

// --- Logic ---

function handleFileDrop(e) {
    e.preventDefault();
    dom.dropZone.classList.remove('dragover');
    const f = e.dataTransfer.files[0];
    if (f) processFile(f);
}

function processFile(file) {
    if (!file.type.startsWith('image/')) {
        return showError('Sadece resim dosyası yükleyiniz.');
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        const fullBase64 = e.target.result;
        state.currentBase64 = fullBase64;
        state.currentUploadedImageFile = file; // Store the original file object
        setupImage(fullBase64);

        // Simulate Prompt Generation (Turkish only)
        if (dom.promptInput) {
            dom.promptInput.value = translations.prompt_example || "";
        }
    };
    reader.onerror = () => showError('Dosya okunamadı.');
    reader.readAsDataURL(file);
}

function setupImage(src, isUrl = false) {
    const img = new Image();
    if (isUrl) img.crossOrigin = "Anonymous";

    img.onload = () => {
        state.currentUploadedImage = img;
        dom.inputPreview.src = src;
        dom.previewArea.classList.remove('hidden');
    };
    img.onerror = () => showError('Görsel yüklenemedi. (CORS veya Hatalı URL)');
    img.src = src;
}

function clearPreview() {
    dom.inputPreview.src = '';
    dom.previewArea.classList.add('hidden');
    state.currentUploadedImage = null;
    state.currentBase64 = null;
    state.generatedImageBase64 = null;
    if (dom.fileInput) dom.fileInput.value = '';
    if (dom.promptInput) dom.promptInput.value = '';
    dom.resultsSection.classList.add('hidden');

    // Reset canvas
    if (ctx && dom.resultCanvas) {
        ctx.clearRect(0, 0, dom.resultCanvas.width, dom.resultCanvas.height);
    }
}

// --- UI Updates (Refactored) ---

function updateLanguage(lang) {
    const t = translations[lang];
    if (!t) return;

    state.language = lang;
    localStorage.setItem('language', lang);

    updateNavbarText(t);
    updateHeroText(t);
    updatePricingText(t);
    updateWorkspaceText(t);
    updateCommonElements(t);
}

function updateNavbarText(t) {
    const pricingNav = document.getElementById('nav-pricing');
    if (pricingNav) pricingNav.textContent = t.nav_pricing;

    if (dom.navAuthBtn) {
        dom.navAuthBtn.textContent = state.isLoggedIn ? t.logout : t.login;
    }
}

function updateHeroText(t) {
    const heroTitle = document.getElementById('hero-title');
    const heroDesc = document.getElementById('hero-desc');
    const showcaseTitle = document.querySelector('.seasonal-showcase .section-title');
    const examplesTitle = document.getElementById('examples-title');

    if (heroTitle) heroTitle.textContent = t.hero_title;
    if (heroDesc) heroDesc.textContent = t.hero_desc;
    if (showcaseTitle) showcaseTitle.textContent = t.showcase_title;
    if (examplesTitle) examplesTitle.textContent = t.examples_title;
}

function updatePricingText(t) {
    const setText = (id, text, isHtml = false) => {
        const el = document.getElementById(id);
        if (!el) return;
        if (isHtml) el.innerHTML = `<i class="fa-solid fa-check"></i> ${text}`;
        else el.textContent = text;
    };

    setText('pricing-title', t.pricing_title);

    // Free Plan
    setText('plan-free-title', t.plan_free_title);
    setText('plan-free-sub', t.plan_free_sub);
    setText('plan-free-btn', t.plan_free_btn);
    setText('plan-free-f1', t.plan_free_f1, true);
    setText('plan-free-f2', t.plan_free_f2, true);
    setText('plan-free-f3', t.plan_free_f3, true);

    // Starter Plan
    setText('plan-starter-title', t.plan_starter_title);
    setText('plan-starter-btn', t.plan_starter_btn);
    setText('plan-starter-f1', t.plan_starter_f1, true);
    setText('plan-starter-f2', t.plan_starter_f2, true);
    setText('plan-starter-f3', t.plan_starter_f3, true);

    // Popular Plan
    setText('plan-popular-title', t.plan_popular_title);
    setText('plan-popular-btn', t.plan_popular_btn);
    setText('plan-popular-f1', t.plan_popular_f1, true);
    setText('plan-popular-f2', t.plan_popular_f2, true);
    setText('plan-popular-f3', t.plan_popular_f3, true);
    setText('plan-popular-f4', t.plan_popular_f4, true);

    // Premium Plan
    setText('plan-premium-title', t.plan_premium_title);
    setText('plan-premium-btn', t.plan_premium_btn);
    setText('plan-premium-f1', t.plan_premium_f1, true);
    setText('plan-premium-f2', t.plan_premium_f2, true);
    setText('plan-premium-f3', t.plan_premium_f3, true);
    setText('plan-premium-f4', t.plan_premium_f4, true);

    const badge = document.getElementById('popular-badge');
    if (badge) badge.textContent = t.popular_badge;
}

function updateWorkspaceText(t) {
    const setHtml = (id, icon, text) => {
        const el = document.getElementById(id);
        if (el) el.innerHTML = `<i class="${icon}"></i> ${text}`;
    };

    const setText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.textContent = text;
    };

    setText('workspace-credits', t.workspace_credits);
    setHtml('workspace-upgrade', 'fa-solid fa-bolt', t.workspace_upgrade);
    setHtml('workspace-myimages', 'fa-solid fa-images', t.workspace_myimages);
    setHtml('workspace-signout', 'fa-solid fa-right-from-bracket', t.workspace_signout);

    setText('ws-intro-text', t.ws_intro_text);
    setText('ws-upload-panel-title', t.ws_upload_panel_title);
    setText('ws-upload-h4', t.ws_upload_h4);
    setText('ws-upload-p', t.ws_upload_p);
    setText('ws-upload-btn', t.ws_upload_btn);
    setText('ws-prompt-title', t.ws_prompt_title);
    setText('ws-video-mode-label', t.ws_video_mode_label);
    setText('ws-info-desc', t.ws_info_desc);
    setText('ws-generate-btn', t.ws_generate_btn);
    setHtml('ws-examples-link', 'fa-solid fa-lightbulb', t.ws_examples_link);
}

function updateCommonElements(t) {
    if (dom.promptInput) {
        dom.promptInput.placeholder = t.prompt_placeholder || "Upload an image...";
    }

    if (dom.videoPromptInput) {
        dom.videoPromptInput.placeholder = t.video_prompt_placeholder || "Describe video movement...";
    }

    // Results buttons
    const resLabel = document.querySelector('.result-label');
    const resNew = document.querySelector('.btn-new');
    const resSave = document.querySelector('.btn-save');
    const resVideo = document.querySelector('.btn-video-generate-premium');

    if (resLabel) resLabel.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> ${t.preview_label}`;
    if (resNew) resNew.innerHTML = `<i class="fa-solid fa-plus"></i> ${t.new_design}`;
    if (resSave) resSave.innerHTML = `<i class="fa-solid fa-download"></i> ${t.download}`;
    if (resVideo) resVideo.innerHTML = `<i class="fa-solid fa-film"></i> ${t.pro_video}`;
}

// --- Navigation & Auth (Cleaned) ---

function showSection(sectionId) {
    dom.sectionLanding.classList.add('hidden');
    dom.sectionWorkspace.classList.add('hidden');
    dom.examplesSection?.classList.add('hidden');

    if (sectionId === 'workspace' || state.isLoggedIn) {
        dom.sectionWorkspace.classList.remove('hidden');
    } else {
        dom.sectionLanding.classList.remove('hidden');
    }

    document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
}

function scrollToExamples() {
    if (dom.examplesSection) {
        dom.sectionLanding.classList.remove('hidden');
        dom.sectionWorkspace.classList.add('hidden');
        dom.examplesSection.classList.remove('hidden');
        dom.examplesSection.scrollIntoView({ behavior: 'smooth' });
    }
}

function toggleAuthModal(show) {
    if (show) dom.authModal.classList.remove('hidden');
    else dom.authModal.classList.add('hidden');
}

// function simulateLogin(method) { ... }  <-- Removed duplicate function

function simulateLogout() {
    state.isLoggedIn = false;

    dom.navAuthBtn.textContent = "Giriş Yap";
    dom.navAuthBtn.classList.remove('logged-in');
    dom.navAuthBtn.onclick = () => toggleAuthModal(true);

    dom.sectionWorkspace.classList.add('hidden');
    dom.sectionLanding.classList.remove('hidden');
    dom.sectionPricing.classList.remove('hidden');

    clearPreview();
    updateLanguage(state.language);
}

// --- Video & Generation Logic ---

function toggleVideoPromptModal(show) {
    if (show) dom.videoPromptModal.classList.remove('hidden');
    else dom.videoPromptModal.classList.add('hidden');
}

async function generateRoom() {
    if (!state.isLoggedIn) return showError('Lütfen giriş yapınız.');
    if (!state.currentUploadedImageFile) return showError('Lütfen önce bir resim yükleyin.');

    dom.loader.classList.remove('hidden');
    dom.loadingText.innerHTML = "Görsel yükleniyor...";

    try {
        // 1. Upload to Supabase Storage
        const file = state.currentUploadedImageFile;
        // Use a clean folder structure and unique filenames
        const fileName = `${currentUser.id}/${Date.now()}-${file.name.replace(/\s+/g, '_')}`;

        const { data, error } = await supabase.storage
            .from('user-uploads')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) throw error;

        // 2. Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from('user-uploads')
            .getPublicUrl(fileName);

        dom.loadingText.innerHTML = "Webhook'a gönderiliyor...";

        // 3. Send to n8n Webhook - updated payload with image_url
        const payload = {
            image_url: publicUrl,
            user_id: currentUser ? currentUser.id : 'anonymous',
            prompt: dom.promptInput.value,
            email: currentUser ? currentUser.email : ''
        };

        const response = await fetch('https://n8n.eness.space/webhook/c58f2782-be1e-41f4-9eec-508134c3390c', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            const respData = await response.text();
            alert("Başarılı! Webhook'a ulaştı. Yanıt: " + respData.substring(0, 100));
        } else {
            const errText = await response.text();
            throw new Error(`Hata: ${response.status} - ${errText}`);
        }
    } catch (error) {
        console.error('Upload/Webhook Error:', error);
        showError('İşlem hatası: ' + error.message);
    } finally {
        dom.loader.classList.add('hidden');
    }
}

// Helper: Resize Image
function resizeImage(img, maxWidth, quality) {
    return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
            height = Math.round(height * (maxWidth / width));
            width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
    });
}

function generateVideoWithPrompt() {
    const prompt = dom.videoPromptInput.value;
    if (!prompt) return showError("Lütfen bir video açıklaması giriniz.");

    toggleVideoPromptModal(false);

    dom.resultsSection.classList.add('hidden');
    dom.loader.classList.remove('hidden');
    dom.loadingText.textContent = 'Prompt İşleniyor: "' + prompt.substring(0, 30) + '..." Video Render Ediliyor...';

    setTimeout(() => {
        dom.loader.classList.add('hidden');
        dom.resultsSection.classList.remove('hidden');
        dom.videoContainer.classList.remove('hidden');
        dom.resultCanvas.classList.add('hidden');

        dom.videoScroller.style.backgroundImage = `url(${dom.resultCanvas.toDataURL()})`;
        dom.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }, CONFIG.VIDEO_GENERATION_DELAY);
}

function finishVideoGeneration() {
    dom.loader.classList.add('hidden');
    dom.resultsSection.classList.remove('hidden');
    dom.videoContainer.classList.remove('hidden');
    dom.resultCanvas.classList.add('hidden');

    const dataUrl = dom.resultCanvas.toDataURL();
    dom.videoScroller.style.backgroundImage = `url(${dataUrl})`;
    dom.resultsSection.scrollIntoView({ behavior: 'smooth' });
}

function renderGeneratedRoom(base64Image) {
    dom.loader.classList.add('hidden');
    dom.resultsSection.classList.remove('hidden');
    dom.videoContainer.classList.add('hidden');
    dom.resultCanvas.classList.remove('hidden');

    // Use simple image drawing instead of complex composition for now, 
    // as the webhook returns the final result.
    const img = new Image();
    img.onload = () => {
        dom.resultCanvas.width = img.width;
        dom.resultCanvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        dom.resultsSection.scrollIntoView({ behavior: 'smooth' });
    };
    img.onerror = () => showError("Sonuç görseli yüklenemedi.");

    // If we call renderGeneratedRoom() without args (old calls), fallback or error?
    // The old calls were removed in generateRoom replacement, 
    // but finishVideoGeneration might still exist? 
    // finishVideoGeneration is separate. 

    if (base64Image) {
        img.src = base64Image;
    } else {
        // Fallback or demo mode if called without args (legacy safety)
        showError("Görsel verisi bulunamadı.");
    }
}

/**
 * Handles the actual canvas drawing logic.
 * Separated from DOM logic for cleaner code.
 */
function drawRoomOnCanvas(bgImg, userImg) {
    if (!ctx) return;

    const targetWidth = CONFIG.CANVAS_WIDTH;
    const targetHeight = targetWidth * CONFIG.DEFAULT_ASPECT_RATIO;

    dom.resultCanvas.width = targetWidth;
    dom.resultCanvas.height = targetHeight;

    // Fill Black
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, targetWidth, targetHeight);

    // Draw Background (Cover Fill)
    const bgScale = Math.max(targetWidth / bgImg.width, targetHeight / bgImg.height);
    const bgW = bgImg.width * bgScale;
    const bgH = bgImg.height * bgScale;
    const bgX = (targetWidth - bgW) / 2;
    const bgY = (targetHeight - bgH) / 2;
    ctx.drawImage(bgImg, bgX, bgY, bgW, bgH);

    // Draw User Image (Furniture)
    if (userImg) {
        // Create temp canvas for processing (background removal sim)
        const tmp = document.createElement('canvas');
        tmp.width = userImg.width;
        tmp.height = userImg.height;
        const tCtx = tmp.getContext('2d');
        tCtx.drawImage(userImg, 0, 0);

        // Simple "White Removal" Filter
        const idata = tCtx.getImageData(0, 0, tmp.width, tmp.height);
        const d = idata.data;
        for (let i = 0; i < d.length; i += 4) {
            // If pixel is very light (white-ish), make transparent
            if (d[i] > 230 && d[i + 1] > 230 && d[i + 2] > 230) {
                d[i + 3] = 0;
            }
        }
        tCtx.putImageData(idata, 0, 0);

        // Position Logic (Center Bottom)
        const scale = 0.5;
        const h = dom.resultCanvas.height * scale;
        const w = h * (userImg.width / userImg.height);
        const x = (dom.resultCanvas.width - w) / 2;
        const y = dom.resultCanvas.height - h - 40;

        // Drop Shadow
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 30;
        ctx.shadowOffsetY = 20;

        ctx.drawImage(tmp, x, y, w, h);

        // Reset Shadow
        ctx.shadowColor = "transparent";
    }
}

function downloadResult() {
    if (!state.generatedImageBase64) {
        // Try fallback to canvas data if state is empty (e.g. video frame)
        try {
            const data = dom.resultCanvas.toDataURL();
            const link = document.createElement('a');
            link.download = `dekoreet-tasarim-${Date.now()}.png`;
            link.href = data;
            link.click();
        } catch (e) {
            showError("İndirilecek görsel bulunamadı.");
        }
        return;
    }

    const link = document.createElement('a');
    link.download = `dekoreet-ai-${Date.now()}.png`;
    link.href = state.generatedImageBase64;
    link.click();
}

function previewResult() {
    if (!state.generatedImageBase64) return showError("Önizlenecek görsel yok.");

    const w = window.open("");
    if (w) {
        w.document.write(`<img src="${state.generatedImageBase64}" style="max-width:100%; height:auto;">`);
        w.document.title = "Dekoreet Önizleme";
    } else {
        showError("Pop-up engelleyiciyi kontrol ediniz.");
    }
}

function redirectToStripe(plan) {
    alert("Redirecting to Stripe checkout for " + plan + " plan...");
    window.open(STRIPE_URLS[plan] || "https://stripe.com", "_blank");
}

// --- Carousel Logic ---

function initHeroCarousels() {
    const cards = document.querySelectorAll('.hero-card');
    cards.forEach((card, index) => {
        const images = card.querySelectorAll('.carousel-track img');
        if (images.length > 0) images[0].classList.add('active');
        startCarousel(card);
    });
}

function startCarousel(card) {
    const index = card.getAttribute('data-index');
    if (state.carouselIntervals[index]) return;

    state.carouselIntervals[index] = setInterval(() => {
        const images = card.querySelectorAll('.carousel-track img');
        let activeIdx = -1;

        images.forEach((img, i) => {
            if (img.classList.contains('active')) activeIdx = i;
            img.classList.remove('active');
        });

        const nextIdx = (activeIdx + 1) % images.length;
        images[nextIdx].classList.add('active');

    }, CONFIG.CAROUSEL_INTERVAL);
}

function stopCarousel(card) {
    const index = card.getAttribute('data-index');
    if (state.carouselIntervals[index]) {
        clearInterval(state.carouselIntervals[index]);
        state.carouselIntervals[index] = null;
    }
}

function initSlider() {
    const items = document.querySelectorAll('.showcase-item');
    if (items.length === 0) return;

    setInterval(() => {
        items[state.currentSliderIndex].classList.remove('active');
        state.currentSliderIndex = (state.currentSliderIndex + 1) % items.length;
        items[state.currentSliderIndex].classList.add('active');
    }, CONFIG.SLIDER_INTERVAL);
}
