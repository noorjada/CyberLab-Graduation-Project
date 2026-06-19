# Admin certificate signature

Place your signature image here so it appears on every CyberLab PDF certificate.

## Quick setup

1. Admin signature image: `admin-signature.png` (your handwritten signature).
2. Platform signature: drawn automatically as the **CyberLab** wordmark on the right side of each PDF.
3. Configure in `server/.env`:
   ```
   CERT_ADMIN_NAME=Haitham
   CERT_ADMIN_TITLE=Founder & Administrator, CyberLab
   ```
4. Restart the server and re-download any certificate PDF.

## Optional

Use a custom file path:

```
CERT_SIGNATURE_PATH=C:\path\to\your\signature.png
```

Supported formats: PNG, JPG.
