import sys
from gemini_agent_core import GeminiLegalAgent

def main():
    agent = GeminiLegalAgent()
    print("\n⚖️ NyayaSetu (Powered by Gemini-1.5-Pro) is Online.\n")
    while True:
        try:
            user_input = input("\n👤 User: ")
            if user_input.lower() in ["quit", "exit"]:
                print("\n👋 Exiting...")
                break
            response = agent.query(user_input)
            print(f"\n🤖 NyayaSetu: {response}")
        except KeyboardInterrupt:
            print("\n👋 Exiting...")
            break
        except Exception as e:
            print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    main()