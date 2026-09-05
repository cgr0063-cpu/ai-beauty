# P20 — Store Mode Product Photo + Wardrobe Compatibility

## Closed in this checkpoint
- Store Mode can classify an optional product photo through the configured remote AI backend after explicit photo-AI consent.
- Premium product-photo classification uses a dedicated `/v1/store/analyze` endpoint protected by `requireAuth + requirePlus + aiLimiter`.
- If visual classification is unavailable, Store Mode does not invent a result; the user can continue from the manual description.
- Decision engine combines optional visual category/color/style tags with closet metadata, budget, favorite/disliked colors, Saved Looks feedback and verified weekly trend context.
- Added explainable 0–100 wardrobe compatibility score, duplicate count, compatible item count and top matching closet labels.
- Trend remains supporting-only and stale trend remains date-labelled.
- EN/TR/RU strings remain parity-checked.

## Truthfulness boundary
The compatibility score is a metadata-based decision aid. It is not a body-fit guarantee, live inventory claim, live price claim, or proof that two colors/fabrics will look identical in person.

## External validation still required
A real signed build plus configured backend/AI provider/RevenueCat entitlement is required to prove product-photo classification end-to-end on device.
