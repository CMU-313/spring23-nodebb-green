FROM python:3.9

WORKDIR /

COPY ./requirements.txt requirements.txt

RUN pip install -r requirements.txt

COPY . .

# Set environment variables
ENV FLASK_APP=predict.py
ENV FLASK_ENV=production

# Expose port 8080
# EXPOSE 8080
EXPOSE 8080

# Start the Flask app
CMD ["gunicorn", "--bind", "0.0.0.0:8080", "predict:app"]
