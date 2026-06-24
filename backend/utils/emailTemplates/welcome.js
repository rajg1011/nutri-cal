const APP_URL = "https://nutri-cal.pages.dev";

const buildWelcomeEmailHtml = (name) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta http-equiv="X-UA-Compatible" content="IE=edge" />
<title>Welcome to NutriCal</title>
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
    Your NutriCal account is ready — start logging meals and hitting your goals today.
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

              <p style="margin:0 0 10px; font-family:'Outfit', Arial, sans-serif; font-size:12px; font-weight:600; letter-spacing:0.06em; text-transform:uppercase; color:#21b86d;">You're all set</p>

              <h1 class="nc-h1" style="margin:0 0 14px; font-family:'Outfit', Arial, sans-serif; font-size:26px; font-weight:700; color:#1e332a; line-height:1.3;">Welcome, ${name || "there"} 👋</h1>

              <p style="margin:0 0 28px; font-family:'Outfit', Arial, sans-serif; font-size:15px; line-height:1.6; color:#748c82;">Your profile is ready. NutriCal is now set up to track your meals, macros and daily goals — here's what you can do next.</p>

              <!-- Feature list -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding-bottom:10px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f5; border-radius:14px;">
                      <tr>
                        <td style="width:44px; padding:14px 0 14px 14px; vertical-align:middle; font-size:20px;">🍽️</td>
                        <td style="padding:14px 14px 14px 8px; vertical-align:middle; font-family:'Outfit', Arial, sans-serif;">
                          <p style="margin:0; font-size:14px; font-weight:600; color:#1e332a;">Log meals in seconds</p>
                          <p style="margin:2px 0 0; font-size:13px; color:#748c82;">Search or pick a food and NutriCal handles the calories.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding-bottom:10px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f5; border-radius:14px;">
                      <tr>
                        <td style="width:44px; padding:14px 0 14px 14px; vertical-align:middle; font-size:20px;">📊</td>
                        <td style="padding:14px 14px 14px 8px; vertical-align:middle; font-family:'Outfit', Arial, sans-serif;">
                          <p style="margin:0; font-size:14px; font-weight:600; color:#1e332a;">Track your macros</p>
                          <p style="margin:2px 0 0; font-size:13px; color:#748c82;">See protein, carbs and fat stack up against your daily goal.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td>
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f6f5; border-radius:14px;">
                      <tr>
                        <td style="width:44px; padding:14px 0 14px 14px; vertical-align:middle; font-size:20px;">🤖</td>
                        <td style="padding:14px 14px 14px 8px; vertical-align:middle; font-family:'Outfit', Arial, sans-serif;">
                          <p style="margin:0; font-size:14px; font-weight:600; color:#1e332a;">Ask your AI nutrition coach</p>
                          <p style="margin:2px 0 0; font-size:13px; color:#748c82;">Get personalized guidance based on your goals and history.</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:32px auto 0;">
                <tr>
                  <td style="border-radius:999px; background-color:#21b86d;">
                    <a href="${APP_URL}/dashboard" style="display:inline-block; padding:14px 32px; font-family:'Outfit', Arial, sans-serif; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:999px;">Open NutriCal →</a>
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

const buildWelcomeEmailText = (name) => `Welcome, ${name || "there"}!

Your NutriCal profile is all set up. Here's what you can do next:

- Log meals in seconds — search or pick a food and NutriCal handles the calories.
- Track your macros — see protein, carbs and fat stack up against your daily goal.
- Ask your AI nutrition coach — get personalized guidance based on your goals and history.

Open NutriCal: ${APP_URL}/dashboard`

export { buildWelcomeEmailText, buildWelcomeEmailHtml }