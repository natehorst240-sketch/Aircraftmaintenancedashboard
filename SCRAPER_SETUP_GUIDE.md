# FlightDocs Scraper - Daily Automation Guide

## Overview

Your dashboard now has an automated data pipeline that scrapes FlightDocs maintenance data daily. The scraper is located at `/src/imports/flightdocs-scraper.ts` and uses Playwright to:

1. Log into FlightDocs
2. Navigate to the maintenance due list
3. Export the data as Excel
4. Convert to CSV
5. Save to `/public/data/due-list.csv`

The dashboard automatically loads this CSV and displays live data. If the CSV doesn't exist, it falls back to mock data.

---

## Quick Start

### 1. Install Dependencies

The scraper requires Node.js and cannot run in the browser. Install dependencies in your project:

```bash
npm install playwright xlsx
npx playwright install chromium
```

### 2. Configure Environment Variables

**Windows PowerShell** (open NEW terminal after setting):
```powershell
setx FLIGHTDOCS_USERNAME "your.email@example.com"
setx FLIGHTDOCS_PASSWORD "your_password"
setx FLIGHTDOCS_OUTPUT_PATH "C:\path\to\project\public\data\due-list.csv"
```

**Linux/Mac Bash**:
```bash
export FLIGHTDOCS_USERNAME="your.email@example.com"
export FLIGHTDOCS_PASSWORD="your_password"
export FLIGHTDOCS_OUTPUT_PATH="/path/to/project/public/data/due-list.csv"
```

**Using .env file** (create `.env` in project root):
```env
FLIGHTDOCS_USERNAME=your.email@example.com
FLIGHTDOCS_PASSWORD=your_password
FLIGHTDOCS_OUTPUT_PATH=./public/data/due-list.csv
```

⚠️ **Security**: Never commit `.env` or credentials to git! Add to `.gitignore`:
```
.env
.env.local
```

### 3. Test the Scraper

Run manually to verify it works:

```bash
node src/imports/flightdocs-scraper.ts
```

You should see output like:
```
[2026-03-05T...] Attempt 1/3
[2026-03-05T...] Navigating to login page
[2026-03-05T...] Filled username using input[name="username"]
[2026-03-05T...] Filled password using input[name="password"]
[2026-03-05T...] Submitted login form
[2026-03-05T...] Navigating to due-list page
[2026-03-05T...] Export control found
[2026-03-05T...] Downloaded file saved
[2026-03-05T...] CSV written: ./public/data/due-list.csv (1234 bytes)
[2026-03-05T...] Success
```

---

## Scheduling Options

### Option A: Windows Task Scheduler (Recommended for Windows)

1. **Open Task Scheduler**:
   - Press `Win + R`, type `taskschd.msc`, press Enter

2. **Create Basic Task**:
   - Click "Create Basic Task" in right panel
   - Name: `FlightDocs Data Sync`
   - Description: `Daily scrape of aircraft maintenance data`

3. **Set Trigger**:
   - Trigger: Daily
   - Start date: Today
   - Time: 2:00 AM (choose a time with low aircraft activity)
   - Recur every: 1 day

4. **Set Action**:
   - Action: Start a program
   - Program/script: `C:\Program Files\nodejs\node.exe`
   - Arguments: `"C:\Users\YourName\path\to\project\src\imports\flightdocs-scraper.ts"`
   - Start in: `C:\Users\YourName\path\to\project`

5. **Configure Settings**:
   - ✅ Run whether user is logged on or not
   - ✅ Run with highest privileges
   - If task fails, restart every: 10 minutes
   - Attempt restart up to: 3 times

6. **Environment Variables**:
   - Set system-wide in: Control Panel → System → Advanced → Environment Variables
   - Or in Task Scheduler: Actions tab → Edit → Environment Variables

### Option B: Linux/Mac Cron Job

1. **Edit crontab**:
   ```bash
   crontab -e
   ```

2. **Add cron entry** (runs daily at 2:00 AM):
   ```cron
   0 2 * * * cd /path/to/project && /usr/bin/node src/imports/flightdocs-scraper.ts >> /var/log/flightdocs-scraper.log 2>&1
   ```

3. **Verify cron entry**:
   ```bash
   crontab -l
   ```

4. **View logs**:
   ```bash
   tail -f /var/log/flightdocs-scraper.log
   ```

### Option C: GitHub Actions (Recommended for Cloud/Team)

Perfect for teams or cloud deployments. The scraper runs on GitHub's servers.

1. **Create workflow file**: `.github/workflows/scrape-flightdocs.yml`

```yaml
name: FlightDocs Daily Sync

on:
  schedule:
    # Runs at 2:00 AM UTC daily
    - cron: '0 2 * * *'
  
  # Allow manual trigger from GitHub UI
  workflow_dispatch:

jobs:
  scrape-and-update:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          npm install playwright xlsx
          npx playwright install chromium
      
      - name: Run FlightDocs scraper
        env:
          FLIGHTDOCS_USERNAME: ${{ secrets.FLIGHTDOCS_USERNAME }}
          FLIGHTDOCS_PASSWORD: ${{ secrets.FLIGHTDOCS_PASSWORD }}
          FLIGHTDOCS_OUTPUT_PATH: ./public/data/due-list.csv
        run: node src/imports/flightdocs-scraper.ts
      
      - name: Commit and push updated CSV
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add public/data/due-list.csv
          git diff --quiet && git diff --staged --quiet || git commit -m "Update maintenance data [automated]"
          git push
      
      - name: Upload CSV as artifact
        uses: actions/upload-artifact@v4
        with:
          name: maintenance-data
          path: public/data/due-list.csv
          retention-days: 30
```

2. **Add GitHub Secrets**:
   - Go to: Repository → Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Add:
     - `FLIGHTDOCS_USERNAME` = your FlightDocs email
     - `FLIGHTDOCS_PASSWORD` = your FlightDocs password

3. **Test the workflow**:
   - Go to: Actions tab → FlightDocs Daily Sync → Run workflow

---

## Troubleshooting

### Scraper fails to login
- Verify credentials are correct
- Check if FlightDocs changed their login page (update selectors in script)
- Try running with `FLIGHTDOCS_HEADLESS=false` to see browser:
  ```bash
  FLIGHTDOCS_HEADLESS=false node src/imports/flightdocs-scraper.ts
  ```

### CSV file not found in dashboard
- Check file exists: `ls -la public/data/due-list.csv`
- Verify OUTPUT_PATH in scraper matches expected location
- Check browser console for fetch errors
- Ensure web server serves files from `/public/data/`

### Scraper times out
- Increase timeouts in script if FlightDocs is slow
- Check network connectivity
- Verify FlightDocs is not experiencing downtime

### Wrong data format
- Update CSV parser in `/src/app/services/maintenanceDataService.ts`
- Check actual CSV column names match expected headers
- Add console.log to debug parsed data

### GitHub Actions quota exceeded
- Free tier: 2,000 minutes/month
- Daily 5-minute runs = ~150 minutes/month (well within limit)
- If exceeded, consider running less frequently or self-hosting

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    DAILY AT 2:00 AM                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  FlightDocs Scraper (Node.js + Playwright)                      │
│  - Launch Chrome browser                                         │
│  - Login to FlightDocs                                          │
│  - Navigate to maintenance due list                             │
│  - Click "Export" button                                        │
│  - Download Excel file                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  XLSX to CSV Converter                                          │
│  - Read Excel workbook                                          │
│  - Extract first sheet                                          │
│  - Convert to CSV format                                        │
│  - Save to /public/data/due-list.csv                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Dashboard React App                                            │
│  - useMaintenanceData hook checks every 5 minutes               │
│  - Fetches /data/due-list.csv via HTTP                         │
│  - Parses CSV into application data structures                  │
│  - Updates UI with live maintenance data                        │
│  - Falls back to mock data if CSV not available                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. ✅ Test scraper manually
2. ✅ Set up scheduled task (choose Option A, B, or C above)
3. ✅ Verify CSV appears in `/public/data/`
4. ✅ Refresh dashboard - should show "Live Data" badge
5. ✅ Monitor for a few days to ensure reliability

---

## Support

If you encounter issues:

1. Check scraper logs for error messages
2. Verify FlightDocs credentials are valid
3. Test with `FLIGHTDOCS_HEADLESS=false` to see browser actions
4. Review CSV format matches expected structure
5. Check browser console for data loading errors

For FlightDocs UI changes, you may need to update the selectors in the scraper script.
