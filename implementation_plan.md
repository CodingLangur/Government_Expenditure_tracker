# Local News Sentiment Analyzer

A Flask-based web application that uses Azure AI Language API to perform sentiment analysis on local news reports. The UI will feature a neat, minimalistic, dark-mode design with premium aesthetics and dynamic animations.

## User Review Required

> [!IMPORTANT]
> You will need to provide your Azure API details (`AZURE_LANGUAGE_ENDPOINT` and `AZURE_LANGUAGE_KEY`) in a `.env` file for the Azure service to work.

## Proposed Changes

### Backend Setup (Flask & Azure)
#### [NEW] `app.py`
The main Flask application. It will serve the frontend and provide an `/api/analyze` endpoint.
#### [NEW] `requirements.txt`
Dependencies including `Flask`, `python-dotenv`, `azure-ai-textanalytics`, and `azure-core`.
#### [NEW] `.env.example`
A template for environment variables containing placeholders for Azure API credentials.

---

### Frontend Components (HTML/CSS/JS)
#### [NEW] `templates/index.html`
The main, minimalistic web interface. Features a clean setup to accept text to be passed into the backend for analysis. The view will also ensure there's visual 'room' available for an image drag/drop capability in the future.
#### [NEW] `static/css/style.css`
A premium Vanilla CSS stylesheet with a clean dark mode palette, smooth dark gradients, glassmorphism elements, modern Google fonts, and micro-animations to feel visually responsive and high quality.
#### [NEW] `static/js/main.js`
The client-side logic to handle submitting text to the Flask `/api/analyze` endpoint and displaying the resulting sentiment and confidence scores dynamically.

## Open Questions
- Do you already have the `azure-ai-textanalytics` endpoint and key, or do you want me to use a mock implementation for testing if you don't have them yet?

## Verification Plan
### Automated Tests
None specifically for the first initial build, we will test the application manually.

### Manual Verification
1. I will run the Flask app locally.
2. I will make sure the UI is visually stunning and responsive.
3. I will feed text to the app and ensure the API processes the result out of the expected endpoints.
