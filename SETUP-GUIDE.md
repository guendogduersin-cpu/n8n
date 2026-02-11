# 🚀 AntiGravity N8N Kurulum Rehberi

## 📋 Adım Adım Kurulum

### 1. ÖN HAZIRLIK

#### A) Gerekli Bilgiler
```
✅ Supabase Project URL
✅ Supabase Service Role Key (Anon Key değil!)
✅ Gmail Account (Email bildirimleri için)
✅ Telegram Bot Token (Opsiyonel)
✅ N8N Instance URL
```

#### B) Supabase Credentials
1. Supabase Dashboard → Settings → API
2. `Project URL` kopyala
3. `service_role` key kopyala (⚠️ GİZLİ tutun!)

---

### 2. SUPABASE VERİTABANI KURULUMU

#### Adım 1: SQL Editor'ı Aç
Supabase Dashboard → SQL Editor → New Query

#### Adım 2: RPC Fonksiyonlarını Oluştur

```sql
-- ============================================
-- ADIM 1: Kredi Ekleme Fonksiyonu
-- ============================================
CREATE OR REPLACE FUNCTION add_user_credits(
    p_user_id UUID,
    p_amount INTEGER
)
RETURNS TABLE(new_balance INTEGER) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- user_credits row yoksa oluştur
    INSERT INTO user_credits (user_id, credits_balance)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Kredi ekle
    UPDATE user_credits
    SET 
        credits_balance = credits_balance + p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Yeni bakiyeyi döndür
    RETURN QUERY
    SELECT credits_balance FROM user_credits WHERE user_id = p_user_id;
END;
$$;

-- ============================================
-- ADIM 2: Kredi Düşme Fonksiyonu
-- ============================================
CREATE OR REPLACE FUNCTION deduct_user_credits(
    p_user_id UUID,
    p_amount INTEGER
)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER, error_message TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_balance INTEGER;
BEGIN
    -- Mevcut bakiyeyi al (Row-level lock)
    SELECT credits_balance INTO current_balance
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE;
    
    -- Kayıt yoksa hata
    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0, 'User not found';
        RETURN;
    END IF;
    
    -- Yetersiz bakiye kontrolü
    IF current_balance < p_amount THEN
        RETURN QUERY SELECT FALSE, current_balance, 'Insufficient credits';
        RETURN;
    END IF;
    
    -- Kredi düş
    UPDATE user_credits
    SET 
        credits_balance = credits_balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Yeni bakiyeyi al
    SELECT credits_balance INTO current_balance
    FROM user_credits
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT TRUE, current_balance, NULL::TEXT;
END;
$$;
```

#### Adım 3: İndexleri Ekle (Performance)

```sql
-- ============================================
-- PERFORMANCE İNDEXLERİ
-- ============================================

-- user_credits tablosu
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id 
ON user_credits(user_id);

-- credit_transactions tablosu
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id 
ON credit_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at 
ON credit_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_type 
ON credit_transactions(transaction_type);

-- user_purchases tablosu
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id 
ON user_purchases(user_id);

CREATE INDEX IF NOT EXISTS idx_user_purchases_purchased_at 
ON user_purchases(purchased_at DESC);

-- generated_images tablosu
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id 
ON generated_images(user_id);

CREATE INDEX IF NOT EXISTS idx_generated_images_created_at 
ON generated_images(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_generated_images_style 
ON generated_images(style);
```

#### Adım 4: Constraints Ekle

```sql
-- ============================================
-- GÜVENLİK CONSTRAINTS
-- ============================================

-- Kredinin negatif olmaması
ALTER TABLE user_credits 
DROP CONSTRAINT IF EXISTS check_credits_positive;

ALTER TABLE user_credits 
ADD CONSTRAINT check_credits_positive 
CHECK (credits_balance >= 0);

-- Paket fiyatının pozitif olması
ALTER TABLE packages 
DROP CONSTRAINT IF EXISTS check_price_positive;

ALTER TABLE packages 
ADD CONSTRAINT check_price_positive 
CHECK (price_eur > 0 AND credits_amount > 0);
```

#### Adım 5: Test Paketi Ekle

```sql
-- ============================================
-- TEST VERİLERİ (Opsiyonel)
-- ============================================

-- Örnek paketler
INSERT INTO packages (name, price_eur, credits_amount, is_active)
VALUES 
    ('Başlangıç', 179, 100, true),
    ('Profesyonel', 299, 200, true),
    ('Premium', 499, 400, true)
ON CONFLICT (name) DO UPDATE
SET price_eur = EXCLUDED.price_eur,
    credits_amount = EXCLUDED.credits_amount,
    is_active = EXCLUDED.is_active;
```

#### ✅ Kontrol: Fonksiyonlar Çalışıyor mu?

```sql
-- Test: Kredi ekleme
SELECT * FROM add_user_credits(
    'YOUR_TEST_USER_ID'::uuid, 
    100
);

-- Test: Kredi düşme
SELECT * FROM deduct_user_credits(
    'YOUR_TEST_USER_ID'::uuid, 
    10
);

-- Sonucu kontrol et
SELECT * FROM user_credits WHERE user_id = 'YOUR_TEST_USER_ID'::uuid;
```

---

### 3. N8N KURULUMU

#### Adım 1: Supabase Credential Oluştur

1. N8N → Credentials → Add Credential
2. Credential Type: **Supabase**
3. Bilgileri gir:
   ```
   Host: https://YOUR_PROJECT.supabase.co
   Service Role Secret: YOUR_SERVICE_ROLE_KEY
   ```
4. Credential Name: `Supabase - AntiGravity`
5. **Save**

⚠️ **ÖNEMLİ**: Credential ID'yi not al (workflow JSON'larda kullanılacak)

#### Adım 2: Gmail Credential Oluştur (Email için)

1. N8N → Credentials → Add Credential
2. Credential Type: **Gmail OAuth2**
3. Google OAuth kurulumu yap
4. Credential Name: `Gmail - AntiGravity Reports`
5. **Save**

#### Adım 3: Telegram Credential Oluştur (Opsiyonel)

1. Telegram'da @BotFather ile yeni bot oluştur
2. Bot Token'ı kopyala
3. N8N → Credentials → Add Credential
4. Credential Type: **Telegram**
5. Access Token: `YOUR_BOT_TOKEN`
6. Credential Name: `Telegram - AntiGravity Bot`
7. **Save**

Chat ID'nizi öğrenmek için:
```bash
# Bot'a mesaj gönderdikten sonra:
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
# "chat":{"id": 123456789} değerini not alın
```

---

### 4. WORKFLOW İMPORT

#### Workflow 1: Payment Success

1. N8N → Workflows → Import from File
2. `workflow-1-payment-success.json` seç
3. Import edildikten sonra aç
4. **ÖNEMLİ**: Tüm Supabase node'larında credential güncelle:
   - Her Supabase node'a tıkla
   - Credentials → `Supabase - AntiGravity` seç
5. Webhook node'una tıkla
6. Production URL'yi kopyala: 
   ```
   https://your-n8n.com/webhook/payment/success
   ```
7. **Activate** workflow'u

#### Workflow 2: Credit Usage & Generation

1. N8N → Workflows → Import from File
2. `workflow-2-credit-usage.json` seç
3. Import edildikten sonra aç
4. Tüm Supabase node'larında credential güncelle
5. Webhook node'una tıkla
6. Production URL'yi kopyala:
   ```
   https://your-n8n.com/webhook/generate
   ```
7. **Activate** workflow'u

#### Workflow 3: Admin Monitoring

1. N8N → Workflows → Import from File
2. `workflow-3-admin-monitoring.json` seç
3. Import edildikten sonra aç
4. Tüm Supabase node'larında credential güncelle
5. Gmail node'unda:
   - Credentials → `Gmail - AntiGravity Reports` seç
   - `sendTo` → kendi email adresinizi girin
6. Telegram node'unda (opsiyonel):
   - Credentials → `Telegram - AntiGravity Bot` seç
   - `chatId` → kendi chat ID'nizi girin
7. Cron ayarlarını kontrol et (günlük 00:00)
8. **Activate** workflow'u

---

### 5. GÜVEN VE GÜVENLİK

#### API Key Koruması Ekle

Her webhook için Authorization kontrolü ekleyin:

##### Webhook'a IF Node Ekle:

```javascript
// Node: Check API Key
// Conditions:
{{$node["Webhook"].json.headers.authorization}} equals "Bearer YOUR_SECRET_API_KEY"

// True branch → devam et
// False branch → 401 Unauthorized response
```

##### 401 Response:
```json
{
  "success": false,
  "error": "unauthorized",
  "message": "Invalid or missing API key"
}
```

#### API Key Oluşturma:
```bash
# Terminal'de random API key oluştur:
openssl rand -base64 32
# Örnek: dGhpcyBpcyBhIHNlY3JldCBrZXkK=
```

#### Backend'den Webhook Çağrısı:
```javascript
// Payment Success
fetch('https://your-n8n.com/webhook/payment/success', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_SECRET_API_KEY'
  },
  body: JSON.stringify({
    user_id: "...",
    package_name: "Başlangıç",
    payment_status: "paid",
    // ...
  })
});
```

---

### 6. TEST SENARYOLARI

#### Test 1: Paket Satın Alma

```bash
curl -X POST https://your-n8n.com/webhook/payment/success \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET_API_KEY" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "package_name": "Başlangıç",
    "payment_status": "paid",
    "price_paid": 179,
    "currency": "EUR",
    "payment_provider": "stripe",
    "transaction_id": "pi_test_123"
  }'
```

**Beklenen Response (200):**
```json
{
  "success": true,
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "package": "Başlangıç",
  "credits_added": 100,
  "new_balance": 100,
  "message": "Credits added successfully"
}
```

#### Test 2: Görsel Üretme

```bash
curl -X POST https://your-n8n.com/webhook/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET_API_KEY" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "prompt": "make my photo anime style",
    "style": "anime",
    "is_video": false,
    "original_image_url": "https://example.com/original.jpg",
    "generated_image_url": "https://example.com/generated.jpg",
    "cost": 1
  }'
```

**Beklenen Response (200):**
```json
{
  "success": true,
  "message": "Generation logged successfully",
  "cost": 1,
  "remaining_credits": 99,
  "generation_type": "image",
  "style": "anime"
}
```

#### Test 3: Video Üretme (10 kredi)

```bash
curl -X POST https://your-n8n.com/webhook/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET_API_KEY" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "prompt": "turn this into a video",
    "style": "realistic",
    "is_video": true,
    "original_image_url": "https://example.com/photo.jpg",
    "generated_image_url": "https://example.com/video.mp4",
    "cost": 10
  }'
```

#### Test 4: Yetersiz Kredi

```bash
curl -X POST https://your-n8n.com/webhook/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET_API_KEY" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "prompt": "expensive operation",
    "style": "4K",
    "is_video": false,
    "cost": 1000
  }'
```

**Beklenen Response (402):**
```json
{
  "success": false,
  "error": "not_enough_credits",
  "required_credits": 1000,
  "available_credits": 89,
  "message": "Insufficient credits for this operation"
}
```

#### Test 5: Hatalı Paket

```bash
curl -X POST https://your-n8n.com/webhook/payment/success \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SECRET_API_KEY" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "package_name": "NonExistentPackage",
    "payment_status": "paid",
    "price_paid": 999,
    "currency": "EUR"
  }'
```

**Beklenen Response (404):**
```json
{
  "success": false,
  "error": "package_not_found",
  "message": "Package 'NonExistentPackage' not found or inactive"
}
```

---

### 7. SUPABASE VERİ KONTROLÜ

#### Kullanıcı Kredisini Kontrol Et:
```sql
SELECT * FROM user_credits 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
```

#### Tüm İşlemleri Gör:
```sql
SELECT * FROM credit_transactions 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC;
```

#### Satın Alımları Kontrol Et:
```sql
SELECT * FROM user_purchases 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY purchased_at DESC;
```

#### Üretimleri Kontrol Et:
```sql
SELECT * FROM generated_images 
WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC;
```

---

### 8. MONİTORİNG VE LOGGING

#### N8N Execution Logs

1. N8N → Executions
2. Filter by:
   - Workflow: "AntiGravity - Payment Success"
   - Status: All / Error Only
   - Time: Last 24 hours

#### Supabase Realtime Monitoring

```sql
-- Son 1 saatteki tüm işlemler
SELECT 
    transaction_type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM credit_transactions
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY transaction_type;
```

#### Günlük Özet:
```sql
SELECT 
    DATE(created_at) as date,
    transaction_type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM credit_transactions
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at), transaction_type
ORDER BY date DESC, transaction_type;
```

---

### 9. PRODUCTION DEPLOYMENT CHECKLİST

```
✅ Supabase RPC fonksiyonları oluşturuldu
✅ Supabase indexler eklendi
✅ Supabase constraints eklendi
✅ Test paketleri eklendi
✅ N8N Supabase credential eklendi
✅ N8N Gmail credential eklendi (opsiyonel)
✅ N8N Telegram credential eklendi (opsiyonel)
✅ Workflow 1 import edildi ve aktif
✅ Workflow 2 import edildi ve aktif
✅ Workflow 3 import edildi ve aktif
✅ Webhook URL'leri backend'e eklendi
✅ API Key güvenliği eklendi
✅ Tüm test senaryoları çalıştırıldı
✅ İlk günlük rapor alındı
✅ Error handling test edildi
✅ Rate limiting değerlendirildi
✅ Backup stratejisi belirlendi
```

---

### 10. YARDIM VE DESTEK

#### N8N Workflow Sorunları:
- N8N Community: https://community.n8n.io
- N8N Docs: https://docs.n8n.io

#### Supabase Sorunları:
- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com

#### Common Issues:

**1. "Credential not found" hatası:**
- Solution: Workflow JSON'da `YOUR_SUPABASE_CREDENTIAL_ID` yerine gerçek credential ID'nizi yazın

**2. RPC fonksiyon bulunamıyor:**
- Solution: Supabase SQL Editor'da fonksiyonların oluşturulduğundan emin olun

**3. Webhook 404 dönüyor:**
- Solution: Workflow'un aktif olduğundan emin olun

**4. Email gönderilmiyor:**
- Solution: Gmail OAuth credential'ının doğru kurulduğundan emin olun

**5. Krediler düşmüyor:**
- Solution: `deduct_user_credits` RPC fonksiyonunu test edin

---

## 🎉 Kurulum Tamamlandı!

Artık AntiGravity kredi sisteminiz tamamen otomatik çalışıyor:

✅ Ödeme → Otomatik kredi ekleme
✅ Üretim → Otomatik kredi düşme
✅ Günlük → Otomatik admin raporu

Başarılar! 🚀
