# server.py
import os
from livekit import api
from flask import Flask

LIVEKIT_API_KEY = 'APIXKBphKjL2cXx'
LIVEKIT_API_SECRET='ewsEhpZeuTFIZVio6eG6kONW1ZOnthtUifCpdSSEssjB'

app = Flask(__name__)

@app.route('/getToken')
def getToken():
  token = api.AccessToken(LIVEKIT_API_KEY,LIVEKIT_API_SECRET) \
    .with_identity("identity") \
    .with_name("my name") \
    .with_grants(api.VideoGrants(
        room_join=True,
        room="my-room",
    ))
  print( token )
  return token.to_jwt()

if __name__ == '__main__':
    app.run(port=8080)

