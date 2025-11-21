# EmailJS Setup Instructions

To enable automatic email sending for the reflection form, you need to set up EmailJS:

## Steps:

1. **Create EmailJS Account**
   - Go to https://www.emailjs.com/
   - Sign up for a free account (200 emails/month free)

2. **Add Email Service**
   - Go to "Email Services" in dashboard
   - Click "Add New Service"
   - Choose your email provider (Gmail recommended)
   - Connect your email account (mvicentin@soka.edu)
   - Note your **Service ID**

3. **Create Email Template**
   - Go to "Email Templates" in dashboard
   - Click "Create New Template"
   - Set up template with these variables:
     - `{{from_email}}` - From address (mvicentin@soka.edu)
     - `{{to_email}}` - Primary recipient (iread@soka.edu)
     - `{{to_email_cc}}` - CC recipient (mvicentin@soka.edu)
     - `{{subject}}` - Email subject
     - `{{message}}` - Full email body
     - `{{protected}}` - What did you protect?
     - `{{risked}}` - What did you risk?
     - `{{learned}}` - What did you learn?
     - `{{next_step}}` - What is one concrete next step?
   - Set "From Name" to your name
   - Set "From Email" to mvicentin@soka.edu
   - Set "To Email" to iread@soka.edu
   - Set "CC" to mvicentin@soka.edu
   - Set "Subject" to {{subject}}
   - Set "Content" to include all the reflection fields
   - Note your **Template ID**

4. **Get Public Key**
   - Go to "Account" → "General"
   - Copy your **Public Key**

5. **Update Code**
   - Open `game/scenes/UIScene.js`
   - Find the `submitReflection()` method
   - Replace these three values:
     - `YOUR_SERVICE_ID` → Your Service ID
     - `YOUR_TEMPLATE_ID` → Your Template ID
     - `YOUR_PUBLIC_KEY` → Your Public Key

## Example Email Template Content:

```
Subject: {{subject}}

AI Pathway Feedback

What did you protect?
{{protected}}

What did you risk?
{{risked}}

What did you learn?
{{learned}}

What is one concrete next step?
{{next_step}}

---

Full message:
{{message}}
```

## Alternative: Use Formspree

If you prefer not to use EmailJS, you can use Formspree (https://formspree.io/):
- Free tier: 50 submissions/month
- No setup required, just get your form endpoint
- Update the code to use Formspree's API instead

