<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Verify your Soko Mtaa email</title>
    <style>
        body { margin: 0; padding: 0; background-color: #f4f4f0; font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; }
        .wrapper { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }
        .header { background-color: #1B6B3A; padding: 32px 40px; text-align: center; }
        .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: 1px; }
        .header p { margin: 4px 0 0; color: rgba(255,255,255,0.75); font-size: 12px; letter-spacing: 2px; text-transform: uppercase; }
        .body { padding: 40px; }
        .greeting { font-size: 18px; font-weight: 700; color: #1a1a1a; margin-bottom: 16px; }
        .text { font-size: 15px; line-height: 1.7; color: #4b5563; margin-bottom: 24px; }
        .btn-wrap { text-align: center; margin: 32px 0; }
        .btn { display: inline-block; background-color: #1B6B3A; color: #ffffff !important; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 15px; font-weight: 800; letter-spacing: 0.5px; }
        .fallback-box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px 20px; margin-top: 24px; }
        .fallback-box p { margin: 0 0 8px; font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; }
        .fallback-url { word-break: break-all; font-size: 13px; color: #1B6B3A; }
        .expiry-note { font-size: 13px; color: #f5a623; font-weight: 700; margin-top: 24px; }
        .footer { background: #f9fafb; border-top: 1px solid #e5e7eb; padding: 24px 40px; text-align: center; }
        .footer p { margin: 0; font-size: 12px; color: #9ca3af; line-height: 1.6; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>Soko Mtaa</h1>
            <p>Kenya's Neighbourhood Marketplace</p>
        </div>

        <div class="body">
            <p class="greeting">Habari {{ $user->name }}!</p>

            <p class="text">
                Thank you for registering with Soko Mtaa. To activate your account and start
                exploring your local market, please verify your email address by clicking the
                button below.
            </p>

            <div class="btn-wrap">
                <a href="{{ $verificationUrl }}" class="btn">Verify Email Address</a>
            </div>

            <p class="expiry-note">⏳ This link expires in 60 minutes.</p>

            <div class="fallback-box">
                <p>Or copy this link into your browser</p>
                <span class="fallback-url">{{ $verificationUrl }}</span>
            </div>

            <p class="text" style="margin-top:24px;">
                If you did not create a Soko Mtaa account, you can safely ignore this email.
                No action is needed.
            </p>
        </div>

        <div class="footer">
            <p>
                Soko Mtaa &mdash; Connecting traders and residents across Kenyan markets.<br />
                This is an automated message, please do not reply directly to this email.
            </p>
        </div>
    </div>
</body>
</html>
