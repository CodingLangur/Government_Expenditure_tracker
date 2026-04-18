# Government Spending Tracker (Hardcse-89) Transition Completed

The application has successfully been pivoted from a single-text Sentiment Analyzer to a full-fledged **Government Spending Tracker Dashboard** according to your requirements. 

Here is what was accomplished:

## 1. Static Database Created
A robust mock database (`government_spending.csv`) was generated within the `data/` directory. It contains 6 realistic government projects spanning several districts (Bengaluru Urban, Hubballi, Mangaluru, etc.), including robust project news snippets.

> [!TIP]
> **Why this helps**: During your Hackathon presentation, this ensures you have instant, zero-latency inputs available without relying on scraping live APIs in real-time.

## 2. Azure Opinion Mining Integrated
`app.py` has been completely rewritten.
- It parses the CSV natively.
- It integrates `show_opinion_mining=True` into your Azure API call.
- It calculates the **Red Flag / Audit Required** status by correlating `Budget >= 50 Cr` and negative sentiment.
- **Fail-safe mechanism built-in**: The mock data generator now simulates Opinion Mining responses and Sentiment Analysis out-of-the-box. If the internet fails, the Dashboard will still visually render precisely the same!

## 3. The Dashboard UI Implementation
The frontend was completely rebuilt using a premium, dark glassmorphic design that doesn't rely on generic libraries:

- **Spending and Stats Ribbon**: Tracking Total Monitor Spend, Tracked Projects, and average sentiment metrics immediately on load.
- **Red Flag Feed**: A designated zone dynamically alerting the user about risky budget allocations vs public dissatisfaction.
- **The Satisfaction Gap Bar Chart**: A clean flexbox UI component powered by basic inline CSS logic in Javascript to avoid CDN issues. It plots allocated budget against negativity/positivity.
- **Opinion Extractor Word Cloud**: Azure's extracted text phrases are fed dynamically into an algorithm that scales `font-size` strictly based on occurrence frequency, using red/green colors for negative/positive opinions.

## 4. How to Verify
1. Make sure you are in the virtual environment.
2. Run `python app.py`.
3. Open `http://localhost:5000` in your browser.
4. Click **Load Analytics** to trigger the dashboard assembly.

> [!IMPORTANT]
> The app is ready to impress the judges. Let me know if you would like to tweak the Red Flag thresholds or modify the styling further!
