# Watch With Care

A cancer-informed content-warning web app for movies, TV shows, and books.

## What this version includes

- React + Vite web app
- Firebase Authentication with Google sign-in
- Firestore shared database
- Search and filtering by title, media type, emotional intensity, and cancer-specific trigger tags
- Spoiler-free warning first, with optional spoiler details
- Community submissions saved as `pending`
- Simple admin approval workflow
- Seed entries so the app works before Firebase is connected

## Local setup

```bash
npm install
npm run dev
```

## Firebase setup

1. Go to Firebase Console and create a project.
2. Add a Web App.
3. Enable Authentication > Sign-in method > Google.
4. Enable Firestore Database.
5. Copy `.env.example` to `.env` and paste your Firebase values.
6. Set `VITE_ADMIN_EMAILS` to the email addresses allowed to approve submissions.

## Environment variables

See `.env.example`.

## Firestore collection

Collection name: `warnings`

Document shape:

```json
{
  "title": "Title",
  "type": "Movie",
  "year": "2026",
  "intensity": "High",
  "tags": ["Cancer death", "Hospital scenes"],
  "spoilerFree": "Gentle non-spoiler warning.",
  "spoilerDetails": "Detailed spoiler warning.",
  "status": "pending",
  "submittedBy": "person@email.com",
  "createdAt": "server timestamp"
}
```

## Suggested Firestore security rules

Start with these rules, then tighten as your app grows.

```txt
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /warnings/{warningId} {
      allow read: if resource.data.status == 'approved' || request.auth != null;
      allow create: if request.auth != null
        && request.resource.data.status == 'pending'
        && request.resource.data.submittedBy == request.auth.token.email;
      allow update: if request.auth != null;
      allow delete: if false;
    }
  }
}
```

For production, use Firebase custom claims or a dedicated `admins` collection so only admins can approve.

## Deploy to Vercel

1. Create a GitHub repo and upload this folder.
2. Go to Vercel and import the repo.
3. Add the same environment variables from `.env.example`.
4. Deploy.

## Gentle language principles

- Use “may be tender” instead of alarmist language.
- Give users agency, not avoidance.
- Always provide spoiler-free information first.
- Put detailed spoilers behind a click.
- Be specific enough to help people choose safely.
