# Generated Files

This directory contains files that are used during deployment or by external services. They are NOT part of the application bundle.

## Files

### `admin-setup.sql`

SQL script to set up the initial admin user and storage infrastructure.

**When to run:** After the first deployment, once all database migrations have been applied.

**How to run:**
1. Create the admin user via the Supabase Dashboard (Authentication > Users > Add User)
   - Email: `admin@gtbi.com.br`
   - Set a strong password
2. Open the Supabase SQL Editor
3. Paste and execute the contents of `admin-setup.sql`
4. The script will:
   - Assign the `admin` role to the user
   - Create `reports` and `evidences` storage buckets
   - Set up storage access policies

### `email-templates/`

HTML email templates used by Resend via Supabase Edge Functions for transactional emails.

| Template | Purpose | Variables |
|----------|---------|-----------|
| `invite.html` | User invitation email | `{{APP_URL}}`, `{{TOKEN}}` |
| `reset-password.html` | Password reset email | `{{APP_URL}}`, `{{TOKEN}}` |
| `report-ready.html` | Weekly report notification | `{{APP_URL}}`, `{{REPORT_ID}}`, `{{RESTAURANT_NAME}}`, `{{WEEK_START}}`, `{{WEEK_END}}`, `{{OVERALL_SCORE}}`, `{{PENDING_ACTIONS}}`, `{{TOTAL_REVIEWS}}`, `{{OPEN_TICKETS}}` |

**How they are used:**
- Edge Functions read these templates and replace `{{VARIABLE}}` placeholders with actual values before sending via the Resend API.
- All templates are in Portuguese (pt-BR) matching the application UI language.

**Customization:**
- Edit the HTML directly. The templates use inline styles for maximum email client compatibility.
- Brand color is `#EA1D2C` (iFood red). Update all instances if the brand color changes.
- Test changes with tools like Litmus or Email on Acid before deploying.
