import csv
import os
import random
from flask import Flask, request, jsonify, render_template
from azure.ai.textanalytics import TextAnalyticsClient
from azure.core.credentials import AzureKeyCredential
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# Credentials loaded from environment variables
AZURE_ENDPOINT = os.environ.get("AZURE_ENDPOINT")
AZURE_KEY = os.environ.get("AZURE_KEY")

def authenticate_client():
    if AZURE_ENDPOINT == "YOUR_AZURE_ENDPOINT_HERE" or AZURE_KEY == "YOUR_AZURE_API_KEY_HERE":
        return None
    try:
        credential = AzureKeyCredential(AZURE_KEY)
        text_analytics_client = TextAnalyticsClient(endpoint=AZURE_ENDPOINT, credential=credential)
        return text_analytics_client
    except Exception as e:
        print(f"Failed to authenticate Azure client: {e}")
        return None

client = authenticate_client()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/projects', methods=['GET'])
def get_projects():
    projects = []
    filepath = os.path.join(os.path.dirname(__file__), 'data', 'government_spending.csv')
    try:
        with open(filepath, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                projects.append({
                    'id': row['ProjectID'],
                    'name': row['ProjectName'],
                    'district': row['District'],
                    'budget': float(row['Budget_Cr']),
                    'content': row['Content']
                })
        return jsonify(projects)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def get_mock_response(text):
    # Simulated simple NLP logic for mock
    lower_text = text.lower()
    
    # Simple keyword-based mock analysis
    if "delayed" in lower_text or "broken" in lower_text or "terrible" in lower_text or "issue" in lower_text:
        sent = "negative"
        pos = round(random.uniform(0.0, 0.2), 2)
        neg = round(random.uniform(0.7, 0.9), 2)
    elif "beautiful" in lower_text or "excellent" in lower_text or "good" in lower_text or "improved" in lower_text:
        sent = "positive"
        pos = round(random.uniform(0.7, 0.9), 2)
        neg = round(random.uniform(0.0, 0.2), 2)
    else:
        sent = "neutral"
        pos = round(random.uniform(0.1, 0.3), 2)
        neg = round(random.uniform(0.1, 0.3), 2)
        
    neu = round(1.0 - pos - neg, 2)
    if neu < 0: neu = 0.0
    
    # Fake opinions
    words = text.split()
    opinions = []
    if len(words) > 3:
         # pick some random "targets"
         target1 = words[2].strip('.,')
         opinions.append({"target": target1, "sentiment": sent})

    return {
        'sentiment': sent,
        'confidence_scores': {
            'positive': pos,
            'neutral': neu,
            'negative': neg
        },
        'opinions': opinions,
        'mocked': True,
        'message': 'Using mock data because Azure credentials/internet is not available.'
    }

@app.route('/api/analyze', methods=['POST'])
def analyze():
    data = request.json
    text = data.get('text')
    budget = data.get('budget', 0.0) # Optional budget injected for correlation
    
    if not text:
        return jsonify({'error': 'No text provided'}), 400

    result = {}

    if not client:
        # Generate mock response
        result = get_mock_response(text)
    else:
        try:
            documents = [text]
            # Use Opinion Mining
            response = client.analyze_sentiment(documents=documents, show_opinion_mining=True)[0]
            
            # If the service returns an error document
            if response.is_error:
                result = get_mock_response(text)
            else:
                opinions = []
                # Extract words/aspects
                if hasattr(response, 'sentences'):
                    for sentence in response.sentences:
                        if hasattr(sentence, 'mined_opinions'):
                            for mined_opinion in sentence.mined_opinions:
                                target = mined_opinion.target.text
                                sent = mined_opinion.target.sentiment
                                opinions.append({"target": target, "sentiment": sent})

                result = {
                    'sentiment': response.sentiment,
                    'confidence_scores': {
                        'positive': response.confidence_scores.positive,
                        'neutral': response.confidence_scores.neutral,
                        'negative': response.confidence_scores.negative
                    },
                    'opinions': opinions,
                    'mocked': False
                }
        except Exception as e:
            print("Azure error:", e)
            result = get_mock_response(text) # Fallback to mock gracefully

    # Correlation Logic (Red Flag)
    # A project is flagged if it has a high budget && highly negative sentiment
    red_flag = False
    if float(budget) >= 50.0 and result['sentiment'] == 'negative':
        red_flag = True
    elif float(budget) >= 100.0 and result['confidence_scores']['negative'] > 0.4:
         red_flag = True

    result['red_flag'] = red_flag

    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, port=5000)
