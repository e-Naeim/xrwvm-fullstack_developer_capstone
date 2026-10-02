from pathlib import Path
from flask import Flask, jsonify
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

app = Flask(__name__)
nltk.data.path.insert(0, str(Path(__file__).parent))
sia = SentimentIntensityAnalyzer(
    lexicon_file='sentiment/vader_lexicon.zip/vader_lexicon/vader_lexicon.txt')


@app.get('/')
def home():
    return jsonify(service='Sentiment Analyzer', status='ok')


@app.get('/analyze/<path:input_txt>')
def analyze_sentiment(input_txt):
    if len(input_txt) > 5000:
        return jsonify(error='Text is too long.'), 400
    scores = sia.polarity_scores(input_txt)
    compound = scores['compound']
    sentiment = 'positive' if compound >= .05 else (
        'negative' if compound <= -.05 else 'neutral')
    return jsonify(sentiment=sentiment, scores=scores)


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050, debug=False)
