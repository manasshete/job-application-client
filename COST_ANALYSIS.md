# JobTracker Document Generation Cost Analysis

## Current Configuration
- **Model**: OpenAI GPT-4o-mini
- **Pricing**: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Document Types**: Resume Tailoring + Cover Letter Generation

---

## Token Estimation Per Document

### Resume Tailoring (Per Document)
- **Input**: ~3,000 tokens
  - System prompt: ~500 tokens
  - Resume text (15,000 char max): ~3,000-4,000 tokens
  - Job description: ~800 tokens
  - Additional context: ~200 tokens
- **Output**: ~1,500 tokens (tailored resume)
- **Total**: ~4,500 input + 1,500 output tokens

### Cover Letter Generation (Per Document)
- **Input**: ~3,500 tokens
  - System prompt: ~600 tokens
  - User input/draft: ~1,500 tokens
  - Job description: ~800 tokens
  - Additional context: ~600 tokens
- **Output**: ~2,000 tokens (full cover letter)
- **Total**: ~3,500 input + 2,000 output tokens

### Cost Per Pair (Resume + Cover Letter)
- **Combined Input**: 7,500 tokens
- **Combined Output**: 3,500 tokens
- **Cost**: (7,500 × $0.15 / 1M) + (3,500 × $0.60 / 1M) = **$0.00375**

---

## Cost Breakdown by Plan

### Pro Tier: 200 Documents/Month
- **Documents per month**: 200 pairs (resume + cover letter)
- **Total tokens**: 2,200,000 input + 700,000 output
- **Monthly API cost**: (2.2M × $0.15) + (0.7M × $0.60) = **$0.75/month**
- **User subscription revenue**: €15-20/month
- **Net margin**: €14.25-19.25/month per user

### Premium Tier: 500 Documents/Month
- **Documents per month**: 500 pairs (resume + cover letter)
- **Total tokens**: 5,500,000 input + 1,750,000 output
- **Monthly API cost**: (5.5M × $0.15) + (1.75M × $0.60) = **$1.89/month**
- **User subscription revenue**: €25-30/month
- **Net margin**: €23.11-28.11/month per user

---

## Recommended Pricing Strategy

| Tier | Limit | API Cost | Suggested Price | Net Margin | Profitability |
|------|-------|----------|-----------------|-----------|----------------|
| Free | 0 | $0 | $0 | $0 | Break-even |
| Pro | 200 | $0.75 | €15/month | €14.25 | 95% margin |
| Premium | 500 | $1.89 | €25/month | €23.11 | 92% margin |

---

## Risk Assessment

### If One Account Uses All Limits
**Scenario**: 1 premium user maxes out 500 documents/month
- **Your cost**: $1.89
- **Revenue (€25)**: ~$27 USD
- **Profit per user**: ~$25.11 (93% margin)
- **Status**: ✅ HIGHLY PROFITABLE

### Peak Scenario: 100 Premium Users at Full Capacity
- **Total cost**: $1.89 × 100 = $189/month
- **Total revenue**: €2,500/month (~$2,700)
- **Profit**: $2,511/month
- **Status**: ✅ EXTREMELY PROFITABLE

---

## Cost Optimization Opportunities

1. **Batch API** (Recommended)
   - Reduce input token cost from $0.15 → $0.075 (50% savings)
   - Perfect for overnight processing
   - Example: At scale, could process 500 documents for $0.94/month

2. **Prompt Caching**
   - Cache common templates and job descriptions
   - Further reduce input token costs

3. **Monthly Limits Are Fine**
   - Even at 500 documents/month per user, cost is negligible ($1.89)
   - Subscription revenue easily covers costs with 90%+ margins

---

## Conclusion

**Raising limits to Pro: 200, Premium: 500 is FINANCIALLY SOUND.**

- Cost is minimal ($0.75-$1.89/month per user at full capacity)
- Revenue margins remain 90%+ on all tiers
- Can scale to 100s of users profitably
- Current implementation is cost-efficient

**Recommendation**: Proceed with increased limits. The API costs are negligible compared to subscription revenue.
