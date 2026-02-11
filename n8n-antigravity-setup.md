# 🚀 AntiGravity - N8N Otomasyon Sistemi

## 📋 İçindekiler
1. [Supabase Kurulum](#supabase-kurulum)
2. [Workflow 1: Paket Satın Alma](#workflow-1-paket-satın-alma)
3. [Workflow 2: Kredi Kullanım](#workflow-2-kredi-kullanım)
4. [Workflow 3: Admin Monitoring](#workflow-3-admin-monitoring)
5. [Test Senaryoları](#test-senaryoları)

---

## 🗄️ Supabase Kurulum

### 1. SQL Functions (RPC) Oluşturma

Öncelikle Supabase SQL Editor'da aşağıdaki fonksiyonları çalıştırın:

```sql
-- ✅ Kullanıcı kredisi ekleme fonksiyonu (Atomic)
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

-- ✅ Kullanıcı kredisi düşme fonksiyonu (Atomic + Güvenli)
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
    -- Mevcut bakiyeyi al
    SELECT credits_balance INTO current_balance
    FROM user_credits
    WHERE user_id = p_user_id
    FOR UPDATE; -- Row-level lock
    
    -- Eğer kayıt yoksa
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
    
    -- Yeni bakiyeyi döndür
    SELECT credits_balance INTO current_balance
    FROM user_credits
    WHERE user_id = p_user_id;
    
    RETURN QUERY SELECT TRUE, current_balance, NULL::TEXT;
END;
$$;

-- ✅ İndexler (Performance için)
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_created_at ON credit_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON user_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_user_id ON generated_images(user_id);
```

### 2. Constraint Eklemeleri

```sql
-- Kredinin negatif olmasını engelle
ALTER TABLE user_credits 
ADD CONSTRAINT check_credits_positive 
CHECK (credits_balance >= 0);

-- Active package kontrolü
ALTER TABLE packages 
ADD CONSTRAINT check_price_positive 
CHECK (price_eur > 0);
```

---

## 🔄 WORKFLOW 1: Paket Satın Alma İşlemi

### 📌 Genel Bakış
- **Trigger:** Webhook (POST /payment/success)
- **Amaç:** Ödeme sonrası kredi ekleme
- **Node Sayısı:** 12

### 🔧 Node Detayları

#### Node 1: Webhook Trigger
```
Type: Webhook
Name: Webhook Payment Success
Settings:
  - HTTP Method: POST
  - Path: payment/success
  - Response Mode: On Received
  - Response Code: 200
```

#### Node 2: Set - Validate Input
```
Type: Set
Name: Validate Input
Settings:
  Values to Set:
    - user_id: {{$json.body.user_id}}
    - package_name: {{$json.body.package_name}}
    - payment_status: {{$json.body.payment_status}}
    - price_paid: {{$json.body.price_paid}}
    - currency: {{$json.body.currency || 'EUR'}}
    - payment_provider: {{$json.body.payment_provider}}
    - transaction_id: {{$json.body.transaction_id}}
```

#### Node 3: IF - Check Required Fields
```
Type: IF
Name: Check Required Fields
Conditions:
  AND:
    - {{$json.user_id}} is not empty
    - {{$json.package_name}} is not empty
    - {{$json.payment_status}} is not empty
    - {{$json.price_paid}} is not empty
```

#### Node 4: Respond - Missing Fields (False branch)
```
Type: Respond to Webhook
Name: Respond Missing Fields
Settings:
  Response Body:
    {
      "success": false,
      "error": "missing_required_fields",
      "message": "user_id, package_name, payment_status, and price_paid are required"
    }
  Response Code: 400
```

#### Node 5: IF - Check Payment Status (True branch)
```
Type: IF
Name: Check Payment Status
Conditions:
  - {{$json.payment_status}} equals "paid"
```

#### Node 6: Respond - Payment Not Paid (False branch)
```
Type: Respond to Webhook
Name: Respond Payment Not Paid
Settings:
  Response Body:
    {
      "success": false,
      "error": "payment_not_paid",
      "message": "Payment status is not 'paid'"
    }
  Response Code: 400
```

#### Node 7: Supabase - Get Package (True branch)
```
Type: Supabase
Name: Get Package
Operation: Get All
Settings:
  - Table: packages
  - Filter: name = {{$json.package_name}}
  - Filter: is_active = true
  - Return Fields: id, name, credits_amount, price_eur
```

#### Node 8: IF - Package Found
```
Type: IF
Name: Package Found
Conditions:
  - {{$json.length}} is greater than 0
```

#### Node 9: Respond - Package Not Found (False branch)
```
Type: Respond to Webhook
Name: Respond Package Not Found
Settings:
  Response Body:
    {
      "success": false,
      "error": "package_not_found",
      "message": "Package '{{$node["Validate Input"].json.package_name}}' not found or inactive"
    }
  Response Code: 404
```

#### Node 10: Supabase - Insert Purchase (True branch)
```
Type: Supabase
Name: Insert Purchase
Operation: Insert
Settings:
  - Table: user_purchases
  - Columns:
      user_id: {{$node["Validate Input"].json.user_id}}
      package_id: {{$node["Get Package"].json[0].id}}
      credits_added: {{$node["Get Package"].json[0].credits_amount}}
      price_paid: {{$node["Validate Input"].json.price_paid}}
      currency: {{$node["Validate Input"].json.currency}}
      payment_provider: {{$node["Validate Input"].json.payment_provider}}
      payment_status: paid
```

#### Node 11: Supabase - Add Credits RPC
```
Type: Supabase
Name: Add Credits RPC
Operation: RPC
Settings:
  - Function Name: add_user_credits
  - Parameters:
      p_user_id: {{$node["Validate Input"].json.user_id}}
      p_amount: {{$node["Get Package"].json[0].credits_amount}}
```

#### Node 12: Supabase - Insert Credit Transaction
```
Type: Supabase
Name: Insert Credit Transaction
Operation: Insert
Settings:
  - Table: credit_transactions
  - Columns:
      user_id: {{$node["Validate Input"].json.user_id}}
      amount: {{$node["Get Package"].json[0].credits_amount}}
      transaction_type: purchase
      description: Package purchase: {{$node["Get Package"].json[0].name}}
```

#### Node 13: Supabase - Update Profile
```
Type: Supabase
Name: Update Profile
Operation: Update
Settings:
  - Table: profiles
  - Filter: id = {{$node["Validate Input"].json.user_id}}
  - Columns:
      plan_type: {{$node["Get Package"].json[0].name}}
      updated_at: {{$now}}
```

#### Node 14: Respond - Success
```
Type: Respond to Webhook
Name: Respond Success
Settings:
  Response Body:
    {
      "success": true,
      "user_id": "{{$node["Validate Input"].json.user_id}}",
      "package": "{{$node["Get Package"].json[0].name}}",
      "credits_added": {{$node["Get Package"].json[0].credits_amount}},
      "new_balance": {{$node["Add Credits RPC"].json[0].new_balance}},
      "message": "Credits added successfully"
    }
  Response Code: 200
```

#### Node 15: On Error - Log Error
```
Type: Supabase
Name: Log Error Transaction
Trigger: On Workflow Error
Operation: Insert
Settings:
  - Table: credit_transactions
  - Columns:
      user_id: {{$node["Validate Input"].json.user_id || null}}
      amount: 0
      transaction_type: error
      description: Payment processing error: {{$json.message}}
```

#### Node 16: On Error - Respond Error
```
Type: Respond to Webhook
Name: Respond Error
Trigger: After Log Error Transaction
Settings:
  Response Body:
    {
      "success": false,
      "error": "supabase_error",
      "message": "An error occurred during payment processing"
    }
  Response Code: 500
```

---

## 🎨 WORKFLOW 2: Kredi Kullanım ve Görsel Üretme

### 📌 Genel Bakış
- **Trigger:** Webhook (POST /generate)
- **Amaç:** Görsel/video üretiminde kredi kontrolü ve düşme
- **Node Sayısı:** 14

### 🔧 Node Detayları

#### Node 1: Webhook Trigger
```
Type: Webhook
Name: Webhook Generate Request
Settings:
  - HTTP Method: POST
  - Path: generate
  - Response Mode: On Received
```

#### Node 2: Set - Validate and Calculate Cost
```
Type: Set
Name: Validate and Calculate Cost
Settings:
  Values to Set:
    - user_id: {{$json.body.user_id}}
    - prompt: {{$json.body.prompt}}
    - style: {{$json.body.style}}
    - is_video: {{$json.body.is_video || false}}
    - original_image_url: {{$json.body.original_image_url}}
    - generated_image_url: {{$json.body.generated_image_url}}
    - cost: {{$json.body.cost}}
```

#### Node 3: IF - Required Fields Check
```
Type: IF
Name: Required Fields Check
Conditions:
  AND:
    - {{$json.user_id}} is not empty
    - {{$json.prompt}} is not empty
    - {{$json.cost}} is not empty
```

#### Node 4: Respond - Missing Fields
```
Type: Respond to Webhook
Name: Respond Missing Fields
Settings:
  Response Body:
    {
      "success": false,
      "error": "missing_required_fields",
      "message": "user_id, prompt, and cost are required"
    }
  Response Code: 400
```

#### Node 5: Switch - Calculate Cost (True branch)
```
Type: Switch
Name: Calculate Cost
Mode: Rules
Rules:
  - Rule 1:
      Conditions: {{$json.is_video}} equals true
      Output: 0
  - Rule 2:
      Conditions: {{$json.style}} equals "4K"
      Output: 1
  - Rule 3:
      Conditions: {{$json.style}} equals "HD"
      Output: 2
  - Default:
      Output: 3
```

#### Node 6: Set - Video Cost (Output 0)
```
Type: Set
Name: Set Video Cost
Settings:
  - cost: 10
```

#### Node 7: Set - 4K Cost (Output 1)
```
Type: Set
Name: Set 4K Cost
Settings:
  - cost: 4
```

#### Node 8: Set - HD Cost (Output 2)
```
Type: Set
Name: Set HD Cost
Settings:
  - cost: 2
```

#### Node 9: Set - Normal Cost (Output 3)
```
Type: Set
Name: Set Normal Cost
Settings:
  - cost: 1
```

#### Node 10: Merge - Combine Cost
```
Type: Merge
Name: Merge Cost Calculations
Mode: Append
```

#### Node 11: Supabase - Get User Credits
```
Type: Supabase
Name: Get User Credits
Operation: Get All
Settings:
  - Table: user_credits
  - Filter: user_id = {{$node["Validate and Calculate Cost"].json.user_id}}
  - Return Fields: credits_balance
```

#### Node 12: IF - Sufficient Credits
```
Type: IF
Name: Sufficient Credits Check
Conditions:
  - {{$json[0].credits_balance}} is greater than or equal to {{$node["Merge Cost Calculations"].json.cost}}
```

#### Node 13: Supabase - Log Failed Transaction (False branch)
```
Type: Supabase
Name: Log Failed Transaction
Operation: Insert
Settings:
  - Table: credit_transactions
  - Columns:
      user_id: {{$node["Validate and Calculate Cost"].json.user_id}}
      amount: 0
      transaction_type: failed_usage
      description: Not enough credits. Required: {{$node["Merge Cost Calculations"].json.cost}}, Available: {{$node["Get User Credits"].json[0].credits_balance}}
```

#### Node 14: Respond - Insufficient Credits
```
Type: Respond to Webhook
Name: Respond Insufficient Credits
Settings:
  Response Body:
    {
      "success": false,
      "error": "not_enough_credits",
      "required_credits": {{$node["Merge Cost Calculations"].json.cost}},
      "available_credits": {{$node["Get User Credits"].json[0].credits_balance}},
      "message": "Insufficient credits for this operation"
    }
  Response Code: 402
```

#### Node 15: Supabase - Deduct Credits RPC (True branch)
```
Type: Supabase
Name: Deduct Credits RPC
Operation: RPC
Settings:
  - Function Name: deduct_user_credits
  - Parameters:
      p_user_id: {{$node["Validate and Calculate Cost"].json.user_id}}
      p_amount: {{$node["Merge Cost Calculations"].json.cost}}
```

#### Node 16: IF - Deduction Success
```
Type: IF
Name: Deduction Success Check
Conditions:
  - {{$json[0].success}} equals true
```

#### Node 17: Supabase - Insert Credit Transaction (True branch)
```
Type: Supabase
Name: Insert Credit Transaction
Operation: Insert
Settings:
  - Table: credit_transactions
  - Columns:
      user_id: {{$node["Validate and Calculate Cost"].json.user_id}}
      amount: -{{$node["Merge Cost Calculations"].json.cost}}
      transaction_type: usage
      description: {{$node["Validate and Calculate Cost"].json.is_video ? 'Video' : 'Image'}} generation - Style: {{$node["Validate and Calculate Cost"].json.style}}
```

#### Node 18: Supabase - Insert Generated Image
```
Type: Supabase
Name: Insert Generated Image
Operation: Insert
Settings:
  - Table: generated_images
  - Columns:
      user_id: {{$node["Validate and Calculate Cost"].json.user_id}}
      original_image_url: {{$node["Validate and Calculate Cost"].json.original_image_url}}
      generated_image_url: {{$node["Validate and Calculate Cost"].json.generated_image_url}}
      prompt: {{$node["Validate and Calculate Cost"].json.prompt}}
      style: {{$node["Validate and Calculate Cost"].json.style}}
      is_video: {{$node["Validate and Calculate Cost"].json.is_video}}
```

#### Node 19: Respond - Success
```
Type: Respond to Webhook
Name: Respond Success
Settings:
  Response Body:
    {
      "success": true,
      "message": "Generation logged successfully",
      "cost": {{$node["Merge Cost Calculations"].json.cost}},
      "remaining_credits": {{$node["Deduct Credits RPC"].json[0].new_balance}},
      "generation_type": "{{$node["Validate and Calculate Cost"].json.is_video ? 'video' : 'image'}}",
      "style": "{{$node["Validate and Calculate Cost"].json.style}}"
    }
  Response Code: 200
```

#### Node 20: Respond - Deduction Failed (False branch of Node 16)
```
Type: Respond to Webhook
Name: Respond Deduction Failed
Settings:
  Response Body:
    {
      "success": false,
      "error": "credit_deduction_failed",
      "message": {{$node["Deduct Credits RPC"].json[0].error_message}},
      "remaining_credits": {{$node["Deduct Credits RPC"].json[0].new_balance}}
    }
  Response Code: 500
```

---

## 📊 WORKFLOW 3: Admin Monitoring - Günlük Rapor

### 📌 Genel Bakış
- **Trigger:** Cron (Daily 00:00)
- **Amaç:** Günlük kullanım ve satış raporu
- **Node Sayısı:** 8

### 🔧 Node Detayları

#### Node 1: Cron Trigger
```
Type: Cron
Name: Daily Report Trigger
Settings:
  - Mode: Every Day
  - Hour: 0
  - Minute: 0
  - Timezone: Europe/Istanbul
```

#### Node 2: Supabase - Get Daily Purchases
```
Type: Supabase
Name: Get Daily Purchases
Operation: Get All
Settings:
  - Table: user_purchases
  - Filter: purchased_at >= (NOW() - INTERVAL '1 day')
  - Return All Fields
```

#### Node 3: Supabase - Get Daily Transactions
```
Type: Supabase
Name: Get Daily Transactions
Operation: Get All
Settings:
  - Table: credit_transactions
  - Filter: created_at >= (NOW() - INTERVAL '1 day')
  - Return All Fields
```

#### Node 4: Supabase - Get Daily Generations
```
Type: Supabase
Name: Get Daily Generations
Operation: Get All
Settings:
  - Table: generated_images
  - Filter: created_at >= (NOW() - INTERVAL '1 day')
  - Return All Fields
```

#### Node 5: Function - Calculate Statistics
```
Type: Function
Name: Calculate Daily Stats
Function Code:
```javascript
// Tüm verileri topla
const purchases = $node["Get Daily Purchases"].json;
const transactions = $node["Get Daily Transactions"].json;
const generations = $node["Get Daily Generations"].json;

// İstatistikleri hesapla
const stats = {
  date: new Date().toISOString().split('T')[0],
  
  // Satın alma istatistikleri
  total_purchases: purchases.length,
  total_revenue_eur: purchases.reduce((sum, p) => sum + (p.price_paid || 0), 0),
  total_credits_sold: purchases.reduce((sum, p) => sum + (p.credits_added || 0), 0),
  
  // İşlem istatistikleri
  total_transactions: transactions.length,
  purchase_transactions: transactions.filter(t => t.transaction_type === 'purchase').length,
  usage_transactions: transactions.filter(t => t.transaction_type === 'usage').length,
  failed_transactions: transactions.filter(t => t.transaction_type === 'failed_usage').length,
  error_transactions: transactions.filter(t => t.transaction_type === 'error').length,
  
  // Kredi hareketleri
  total_credits_added: transactions
    .filter(t => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0),
  total_credits_spent: Math.abs(transactions
    .filter(t => t.amount < 0)
    .reduce((sum, t) => sum + t.amount, 0)),
  
  // Üretim istatistikleri
  total_generations: generations.length,
  image_generations: generations.filter(g => !g.is_video).length,
  video_generations: generations.filter(g => g.is_video).length,
  
  // En popüler stiller
  top_styles: Object.entries(
    generations.reduce((acc, g) => {
      acc[g.style] = (acc[g.style] || 0) + 1;
      return acc;
    }, {})
  )
  .sort((a, b) => b[1] - a[1])
  .slice(0, 5)
  .map(([style, count]) => ({ style, count })),
  
  // En aktif kullanıcılar (en çok kredi harcayanlar)
  top_users_by_spending: Object.entries(
    transactions
      .filter(t => t.amount < 0)
      .reduce((acc, t) => {
        acc[t.user_id] = (acc[t.user_id] || 0) + Math.abs(t.amount);
        return acc;
      }, {})
  )
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([user_id, credits]) => ({ user_id, credits_spent: credits })),
  
  // Uyarılar
  alerts: []
};

// Uyarı kontrolü
if (stats.failed_transactions > 10) {
  stats.alerts.push({
    type: 'high_failed_transactions',
    message: `${stats.failed_transactions} failed credit transactions today`,
    severity: 'warning'
  });
}

if (stats.error_transactions > 0) {
  stats.alerts.push({
    type: 'system_errors',
    message: `${stats.error_transactions} system errors occurred today`,
    severity: 'critical'
  });
}

if (stats.total_purchases === 0) {
  stats.alerts.push({
    type: 'no_purchases',
    message: 'No purchases made today',
    severity: 'info'
  });
}

return [stats];
```
```
```

#### Node 6: IF - Check Alerts
```
Type: IF
Name: Check Alerts
Conditions:
  - {{$json.alerts.length}} is greater than 0
```

#### Node 7: Function - Format Email Report (True branch)
```
Type: Function
Name: Format Email Report
Function Code:
```javascript
const stats = $input.all()[0].json;

const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 800px; margin: 0 auto; padding: 20px; }
    h1 { color: #2c3e50; border-bottom: 3px solid #3498db; padding-bottom: 10px; }
    h2 { color: #34495e; margin-top: 30px; }
    .stat-box { background: #ecf0f1; padding: 15px; margin: 10px 0; border-radius: 5px; }
    .stat-label { font-weight: bold; color: #7f8c8d; }
    .stat-value { font-size: 24px; color: #2c3e50; font-weight: bold; }
    .alert { padding: 15px; margin: 10px 0; border-radius: 5px; }
    .alert-warning { background: #fff3cd; border-left: 4px solid #ffc107; }
    .alert-critical { background: #f8d7da; border-left: 4px solid #dc3545; }
    .alert-info { background: #d1ecf1; border-left: 4px solid #17a2b8; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #3498db; color: white; }
    tr:hover { background-color: #f5f5f5; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 AntiGravity - Günlük Rapor</h1>
    <p><strong>Tarih:</strong> ${stats.date}</p>
    
    ${stats.alerts.length > 0 ? `
      <h2>⚠️ Uyarılar</h2>
      ${stats.alerts.map(alert => `
        <div class="alert alert-${alert.severity}">
          <strong>${alert.type}:</strong> ${alert.message}
        </div>
      `).join('')}
    ` : ''}
    
    <h2>💰 Satış İstatistikleri</h2>
    <div class="stat-box">
      <div class="stat-label">Toplam Satın Alma</div>
      <div class="stat-value">${stats.total_purchases}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Toplam Gelir</div>
      <div class="stat-value">€${stats.total_revenue_eur.toFixed(2)}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Satılan Toplam Kredi</div>
      <div class="stat-value">${stats.total_credits_sold}</div>
    </div>
    
    <h2>🔄 İşlem İstatistikleri</h2>
    <div class="stat-box">
      <div class="stat-label">Toplam İşlem</div>
      <div class="stat-value">${stats.total_transactions}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Başarılı Kullanım</div>
      <div class="stat-value">${stats.usage_transactions}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Başarısız İşlem</div>
      <div class="stat-value" style="color: #e74c3c;">${stats.failed_transactions}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Sistem Hataları</div>
      <div class="stat-value" style="color: #e74c3c;">${stats.error_transactions}</div>
    </div>
    
    <h2>💳 Kredi Hareketleri</h2>
    <div class="stat-box">
      <div class="stat-label">Eklenen Kredi</div>
      <div class="stat-value" style="color: #27ae60;">+${stats.total_credits_added}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Harcanan Kredi</div>
      <div class="stat-value" style="color: #e74c3c;">-${stats.total_credits_spent}</div>
    </div>
    
    <h2>🎨 Üretim İstatistikleri</h2>
    <div class="stat-box">
      <div class="stat-label">Toplam Üretim</div>
      <div class="stat-value">${stats.total_generations}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Görsel Üretimi</div>
      <div class="stat-value">${stats.image_generations}</div>
    </div>
    <div class="stat-box">
      <div class="stat-label">Video Üretimi</div>
      <div class="stat-value">${stats.video_generations}</div>
    </div>
    
    <h2>🔥 En Popüler Stiller</h2>
    <table>
      <thead>
        <tr>
          <th>Stil</th>
          <th>Kullanım Sayısı</th>
        </tr>
      </thead>
      <tbody>
        ${stats.top_styles.map(s => `
          <tr>
            <td>${s.style}</td>
            <td>${s.count}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <h2>👥 En Aktif Kullanıcılar (Kredi Harcama)</h2>
    <table>
      <thead>
        <tr>
          <th>Kullanıcı ID</th>
          <th>Harcanan Kredi</th>
        </tr>
      </thead>
      <tbody>
        ${stats.top_users_by_spending.map(u => `
          <tr>
            <td>${u.user_id.substring(0, 8)}...</td>
            <td>${u.credits_spent}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
    
    <hr style="margin: 40px 0;">
    <p style="color: #7f8c8d; font-size: 12px;">
      Bu rapor otomatik olarak N8N tarafından oluşturulmuştur.
    </p>
  </div>
</body>
</html>
`;

return [{
  json: {
    subject: `[AntiGravity] Günlük Rapor - ${stats.date}`,
    html: emailHtml,
    stats: stats
  }
}];
```
```
```

#### Node 8: Send Email (Gmail/SMTP)
```
Type: Gmail / Send Email
Name: Send Admin Report
Settings:
  - To: admin@antigravity.com
  - Subject: {{$json.subject}}
  - Email Type: HTML
  - Message: {{$json.html}}
```

Alternatif olarak Telegram/Discord/Slack kullanılabilir:

**Telegram Node:**
```
Type: Telegram
Name: Send Telegram Alert
Settings:
  - Chat ID: YOUR_ADMIN_CHAT_ID
  - Text:
```
🤖 **AntiGravity Günlük Rapor**
📅 Tarih: {{$node["Calculate Daily Stats"].json.date}}

💰 **Satışlar:**
• Toplam: {{$node["Calculate Daily Stats"].json.total_purchases}}
• Gelir: €{{$node["Calculate Daily Stats"].json.total_revenue_eur}}

🎨 **Üretim:**
• Toplam: {{$node["Calculate Daily Stats"].json.total_generations}}
• Görsel: {{$node["Calculate Daily Stats"].json.image_generations}}
• Video: {{$node["Calculate Daily Stats"].json.video_generations}}

⚠️ **Uyarılar:** {{$node["Calculate Daily Stats"].json.alerts.length}}

Detaylı rapor email olarak gönderildi.
```
```
```

---

## 🧪 Test Senaryoları

### Test 1: Paket Satın Alma (Success)
```bash
curl -X POST https://your-n8n-instance.com/webhook/payment/success \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "package_name": "Başlangıç",
    "payment_status": "paid",
    "price_paid": 179,
    "currency": "EUR",
    "payment_provider": "stripe",
    "transaction_id": "pi_1234567890"
  }'
```

**Beklenen Yanıt:**
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

### Test 2: Görsel Üretme (Success)
```bash
curl -X POST https://your-n8n-instance.com/webhook/generate \
  -H "Content-Type: application/json" \
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

**Beklenen Yanıt:**
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

### Test 3: Yetersiz Kredi
```bash
curl -X POST https://your-n8n-instance.com/webhook/generate \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "550e8400-e29b-41d4-a716-446655440000",
    "prompt": "make video",
    "style": "realistic",
    "is_video": true,
    "cost": 10
  }'
```

**Beklenen Yanıt (eğer kredi yetersizse):**
```json
{
  "success": false,
  "error": "not_enough_credits",
  "required_credits": 10,
  "available_credits": 5,
  "message": "Insufficient credits for this operation"
}
```

---

## 🔒 Güvenlik Önerileri

### 1. API Key Authentication
Her workflow için webhook'lara Authorization header ekleyin:

```javascript
// IF Node - Check Authorization
{{$node["Webhook"].json.headers.authorization}} equals "Bearer YOUR_SECRET_API_KEY"
```

### 2. Rate Limiting
N8N'de Rate Limit Node ekleyin:
- Max requests: 100 per minute per user_id

### 3. Input Validation
Tüm user input'ları sanitize edin:
- SQL injection koruması (Supabase RPC kullanımı bunu halleder)
- XSS koruması (HTML encode)
- UUID validasyonu

---

## 📈 Performance İyileştirmeleri

### 1. Caching
- Package bilgilerini Redis'te cache'leyin (5 dakika)
- User credits bilgisini cache'leyin (30 saniye)

### 2. Batch Processing
- Aynı anda 100+ kullanıcı için bulk insert kullanın

### 3. Async Processing
- Görsel kaydını queue'ya atın (RabbitMQ/Redis Queue)
- N8N workflow'u async çalıştırın

---

## 🐛 Debugging

### Log Kontrol
Supabase'de transaction loglarını kontrol edin:

```sql
-- Son 1 saatteki tüm işlemler
SELECT * FROM credit_transactions
WHERE created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Failed işlemler
SELECT * FROM credit_transactions
WHERE transaction_type = 'failed_usage'
ORDER BY created_at DESC
LIMIT 50;

-- Error işlemler
SELECT * FROM credit_transactions
WHERE transaction_type = 'error'
ORDER BY created_at DESC
LIMIT 50;
```

### N8N Execution Log
N8N panel'den:
- Executions → Filters
- Error only göster
- Son 24 saat

---

## ✅ Deployment Checklist

- [ ] Supabase SQL fonksiyonları oluşturuldu
- [ ] Supabase indexler eklendi
- [ ] Packages tablosu dolduruldu
- [ ] N8N Workflow 1 import edildi ve test edildi
- [ ] N8N Workflow 2 import edildi ve test edildi
- [ ] N8N Workflow 3 import edildi ve test edildi
- [ ] Webhook URL'leri kaydedildi
- [ ] API Key güvenliği eklendi
- [ ] Email/Telegram bildirimleri ayarlandı
- [ ] Production test senaryoları koşuldu
- [ ] Monitoring dashboard kuruldu

---

## 📞 Destek

Sorularınız için:
- N8N Community: https://community.n8n.io
- Supabase Docs: https://supabase.com/docs
- AntiGravity Support: support@antigravity.com
