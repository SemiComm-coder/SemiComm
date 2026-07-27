# SemiComm
SemiComm delivers technical and strategic insights for engineers and executives, bridging semiconductor manufacturing and global markets. We provide intelligence that drives innovation and decision-making.

Official site: https://semicommhub.com/

## Subscriber Database and Export Flow

The site now supports a global subscriber database flow for all `.subscribe-form` forms.

### 1) Set up Google Apps Script backend

1. Create a new Google Sheet for subscribers.
2. Open `Extensions > Apps Script`.
3. Copy code from [integrations/google-apps-script/subscriber-database.gs](integrations/google-apps-script/subscriber-database.gs).
4. In Apps Script, set a script property:
	- Key: `EXPORT_TOKEN`
	- Value: a long random token
5. Deploy as a web app:
	- Execute as: Me
	- Who has access: Anyone
6. Copy the deployed web app URL.

### 2) Connect website forms to the database

In [script.js](script.js), set:

```js
const SUBSCRIBER_DATABASE_ENDPOINT = 'YOUR_APPS_SCRIPT_WEB_APP_URL';
```

When set, every subscribe form on the site writes to the same subscriber sheet.
If the endpoint fails, the form falls back to the existing FormSubmit email path.

### 3) Export subscribers to CSV

Use [scripts/export-subscribers.sh](scripts/export-subscribers.sh):

```bash
export SUBSCRIBER_EXPORT_URL='YOUR_APPS_SCRIPT_WEB_APP_URL'
export SUBSCRIBER_EXPORT_TOKEN='YOUR_EXPORT_TOKEN'
./scripts/export-subscribers.sh
```

This creates a timestamped `subscribers-YYYYMMDD-HHMMSS.csv` file in the repo root.
