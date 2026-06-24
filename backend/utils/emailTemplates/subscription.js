import { SUBSCRIPTION_TYPE_PRO, SUBSCRIPTION_TYPE_QUESTION } from "../../constant.js";

const APP_URL = "https://nutri-cal.pages.dev";

const formatDate = (isoDate) => {
  if (!isoDate) return "";
  return new Date(isoDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
};

const PLAN_COPY = {
  [SUBSCRIPTION_TYPE_PRO]: ({ price, endDate }) => ({
    eyebrow: "You're a Pro member",
    heading: "Welcome to NutriCal AI Pro 🎉",
    intro: `Your payment of ₹${price} went through and NutriCal AI Pro is now active on your account, valid until ${formatDate(endDate)}. Here's what's unlocked.`,
    features: [
      { icon: "🤖", title: "Unlimited AI nutrition coach", desc: "Chat with NutriCal AI as often as you like — no question limits." },
      { icon: "📊", title: "Personalized macro guidance", desc: "Get advice tailored to your goals, history and daily targets." },
      { icon: "🍽️", title: "Smarter meal suggestions", desc: "Ask for meal ideas that fit your remaining calories and macros." },
    ],
    ctaLabel: "Ask NutriCal AI →",
    preview: "NutriCal AI Pro is active — unlimited AI nutrition coaching is ready for you.",
  }),
  [SUBSCRIPTION_TYPE_QUESTION]: ({ price, questionsRemaining }) => ({
    eyebrow: "Questions added",
    heading: "Your AI questions are ready 🤖",
    intro: `Your payment of ₹${price} went through and ${questionsRemaining} NutriCal AI questions have been added to your account. Here's how to make the most of them.`,
    features: [
      { icon: "🤖", title: `${questionsRemaining} AI questions to use`, desc: "Ask anything about your meals, macros or goals — answered by NutriCal AI." },
      { icon: "📊", title: "Get a personalized macro plan", desc: "Ask for guidance based on your current goals and history." },
      { icon: "🍽️", title: "Plan your next meal", desc: "Describe what you have and get a calorie-smart suggestion." },
    ],
    ctaLabel: "Ask NutriCal AI →",
    preview: "Your NutriCal AI questions are live — here's how to use them.",
  }),
};

const getCopy = (payload) => {
  const builder = PLAN_COPY[payload.plan];
  if (!builder) throw new Error(`Unknown subscription plan for email: ${payload.plan}`);
  return builder(payload);
};

const buildFeatureRow = ({ icon, title, desc }) => `
                <tr>
                  <td style="padding-bottom:10px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f5; border-radius:14px;">
                      <tr>
                        <td style="width:44px; padding:14px 0 14px 14px; vertical-align:middle; font-size:20px;">${icon}</td>
                        <td style="padding:14px 14px 14px 8px; vertical-align:middle; font-family:'Outfit', Arial, sans-serif;">
                          <p style="margin:0; font-size:14px; font-weight:600; color:#1e332a;">${title}</p>
                          <p style="margin:2px 0 0; font-size:13px; color:#748c82;">${desc}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>`;

const buildSubscriptionEmailHtml = (payload) => {
  const { name } = payload;
  const copy = getCopy(payload);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>${copy.heading}</title>
<!--[if mso]>
<style type="text/css">
  body, table, td, a { font-family: Arial, Helvetica, sans-serif !important; }
</style>
<![endif]-->
<style>
  @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap');
  @media only screen and (max-width: 600px) {
    .nc-card { padding: 28px 22px !important; border-radius: 16px !important; }
    .nc-h1 { font-size: 22px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background-color:#f4f8f6; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all; opacity:0;">
    ${copy.preview}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f8f6;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:560px;">

          <!-- Brand -->
          <tr>
            <td align="center" style="padding-bottom:24px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="width:40px; height:40px; background-color:#e5f0eb; border-radius:12px; text-align:center; vertical-align:middle; font-size:20px; line-height:40px;">🥗</td>
                  <td style="padding-left:10px; vertical-align:middle; font-family:'Outfit', Arial, sans-serif; font-size:18px; font-weight:700; color:#1e332a;">NutriCal</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td class="nc-card" style="background-color:#ffffff; border:1px solid #e2e8e5; border-radius:20px; padding:40px;">

              <p style="margin:0 0 10px; font-family:'Outfit', Arial, sans-serif; font-size:12px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:#21b86d;">${copy.eyebrow}</p>

              <h1 class="nc-h1" style="margin:0 0 14px; font-family:'Outfit', Arial, sans-serif; font-size:26px; font-weight:700; color:#1e332a; line-height:1.3;">${copy.heading}</h1>

              <p style="margin:0 0 28px; font-family:'Outfit', Arial, sans-serif; font-size:15px; line-height:1.6; color:#748c82;">Hey ${name || "there"}, ${copy.intro}</p>

              <!-- Feature list -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${copy.features.map(buildFeatureRow).join("")}
              </table>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:32px auto 0;">
                <tr>
                  <td style="border-radius:999px; background-color:#21b86d;">
                    <a href="${APP_URL}/dashboard" style="display:inline-block; padding:14px 32px; font-family:'Outfit', Arial, sans-serif; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:999px;">${copy.ctaLabel}</a>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top:28px;">
              <p style="margin:0; font-family:'Outfit', Arial, sans-serif; font-size:12px; color:#aebaba;">&copy; ${new Date().getFullYear()} NutriCal. All rights reserved.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const buildSubscriptionEmailText = (payload) => {
  const { name } = payload;
  const copy = getCopy(payload);
  const featureLines = copy.features.map((f) => `- ${f.title} — ${f.desc}`).join("\n");

  return `${copy.heading}

Hey ${name || "there"}, ${copy.intro}

${featureLines}

Open NutriCal: ${APP_URL}/dashboard`;
};

export { buildSubscriptionEmailHtml, buildSubscriptionEmailText };
