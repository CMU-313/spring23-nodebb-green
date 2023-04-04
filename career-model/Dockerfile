FROM python:3.9-slim-buster

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Set environment variables
ENV FLASK_APP=predict.py
ENV FLASK_ENV=production

# Expose port 8080
EXPOSE 8080
EXPOSE 5001

# Start the Flask app
CMD ["flask", "run", "--host=0.0.0.0", "--port=5001"]
