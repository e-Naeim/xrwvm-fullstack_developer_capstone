import unittest
from app import app


class SentimentTests(unittest.TestCase):
    def test_positive(self):
        self.assertEqual(app.test_client().get('/analyze/Fantastic services').json['sentiment'], 'positive')

    def test_negative(self):
        self.assertEqual(app.test_client().get('/analyze/Terrible service and awful experience').json['sentiment'], 'negative')

    def test_neutral(self):
        self.assertEqual(app.test_client().get('/analyze/The car is a sedan').json['sentiment'], 'neutral')

    def test_overlong(self):
        self.assertEqual(app.test_client().get('/analyze/' + 'a' * 5001).status_code, 400)


if __name__ == '__main__':
    unittest.main()
