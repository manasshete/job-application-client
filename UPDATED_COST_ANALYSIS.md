# HireFlow Updated Cost Analysis with New Limits

## New Configuration
- **Pro Tier**: 200 AI extractions + 200 documents/month (was 50 + 0)
- **Premium Tier**: 500 AI extractions + 500 documents/month (was unlimited + 100)
- **Model**: OpenAI GPT-4o-mini
- **Pricing**: $0.15 per 1M input tokens, $0.60 per 1M output tokens

---

## Cost Per Operation

### AI Extraction (Job URL → Parsed Data)
- **Input tokens**: ~800 tokens (URL + system prompt)
- **Output tokens**: ~600 tokens (parsed JSON)
- **Cost per extraction**: (800 × $0.15 / 1M) + (600 × $0.60 / 1M) = **$0.000516**

### Document Generation (Resume + Cover Letter Pair)
- **Input tokens**: ~7,500 tokens
- **Output tokens**: ~3,500 tokens
- **Cost per pair**: (7,500 × $0.15 / 1M) + (3,500 × $0.60 / 1M) = **$0.00375**

---

## Cost Analysis: User at Full Capacity

### PRO TIER - User Uses All 200 Extractions + 200 Documents

**AI Extraction Costs:**
- 200 extractions × $0.000516 = **$0.1032**

**Document Generation Costs:**
- 200 documents = 100 pairs (each pair is resume + cover letter)
- 100 pairs × $0.00375 = **$0.375**

**Total Pro API Cost**: $0.1032 + $0.375 = **$0.4782/month**
- **Pro subscription revenue**: £10/month (~$12.50 USD)
- **Profit per user**: $12.02 (96% margin!)

---

### PREMIUM TIER - User Uses All 500 Extractions + 500 Documents

**AI Extraction Costs:**
- 500 extractions × $0.000516 = **$0.258**

**Document Generation Costs:**
- 500 documents = 250 pairs
- 250 pairs × $0.00375 = **$0.9375**

**Total Premium API Cost**: $0.258 + $0.9375 = **$1.1955/month**
- **Premium subscription revenue**: £20/month (~$25 USD)
- **Profit per user**: $23.80 (95% margin!)

---

## Summary Table

| Metric | Pro (Full) | Premium (Full) |
|--------|-----------|---|
| AI Extractions | 200 | 500 |
| Documents | 200 | 500 |
| API Cost | $0.48 | $1.20 |
| Monthly Revenue | £10 (~$12.50) | £20 (~$25) |
| **Profit per User** | **$12.02** | **$23.80** |
| **Margin** | **96%** | **95%** |

---

## Scaling Analysis

### 100 Pro Users at Full Capacity
- Total API cost: $0.48 × 100 = **$48/month**
- Total revenue: £1,000 (~$1,250)
- **Total profit**: $1,202/month

### 100 Premium Users at Full Capacity
- Total API cost: $1.20 × 100 = **$120/month**
- Total revenue: £2,000 (~$2,500)
- **Total profit**: $2,380/month

### 50 Pro + 50 Premium Users (Mixed)
- Total API cost: ($0.48 × 50) + ($1.20 × 50) = **$84/month**
- Total revenue: £500 + £1,000 = £1,500 (~$1,875)
- **Total profit**: $1,791/month

---

## Recommendation

✅ **INCREASE LIMITS TO:**
- **Pro**: 200 extractions + 200 documents
- **Premium**: 500 extractions + 500 documents

**Reasons:**
1. **Negligible cost increase**: Only $0.48-$1.20 per user at full capacity
2. **Maintain high margins**: 95-96% profit margins even at max usage
3. **Competitive advantage**: Much higher limits than competitors
4. **Scalable profitability**: Can profitably serve hundreds of users
5. **User retention**: Higher limits = happier customers = less churn

**Conclusion**: The increased limits are financially sound and will improve user satisfaction without impacting profitability.
