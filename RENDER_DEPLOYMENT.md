# Contribly Render Deployment Guide

## Architecture
- **Backend API**: Node.js + Express + Prisma on Render
- **Frontend**: Next.js on Render
- **Database**: PostgreSQL on Render
- **Both services**: Same Render account for simplified management

---

## Backend Setup (Already Deployed)

**Service Name**: `contribly-api`
**URL**: `https://contribly-api.onrender.com`

### Environment Variables Set in Render Dashboard:
```
DATABASE_URL=postgresql://...  (from Render PostgreSQL)
JWT_SECRET=<your-secret>
```

### CORS Configuration:
- ✅ Allows `http://localhost:3000` (local dev)
- ✅ Allows `http://localhost:3001` (API dev)
- ✅ Allows `$FRONTEND_URL` (Render frontend URL)
- ✅ Supports credentials/cookies

---

## Frontend Setup - Deploy to Render

### Step 1: Create New Web Service on Render

1. Go to [render.com](https://render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository (contribly)
4. Configure:

**Service Name:**
```
contribly-web
```

**Root Directory:**
```
apps/web
```

**Build Command:**
```
npm install && npm run build
```

**Start Command:**
```
npm run start
```

### Step 2: Set Environment Variables in Render Dashboard

Add ONE variable:

| Key | Value |
|-----|-------|
| `NEXT_PUBLIC_API_URL` | `https://contribly-api.onrender.com/api` |

**Important**: Make sure `NEXT_PUBLIC_API_URL` is set in ALL environments (Production, Preview, Development).

### Step 3: Configure Backend for Frontend

Update `apps/api/src/index.ts` CORS to include Render frontend URL:

In your Render backend service:
1. Go to **Environment** tab
2. Add/Update:

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://contribly-web.onrender.com` |

(Replace `contribly-web` with your actual service name)

### Step 4: Redeploy API

After setting `FRONTEND_URL`:
1. Go to your `contribly-api` service
2. Click **Redeploy latest** at the top
3. Wait for deployment to complete

---

## Validation Checklist

After both services are deployed:

### ✅ Backend Tests
```bash
curl https://contribly-api.onrender.com/
curl https://contribly-api.onrender.com/api/health
```

Should return:
```json
{ "status": "ok", "message": "Contribly API is running" }
```

### ✅ Frontend Tests
1. Open `https://contribly-web.onrender.com` in browser
2. Try **Register** page
   - Should load without errors
   - Network tab shows API calls to `https://contribly-api.onrender.com/api`
3. Fill form and submit
   - Should succeed (no CORS errors)
   - Check browser console for any errors
4. Try **Login** with test credentials
5. Create organization and department

### ✅ CORS Validation
Open browser DevTools → Network tab and verify:
- No errors containing "CORS policy"
- All API requests show `200` or `201` status
- Response headers include `Access-Control-Allow-Origin: https://contribly-web.onrender.com`

### ✅ Cookies/JWT Flow
1. Register or login
2. Check Application tab → Cookies
   - Should see authentication cookies set
3. Refresh page
   - Should still be logged in
4. Check Network tab
   - Requests should include `Cookie` header automatically

---

## Troubleshooting

### CORS Still Showing Errors?
1. Verify `FRONTEND_URL` is set in backend service environment
2. Redeploy the API service
3. Check backend logs in Render dashboard
4. Ensure frontend URL exactly matches (including protocol)

### Login/Register Returns 401/403?
1. Check database connection with `curl https://contribly-api.onrender.com/api`
2. Verify `DATABASE_URL` is set in backend
3. Check Render logs for database connection errors

### Frontend Showing Blank Pages?
1. Check browser console for errors
2. Check Render logs for frontend build errors
3. Verify `NEXT_PUBLIC_API_URL` is set in frontend service
4. Rebuild frontend service: click **Redeploy latest**

---

## Local Development (Unchanged)

For local development, everything works with:
- **API**: `http://localhost:3001`
- **Frontend**: `http://localhost:3000` (from `npm run dev`)
- **Database**: Local PostgreSQL or Docker instance

No changes needed to `.env.local` files.

---

## Production URLs

After successful deployment:
- **Frontend**: `https://contribly-web.onrender.com`
- **API**: `https://contribly-api.onrender.com`
- **API Health**: `https://contribly-api.onrender.com/api/health`

---

## Next Steps

1. ✅ Update backend CORS (done)
2. Deploy frontend to Render (pending)
3. Set `FRONTEND_URL` environment variable in backend
4. Redeploy backend
5. Test full flow in production
6. Monitor logs in Render dashboard
