# Home daily pool audit — 2026-05-26

Read-only audit of the next 10 dilemmas the EN home will serve via `getDailyScenario`.
Pool ordering mirrors `app/page.tsx`: `[...uniqueDynamicEn, ...staticEn]`. Index uses `floor(Date.now() / 86_400_000) % poolLength`.

## Pool summary

- Dynamic EN approved (after dedup vs static): **172**
- Static EN: **41**
- Total pool length: **213**
- Today's pool index: **151** (daysSinceEpoch=20599)
- Editorial-shape flag rate (moral, whole pool): **42.9%** (87/203)

## Next 10 daily dilemmas

| Offset | Date (UTC) | Pool idx | Source | Locale | Category | Style | Warnings | Question | Option A | Option B |
|---:|---|---:|---|---|---|---|---|---|---|---|
| **TODAY** | 2026-05-26 | 151 | dynamic | en | technology | moral | wordy_setup_question | To save your future child from a painful hereditary disease, you can edit their genes. But doing so could set a precedent for 'designer babies' and widen societal inequality. | Edit the genes to ensure your child has a healthy life, accepting the personal moral and social risks. | Do not edit the genes, choosing to accept the natural genetic lottery to avoid setting a problematic precedent. |
| +1d | 2026-05-27 | 152 | dynamic | en | technology | moral | undefined_collective_actor, missing_personal_stake | Social media platforms connect millions of teens but can also host harmful content. Should these companies be held legally accountable when a teen's suicide is linked to content they hosted? | Yes, because it creates a critical financial incentive for companies to proactively design safer platforms and remove harmful content. | No, because it would lead to excessive censorship and shift the fundamental responsibility for teen safety away from parents and communities. |
| +2d | 2026-05-28 | 153 | dynamic | en | relationships | moral | wordy_setup_question | An unexpected diagnosis leaves your parent needing daily, hands-on care, and they long to stay at home. Your hard-earned career is finally taking off and you're the primary earner for your own family. | Leave your career to provide care, ensuring your parent's comfort and dignity but risking your financial security and professional future. | Arrange for high-quality professional care, allowing you to continue supporting your family's needs while feeling you have outsourced a deep personal duty. |
| +3d | 2026-05-29 | 154 | dynamic | en | society | moral | missing_personal_stake | To save more lives, a government proposes a law where everyone is an organ donor unless they actively opt-out, using presumed consent. Is this a compassionate policy that maximizes the common good, or an unethical violation of personal choice over one's body? | Support the opt-out system, prioritizing the urgent need for organs and the potential to save countless lives. | Reject the opt-out system, upholding the principle of explicit, informed consent as a fundamental right that cannot be presumed. |
| +4d | 2026-05-30 | 155 | dynamic | en | technology | moral | — | If you knew your future child would inherit a fatal genetic disease, would you use gene editing to prevent it, or accept the natural risk to preserve genetic diversity? | Edit the genes to eliminate the disease, ensuring the child lives a healthy life. | Refuse the edit, upholding the natural human gene pool and avoiding unintended consequences. |
| +5d | 2026-05-31 | 156 | dynamic | en | society | moral | missing_personal_stake | Is offering substantial financial compensation to homeless individuals for participating in a medical study an ethical way to advance science, or does it exploit their vulnerability and desperation? | Yes, it provides needed income and autonomy for a marginalized group while contributing to vital research. | No, it takes advantage of their dire circumstances, offering unfair inducement and potentially compromising informed consent. |
| +6d | 2026-06-01 | 157 | dynamic | en | justice | moral | missing_personal_stake | After decades in prison, a murderer has demonstrated profound remorse and a complete transformation, but the victims' families still live with their grief. Should the justice system prioritize the inmate's proven rehabilitation or the victims' need for a sense of finality and punishment? | Grant early release, as true rehabilitation is the ultimate goal of the justice system and the person no longer poses a threat. | Deny early release, as the severity of the crime demands that the original sentence be served to uphold justice for the victims. |
| +7d | 2026-06-02 | 158 | dynamic | en | morality | moral | — | After realizing your career achievements were overwhelmingly due to fortunate circumstances rather than merit, do you feel obliged to redistribute your accumulated wealth to those less fortunate, or honor the commitments you made with it? | Redistribute most of your wealth to address systemic inequities and help others who lacked similar opportunities. | Retain your wealth to fulfill existing personal and family responsibilities, while advocating for structural change. |
| +8d | 2026-06-03 | 159 | dynamic | en | technology | moral | missing_personal_stake | Should social media platforms face legal consequences when their algorithms amplify harmful content linked to teen suicides, even if they did not create the content themselves? | Yes, because companies must be held accountable for the real-world harm caused by their platform's design choices and amplification systems. | No, because this could lead to excessive censorship, stifle free expression, and place an impossible burden on platforms to pre-screen all content. |
| +9d | 2026-06-04 | 160 | dynamic | en | society | moral | missing_personal_stake | When a nation shifts to an opt-out organ donation system to save more lives, is it right to presume consent from citizens who may not have explicitly agreed, or does this undermine individual rights over their own body? | Prioritize saving lives through presumed consent, as it benefits society and respects the urgency of transplants. | Respect individual autonomy by requiring explicit consent, ensuring no one's body is used without their clear agreement. |

## Per-day detail (full text)

### **TODAY** — 2026-05-26 — pool idx 151

- id: `ai-en-to-save-your-future-ch-octds`
- source: dynamic
- locale: en
- category: technology
- style: moral
- editorial warnings: wordy_setup_question

> Q: To save your future child from a painful hereditary disease, you can edit their genes. But doing so could set a precedent for 'designer babies' and widen societal inequality.

- A: Edit the genes to ensure your child has a healthy life, accepting the personal moral and social risks.
- B: Do not edit the genes, choosing to accept the natural genetic lottery to avoid setting a problematic precedent.

### +1d — 2026-05-27 — pool idx 152

- id: `ai-en-social-media-platforms-o67az`
- source: dynamic
- locale: en
- category: technology
- style: moral
- editorial warnings: undefined_collective_actor, missing_personal_stake

> Q: Social media platforms connect millions of teens but can also host harmful content. Should these companies be held legally accountable when a teen's suicide is linked to content they hosted?

- A: Yes, because it creates a critical financial incentive for companies to proactively design safer platforms and remove harmful content.
- B: No, because it would lead to excessive censorship and shift the fundamental responsibility for teen safety away from parents and communities.

### +2d — 2026-05-28 — pool idx 153

- id: `ai-en-an-unexpected-diagnosi-o77c7`
- source: dynamic
- locale: en
- category: relationships
- style: moral
- editorial warnings: wordy_setup_question

> Q: An unexpected diagnosis leaves your parent needing daily, hands-on care, and they long to stay at home. Your hard-earned career is finally taking off and you're the primary earner for your own family.

- A: Leave your career to provide care, ensuring your parent's comfort and dignity but risking your financial security and professional future.
- B: Arrange for high-quality professional care, allowing you to continue supporting your family's needs while feeling you have outsourced a deep personal duty.

### +3d — 2026-05-29 — pool idx 154

- id: `ai-en-to-save-more-lives-a-g-o6sv6`
- source: dynamic
- locale: en
- category: society
- style: moral
- editorial warnings: missing_personal_stake

> Q: To save more lives, a government proposes a law where everyone is an organ donor unless they actively opt-out, using presumed consent. Is this a compassionate policy that maximizes the common good, or an unethical violation of personal choice over one's body?

- A: Support the opt-out system, prioritizing the urgent need for organs and the potential to save countless lives.
- B: Reject the opt-out system, upholding the principle of explicit, informed consent as a fundamental right that cannot be presumed.

### +4d — 2026-05-30 — pool idx 155

- id: `ai-en-if-you-knew-your-futur-o8h0a`
- source: dynamic
- locale: en
- category: technology
- style: moral
- editorial warnings: none

> Q: If you knew your future child would inherit a fatal genetic disease, would you use gene editing to prevent it, or accept the natural risk to preserve genetic diversity?

- A: Edit the genes to eliminate the disease, ensuring the child lives a healthy life.
- B: Refuse the edit, upholding the natural human gene pool and avoiding unintended consequences.

### +5d — 2026-05-31 — pool idx 156

- id: `ai-en-is-offering-substantia-oawve`
- source: dynamic
- locale: en
- category: society
- style: moral
- editorial warnings: missing_personal_stake

> Q: Is offering substantial financial compensation to homeless individuals for participating in a medical study an ethical way to advance science, or does it exploit their vulnerability and desperation?

- A: Yes, it provides needed income and autonomy for a marginalized group while contributing to vital research.
- B: No, it takes advantage of their dire circumstances, offering unfair inducement and potentially compromising informed consent.

### +6d — 2026-06-01 — pool idx 157

- id: `ai-en-after-decades-in-priso-oblok`
- source: dynamic
- locale: en
- category: justice
- style: moral
- editorial warnings: missing_personal_stake

> Q: After decades in prison, a murderer has demonstrated profound remorse and a complete transformation, but the victims' families still live with their grief. Should the justice system prioritize the inmate's proven rehabilitation or the victims' need for a sense of finality and punishment?

- A: Grant early release, as true rehabilitation is the ultimate goal of the justice system and the person no longer poses a threat.
- B: Deny early release, as the severity of the crime demands that the original sentence be served to uphold justice for the victims.

### +7d — 2026-06-02 — pool idx 158

- id: `ai-en-after-realizing-your-c-o8s4o`
- source: dynamic
- locale: en
- category: morality
- style: moral
- editorial warnings: none

> Q: After realizing your career achievements were overwhelmingly due to fortunate circumstances rather than merit, do you feel obliged to redistribute your accumulated wealth to those less fortunate, or honor the commitments you made with it?

- A: Redistribute most of your wealth to address systemic inequities and help others who lacked similar opportunities.
- B: Retain your wealth to fulfill existing personal and family responsibilities, while advocating for structural change.

### +8d — 2026-06-03 — pool idx 159

- id: `ai-en-should-social-media-pl-o9vn5`
- source: dynamic
- locale: en
- category: technology
- style: moral
- editorial warnings: missing_personal_stake

> Q: Should social media platforms face legal consequences when their algorithms amplify harmful content linked to teen suicides, even if they did not create the content themselves?

- A: Yes, because companies must be held accountable for the real-world harm caused by their platform's design choices and amplification systems.
- B: No, because this could lead to excessive censorship, stifle free expression, and place an impossible burden on platforms to pre-screen all content.

### +9d — 2026-06-04 — pool idx 160

- id: `ai-en-when-a-nation-shifts-t-oansi`
- source: dynamic
- locale: en
- category: society
- style: moral
- editorial warnings: missing_personal_stake

> Q: When a nation shifts to an opt-out organ donation system to save more lives, is it right to presume consent from citizens who may not have explicitly agreed, or does this undermine individual rights over their own body?

- A: Prioritize saving lives through presumed consent, as it benefits society and respects the urgency of transplants.
- B: Respect individual autonomy by requiring explicit consent, ensuring no one's body is used without their clear agreement.
