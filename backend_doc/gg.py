import google.generativeai as genai

genai.configure(api_key="AIzaSyAja0uTquZyQrZEr3Q5W7zDhSvQuZ5wE7I")
for m in genai.list_models():
    print(m.name, m.supported_generation_methods)
