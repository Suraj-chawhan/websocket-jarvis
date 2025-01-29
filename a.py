from flask import Flask
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from groq import Groq

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app)

# Initialize Groq client
groq_client = Groq(api_key="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")

def groq_prompt(prompt):
    try:
        convo = [{'role': 'user', 'content': prompt}]
        chat_completion = groq_client.chat.completions.create(
            messages=convo,
            model='llama3-70b-8192'
        )
        return chat_completion.choices[0].message.content
    except Exception as e:
        print(f"Error generating response from Groq: {e}")
        return "Sorry, I couldn't process your request."

# WebSocket route to handle messages
@socketio.on('message')
def handle_message(message):
    print(f"Received message: {message}")

    # Get response from Groq
    response_text = groq_prompt(message)
    
    # Send the response back to the frontend via WebSocket
    emit('response', response_text)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5000)
